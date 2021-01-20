const User = require('../model/user')
const {sendWelcomeEmail} = require('../utils/mailer')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const crypto = require('crypto')
const emailArray = []
const sendEmail = async ()=>{
  try {
    const data = fs.readFileSync('./utils/sample.csv', 'utf8')
    console.log(data)
    const lines = data.split('\n')
    for (line of lines){
      const [v1,v2,v3] = line.split(',')
      if (v1) emailArray.push(v1)
      if (v2) emailArray.push(v2)
      if (v3) emailArray.push(v3)
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
