const User = require('../model/user')
const {sendWelcomeEmail} = require('../utils/mailer')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const crypto = require('crypto')
const emailArray = []
const sendEmail = async ()=>{
  try {
    const data = fs.readFileSync('./utils/mailchimp.csv', 'utf8')
    if (!data) return
    const lines = data.split('\n')
    for (line of lines){
      emailArray.push(line)
      console.log(line)
    }
  } catch (err) {
    console.error(err)
  }
  for (email of emailArray){
    const userCheck = await User.findOne({email:email})
    if (userCheck) continue
    console.log('Now sending to '+email)
    const pwd = crypto.randomBytes(10).toString('hex')
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(pwd, salt)
    const user = new User({
      email:email,
      password:hashPassword,
      needAddress:false,
      regStep:3,
      registeredInDoTerra:true
    })
    await user.save()
    await sendWelcomeEmail(email,pwd)
  
  }
}

sendEmail()
