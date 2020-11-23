const methods = require('../../middlewares/methods')
const verify = require('../../middlewares/verifyToken')
const Order = require('../../model/order')
const {notFound} = require('../../utils/errors')
const {serverError} = require('../../utils/errors')
const {
    idValidation,
    getFilteredOrdersValidation,
} = require('../../utils/validation')

module.exports = (router) =>{
router.all('/orders',methods(['GET','POST']))
router.get('/orders',verify(1), async (req,res) => {
    try{
    const orders = await Order.find({})
    res.send({
        message:'Orders retrieved successfully',
        count: orders.length,
        orders : orders
    })
    }
    catch(err){
        serverError(res,err)
    }
})

router.post('/orders',verify(1), async (req,res) => {
    if (getFilteredOrdersValidation(req,res)) return
    try {
        const orders = await Order.find(req.body.filters).limit(req.body.limit).sort(req.body.sortBy)
        return res.send({
            message : 'Orders retrieved successfully',
            count: orders.length,
            orders : orders
        })
    }
    catch(err) {
       serverError(res,err)
    }
})

router.all('/orders/:id',methods(['GET']))
router.get('/orders/:id',verify(1),async (req,res) => {
    try{
        const order = await Order.findById(req.params.id)
        if (!order) return notFound(res,'Order')
        res.send({
            message:'Order retrieved successfully',
            order:order
        })
    }
    catch(err){
        serverError(res,err)
    }
})

router.all('/orders/:id/fulfill',methods(['POST']))
router.post('/orders/:id/fulfill',verify(1),async (req,res) => {
    if (idValidation(req,res)) return
    try{
        const order = await Order.findById(req.params.id)
        if (!order) return notFound(res,'Order')
        if (order.status == 'pending') return res.status(400).send({message:'Cannot fulfill an unpaid order',error:'unpaid'})
        if (order.status == 'fulfilled') return res.status(400).send({message:'The order has already been fulfileld',error:'fulfilled'})
        if (order.status == 'cancelled') return res.status(400).send({message:'The order has already been cancelled',error:'cancelled'})
        order.status = 'fulfilled'
        await order.save()
        res.send({
            message:'Order fulfilled successfully',
            order:order
        })
    }
    catch(err){
        serverError(res,err)
    }
})
router.all('/orders/:id/cancel',methods(['POST']))
router.post('/orders/:id/cancel',verify(1),async (req,res) => {
    if (idValidation(req,res)) return
    try{
        const order = await Order.findById(req.params.id)
        if (!order) return notFound(res,'Order')
        if (order.status == 'pending') return res.status(400).send({message:'Cannot cancel an unpaid order',error:'unpaid'})
        if (order.status == 'fulfilled') return res.status(400).send({message:'The order has already been fulfilled',error:'fulfilled'})
        if (order.status == 'cancelled') return res.status(400).send({message:'The order has already been cancelled',error:'cancelled'})
        order.status = 'cancel'
        await order.save()
        res.send({
            message:'Order cancelled successfully',
            order:order
        })
    }
    catch(err){
        serverError(res,err)
    }
})
}