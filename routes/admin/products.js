const methods = require('../../middlewares/methods')
const verify = require('../../middlewares/verifyToken')
const Product = require('../../model/product')
const {serverError} = require('../../utils/errors')
const smartSearch = require('../../utils/smartSearch')
const {notFound} = require('../../utils/errors')
const {resizeImage,unlinkIfRedundant} = require('../../utils/files')
const {
    newProductValidation,
    idValidation,
    getFilteredProductsValidation,
    patchProductValidation,
} = require('../../utils/validation')
const upload = require('../../utils/multerConfig')

module.exports = (router) => {
    router.all('/products', methods(['GET', 'POST']))
    router.get('/products', verify(1), async (req, res) => {
        try {
            const products = await Product.find()
            res.send({
                message: 'Products retrieved successfully',
                count: products.length,
                products: products
            })
        } catch(err){
            serverError(res,err)
        }
    })
    
    router.post('/products', verify(1), async (req, res) => {
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
        catch (err){
            serverError(res,err)
        }
    })
    
    
    router.all('/products/:id/image', methods(['POST']))
    router.post('/products/:id/image', [verify(1), upload.single('productImage')], async (req, res) => {
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
            return res.status(400).send({
                message: 'The id provided is in an invalid format',
                error: 'format'
            })
        }
    })
    
    
    router.all('/products/create', methods(['POST']))
    router.post('/products/create', verify(1), async (req, res) => {
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
    router.get('/products/:id',verify(1), async (req, res) => {
        if (idValidation(req,res)) return
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
    
    
    router.patch('/products/:id', verify(1), async (req,res) => {
        if (idValidation(req,res)) return
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
    
    
    router.delete('/products/:id', verify(1), async (req, res) => {
        if (idValidation(req,res)) return
        try {
            const product = await Product.findById(req.params.id)
            if (!product) {
                return notFound(res,'Product')
            }
            if (product.soldAmount > 0) {
                return res.status(400).send({
                    message: 'You tried to delete an item that has already been sold. Because this request might break the functionality of other api calls, your request was blocked',
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
}