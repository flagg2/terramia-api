const router = require('express').Router()

require('./products')(router)
require('./orders')(router)
require('./users')(router)
require('./coupons')(router)
require('./blog')(router)

module.exports = router