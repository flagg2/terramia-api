const methods = require('../../middlewares/methods')
const verify = require('../../middlewares/verifyToken')
const Coupon = require('../../model/coupon')
const {
    createCouponValidation, idValidation
} = require('../../utils/validation')
const {serverError} = require('../../utils/errors')

module.exports = (router) => {
    router.all('/coupons/create', methods(['POST']))
    router.post('/coupons/create', verify(1), async (req, res) => {
        if (createCouponValidation(req,res)) return
        try{
            const coupons = await Coupon.find({})
            for (const coupon of coupons){
                if (coupon.code == req.body.code){
                    return res.status(409).send({
                        message:'A coupon with the same code already exists',
                        error:'exists'
                    })
                }
            } 
            if (req.body.type == 'percentage' && req.body.value>100){
                return res.status(400).send({
                    message:'Cannot create a percentage discount with value over 100',
                    error:'invalid-discount'
                })
            }
            const coupon = new Coupon({
                ...req.body
            })
            await coupon.save()
            res.send({
                message:'Coupon created successfully'
            })
        }
        catch(err){
            serverError(res,err)
        }
    })

    router.all('/coupons',methods(['GET']))
    router.get('/coupons',verify(1), async (req,res) => {
        try{
            const coupons = await Coupon.find({})
            res.send({
                message:'Coupons retrieved successfully',
                count:coupons.length,
                coupons:coupons
            })
        }
        catch(err){
            serverError(res,err)
        }
    })

    router.all('/coupons/:id', methods(['GET','DELETE']))
    router.get('/coupons/:id', verify(1), async (req,res) => {
        if (idValidation(req,res)) return
    })
}