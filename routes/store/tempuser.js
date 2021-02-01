const methods = require('../../middlewares/methods')
const {serverError} = require('../../utils/errors')
const User = require('../../model/user')
const {
    idValidation,
    tempUserValidation
} = require('../../utils/validation')
const { notFound } = require('../../utils/errors')

module.exports = (router) => {
    router.all('/tempUser', methods(['POST']))
    router.post('/tempUser', async (req, res) => {
        if (tempUserValidation(req, res)) return
        try {
            await User.findOneAndDelete({
                email:{$regex:'﻿?'+req.body.email},
                tempUser:true
            })
            const user = new User({
                ...req.body,
                tempUser:true
            })
            const tempUser = await user.save()
            res.send({
                id: tempUser._id,
                message: 'Temporary user created successfully'

            })
        } catch (err) {
            res.status(400).send(err)
        }
    })

    router.all('/tempUser/:id', methods(['GET']))
    router.get('/tempUser/:id', async (req, res) => {
        if (idValidation(req, res)) return
        try {
            const user = await User.findById(req.params.id)
            if (!user) return notFound(res, 'User')
            if (user.password) return res.status(400).send({
                message: 'The provided id matches an actual user, not a temporary one',
                error: 'not-temp'
            })
            res.send({
                message: 'Temporary user info retrieved successfully',
                user: user
            })

        } catch (err) {
            serverError(res,err)
        }
    })
}