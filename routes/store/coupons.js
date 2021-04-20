const methods = require('../../middlewares/methods')
const {
    serverError,
    notFound
} = require('../../utils/errors')
const Coupon = require('../../model/coupon')
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
    router.all("/coupons/:code",methods(['GET']))
    router.get("/coupons/:code",verify(1),async (req,res) =>
    {
        const coupon = await Coupon.findById(req.params.code)
        if (!coupon) return notFound(res,'Coupon')
        try {
            return res.send({
                message:'Coupon loaded successfully',
                coupon:coupon
            })
        }
        catch(err) {
            serverError(res,err)
        }
    })
}