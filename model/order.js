
const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    orderedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    value: {
        type:Number,
        min:0,
    },
    date: {
        type: Date,
        default: Date.now
    },
    status:{
        type: String,
        default: 'pending'
    },
    clientSecret:{
        type:String,
        default:'none'
    },
    overwrite:{
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
        }
    },
    coupon:{
        type:String,
        max:20
    },
    paidOnline:{
        type:Boolean,
        default:false
    },
    applyDiscount:{
        type:Boolean,
        default:false
    },
    shouldDeliver:{
        type:Boolean,
        default:true
    },
    buyingAsCompany:{
        type:Boolean,
        default:false
    },
    note:{
        type:String
    }
})


module.exports = mongoose.model('Order',orderSchema)