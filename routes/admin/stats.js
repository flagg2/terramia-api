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
    router.all("/stats",methods(['GET']))
    router.get("/stats",verify(1),async (req,res) =>
    {
        if (!['day','week','month','year','all'].includes(req.query.timespan) && !/^[0-3][0-9]\/[0-1][0-9]\/[0-9]{4}:[0-3][0-9]\/[0-1][0-9]\/[0-9]{4}$/.test(req.query.timespan) && req.query.timespan!=undefined) return res.status(400).send({
            message:'Provided timespan is invalid',
            messageSK:'Zadaný časový okruh nie je valídny',
            error:'format'
        })
        try {
            const stats = await getStatsFromTimespan(req.query.timespan)
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