const methods = require('../../middlewares/methods')
const verify = require('../../middlewares/verifyToken')
const User = require('../../model/user')
const smartSearch = require('../../utils/smartSearch')
const {notFound, serverError} = require('../../utils/errors')
const {
    idValidation,
    getFilteredUsersValidation,
} = require('../../utils/validation')

module.exports = (router) => {
    router.all('/users', methods(['GET','POST']))
router.get('/users',verify(1), async (req,res) => {
    try{
        const users = await User.find({}).select('-password')
        res.send({
            message:'Users retrieved successfully',
            count:users.length,
            users:users
        })
    }
    catch(err){
        serverError(res,err)
    }
})

router.post('/users', verify(1), async (req, res) => {
    if (getFilteredUsersValidation(req,res)) return
    try {
        const users = await User.find(req.body.filters).limit(req.body.limit).sort(req.body.sortBy).select('-password')
        if (req.body.query){
            const searchResults = smartSearch(req.body.query,users,['name','email','phone'])
            return res.send({
                message : 'Users retrieved successfully',
                count: searchResults.length,
                users : searchResults
            })
        }
        res.send({
            message : 'Users retrieved successfully',
            count: users.length,
            users : users
        })
    }
    catch {
        serverError(res,err)
    }
})

router.all('/users/pendingSamples', methods(['GET']))
router.get('/users/pendingSamples',verify(1), async (req,res) => {
    try{
        const users = await User.find({sampleSent:false, address:{$exists:true}})
        res.send({
            message:'Users with pending samples retrieved successfully',
            count: users.length,
            users: users
        })
    }
    catch(err){
        serverError(err)
    }
})

router.all('/users/:id',methods(['GET']))
router.get('/users/:id',verify(1),async (req,res)=>{
    if (idValidation(req,res)) return
    try{
        const user = await User.findById(req.params.id).select('-password')
        if (!user) return notFound(res,'User')
        res.send({
            message:'User retrieved successfully',
            user:user
        })
    }
    catch(err){
        serverError(res,err)
    }
})

router.all('/users/:id/sendSample',methods(['POST']))
router.post('/users/:id/sendSample',verify(1),async (req,res)=>{
    if (idValidation(req,res)) return
    try{
        const user = await User.findById(req.params.id).select('-password')
        if (!user) return notFound(res,'User')
        if (user.sampleSent == true) return res.status(400).send({message:'Samples were already sent to the user with the provided id',error:'sent'})
        user.sampleSent = true
        user.save()
        res.send({
            message:'Samples were sent to the user successfully',
            user:user
        })
    }
    catch(err){
        serverError(res,err)
    }
})
}