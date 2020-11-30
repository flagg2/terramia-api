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
            eshop:false
        })
        await transport.save()
        console.log('Created transport product.')
    }
}
createTransportProduct()