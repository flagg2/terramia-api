const nodemailer = require('nodemailer')
const fs = require('fs')
const handlebars = require('handlebars');
const user = require('../model/user');
const Coupon = require('../model/coupon')
const Order = require('../model/order')
const Product = require('../model/product');
const order = require('../model/order');
const logoId = 'terramia_logo'

handlebars.registerHelper("link", function (text, url, cls) {
    var url = handlebars.escapeExpression(url),
        text = handlebars.escapeExpression(text)

    return new handlebars.SafeString(`<a class=${cls} href='${url}'>${text}</a>`);
});

handlebars.registerHelper("img", function (src, cls) {
    var src = handlebars.escapeExpression(src)
    return new handlebars.SafeString(`<img class=${cls} src="cid:${src}">`);
});

const createTransport = () => {
    return nodemailer.createTransport({
        pool: true,
        host: "smtp.websupport.sk",
        port: 465,
        secure: true, // use TLS
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        }
    })
}

var readHTMLFile = (path, callback) => {
    fs.readFile(path, {
        encoding: 'utf-8'
    }, function (err, html) {
        if (err) {
            throw err;
        } else {
            return callback(null, html);
        }
    })
}

const sendWelcomeEmail = async (receiverAdress, user) => {
    const transporter = createTransport()
    const link = `${process.env.PASSWORD_RESET_LINK}/${user.resetSecret}`
    readHTMLFile('./email_content/recovery.html', function (err, html) {
        var template = handlebars.compile(html);
        var replacements = {
            logo: {
                src: logoId,
                cls: 'image'
            },
            name: user.name.split(' ')[0],
        };
        var htmlToSend = template(replacements);
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: receiverAdress,
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
    })
}

const sendRecoveryMail = async (receiverAdress, user) => {
    const transporter = createTransport()
    const link = `${process.env.PASSWORD_RESET_LINK}/${user.resetSecret}`
    readHTMLFile('./email_content/recovery.html', function (err, html) {
        var template = handlebars.compile(html);
        var replacements = {
            logo: {
                src: logoId,
                cls: 'image'
            },
            reset: {
                url: link,
                text: "RESETOVAŤ HESLO",
                cls: 'link'
            },
            name: user.name.split(' ')[0],
        };
        var htmlToSend = template(replacements);
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: receiverAdress,
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
    })
}

const prepareOrderHelpers = async (order) => {
    const ord = await Order.findById(order)
    const quants = new Object()
    const products = []
    for (const prod of ord.products) {
        if (quants[prod]) quants[prod] += 1
        else quants[prod] = 1
    }
    for (const key in quants) {
        const quantity = quants[key]
        products.push(await Product.findById(key), quantity)
    }
    let placeholder = false
    let orderSum = 0
    const attachments = [{
        filename: 'logo.png',
        path: './email_content/logo.png',
        cid: `${logoId}`
    }]
    console.log(quants)
    let string = `<div>
                    <table class='products'>
                    <tr class='underline'>
                        <td class='name-h'>Produkt</td>
                        <td></td>
                        <td>Kusov</td>
                        <td>Cena s DPH</td>
                    </tr>`
    for (const [index, product] of products.entries()) {
        let imageHtml = ''
        if (index % 2 == 1) continue
        orderSum += product.price * products[index + 1]
        if (product.imagePath) {
            attachments.push({
                filename: `${product.imagePath}`,
                path: `./uploads/resized/${product.imagePath}`,
                cid: `img${index/2}`
            })
            imageHtml = `<td class="productImg"><img src="cid:img${index/2}"></td>`
        } else {
            if (!placeholder) {
                attachments.push({
                    filename: `placeholder.png`,
                    path: `./email_content/placeholder.png`,
                    cid: `placeholder`
                })
                placeholder = true
            }
            imageHtml = `<td class="productImg"><img src="cid:placeholder"></td>`
        }
        string += `
                        <tr>
                        ${imageHtml}
                        <td class="productName">${product.name}</td>
                        <td class="productQuant">${products[index+1]}</td>
                        <td class="productPrice">${product.price/100*products[index+1]}€</td>
                        </tr>`
    }
    string += '</table></div>'
    const coupon = await Coupon.findOne({
        code: ord.coupon
    })
    handlebars.registerHelper('products', function () {
        return new handlebars.SafeString(string)
    })
    const discString = coupon ? `    
                            <tr class='disc'>
                                <td class="total-sum">Suma pred zľavou</td>
                                <td class="total-price">${(orderSum/100).toFixed(2)}€</td>
                            </tr>
                     
                            <tr>
                                <td class="total-sum">Zľava</td>
                                <td class="total-price">${coupon.value}${coupon.type=='percentage' ? '%' : '€'}</td>
                            </tr>` :
        ''
    handlebars.registerHelper('discount', function () {
        if (ord.coupon) {
            return new handlebars.SafeString(discString)
        } else return
    })
    return [ord, attachments]
}

