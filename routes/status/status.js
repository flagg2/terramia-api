const router = require('express').Router()
const methods = require('../../middlewares/methods')
const Status = require('../../model/status')


router.all("/",methods(['GET']))
router.get("/",async (req,res) =>
{
    const status = await Status.findOne()
    try {
        return res.send({
            message:'Website status retrieved successfully',
            status:status
        })
    }
    catch(err) {
        serverError(res,err)
    }
})



module.exports = router