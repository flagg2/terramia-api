const methods = require('../../middlewares/methods')
const verify = require('../../middlewares/verifyToken')
const Product = require('../../model/product')
const {serverError} = require('../../utils/errors')
const smartSearch = require('../../utils/smartSearch')
const {notFound} = require('../../utils/errors')
const {
    idValidation,
    getFilteredUsersValidation,
    getStatsValidation
} = require('../../utils/validation')
const {getStatsFromTimespan} = require('../../utils/statHelpers')

module.exports = (router) => {
    router.all("/stats",methods(['POST']))
    router.post("/stats",verify(1),async (req,res) =>
    {
        if (getStatsValidation(req,res)) return
        try {
            const stats = await getStatsFromTimespan(req.body.timespan)
            return res.send({
                message:'Stats retrieved successfully',
                stats:stats
            })
        }
        catch(err) {
            serverError(res,err)
        }
    })
}