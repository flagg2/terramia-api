const methods = require('../../middlewares/methods')
const {
    serverError,
    notFound
} = require('../../utils/errors')
const Product = require('../../model/product')
const User = require('../../model/user')
const smartSearch = require('../../utils/smartSearch')
const mongoose = require('mongoose')
const {
    getFilteredProductsValidation,
    idValidation
} = require('../../utils/validation')
const verify = require('../../middlewares/verifyToken')
const {
    get
} = require('mongoose')


module.exports = (router) => {
    router.all('/products', methods(['GET', 'POST']))
    router.get('/products', async (req, res) => {
        try {
            const products = await Product.find({
                name: {$not: {$eq: 'Doprava'}},
                eshop: true
            })
            res.send({
                message: 'Products retrieved successfully',
                count: products.length,
                products: products
            })
        } catch (err) {
            serverError(res, err)
        }
    })
    //TODO mozno dat native filter j na admina
    router.post('/products', async (req, res) => {
        if (getFilteredProductsValidation(req, res)) return
        try {
            const products = await Product.find({
                ...req.body.filters,
                name: {$not: {$eq: 'Doprava'}},
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
            serverError(res, err)
        }
    })

    router.all('/products/:id', methods(['GET']))
    router.get('/products/:id', async (req, res) => {
        if (idValidation(req, res)) return
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
            notFound(res, 'Product')
        }
    })

    //REDUNDAND for terramia
    router.all('/products/:id/watch', methods(['POST']))
    router.post('/products/:id/watch', verify(0), async (req, res) => {
        if (idValidation(req, res)) return
        try {
            const user = await User.findById(req.user._id)
            const product = await Product.findById(req.params.id)
            if (!product) return notFound(res, 'Product')
            user.watchList.push(product._id)
            user.markModified('watchList')
            await user.save()
            res.send({
                message: 'Item added to watchlist successfully'
            })
        } catch (err) {
            serverError(res, err)
        }
    })

    router.all('/products/:id/getSimilar', methods(['GET']))
    router.get('/products/:id/getSimilar', async (req, res) => {
        if (idValidation(req, res)) return
        try {
            const product = await Product.findById(req.params.id)
            if (!product) return notFound(res, 'Product')
            const getCount = req.query.count > 0 ? req.query.count : 5
            let toFillRandomly = getCount - Object.keys(product.boughtTogether).length
            let productsToGet = []
            for (key in product.boughtTogether) {
                productsToGet.push([product.boughtTogether[key], key])
            }
            const sortedKeys = productsToGet.sort().slice(0, getCount - Math.max(0, toFillRandomly)).map(val => val[1])
            const similars = []
            const notIn = [mongoose.Types.ObjectId(product._id)]
            for (val of sortedKeys) {
                similars.push(await Product.findById(val))
                notIn.push(mongoose.Types.ObjectId[val])
            }
            const randoms = await Product.aggregate([{
                $match: {
                    '_id': {
                        $not: {
                            $in: [product._id]
                        }
                    },
                    'eshop' : true,
                }
            },{
                $sample: {
                    size: toFillRandomly
                }
            }, ])
            const result = similars.concat(randoms)
            res.send({
                message: 'Similar products retrieved successfully',
                count: result.length,
                products: result
            })
        } catch (err) {
            serverError(res, err)
        }
    })
}