
const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    date: {
        type:Date,
        default:Date.now
    },
    description:{
        type:String,
        default:''
    },
    imagePath:{
        type:String
    },
    pageViews:{
        type:Number,
        default:0
    },
    html:{
        type:String,
        required:true
    },
    draft:{
        type:Boolean,
        default:false
    },
    type:{
        type:Number,
        required:true
    },
    locked:{
        type:Boolean,
        default:false
    },
    link:{
        type:String
    }
})


module.exports = mongoose.model('Blog',blogSchema)