
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
    }
    //TODO add stripe checkout session id
})


module.exports = mongoose.model('Order',orderSchema)