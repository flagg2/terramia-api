const User = require('../model/user')
const Product = require('../model/product')
const Coupon = require('../model/coupon')
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const {serverError} = require('./errors');
const {sendOrderCompletedMail,sendNewOrderMail} = require('./mailer')

const calculateOrderAmount = async (order, ignoreCoupon = false, ignoreDiscount = false) => {
    try {
        let totalPrice = 0;
        const quants = new Object()
        const products = []
        for (const prod of order.products) {
            if (quants[prod]) quants[prod] += 1
            else quants[prod] = 1
        }
        for (const key in quants) {
            const quantity = quants[key]
            products.push(await Product.findById(key), quantity)
        }
        
        for (const [index, product] of products.entries()) {
            if (index % 2 == 1) continue
            const actPrice = order.applyDiscount && product.points!=0 && product.isDoTerraProduct && !ignoreDiscount?
            (product.price*products[index+1]*0.75).toFixed(0) : (product.price*products[index+1])
            totalPrice += parseInt(actPrice)
        }
        const coupon = await Coupon.findOne({
            code: order.coupon
        })
        if (coupon && !ignoreCoupon) {
            if (coupon.type == 'flat') {
                totalPrice -= parseInt(coupon.value)
            } else {
                totalPrice = Math.ceil(totalPrice - totalPrice * parseInt(coupon.value) / 100)
            }
        }
        console.log(totalPrice)
        totalPrice = parseInt(totalPrice.toFixed(0))
        return totalPrice < 0 ? 0 : totalPrice;
    } catch (err) {
        console.log(err)
    }
};

const shouldShippingBeFree = async (order) => {
    try{
        if (await calculateOrderAmount(order) == 0) return true
        let totalPoints = 0;
        const products = order.products
        console.log (products)
        for (productID of products){
            const product = await Product.findById(productID)
            totalPoints += product.points
        }
        console.log(totalPoints,totalPoints>=process.env.MINIMUM_VALUE_FREE_SHIPPING)
        return totalPoints>=process.env.MINIMUM_VALUE_FREE_SHIPPING
    }
    catch(err){
        console.log(err)
    }
}

const validateCoupon = async (order, res) => {
    try {
        if (order.coupon) {
            const coupon = await Coupon.findOne({
                code: order.coupon
            })
            if (!coupon) {
                return res.status(400).send({
                    message: 'Invalid coupon code',
                    error: 'invalid-coupon'
                })
            }
            if (coupon.minValue) {
                const orderAmount = await calculateOrderAmount(order, true)
                if (!orderAmount) throw 'Order amount is undefined'
                if (orderAmount < coupon.minValue) {
                    return res.status(400).send({
                        message: 'Order value is not high enough to apply this coupon',
                        error: 'order-value'
                    })
                }
            }
            const user = await User.findById(order.orderedBy)
            if (coupon.maxUses) {
                const ind = coupon.redeems.findIndex((elem) => (elem == user.email)) + 1
                if (ind) {
                    if (coupon.redeems[ind] >= coupon.maxUses) {
                        return res.status(400).send({
                            message: "This coupon's usage limit has been exceeded for this user",
                            err: 'limit-exceeded-user'
                        })
                    }
                }
            }

            if (coupon.maxUsesTotal) {
                if (coupon.totalUses >= coupon.maxUsesTotal) {
                    return res.status(400).send({
                        message: "This coupon's total usage limit has been exceeded",
                        err: 'limit-exceeded-total'
                    })
                }
            }
        }
    } catch (err) {
        serverError(res, err)
    }
}

const updateSimilarProducts = async (lastProduct, user) => {
    const shipping = await Product.findOne({name:'Doprava'})
    const pod = await Product.findOne({name:'Dobierka'})
    if (shipping.id == lastProduct.id) return
    if (pod.id == lastProduct.id) return
    const boughtSoFar = user.boughtProducts[lastProduct.id] ? user.boughtProducts[lastProduct.id].count : (() => {
        user.boughtProducts[lastProduct.id] = {
            count:0
        }
        return 0
    })()
    console.log(boughtSoFar)
    user.markModified('boughtProducts')
    lastProduct.markModified('boughtTogether')
    for (prop in user.boughtProducts){
        if (prop == shipping.id) continue
        if (prop = pod.id) return
        const consecutivePurchasesSignificanceRatio = 0.8
        if (prop == lastProduct.id){
            user.boughtProducts[prop].count += 1
        } 
        else {
            try{
            if (lastProduct.boughtTogether[prop]){
                lastProduct.boughtTogether[prop]+=consecutivePurchasesSignificanceRatio**boughtSoFar
            }
            else {
                lastProduct.boughtTogether[prop]=1
            }
                const productToUpdate = await Product.findById(prop)
                if (productToUpdate.boughtTogether[lastProduct.id]){
                    productToUpdate.boughtTogether[lastProduct.id]+=consecutivePurchasesSignificanceRatio**boughtSoFar
                }
                else{
                    productToUpdate.boughtTogether[lastProduct.id]=1
                }
                productToUpdate.markModified("boughtTogether")
                
                await productToUpdate.save()
            }
            catch(err){
                console.log(err)
            }
        }
    }
    await user.save()
}

const finishOrder = async (order, res, paidOnline) => {
    try {
        order.status = "ordered"
        if (paidOnline) order.paidOnline = true
        const user = await (User.findById(order.orderedBy))
        user.totalSpent += order.value;
        for (const key in order.products) {
            const product = await Product.findById(order.products[key])
            product.soldAmount += 1
            await updateSimilarProducts(product, user)
            await product.save()
        }
        const coupon = await Coupon.findOne({
            code: order.coupon
        })
        if (coupon){
            coupon.totalUses += 1
            const ind = coupon.redeems.findIndex((elem) => (elem == user.email)) + 1
            if (ind) {
                coupon.redeems[ind]+=1
            }
            else{
                coupon.redeems.push(user.email)
                coupon.redeems.push(1)
            }
            coupon.markModified('redeems')
            await coupon.save()
        }
        sendOrderCompletedMail(user.email, order)
        sendNewOrderMail(order, user)
        if (order.applyDiscount){
            user.registeredInDoTerra = true
        }
        await user.save()
        await order.save()
        return res.send()
    } catch (err) {
        return serverError(res, err)
    }
}

const refundOrder = async (order) => {
    const refund = await stripe.refunds.create({
        payment_intent: `pi_${order.clientSecret.split('_')[1]}`,
      });
    return refund
}

module.exports = {
    validateCoupon,
    calculateOrderAmount,
    finishOrder,
    refundOrder,
    shouldShippingBeFree
}