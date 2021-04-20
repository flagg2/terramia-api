const router = require('express').Router()

require('./products')(router)
require('./orders')(router)
require('./tempuser')(router)
require('./coupons')(router)

module.exports = router