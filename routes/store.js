const methods = require('../middlewares/methods')
const verify = require('../middlewares/verifyToken')
const router = require('express').Router()
const Product = require('../model/product')
const Order = require('../model/order')
const User = require('../model/user')
const smartSearch = require('../utils/smartSearch')
const {
    getFilteredProductsValidation,
    idValidation,
    tempUserValidation,
    orderValidation
} = require('../utils/validation')
const {
    route
} = require('./auth')
const { notFound } = require('../utils/errors')

router.all('/products', methods(['GET', 'POST']))
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({
            eshop:true
        })
        res.send({
            message: 'Products retrieved successfully',
            count: products.length,
            products: products
        })
    } catch {
        return res.status(500).send(({
            message: 'An unknown error has occured'
        }))
    }
})

router.post('/products', async (req, res) => {
    if (getFilteredProductsValidation(req, res)) return
    try {
        const products = await Product.find({
            ...req.body.filters,
            eshop:true
        }).limit(req.body.limit).sort(req.body.sortBy)
        if (req.body.query) {
            const searchResults = smartSearch(req.body.query, products)
            return res.send({
                message: 'Products retrieved successfully',
                count: searchResults.length,
                products: searchResults
            })
        }
        res.send({
            message: 'Products retrieved successfully',
            count: products.length,
            products: products
        })
    } catch {
        return res.status(500).send(({
            message: 'An unknown error has occured'
        }))
    }
})

router.all('/products/:id', methods(['GET']))
router.get('/products/:id', async (req, res) => {
    if (idValidation(req,res)) return
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return res.status(404).send({
                message: 'No product matches the provided id',
                error: 'not-found'
            })
        }
        res.send({
            message: 'Retrieved successfully',
            product: product
        })
    } catch (err) {
        res.status(404).send({
            message: 'No product matches the provided id',
            error: 'not-found'
        })
    }
})


router.all('/order', methods(['POST']))
router.post('/order', verify(0, false), async (req, res) => {
    if (req.user) req.body.userId = req.user._id
    if (orderValidation(req,res)) return
    try {
        if (!req.user) {
            return res.status(400).send({
                error:'no-user',
                message:'You have to create a temporary user before making an order'
            })
        }
        if (idValidation(req,res)) return
        //TODO zlepsenie pridat quantities a same item checking
        const user = await User.findById(req.body.userId)
        if (!user) notFound(res, 'User')
        const required  = ['city','psc','address','country']
        const notSatisfied = []
        required.forEach(requirement => {
            if (!user[requirement]) notSatisfied.push(requirement)
        })
        if (notSatisfied) return res.status(400).send({
            error:'billing-data',
            message:'Some of the billing details of this user have not yet been defined',
            missing: notSatisfied.join(', ')
        })
        for (const product in req.body.products){
            console.log(req.body.products[product])
            if(!await Product.findById(req.body.products[product])) return res.status(404).send({error:'not-found',message: 'One or more product ids provided were invalid'})
        }
        const order = new Order({
           ...req.body,
           orderedBy : req.body.userId
        })
        const savedOrder = await order.save()
        user.orders.push(savedOrder._id)
        user.markModified('orders')
        user.save()
        res.send({
            message:'New order created successfully',
            orderId: savedOrder._id
        })
    } catch (err) {
        res.status(400).send({
            error:err,
            message:'An unknown error has occured'
        })
    }
})

router.all('/order/:id', methods(['GET']))
router.get('/order/:id', async (req,res) => {
    if (idValidation(req,res)) return
    try{
        const order = await Order.findById(req.params.id)
        if (!order) throw new Error
        res.send({
            message:'The order was retrieved successfully',
            order: order
        })

    }
    catch(err){
        res.status(404).send({
            error:'not-found',
            message:'The provided id does not match any order in the database'
        })
    }
})


router.all('/tempUser', methods(['POST']))
router.post('/tempUser', async (req, res) => {
    if (tempUserValidation(req,res)) return
    try{
        const user = new User({
            ...req.body
        })
        const tempUser = await user.save()
        res.send({
            id:tempUser._id,
            message:'Temporary user created successfully'

        })
    }
    catch (err){
        res.status(400).send(err)
    }
})

router.all('/tempUser/:id',methods(['GET']))
router.get('/tempUser/:id', async (req,res) => {
    if (idValidation(req,res)) return
    try{
        const user = await User.findById(req.params.id)
        if (!user) return notFound(res,'User')
        if (user.password) return res.status(400).send({
            message:'The provided id matches an actual user, not a temporary one',
            error:'not-temp'
        })
        res.send({
            message:'Temporary user info retrieved successfully',
            user: user
        })

    }
    catch(err){
        res.status(500).send({
            message:'An unknown error has occured',
            error: err
        })
    }
})


module.exports = router