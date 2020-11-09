const router = require('express').Router()
const methods = require('../../middlewares/methods')
const Product = require('../../model/product')
const Order = require('../../model/order')
const {
	createPaymentValidation
} = require('../../utils/validation')
const User = require('../../model/user')
const { serverError } = require('../../utils/errors')
const { validateCoupon,calculateOrderAmount,finishOrder } = require('../../utils/orderHelpers')
const stripe = require("stripe")(process.env.STRIPE_SECRET);

router.all('/webhook', methods(['POST']))
router.post('/webhook', async (req, res) => {
	const sig = req.headers['stripe-signature']
	let event;
	try {
		event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.WEBHOOK_SECRET)
	} catch (err) {
		return res.status(400).send(`Webhook error: ${err.message}`)
	}
	if (event.type == 'payment_intent.succeeded') {
		const secret = event.data.object.client_secret
		try {
			const order = await Order.findOne({
				clientSecret: secret
			})
			if (!order) {
				return res.status(400).send(`Webhook error: invalid secret`)
			}
			if (!order.paid){
			return finishOrder(order,res)
			}
			
		} catch (err) {
			console.log(err)
			res.status(400).send()
		}
	}
	res.send()
})

router.all('/create', methods(['POST']))
router.post('/create', async (req, res) => {
	if (createPaymentValidation(req, res)) return
	const {
		orderId
	} = req.body
	try {
		const order = await Order.findById(orderId)
		if (!order) throw {
			message: 'The order id provided was invalid',
			error: 'not-found'
		}
		if (order.status == 'paid') throw {
			message: 'This order has already been paid',
			error: 'paid'
		}
		if (await validateCoupon(order,res)) return
		orderAmount = await calculateOrderAmount(order)
		const paymentIntent = await stripe.paymentIntents.create({
			amount: orderAmount,
			currency: "eur"
		});
		order.clientSecret = paymentIntent.client_secret;
		order.value = orderAmount
		await order.save()
		res.send({
			message: 'Payment intent created successfully',
			clientSecret: paymentIntent.client_secret
		});
	} catch (err) {
		serverError(res,err)
	}
})

module.exports = router