const router = require('express').Router()
const nodemailer = require('nodemailer')
const {
    required
} = require('@hapi/joi')
const config = require('../utils/config')
const {
    notFound
} = require('../utils/errors')
const User = require('../model/user')
const {
    registerValidation,
    loginValidation,
    changePasswordValidation,
    resetPasswordValidation
} = require('../utils/validation')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const methods = require('../middlewares/methods')
const crypto = require('crypto')

//register user
router.all('/register', methods(['POST']))
router.post('/register', async (req, res) => {
    //validate req
    if (registerValidation(req, res)) return
    //check if email exists
    if (await User.findOne({
            email: req.body.email
        })) {
        return res.status(409).send({
            message: 'Email already exists',
            type: 'email',
            error: 'exists'
        })
    }

    //check if phone exists
    if (await User.findOne({
            phone: req.body.phone
        })) {
        return res.status(409).send({
            message: 'Phone number already exists',
            type: 'phone',
            error: 'exists'
        })
    }

    //hash passwords
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(req.body.password, salt)

    //insert into db
    const user = new User({
        ...req.body,
        password: hashPassword
    })
    try {
        const savedUser = await user.save()
        res.send({
            message: 'The user has been successfully registered'
        })
    } catch (err) {
        res.status(400).send(err)
    }
})


//log user in
router.all('/login', methods(['POST']))
router.post('/login', async (req, res) => {
    if (loginValidation(req, res)) return
    //check if email exists
    const user = await User.findOne({
        email: req.body.email
    })
    if (!user) {
        return res.status(400).send({
            message: 'Email is invalid',
            error: 'email'
        })
    }
    //check if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password)
    if (!validPass) {
        return res.status(400).send({
            message: 'Password is invalid',
            error: 'password'
        })
    }

    //create and assign a token
    const token = jwt.sign({
        _id: user._id,
        admin: user.admin
    }, process.env.TOKEN_SECRET)
    res.header('auth-token', token).send({
        message: 'Login successful'
    })
})

//send mail
const sendRecoveryMail = async (recieverAdress,user) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    const link = `${config.passwordResetLink}?secret=${user.resetSecret}`
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: recieverAdress,
        subject: 'Forgotten password',
        html: `<p>The link to reset your password is <a href="${link}">${link}</a></p>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

//send email because of forgotten password

router.all('/forgot', methods(['POST']))
router.post('/forgot', async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.body.email
        })
        if (!user) notFound(res, 'Email')
        user.resetSecret = crypto.randomBytes(20).toString('hex')
        const savedUser = await user.save()
        console.log(sendRecoveryMail(req.body.email, savedUser))
        return res.status(200).send({
            message: 'A password reset link has been sent to the email provided'
        })

    } catch (err) {
        res.status(500).send(err)
    }
})

router.all('/reset', methods(['POST']))
router.post('/reset', async (req,res)=>{
    if (resetPasswordValidation(req,res)) return 
    try{
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(req.body.password, salt)
        const user = await User.findOne({resetSecret:req.body.resetSecret})
        if (!user) res.status(400).send({message:'Reset secret was invalid',error:'invalid-secret'})
        user.password = hashPassword
        user.markModified('password')
        const a = await user.save()
        console.log(a)
        res.send({
            message:'Password was reset successfully'
        })
    }
    catch(err){
        res.status(500).send({
            message: err
        })
    }
})

module.exports = router