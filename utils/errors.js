const notFound = (res,name) => {
    return res.status(404).send({message:`${name} with the provided id was not found`,error:'not-found'})
}

module.exports = {
    notFound
}