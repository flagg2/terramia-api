const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    type: {
        //TODO doklepnut potom tuto strukturu typov a kategorii
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
    boughtTogether : { type: mongoose.Schema.Types.Mixed, default: {} }
}

, { minimize: false })

module.exports = mongoose.model('Product',productSchema)

