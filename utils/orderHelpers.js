const User = require('../model/user')
const Product = require('../model/product')
const Coupon = require('../model/coupon')
const {serverError} = require('./errors');
const {sendOrderCompletedMail} = require('./mailer')

const calculateOrderAmount = async (order, ignoreCoupon = false) => {
    try {
        let totalPrice = 0;
        const products = order.products
        products.forEach(async (product) => {
            product = await Product.findById(product)
            totalPrice += product.price
        });
        const coupon = await Coupon.findOne({
            code: order.coupon
        })
        console.log(totalPrice)
        if (coupon && !ignoreCoupon) {
            if (coupon.type == 'flat') {
                totalPrice -= parseInt(coupon.value)
            } else {
                console.log(totalPrice)
                totalPrice = Math.ceil(totalPrice - totalPrice * parseInt(coupon.value) / 100)
                console.log(totalPrice)
            }
        }
        console.log(totalPrice)
        return totalPrice < 0 ? 0 : totalPrice;
    } catch (err) {
        console.log(err)
    }
};

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
        const onsecutivePurchasesSignificanceRatio = 0.8
        if (prop == lastProduct.id){
            user.boughtProducts[prop].count += 1
        } 
        else {
            if (lastProduct.boughtTogether[prop]){
                lastProduct.boughtTogether[prop]+=onsecutivePurchasesSignificanceRatio**boughtSoFar
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
    }
    await user.save()
}

const finishOrder = async (order, res) => {
    try {
        order.status = "paid"
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
        await user.save()
        await order.save()
        return res.send()
    } catch (err) {
        return serverError(res, err)
    }
}

module.exports = {
    validateCoupon,
    calculateOrderAmount,
    finishOrder
}