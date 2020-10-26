const router = require('express').Router()
const methods = require('../middlewares/methods')
const Product = require('../model/product')
const bodyParser = require('body-parser')
const Order = require('../model/order')
const {
	createPaymentValidation
} = require('../utils/validation')
const User = require('../model/user')
const verify = require('../middlewares/verifyToken')
const {
	create
} = require('../model/user')
const stripe = require("stripe")("sk_test_51Hc5rMFGDIXHKcdbWSCiO0wJGIK2a4i5WUmM0OSoehT2wouQSxGQSudTSOqSqflMnEc2OIZ8ts8UZOQncppE0gbS00J5oUWHnc");

const calculateOrderAmount = products => {
	let totalPrice = 0;
	products.forEach(product => {
		totalPrice += product.price
	});
	return totalPrice;
};

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
			order.status = "paid"
			const user = await (User.findById(order.orderedBy))
			user.totalSpent += order.value;
			for (const key in order.products) {
				const product = await Product.findById(order.products[key])
				product.soldAmount += 1,
					await product.save()
			}
			await user.save()
			await order.save()
			res.send()
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
		const products = []
		if (!order) throw {
			message: 'The order id provided was invalid',
			error: 'not-found'
		}
		for (const key in order.products) {
			const product = await Product.findById(order.products[key])
			if (!product) throw {
				message: 'One or more of products provided product ids were invalid',
				error: 'not-found'
			}
			products.push(product)
		}
		if (order.status == 'paid') throw {
			message: 'This order has already been paid',
			error: 'paid'
		}
		orderAmount = calculateOrderAmount(products)
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
		res.status(400).send({
			...err
		})
	}
})

module.exports = router