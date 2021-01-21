const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    type: {
        type: Number,
        required: true,
        min: 1,
        max: 16
    },
    name: {
        type: String,
        required: true,
        max:100
    },
    label: {
        type: String,
        max:50
    },
    category: {
        type: Number,
        min:0,
        max:50
    },
    description: {
        type: String,
        max: 5000
    },
    price: {
        type: Number,
        min:0,
        required: true
    },
    imagePath: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    soldAmount: {
        type: Number,
        default: 0
    },
    available: {
        type: Boolean,
        default: true
    },
    eshop: {
        type: Boolean,
        default: true
    },
    boughtTogether : { type: mongoose.Schema.Types.Mixed, default: {} },
    topProduct: {
        type: Boolean,
        default: false
    },
    problemType: [{
        type: Number,
        min:0
    }],
    points:{
        type:Number,
        default:0,
        min:0
    },
    tips:[{
        type:String
    }],
    isDoTerraProduct:{
        type:Boolean,
        required:true
    },
    link:{
        type:String
    }
}

, { minimize: false })

module.exports = mongoose.model('Product',productSchema)

