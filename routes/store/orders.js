const methods = require('../../middlewares/methods')
const verify = require('../../middlewares/verifyToken')
const Product = require('../../model/product')
const Order = require('../../model/order')
const User = require('../../model/user')
const {
    idValidation,
    orderValidation
} = require('../../utils/validation')
const {validateCoupon} = require('../../utils/orderHelpers')
const {
    notFound, serverError
} = require('../../utils/errors')


module.exports = (router) => {
    router.all('/order', methods(['POST']))
    router.post('/order', verify(0, false), async (req, res) => {
        if (req.user) req.body.userId = req.user._id
        if (orderValidation(req, res)) return
        try {
            if (!req.body.userId) {
                return res.status(400).send({
                    error: 'no-user',
                    message: 'You have to create a temporary user before making an order'
                })
            }
            const user = await User.findById(req.body.userId)
            if (!user) notFound(res, 'User')

            //are all billing details provided?
            const required = ['city', 'psc', 'address', 'country']
            const notSatisfied = []
            required.forEach(requirement => {
                if (!user[requirement]) notSatisfied.push(requirement)
            })
            if (notSatisfied.length) return res.status(400).send({
                error: 'billing-data',
                message: 'Some of the billing details of this user have not yet been defined',
                missing: notSatisfied.join(', ')
            })

            //are all product ids valid?
            for (const product in req.body.products) {
                console.log(req.body.products[product])
                if (!await Product.findById(req.body.products[product])) return res.status(404).send({
                    error: 'not-found',
                    message: 'One or more product ids provided were invalid'
                })
            }

            const order = new Order({
                ...req.body,
                orderedBy: req.body.userId
            })
            //apply coupons
            if (await validateCoupon(order,res)) return
            
            const savedOrder = await order.save()
            user.orders.push(savedOrder._id)
            user.markModified('orders')
            user.save()
            res.send({
                message: 'New order created successfully',
                orderId: savedOrder._id
            })
        } catch (err) {
            serverError(res,err)
        }
    })

    router.all('/order/:id', methods(['GET']))
    router.get('/order/:id', async (req, res) => {
        if (idValidation(req, res)) return
        try {
            const order = await Order.findById(req.params.id)
            if (!order) throw new Error
            res.send({
                message: 'The order was retrieved successfully',
                order: order
            })

        } catch (err) {
            res.status(404).send({
                error: 'not-found',
                message: 'The provided id does not match any order in the database'
            })
        }
    })
}