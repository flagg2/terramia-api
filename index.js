require('console-stamp')(console, '[HH:MM:ss.l]');
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const https = require('https');
const fs = require('fs');
const port = 8443;

require('dotenv/config')
require('./cron_jobs/cron_jobs')

//TODO zmenit cislo na realne v emailoch
//TODO pridat moznost kontaktu cez formular

//Import Routes
const authRoute = require('./routes/auth/auth')
const userRoute = require('./routes/user/user')
const adminRoute = require('./routes/admin/admin')
const notFoundRoute = require('./routes/notfound/notfound')
const storeRoute = require('./routes/store/store')
const paymentRoute = require('./routes/payments/payments')
const contactRoute = require('./routes/contact/contact')
const blogRoute = require('./routes/blog/blog')
const statusRoute = require('./routes/status/status')


//Connect to DB
const key = fs.readFileSync('/etc/webmin/webmin/coronashop.store.key');
const cert = fs.readFileSync('/etc/webmin/webmin/coronashop.store.cert');
const options = {
  key: key,
  cert: cert
};

require('./utils/DBconfig')

require('./utils/createAccounts')

//Middlewares
app.use(bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf
    }
  }))

//is json valid?
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      console.error(err);
      return res.status(400).send({
        message:'Syntax of provided body is invalid',
        error:'invalid-syntax'
      })
  }

  next();
});

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
app.use('/api/blogs', blogRoute)
app.use('/api/admin', adminRoute)
app.use('/api/store', storeRoute)
app.use('/api/payments', paymentRoute)
app.use('/api/contact',contactRoute)
app.use('/api/status',statusRoute)
app.use('*',notFoundRoute)

require('./utils/createAccounts')

const server = https.createServer(options, app);

server.listen(port, ()=>{console.log('Server up and running.')})