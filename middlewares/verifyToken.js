const jwt = require('jsonwebtoken')

module.exports = (permissionLevel, autoRespond=true ) => (req, res, next) => {
    const token = req.header('auth-token')
    if (!token) {
        if (!autoRespond) return next()
        return res.status(401).send({
            message: 'Access Denied',
            error: 'bad-token'
    })}

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        const dec = jwt.decode(token)

        //check if token is expired
        const timestamp = Math.ceil((Date.now() / 1000))
        console.log(dec.iat,process.env.TOKEN_EXPIRY_TIME,timestamp)
        if (dec.iat + parseInt(process.env.TOKEN_EXPIRY_TIME) < timestamp) {
            return res.status(401).send({
                message: 'Token expired',
                error: 'token-expired'
            })
        }
        if (dec.admin < permissionLevel){
            return res.status(401).send({
                message: 'You have to have admin status to access this resource',
                error:'lacking-privileges'
            })
        }

        req.user = verified;
        next()
    } catch {
        res.status(400).send({
            message: 'Invalid Token',
            error: 'token-invalid'
        })
    }
}