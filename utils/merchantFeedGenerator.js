const ObjectsToCsv = require('objects-to-csv');
const Product = require('../model/product')
 
const a = async () => {
    const products = await Product.find({
        name: {$not: {$in: ['Doprava','Dobierka','Doprava2']}},
        eshop: true
    })
    data = []
    for (const product of products){
        data.push({
            id: product.id,
            title: product.name,
            description: product.description,
            link: `https://terramia.sk/e-shop/${product.link}`,
            image_link: `https://coronashop.store:8443/uploads/${product.imagePath}`,
            availability: 'in stock',
            price: `${(product.price/100).toFixed(2)} EUR`,
            brand: product.isDoTerraProduct ? 'doTERRA' : 'TerraMia',
            identifier_exists: 'no'
        })
    }
    const csv = new ObjectsToCsv(data);
    
    // Save to file:
    await csv.toDisk('./uploads/csv/test.csv');
    
    // Return the CSV file as string:
    console.log(await csv.toString());
}
a()

// If you use "await", code must be inside an asynchronous function:
module.exports = {
    exportProducts: async () => {
        const products = await Product.find({
            name: {$not: {$in: ['Doprava','Dobierka','Doprava2']}},
            eshop: true
        })
        data = []
        for (const product of products){
            data.push({
                id: product.id,
                title: product.name,
                description: product.description,
                link: `https://terramia.sk/e-shop/${product.link}`,
                image_link: `https://coronashop.store:8443/uploads/${product.imagePath}`,
                availability: 'in stock',
                price: `${(product.price/100).toFixed(2)} EUR`,
                brand: product.isDoTerraProduct ? 'doTERRA' : 'TerraMia',
                identifier_exist: 'no'
            })
        }
        const csv = new ObjectsToCsv(data);
        
        // Save to file:
        await csv.toDisk('./uploads/csv/test.csv');
        
        // Return the CSV file as string:
        console.log(await csv.toString());
    }
}
