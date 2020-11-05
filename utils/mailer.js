const nodemailer = require('nodemailer')
const fs = require('fs')
const handlebars = require('handlebars');
const user = require('../model/user');
const Order = require('../model/order')

handlebars.registerHelper("link", function(text, url, cls) {
    var url = handlebars.escapeExpression(url),
        text = handlebars.escapeExpression(text)
        
   return new handlebars.SafeString(`<a class=${cls} href='${url}'>${text}</a>`);
});

handlebars.registerHelper("img", function(src, cls) {
    var src = handlebars.escapeExpression(src)
   return new handlebars.SafeString(`<img class=${cls} src="cid:${src}">`);
});

handlebars.registerHelper('products', async function(order){
    const ord = await Order.findById(order)
    return new handlebars.SafeString(`<div>${ord._id}</div>`)
})

var readHTMLFile = (path, callback) => {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
      if (err) {
        throw err;
      }
      else {
        return callback(null, html);
      }
    })
  }

const sendRecoveryMail = async (recieverAdress,user) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    const logoId = 'terramia_logo'
    const link = `${process.env.PASSWORD_RESET_LINK}?secret=${user.resetSecret}`
    readHTMLFile('./email_content/recovery.html', function (err, html) {
        var template = handlebars.compile(html);
        var replacements = {
            logo:{
                src:logoId,
                cls:'image'
            },
            reset:{
                url: link,
                text: "RESETOVAŤ HESLO",
                cls: 'link'
            },
            name: user.name.split(' ')[0],
        };
        var htmlToSend = template(replacements);
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: recieverAdress,
        subject: 'Zabudnuté heslo',
        html: htmlToSend,
        attachments: [{
            filename: 'logo.png',
            path: './email_content/logo.png',
            cid: `${logoId}`
        }]
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
})}

//todo fix grammar receive
const sendOrderCompletedEmail = async (recieverAdress, order) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    const logoId = 'terramia_logo'
    readHTMLFile('./email_content/order.html', function (err, html) {
        var template = handlebars.compile(html);
        var replacements = {
            logo:{
                src:logoId,
                cls:'image'
            },
            order: order
        };
        var htmlToSend = template(replacements);
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: recieverAdress,
        subject: 'Nová objednávka',
        html: htmlToSend,
        attachments: [{
            filename: 'logo.png',
            path: './email_content/logo.png',
            cid: `${logoId}`
        }]
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
})
}

module.exports = {sendRecoveryMail,sendOrderCompletedEmail}