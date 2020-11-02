const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv/config')

//Import Routes
const authRoute = require('./routes/auth/auth')
const userRoute = require('./routes/user/user')
const adminRoute = require('./routes/admin/admin')
const notFoundRoute = require('./routes/notfound/notfound')
const storeRoute = require('./routes/store/store')
const paymentRoute = require('./routes/payments/payments')


//Connect to DB
mongoose.connect(process.env.DB_CONNECTION,{useNewUrlParser: true, useUnifiedTopology: true}, ()=>{
    console.log('Connected to db!')
})


//Middlewares
app.use(bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf
    }
  }))
//cors
app.use('*', (req,res,next) => {
    res.header('Access-Control-Allow-Origin',"*")
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers' ,'*')
    res.header('Access-Control-Expose-Headers', '*')
    next()
})
app.use('/uploads',express.static('./uploads'))
//Route MiddleWares
app.use('/api/auth', authRoute)
app.use('/api/user', userRoute)
app.use('/api/admin', adminRoute)
app.use('/api/store', storeRoute)
app.use('/api/payments', paymentRoute)
app.use('*',notFoundRoute)

app.listen(8080, ()=>{console.log('Server up and running.')})