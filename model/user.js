const mongoose = require('mongoose')
//knowdoterra is required fix
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        min: 6,
        max: 50
    },
    email: {
        type: String,
        min: 6,
        max: 255
    },
    password: {
        type: String,
        min: 6,
        max: 1024
    },
    phone: {
        type: String,
        min: 6,
        max: 20
    },
    address: {
        type: String,
        max: 50
    },
    city: {
        type: String,
        max: 50
    },
    psc: {
        type: String,
        min: 4,
        max: 10
    },
    country: {
        type: String,
        min: 6,
        max: 30
    },
    date: {
        type: Date,
        default: Date.now
    },
    admin: {
        //0 => user
        //1 => member
        //2 => admin
        type: Number,
        min:0,
        max:2,
        default: 0
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    totalSpent:{
        type: Number,
        default:0
    },
    sampleSent:{
        type: Boolean,
        default: false
    },
    sampleType:{
        type: Number,
        min:1,
        max:9
    },
    resetSecret:{
        type: String
    },
    registrationCode:{
        type: String
    },
    watchList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    boughtProducts:{ type: mongoose.Schema.Types.Mixed, default: {} },
    knowDoTerra:{
        type: Boolean
    },
    registeredInDoTerra:{
        type:Boolean,
        default:false
    },
    birthDate:{
        type:String
    },
    regStep:{
        type:Number,
        default:0
    },
    company:{
        name:{
            type:String
        },
        ico:{
            type:String
        },
        icdph:{
            type:String
        },
        dic:{
            type:String
        }
    }
}, { minimize: false })

module.exports = mongoose.model('User',userSchema)