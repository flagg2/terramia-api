const {
    preRegisterValidation,
    billingRegisterValidation,
    sendCodeRegisterValidation,
    finishRegisterValidation
} = require('../../utils/validation')
const {
    notFound,
    serverError
} = require('../../utils/errors')
const {
    sendCodeVerificationMail,
    sendNewUserSummaryMail
} = require('../../utils/mailer')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const methods = require('../../middlewares/methods')
const crypto = require('crypto')
const User = require('../../model/user')

module.exports = (router) => {
    router.all('/register/pre', methods(['POST']))
    router.post('/register/pre', async (req, res) => {
        if (preRegisterValidation(req, res)) return
        if (await User.findOne({
                email: req.body.email
            })) {
            return res.status(409).send({
                message: 'Email already exists',
                type: 'email',
                error: 'exists',
                regStep: user.regStep
            })
        }
        const user = new User({
            ...req.body
        })
        try {
            await user.save()
            res.send({
                message: 'User pre-registered successfully'
            })
        } catch (err) {
            serverError(res, err)
        }
    })

    router.all('/register/billing', methods(['POST']))
    router.post('/register/billing', async (req, res) => {
        if (billingRegisterValidation(req, res)) return
        try {
            let user = await User.findOne({
                email: req.body.email
            })
            if (!user) return notFound(res, 'User')
            if (user.address) return res.status(400).send({
                message: 'This user has already provided their billing information',
                error: 'billing-exists'
            })
            if (user.password) return res.status(400).send({
                message: 'This user has already finished the process of registration',
                error: 'reg-finished'
            })
            if (req.body.phone) {
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
            const result = await User.updateOne({
                email: req.body.email
            }, {
                ...req.body,
                regStep:1
            })
            const user2 = await User.findOne({email:req.body.email})
            sendNewUserSummaryMail(user2)
            res.send({
                message: 'Billing details added succesfully'
            })
        } catch (err) {
            serverError(res, err)
        }
    })

    router.all('/register/sendCode', methods(['POST']))
    router.post('/register/sendCode', async (req, res) => {
        if (sendCodeRegisterValidation(req, res)) return
        try {
            const user = await User.findOne({
                email: req.body.email
            })
            if (!user) return notFound(res, 'User')
            if (!user.address) return res.status(400).send({
                message: 'This user has not yet provided their billing information',
                error: 'no-billing'
            })
            if (user.password) return res.status(400).send({
                message: 'This user has already finished the process of registration',
                error: 'reg-finished'
            })
            user.registrationCode = crypto.randomBytes(12).toString('hex')
            user.regStep = 2
            const savedUser = await user.save()
            sendCodeVerificationMail(user.email, user)
            res.send({
                message: 'Register code sent successfully',
                user:savedUser
            })

        } catch (err) {
            serverError(res, err)
        }
    })

    router.all('/register/finish', methods(['POST']))
    router.post('/register/finish', async (req, res) => {
        if (finishRegisterValidation(req, res)) return
        try {
            const user = await User.findOne({
                email: req.body.email
            })
            if (!user) return notFound(res, 'User')
            if (!user.address) return res.status(400).send({
                message: 'This user has not yet provided their billing information',
                error: 'no-billing'
            })
            if (user.password) return res.status(400).send({
                message: 'This user has already finished the process of registration',
                error: 'reg-finished'
            })
            if (req.body.code != user.registrationCode) return res.status(400).send({
                message: 'Invalid registration code',
                error: 'invalid-code'
            })
            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(req.body.password, salt)
            const result = await User.updateOne({
                email: req.body.email,
                regStep:3
            }, {
                password: hashPassword
            })
            await user.save()
            res.send({
                message: 'User registered successfully'
            })
        } catch (err) {
            serverError(res, err)
        }
    })
}