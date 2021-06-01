const Order = require('../model/order')
const User = require('../model/user')
const Product = require('../model/product')
var xl = require('excel4node');
const crypto = require('crypto');
const { string } = require('@hapi/joi');
const moment = require('moment')

module.exports = class ExcelGenerator {
    constructor() {
        this.wb = new xl.Workbook({
            defaultFont: {
                size: 9
            }
        });
        this.ws = this.wb.addWorksheet('Sheet 1');
        this.ws.row(1).setHeight(35)

        const defaultStyle = {
            fill: {
                type: 'pattern',
                patternType: 'solid',
            },
            font: {
                bold: true
            },
            alignment: {
                shrinkToFit: true,
                wrapText: true,
                vertical: 'center'
            }
        }

        const yellowStyle = {
            ...defaultStyle
        }
        yellowStyle.fill.fgColor = 'FFFF99'
        this.yellow = this.wb.createStyle(yellowStyle)

        const orangeStyle = {
            ...defaultStyle
        }
        orangeStyle.fill.fgColor = 'FFCC00'
        this.orange = this.wb.createStyle(orangeStyle)

        const redStyle = {
            ...defaultStyle
        }
        redStyle.fill.fgColor = 'FF9900'
        this.red = this.wb.createStyle(redStyle)

        this.head = {
            yellow: ["Meno a priezvisko odosielateľa", 'Organizácia odosielateľa', 'Ulica odosielateľa', 'Obec odosielateľa', 'PSČ Pošty', "Email odosielateľa", "Spôsob úhrady za zásielky (poštovné)"],
            orange: ["Meno a priezvisko adresáta", "Organizácia adresáta", "Ulica adresáta", "Obec adresáta", "PSČ Pošty", "Krajina adresáta", "Hmotnosť (kg)", "Trieda", "Poznámka", "Slepecká zásielka"],
            red: ["Meno a priezvisko späť", "Organizácia späť", "Ulica späť", "Obec späť", "PSČ späť"]
        }
    }

    renderHead(startingCol = 1) {
        let col = startingCol
        for (const key in this.head) {
            for (const item of this.head[key]) {
                this.ws.column(col).setWidth(20)
                this.ws.cell(1, col)
                    .string(item)
                    .style(eval(`this.${key}`))
                col += 1
            }
        }
    }

    async renderOrders() {
        this.renderHead()
        const orders = await Order.find({
            status: 'fulfilled',
            value:0
        })
        for (const [index, order] of orders.entries()) {
            try{
            const user = await User.findById(order.orderedBy)
            const product = await Product.findById(order.products[0])
            this.ws.cell(index+2,8).string(user.name)
            this.ws.cell(index+2,10).string(user.address)
            this.ws.cell(index+2,11).string(user.city)
            this.ws.cell(index+2,12).string(user.psc)
            this.ws.cell(index+2,13).string(user.country)
            this.ws.cell(index+2,16).string(product.name)
            
            }
            catch(err){
                console.log('Error while creating excel cell: '+ err)
            }
        }
    }

    async renderFullOrders(filters){
        try{
            const valOverZero = filters.valueOverZero
            if (filters) delete filters.valueOverZero
            let orders
            if (valOverZero){
                orders = await Order.find({...filters, value : {$gt:0}})
            }
            else{
                orders = await Order.find(filters)
            }
            this.head = {
                yellow: ['Meno', 'Dátum objednávky','Čas','Email','Tel. číslo','Dátum narodenia','Adresa','PSČ','Mesto','Krajina','Doručenie','Platba','Na firmu','Produkty','Cena']
            }
            this.renderHead()
            let index = 2
            for (const order of orders){
                const orderObj = order.toObject()
                const user = await User.findById(order.orderedBy)
                const billing = orderObj.overwrite || {
                    address: user.address,
                    city: user.city,
                    psc: user.psc,
                    country: user.country
                }
                this.ws.cell(index,1).string(user.name)
                this.ws.cell(index,2).string(moment(order.date).format('DD.MM.YYYY'))
                this.ws.cell(index,3).string(moment(order.date).format('HH:mm'))
                this.ws.cell(index,4).string(user.email)
                this.ws.cell(index,5).string(user.phone)
                this.ws.cell(index,6).string(user.birthDate)
                this.ws.cell(index,7).string(billing.address)
                this.ws.cell(index,8).string(billing.psc)
                this.ws.cell(index,9).string(billing.city)
                this.ws.cell(index,10).string(billing.country)
                this.ws.cell(index,11).string(order.shouldDeliver ? 'Kuriér' : 'Osobný odber')
                this.ws.cell(index,12).string(order.paidOnline ? 'Karta' : 'Hotovosť')
                this.ws.cell(index,13).string(order.buyingAsCompany ? 'Áno' : 'Nie')
                this.ws.cell(index,15).string(`${(order.value/100).toFixed(2)} €`)
                const productsWithQants = {}
                for (const productId of order.products){
                    const product = await Product.findById(productId)
                    if (['Doprava','Dobierka','Doprava2'].includes(product.name)) continue
                    if (productsWithQants[productId]){
                        productsWithQants[productId].quant += 1
                    }
                    else {
                        productsWithQants[productId] = {
                            name: product.name,
                            quant: 1
                        }
                    }
                } 
                for (const productId of Object.keys(productsWithQants)){
                    const productInfo = productsWithQants[productId]
                    this.ws.cell(index,14).string(`${productInfo.name} - ${productInfo.quant}X`)
                    index+=1
                }
            }
        }
        catch(err){
            console.log('Error while creating excel cell: '+ err)
        }
    }

    async generateExcel(mode, filters) {
        if (mode == 'simple'){
            await this.renderOrders()
        }
        else {
            await this.renderFullOrders(filters)
        }
        const name = crypto.randomBytes(10).toString('hex')
        this.wb.write(`uploads/excel/${name}.xlsx`);
        console.log(`Created excel with name ${name}.xlsx`)
        return name
    }
}