const sendOrderCompletedMail = async (receiverAdress, order) => {
    const [ord, attachments] = await prepareOrderHelpers(order)
    const transporter = createTransport()
    readHTMLFile('./email_content/order.html', function (err, html) {
        var template = handlebars.compile(html);
        console.log(ord.value)
        var replacements = {
            logo: {
                src: logoId,
                cls: 'image'
            },
            orderSum: (parseInt(ord.value) / 100).toFixed(2)
        };
        var htmlToSend = template(replacements);
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: receiverAdress,
            subject: 'Nová objednávka',
            html: htmlToSend,
            attachments: attachments
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

const sendOrderCancelledMail = async (receiverAdress, order) => {
    const [ord, attachments] = await prepareOrderHelpers(order)
    const transporter = createTransport()
    readHTMLFile('./email_content/order_refund.html', function (err, html) {
        var template = handlebars.compile(html);
        console.log(ord.value)
        var replacements = {
            logo: {
                src: logoId,
                cls: 'image'
            },
            orderSum: (parseInt(ord.value) / 100).toFixed(2)
        };
        var htmlToSend = template(replacements);
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: receiverAdress,
            subject: 'Zrušenie objednávky',
            html: htmlToSend,
            attachments: attachments
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

const sendNewOrderMail = async (order, user) => {
    const receiverAdress = process.env.ORDERS_RECIEVER_MAIL
    const [ord, attachments] = await prepareOrderHelpers(order)
    const transporter = createTransport()
    readHTMLFile('./email_content/order_summary.html', function (err, html) {
        var template = handlebars.compile(html);
        console.log(ord.value)
        var replacements = {
            logo: {
                src: logoId,
                cls: 'image'
            },
            orderSum: (parseInt(ord.value) / 100).toFixed(2),
            user:{
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                psc:user.psc,
                country:user.country,
                city:user.city
            }
        };
        console.log(replacements)
        var htmlToSend = template(replacements);
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: receiverAdress,
            subject: 'Nová objednávka',
            html: htmlToSend,
            attachments: attachments
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

const sendNewMessage = async(message) => {
    const receiverAdress = process.env.ORDERS_RECIEVER_MAIL
    const transporter = createTransport()
    readHTMLFile('./email_content/message.html', function (err, html) {
        var template = handlebars.compile(html)
        var replacements = {
            logo: {
                src: logoId,
                cls: 'image'
            },
            user:{
                name:message.name,
                email:message.email,
                phone:message.phone,
                message:message.message,
            }
            
        }
        var htmlToSend = template(replacements)
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: receiverAdress,
            subject: 'Nová správa',
            html: htmlToSend,
            attachments: [{
                filename: 'logo.png',
                path: './email_content/logo.png',
                cid: `${logoId}`
            }]
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    });
}

const sendNewUserSummaryMail = async (user) => {
    const receiverAdress = process.env.ORDERS_RECIEVER_MAIL
    const transporter = createTransport()
    readHTMLFile('./email_content/new_user_summary.html', function (err, html) {
        var template = handlebars.compile(html)
        var replacements = {
            logo: {
                src: logoId,
                cls: 'image'
            },
            user:{
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                psc:user.psc,
                country:user.country,
                city:user.city,
                sampleType:user.sampleType
            }
            
        }
        var htmlToSend = template(replacements)
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: receiverAdress,
            subject: 'Žiadosť o vzorky',
            html: htmlToSend,
            attachments: [{
                filename: 'logo.png',
                path: './email_content/logo.png',
                cid: `${logoId}`
            }]
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    })
}

const sendCodeVerificationMail = async (receiverAdress, user) => {
    const transporter = createTransport()
    readHTMLFile('./email_content/codeVerification.html', function (err, html) {
        var template = handlebars.compile(html)
        var replacements = {
            logo: {
                src: logoId,
                cls: 'image'
            },
            code: user.registrationCode,
            name: user.name.split(' ')[0],
        }
        var htmlToSend = template(replacements)
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: receiverAdress,
            subject: 'Overovací kód',
            html: htmlToSend,
            attachments: [{
                filename: 'logo.png',
                path: './email_content/logo.png',
                cid: `${logoId}`
            }]
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    })
}

module.exports = {
    sendRecoveryMail,
    sendOrderCompletedMail,
    sendNewUserSummaryMail,
    sendNewOrderMail,
    sendCodeVerificationMail,
    sendOrderCancelledMail,
    sendNewMessage
}