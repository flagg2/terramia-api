const methods = require('../../middlewares/methods')
const verify = require('../../middlewares/verifyToken')
const Order = require('../../model/order')
const ExcelGenerator = require('../../utils/excelGenerator')
const User = require('../../model/user')
const {notFound} = require('../../utils/errors')
const {serverError} = require('../../utils/errors')
const { sendOrderCancelledMail,sendOrderProcessedMail,sendOrderSentMail } = require('../../utils/mailer')
const {refundOrder} = require('../../utils/orderHelpers')
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
        const valOverZero = req.body.filters.valueOverZero
        if (req.body.filters) delete req.body.filters.valueOverZero
        let orders
        if (valOverZero){
            orders = await Order.find({...req.body.filters, value : {$gt:0}}).limit(req.body.limit).sort(req.body.sortBy)
        }
        else{
            orders = await Order.find(req.body.filters).limit(req.body.limit).sort(req.body.sortBy)
        }
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

router.all("/orders/createExcel",methods(['POST']))
router.post("/orders/createExcel",verify(1),async (req,res) =>
{
    try {
        const eg = new ExcelGenerator()
        const name = await eg.generateExcel()
        return res.send({
            message:'Excel file created successfully',
            path : `${name}.xlsx`
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
        console.log(req.params.id)
        const order = await Order.findById(req.params.id)
        console.log(order)
        if (!order) return notFound(res,'Order')
        if (order.status == 'sent') return res.status(400).send({message:'The order has already been sent',error:'sent'})
        if (order.status == 'pending') return res.status(400).send({message:'Cannot fulfill an incomplete order',error:'incomplete'})
        if (order.status == 'fulfilled') return res.status(400).send({message:'The order has already been fulfileld',error:'fulfilled'})
        if (order.status == 'cancelled') return res.status(400).send({message:'The order has already been cancelled',error:'cancelled'})
        order.status = 'fulfilled'
        const user = await User.findById(order.orderedBy)
        await sendOrderProcessedMail(user.email,order)
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
        if (order.status == 'sent') return res.status(400).send({message:'The order has already been sent',error:'sent'})
        if (order.status == 'pending') return res.status(400).send({message:'Cannot cancel an incomplete order',error:'incomplete'})
        if (order.status == 'cancelled') return res.status(400).send({message:'The order has already been cancelled',error:'cancelled'})
        order.status = 'cancelled'
        await order.save()
        await refundOrder(order)
        const user = await User.findById(order.orderedBy)
        await sendOrderCancelledMail(user.email,order)
        res.send({
            message:'Order cancelled successfully',
            order:order
        })
    }
    catch(err){
        serverError(res,err)
    }
})
router.all('/orders/:id/send',methods(['POST']))
router.post('/orders/:id/send',verify(1),async (req,res) => {
    if (idValidation(req,res)) return
    try{
        const order = await Order.findById(req.params.id)
        if (!order) return notFound(res,'Order')
        if (order.status == 'pending') return res.status(400).send({message:'Cannot send an incomplete order',error:'incomplete'})
        if (order.status == 'ordered') return res.status(400).send({message:'Cannot send an unfulfilled order',error:'unfulfilled'})
        if (order.status == 'sent') return res.status(400).send({message:'The order has already been sent',error:'sent'})
        if (order.status == 'cancelled') return res.status(400).send({message:'The order has already been cancelled',error:'cancelled'})
        order.status = 'sent'
        const user = await User.findById(order.orderedBy)
        await sendOrderSentMail(user.email,order)
        await order.save()
        res.send({
            message:'Order sent successfully',
            order:order
        })
    }
    catch(err){
        serverError(res,err)
    }
})
}
