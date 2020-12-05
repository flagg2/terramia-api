const Joi = require('@hapi/joi')
const mongoose = require('mongoose')
const passwordValidator = require('password-validator')

const validate = (req, res, Joischema) => {
    const {
        error
    } = Joischema.validate(req.body)
    return error != null ? res.status(400).send({
        message: error.details[0].message,
        error: 'format'
    }) : null
}

const validatePassword = (pass) => {
    const schema = new passwordValidator();
    schema
        .is().min(8)
        .is().max(100)
        .has().uppercase()
        .has().lowercase()
        .has().digits(1)
        .has().letters()
        .has().not().spaces()
    const valid = schema.validate(pass)
    if (!valid) {
        return new Object({
            message: 'Password is in an invalid format',
            error: 'format'
        })
    }
}

//New product validation

const newProductValidation = (req, res) => {
    const Joischema = Joi.object({
        type: Joi.number().min(1).max(16).required(),
        name: Joi.string().max(100).required(),
        category: Joi.number().max(50),
        label: Joi.string().max(50),
        description: Joi.string().max(5000),
        price: Joi.number().min(0).required(),
        eshop: Joi.boolean(),
        available: Joi.boolean(),
        topProduct: Joi.boolean(),
        problemType: Joi.array().items(Joi.number()),
        points:Joi.number().min(0)
    })
    return validate(req, res, Joischema)
}

const patchProductValidation = (req, res) => {
    const Joischema = Joi.object({
        type: Joi.number().min(1).max(16),
        name: Joi.string().max(100),
        category: Joi.number().max(50),
        label: Joi.string().max(50),
        description: Joi.string().max(5000),
        price: Joi.number().min(0),
        eshop: Joi.boolean(),
        available: Joi.boolean(),
        topProduct: Joi.boolean(),
        problemType: Joi.array().items(Joi.number()),
        points:Joi.number().min(0)
    })
    return validate(req, res, Joischema)
}

const getFilteredProductsValidation = (req, res) => {
    const Joischema = Joi.object({
        filters: Joi.object({
            category: Joi.number().max(50),
            label: Joi.string().max(50),
            name: Joi.string().max(100),
            type: Joi.number().min(1).max(16),
            available: Joi.boolean(),
            topProduct: Joi.boolean(),
            problemType: Joi.number()
        }),
        sortBy: Joi.object({
            price: Joi.number().valid(-1, 1),
            soldAmount: Joi.number().valid(-1, 1),
            points: Joi.number().valid(-1, 1)
        }),
        limit: Joi.number().min(0),
        query: Joi.string(),
        mostSold: Joi.boolean()

    })
    return validate(req, res, Joischema)
}

const requestSamplesValidation = (req,res) => {
    const Joischema = Joi.object({
        type: Joi.number().min(1).max(4).required()
    })
    return validate(req,res,Joischema)
}

const getFilteredOrdersValidation = (req, res) => {
    const Joischema = Joi.object({
        filters: Joi.object({
            status: Joi.string().valid('ordered','fulfilled','pending','cancelled','sent'),
            orderedBy: Joi.string().max(20)
        }),
        sortBy: Joi.object({
            value: Joi.number().valid(-1, 1),
            date: Joi.number().valid(-1,1)
        }),
        limit: Joi.number().min(0),
    })
    return validate(req, res, Joischema)
}

const getFilteredUsersValidation = (req, res) => {
    const Joischema = Joi.object({
        filters: Joi.object({
            admin: Joi.number().max(2).min(0),
            name: Joi.string().max(50),
            email: Joi.string().email(),
            phone: Joi.string().max(15)
        }),
        sortBy: Joi.object({
            date: Joi.number().valid(-1, 1),
            totalSpent: Joi.number().valid(-1, 1)
        }),
        limit: Joi.number().min(0),
        query: Joi.string().max(40)
    })
    return validate(req, res, Joischema)
}

const tempUserValidation = (req, res) => {
    const Joischema = Joi.object({
        name: Joi.string().min(6).max(50).required(),
        email: Joi.string().min(6).max(255).required().email(),
        phone: Joi.string().regex(/^[+]?[0-9]+$/).min(6).max(20).required(),
        address: Joi.string().max(50).required(),
        psc: Joi.string().min(3).max(10).required(),
        country: Joi.string().max(30).required(),
        city: Joi.string().max(50).required(),
    })
    return validate(req, res, Joischema)
}

const idValidation = (req,res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).send({
            message:'The id provided is in an invalid format',
            error: 'format'
        })
    }
}

const createPaymentValidation = (req,res) => {
    const Joischema = Joi.object({
        orderId: Joi.string().required()
    })
    try{
    if (!mongoose.Types.ObjectId.isValid(req.body.orderId)) {
        return res.status(400).send({
            error: 'format',
            message: 'Order id is in an invalid format'
        })
    }
    }
    catch{
        return validate(req, res, Joischema)
    }
    return validate(req, res, Joischema)
}

