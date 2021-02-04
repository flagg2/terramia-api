const Order = require('../model/order')
const User = require('../model/user')
const Product = require('../model/product')
var xl = require('excel4node');
const crypto = require('crypto');
const { string } = require('@hapi/joi');

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

    renderHead() {
        let col = 1
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

    async generateExcel() {
        this.renderHead()
        await this.renderOrders()
        const name = crypto.randomBytes(10).toString('hex')
        this.wb.write(`uploads/excel/${name}.xlsx`);
        console.log(`Created excel with name ${name}.xlsx`)
        return name
    }
}
