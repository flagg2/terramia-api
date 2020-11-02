
const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    code: {
        //coupon code
        type:String,
        required: true,
        max:20
    },
    type: {
        //type of discount
        //flat or percentage
        type:String,
        required: true
    },
    value: {
        //flat in cents
        //percentage in n%
        type:Number,
        required:true
    },
    maxUses: {
        type: Number,
        min:0,
        default:0
        //number of uses per user
        //0 for unlimited
    },
    maxUsesTotal:{
        type:Number,
        min:0,
        default:0
    },
    minValue: {
        //minimal value an order has to have in order for this coupon to be applicable
        type: Number,
        min:0
    },
    redeems: {
        //even indexes for email addresses
        //odd indexes for number of redeems
        type: []
    },
    totalUses: {
        type:Number,
        default: 0
    }
})


module.exports = mongoose.model('Coupon',couponSchema)