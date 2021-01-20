
const { stat } = require('fs')
const mongoose = require('mongoose')

const statusSchema = new mongoose.Schema({
    underMaintenance: {
        type:Boolean,
        default:false
    },
})


module.exports = mongoose.model('Status',statusSchema)