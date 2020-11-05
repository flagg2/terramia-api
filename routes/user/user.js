const verify = require('../../middlewares/verifyToken')
const methods = require('../../middlewares/methods')
const User = require('../../model/user')
const Order = require('../../model/order')
const bcrypt = require('bcryptjs')
const {serverError} = require('../../utils/errors')
const {
    patchProfileValidation,
    changePasswordValidation,
    requestSamplesValidation
} = require('../../utils/validation')

const router = require('express').Router()

router.all('/orders', methods(['GET']))
router.get('/orders', verify(0), async (req, res) => {
    const orders = []
    try {
        const userInfo = await User.findById(req.user._id)
        if (!userInfo) throw {
            error: 'not-found',
            message: 'User with the provided id was not found'
        }
        for (const order in userInfo.orders){
            const ord = await Order.findById(userInfo.orders[order])
            ord.clientSecret = undefined
            orders.push({ord})
        }
        res.send({
            message: 'Orders retrieved successfully',
            count: orders.length,
            orders: orders
        })
    } catch (err) {
        res.status(404).send(...err)
    }
})

//get info about the user
router.all('/requestSamples', methods(['POST']))
router.post('/requestSamples', verify(0), async (req,res) => {
    if (requestSamplesValidation(req,res)) return
    try{
        const user = await User.findById(req.user._id)
        if (user.sampleSent) return res.status(400).send({
            message:'Samples have already been sent to this user',
            error: 'already-sent'
        })
        user.sampleType = req.body.type
        await user.save()
        res.send({
            message:'Samples requested successfully'
        })
    }
    catch (err){
        serverError(res,err)
    }
})

router.all('/profile', methods(['GET', 'PATCH']))
router.get('/profile', verify(0), async (req, res) => {
    try {
        const userInfo = await User.findById(req.user._id).select('-password')
        if (!userInfo) throw {
            error: 'not-found',
            message: 'User with the provided id was not found'
        }
        res.send({
            message: 'User info retrieved successfully',
            user: userInfo
        })
    } catch (err) {
        res.status(404).send(...err)
    }
})

//update user info

router.patch('/profile', verify(0), async (req, res) => {
    //validate req
    if (patchProfileValidation(req, res)) return

    //properties ktore je mozne zmenit 
    const props = {
        a: 'name',
        b: 'email',
        c: 'phone',
        d: 'address',
        e: 'city',
        f: 'psc',
        g: 'country'
    }
    try {
        //update user
        const user = await User.findById(req.user._id)
        for (const propk in props) {
            const prop = props[propk]
            //TODO zmenit eval na zatvorkovu notaciu
            if (eval(`req.body.${prop} !== undefined`)) {
                //check if email exists
                if (prop == 'email') {
                    if (await User.findOne({
                            email: req.body.email
                        })) {
                        return res.status(409).send({
                            message: 'Email already exists',
                            type: 'email',
                            error: 'exists'
                        })
                    }
                }
                //check if phone exists
                else if (prop == 'phone') {
                    if (await User.findOne({
                            phone: req.body.phone
                        })) {
                        return res.status(409).send({
                            message: 'Phone number already exists',
                            type: 'phone',
                            error: 'exists'
                        })
                    }
                }
                eval(`user.${prop} = req.body.${prop}`)
            }
        }
        user.save()
        res.send({
            message: 'Records updated successfully'
        })
    } catch (err) {
        res.status(400).send(err)
    }
})

router.all('/password', methods(['POST']))
router.post('/password', verify(0), async (req, res) => {
    if (changePasswordValidation(req, res)) return
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(req.body.password, salt)
    try {
        const user = await User.findById(req.user._id)
        const validPass = await bcrypt.compare(req.body.oldPassword, user.password)
        if (!validPass){
            return res.status(400).send({
            message:'The old password provided is invalid',
            error:'invalid-password'
            })
        }
        user.password = hashPassword
        user.save()
        res.send({
            message: 'Password changed successfully'
        })
    } catch (err) {
        serverError(res,err)
    }
})

module.exports = router