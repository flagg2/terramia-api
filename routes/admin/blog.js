const methods = require('../../middlewares/methods')
const {serverError, notFound} = require('../../utils/errors')

module.exports = (router) => {
   
const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        max:100
    },
    html:{
        type:String,
        required: true
    },
    thumbnailPath:{
        type:string
    },
    totalViews:{
        type:Number,
        default:0
    }
})


module.exports = mongoose.model('Blog',blogSchema)
}