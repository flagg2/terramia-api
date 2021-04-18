
const mongoose = require('mongoose')

const emailBundleSchema = new mongoose.Schema({
    date: {
        type:Date,
        default:Date.now
    },
    terramia: {
        type:[{type:String}]
    },
    terramia_net:{
        type:[{type:String}]
    },
    includeInStats:{
        type:Boolean,
        default:false
    }
})


module.exports = mongoose.model('EmailBundle',emailBundleSchema)