const orderValidation = (req, res) => {
    const Joischema = Joi.object({
        userId: Joi.string().required(),
        products: Joi.array().items(Joi.string()).required(),
        overwrite: Joi.object({
            address: Joi.string().max(50),
            psc: Joi.string().min(3).max(10),
            country: Joi.string().min(6).max(30),
            city: Joi.string().max(50),
        }),
        coupon: Joi.string().max(20)
    })
    try {
        if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
            return res.status(400).send({
                error: 'format',
                message: 'User id is in an invalid format'
            })
        }
        for (const id in req.body.products) {
            if (!mongoose.Types.ObjectId.isValid(req.body.products[id])) {
                return res.status(400).send({
                    error: 'format',
                    message: 'One or more of the product ids provided is in an invalid format'
                })
            }
        }
    } catch (err) {
        return res.status(400).send({
            error: 'format',
            message: 'An unexpected error has occured, did you pass products as an array?'
        })
    }
    return validate(req, res, Joischema)
}

const registerValidation = (req, res) => {
    const Joischema = Joi.object({
        //TODO add fail cases to when user has no name/phone when they are creating an order
        name: Joi.string().min(6).max(50),
        email: Joi.string().min(6).max(255).required().email(),
        password: Joi.string().min(6).max(1024).required(),
        phone: Joi.string().regex(/^[+]?[0-9]+$/).min(6).max(20),
        address: Joi.string().max(50),
        psc: Joi.string().min(3).max(10),
        country: Joi.string().min(6).max(30),
        city: Joi.string().max(50),

    })
    const passwordError = validatePassword(req.body.password)
    if (passwordError) {
        return res.status(400).send(passwordError)
    }
    return validate(req, res, Joischema)
}

const preRegisterValidation = (req,res) => {
    const Joischema = Joi.object({
        email: Joi.string().min(6).max(255).required().email(),
        knowDoTerra: Joi.boolean().required(),
        sampleType: Joi.number().min(1).max(9).required(),
    })
    return validate(req,res,Joischema)
}

const sendCodeRegisterValidation = (req,res) => {
    const Joischema = Joi.object({
        email : Joi.string().min(6).max(255).required().email()
    })
    return validate(req,res,Joischema)
}

const billingRegisterValidation = (req,res) => {
    const Joischema = Joi.object({
        email: Joi.string().min(6).max(255).required().email(),
        phone: Joi.string().regex(/^[+]?[0-9]+$/).min(6).max(20).required(),
        address: Joi.string().max(50).required(),
        psc: Joi.string().min(3).max(10).required(),
        country: Joi.string().max(30).required(),
        city: Joi.string().max(50).required(),
        name: Joi.string().max(50).required()
    })
    return validate(req,res,Joischema)
}

const finishRegisterValidation = (req,res) => {
    const Joischema = Joi.object({
        email: Joi.string().min(6).max(255).required().email(),
        code: Joi.string().required(),
        password: Joi.string().min(8).max(1024).required()
    })
    const passwordError = validatePassword(req.body.password)
    if (passwordError) {
        return res.status(400).send(passwordError)
    }
    validate(req,res,Joischema)
}

const loginValidation = (req, res) => {
    const Joischema = Joi.object({
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    })
    return validate(req, res, Joischema)
}

const changePasswordValidation = (req, res) => {
    const Joischema = Joi.object({
        oldPassword: Joi.string().min(8).max(1024).required(),
        password: Joi.string().min(8).max(1024).required()
    })
    const passwordError = validatePassword(req.body.password)
    if (passwordError) {
        return res.status(400).send(passwordError)
    }
    return validate(req, res, Joischema)
}

const resetPasswordValidation = (req, res) => {
    const Joischema = Joi.object({
        password: Joi.string().min(8).max(1024).required(),
        resetSecret: Joi.string().required()
    })
    const passwordError = validatePassword(req.body.password)
    if (passwordError) {
        return res.status(400).send(passwordError)
    }
    return validate(req, res, Joischema)
}

const patchProfileValidation = (req, res) => {
    const Joischema = Joi.object({
        name: Joi.string().min(6).max(50),
        email: Joi.string().min(6).max(255).email(),
        password: Joi.string().min(8).max(1024),
        phone: Joi.string().regex(/^[+]?[0-9]+$/).min(6).max(20),
        address: Joi.string().max(50),
        psc: Joi.string().min(3).max(10),
        city: Joi.string().max(50),
        country: Joi.string().max(50)

    })
    return validate(req, res, Joischema)
}

const createCouponValidation = (req,res) => {
    const Joischema = Joi.object({
        code: Joi.string().max(20).required(),
        type: Joi.string().valid('flat','percentage').required(),
        value: Joi.number().min(0).required(),
        maxUses: Joi.number().min(0),
        minValue: Joi.number().min(0),
        maxUsesTotal: Joi.number().min(0)
    })

    return validate(req,res,Joischema)
}

const createMessageValidation = (req,res) => {
    const Joischema = Joi.object({
        name: Joi.string().max(50).required(),
        email: Joi.string().max(50).required().email(),
        phone: Joi.string().regex(/^[+]?[0-9]+$/).min(6).max(20),
        message:Joi.string().max(2000).required() 
    })

    return validate(req,res,Joischema)
}

module.exports = {
    requestSamplesValidation,
    getFilteredUsersValidation,
    registerValidation,
    preRegisterValidation,
    billingRegisterValidation,
    finishRegisterValidation,
    getFilteredOrdersValidation,
    loginValidation,
    patchProfileValidation,
    patchProductValidation,
    changePasswordValidation,
    resetPasswordValidation,
    sendCodeRegisterValidation,
    newProductValidation,
    getFilteredProductsValidation,
    tempUserValidation,
    orderValidation,
    createPaymentValidation,
    idValidation,
    createCouponValidation,
    createMessageValidation
}