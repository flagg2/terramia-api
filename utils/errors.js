const notFound = (res, name) => {
    return res.status(404).send({
        message: `${name} with the provided id was not found`,
        error: 'not-found'
    })
}

const serverError = (res, err) => {
    console.log(err)
    return res.status(500).send({
        message:'An unexpected error has occured'
    })
}

module.exports = {
    notFound,
    serverError
}