const methods = require('../middlewares/methods')
const verify = require('../middlewares/verifyToken')
const router = require('express').Router()
const Product = require('../model/product')
const Order = require('../model/order')
const User = require('../model/user')
const smartSearch = require('../utils/smartSearch')
const {notFound} = require('../utils/errors')
const {resizeImage,unlinkIfRedundant} = require('../utils/files')
const {
    newProductValidation,
    getFilteredProductsValidation,
    getFilteredUsersValidation,
    patchProductValidation,
    getFilteredOrdersValidation
} = require('../utils/validation')
const upload = require('../utils/multerConfig')
const { restart } = require('nodemon')
const order = require('../model/order')
const user = require('../model/user')


//get list of all products
router.all('/products', methods(['GET', 'POST']))
router.get('/products', verify(2), async (req, res) => {
    try {
        const products = await Product.find()
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

router.post('/products', verify(2), async (req, res) => {
    if (getFilteredProductsValidation(req,res)) return
    try {
        const products = await Product.find(req.body.filters).limit(req.body.limit)
        if (req.body.query){
            const searchResults = smartSearch(req.body.query,products)
            return res.send({
                message : 'Products retrieved successfully',
                count: searchResults.length,
                products : searchResults
            })
        }
        products.sort(req.body.sortBy)
        res.send({
            message : 'Products retrieved successfully',
            count: products.length,
            products : products
        })
    }
    catch {
        return res.status(500).send(({
            message: 'An unknown error has occured'
        }))
    }
})


router.all('/products/:id/image', methods(['POST']))
router.post('/products/:id/image', [verify(2), upload.single('productImage')], async (req, res) => {
    if (!req.file) {
        return res.status(400).send({
            message: 'The file provided was invalid',
            error: 'invalid-file'
        })
    }
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            unlinkIfRedundant(req.file.filename)
            return notFound(res,'Product')
        }
        unlinkIfRedundant(product.imagePath)
        product.imagePath = req.file.filename
        resizeImage(req.file.filename)
        product.save()
        res.send({
            message: 'Image added successfully'
        })
    } catch {
        unlinkIfRedundant(req.file.filename)
        return res.status(404).send({
            message: 'The product with the specified id could not be found',
            error: 'not-found'
        })
    }
})


router.all('/products/create', methods(['POST']))
router.post('/products/create', verify(2), async (req, res) => {
    if (newProductValidation(req, res)) return
    try {
        //check if it doesnt exist already
        const exists = await Product.findOne({
            name: req.body.name,
            type: req.body.type,
            price: req.body.price
        })
        if (exists) {
            return res.status(303).send({
                message: 'Product already exists, returned the id of the product',
                error: 'exists',
                id: exists._id
            })
        }
        const product = new Product({
            ...req.body
        })
        product.save()
        res.send({
            success: 'New product created successfully'
        })
    } catch (err) {
        res.status(400).send(err)
    }

})

router.all('/products/:id', methods(['GET', 'DELETE', 'PATCH']))
router.get('/products/:id',verify(2), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return notFound(res,'Product')
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


router.patch('/products/:id', verify(2), async (req,res) => {
    if (patchProductValidation(req, res)) return
    try{
        const product = await Product.findById(req.params.id)
        if (!product) return notFound(res,'Product')
        for (const key in req.body){
            product[key] = req.body[key]
        }
        product.save()
        return res.send(
            {
                message:'Product patched successfully'
            }
        )
    }
    catch{
        res.status(404).send({
            message: 'No product matches the provided id',
            error: 'not-found'
        })
    }
})


router.delete('/products/:id', verify(2), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return notFound(res,'Product')
        }
        if (product.soldAmount > 0) {
            return res.status(400).send({
                message: 'You tried to delete an item that has already been sold. Because this request might break the functionality of other api calls, it has been blocked',
                error: 'sold-amount-not-null'
            })
        }
        Product.findByIdAndDelete(req.params.id, () => {})
        res.send({
            message: 'Deleted successfully'
        })
    } catch (err) {
        res.status(404).send({
            message: 'No product matches the provided id',
            error: 'not-found'
        })
    }
})

router.all('/orders',methods(['GET','POST']))
router.get('/orders',verify(2), async (req,res) => {
    try{
    const orders = await Order.find({})
    res.send({
        message:'Orders retrieved successfully',
        count: orders.length,
        orders : orders
    })
    }
    catch(err){
        res.status(500).send({message:err})
    }
})

router.post('/orders',verify(2), async (req,res) => {
    if (getFilteredOrdersValidation(req,res)) return
    try {
        const orders = await Order.find(req.body.filters).limit(req.body.limit).sort(req.body.sortBy)
        return res.send({
            message : 'Orders retrieved successfully',
            count: orders.length,
            orders : orders
        })
    }
    catch {
        return res.status(500).send(({
            message: 'An unknown error has occured'
        }))
    }
})

router.all('/orders/:id',methods(['GET']))
router.get('/orders/:id',verify(2),async (req,res) => {
    try{
        const order = await Order.findById(req.params.id)
        if (!order) return notFound(res,'Order')
        res.send({
            message:'Order retrieved successfully',
            order:order
        })
    }
    catch(err){
        res.status(500).send({
            message: err
        })
    }
})

router.all('/orders/:id/fulfill',methods(['POST']))
router.post('/orders/:id/fulfill',verify(2),async (req,res) => {
    try{
        const order = await Order.findById(req.params.id)
        if (!order) return notFound(res,'Order')
        if (order.status == 'pending') return res.status(400).send({message:'Cannot fulfill an unpaid order',error:'unpaid'})
        if (order.status == 'fulfilled') return res.status(400).send({message:'The order has already been fulfileld',error:'fulfilled'})
        order.status = 'fulfilled'
        await order.save()
        res.send({
            message:'Order fulfilled successfully',
            order:order
        })
    }
    catch(err){
        res.status(500).send({
            message: err
        })
    }
})

router.all('/users', methods(['GET','POST']))
router.get('/users',verify(2), async (req,res) => {
    try{
        const users = await User.find({})
        res.send({
            message:'Users retrieved successfully',
            count:users.length,
            users:users
        })
    }
    catch(err){
        res.status(500).send({
            message: err
        })
    }
})

router.post('/users', verify(2), async (req, res) => {
    if (getFilteredUsersValidation(req,res)) return
    try {
        const users = await User.find(req.body.filters).limit(req.body.limit).sort(req.body.sortBy)
        if (req.body.query){
            const searchResults = smartSearch(req.body.query,users,['name','email','phone'])
            return res.send({
                message : 'Users retrieved successfully',
                count: searchResults.length,
                users : searchResults
            })
        }
        res.send({
            message : 'Users retrieved successfully',
            count: users.length,
            users : users
        })
    }
    catch {
        return res.status(500).send(({
            message: 'An unknown error has occured'
        }))
    }
})

router.all('/users/:id',methods(['GET']))
router.get('/users/:id',verify(2),async (req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if (!user) return notFound(res,'User')
        res.send({
            message:'User retrieved successfully',
            user:user
        })
    }
    catch(err){
        res.status(500).send({
            message: err
        })
    }
})

router.all('/users/:id/sendSample',methods(['POST']))
router.post('/users/:id/sendSample',verify(2),async (req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if (!user) return notFound(res,'User')
        if (user.sampleSent == true) return res.status(400).send({message:'Samples were already sent to the user with the provided id',error:'sent'})
        user.sampleSent = true
        user.save()
        res.send({
            message:'Samples were sent to the user successfully',
            user:user
        })
    }
    catch(err){
        res.status(500).send({
            message: err
        })
    }
})

module.exports = router