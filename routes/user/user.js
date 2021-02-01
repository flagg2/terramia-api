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
        serverError(res,err)
    }
})

//update user info

router.patch('/profile', verify(0), async (req, res) => {
    //validate req
    if (patchProfileValidation(req, res)) return

    //properties ktore je mozne zmenit 
    const props = [
         'email',
         'phone'
    ]
    try {
        //update user
        const user = await User.findById(req.user._id)
        for (const prop of props) {
            if (req.body[prop] !== undefined) {
                //check if email exists
                if (prop == 'email') {
                    const userByReq = await User.findOne({
                        email: {$regex:'﻿?'+req.body.email},
                        tempUser:false
                    })
                    if (userByReq && userByReq.email != user.email) {
                        return res.status(409).send({
                            message: 'Email already exists',
                            type: 'email',
                            error: 'exists'
                        })
                    }
                }
                //check if phone exists
                else if (prop == 'phone') {
                    const userByReq = await User.findOne({
                        phone: req.body.phone,
                        tempUser:false
                    })
                    if (userByReq && userByReq.phone != user.phone) {
                        return res.status(409).send({
                            message: 'Phone number already exists',
                            type: 'phone',
                            error: 'exists'
                        })
                    }
                }
            }
        }
        await User.findByIdAndUpdate(req.user._id,{...req.body})
        const su = await User.findById(req.user._id).select('-password -resetSecret')
        res.send({
            message: 'Records updated successfully',
            user: su
        })
    } catch (err) {
        serverError(res,err)
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