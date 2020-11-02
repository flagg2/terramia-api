const router = require('express').Router()

require('./products')(router)
require('./orders')(router)
require('./tempuser')(router)

module.exports = router