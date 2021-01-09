const mongoose = require('mongoose')
const Product = require('../model/product')
mongoose.connect(process.env.DB_CONNECTION,{useNewUrlParser: true, useUnifiedTopology: true}, ()=>{
    console.log('Connected to db!')
})
const createTransportProduct = async () => {
    const tran = await Product.findOne({name:'Doprava'})
    if (!tran) {
        const transport = new Product({
            type:1,
            name:'Doprava',
            price:700,
            imagePath:'doprava.png',
            eshop:false,
            isDoTerraProduct:false
        })
        await transport.save()
        console.log('Created transport product.')
    }
}
const createTransportProduct2 = async () => {
    const tran = await Product.findOne({name:'Doprava2'})
    if (!tran) {
        const transport = new Product({
            type:1,
            name:'Doprava2',
            price:840,
            imagePath:'doprava.png',
            eshop:false,
            isDoTerraProduct:false
        })
        await transport.save()
        console.log('Created transport product.')
    }
}
const createPODProduct = async () => {
    const pod = await Product.findOne({name:'Dobierka'})
    if(!pod){
        const pod = new Product({
            type:1,
            name:'Dobierka',
            price:200,
            imagePath:'dobierka.png',
            eshop:false,
            isDoTerraProduct:false
        })
        await pod.save()
    console.log('Created pod product.')
    }
}
createTransportProduct()
createTransportProduct2()
createPODProduct()