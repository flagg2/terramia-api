
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    name: {
        type:String,
        required: true,
        max:50
    },
    email:{
        type:String,
        required: true,
        max:50
    },
    phone:{
        type:String,
        max:20
    },
    message:{
        type:String,
        required: true,
        max:2000
    }
})


module.exports = mongoose.model('Message',messageSchema)