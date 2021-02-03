const router = require('express').Router()
const methods = require('../../middlewares/methods')
const Message = require('../../model/message')
const {createMessageValidation} = require('../../utils/validation')
const {
    serverError
} = require('../../utils/errors')
const {
    sendNewMessage, sendHelpMessage
} = require('../../utils/mailer')

router.all('/form', methods(['POST']))
router.post('/form', async (req, res) => {
    if (createMessageValidation(req,res)) return
    try {
        const message = new Message({
            ...req.body
        })
        const msg = await message.save()
        await sendNewMessage(msg)
        res.send({
            message: 'Message sent successfully'
        })
    } catch (err) {
        serverError(res,err)
    }
})

router.all('/help', methods(['POST']))
router.post('/help', async (req, res) => {
    if (createMessageValidation(req,res)) return
    try {
        const message = new Message({
            ...req.body
        })
        const msg = await message.save()
        await sendHelpMessage(msg)
        res.send({
            message: 'Message sent successfully'
        })
    } catch (err) {
        serverError(res,err)
    }
})

module.exports = router