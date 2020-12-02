const fs = require('fs')
const sharp = require('sharp')

const unlinkIfRedundant = function (path) {
    fs.unlink(`uploads/${path}`, (err) => {
        if (err && err.code == 'ENOENT') {
            console.info("File doesn't exist, won't remove it.")
        }
    })
    fs.unlink(`uploads/resized/${path}`, (err) => {
        if (err && err.code == 'ENOENT') {
            console.info("File doesn't exist, won't remove it.")
        }
    })
}

const resizeImage = async function (link) {
    sharp(`./uploads/${link}`)
        .resize(parseInt(process.env.RESIZED_IMAGE_SIZE))
        .toFile(`./uploads/resized/${link}`, function (err) {
            console.log(err)
        });
}

module.exports = {unlinkIfRedundant,resizeImage}


