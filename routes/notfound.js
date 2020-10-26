const router = require('express').Router()

router.all('*',(req,res) => {
    res.status(404).send(
        {
            message:'This api endpoint does not exist',
            error:'not-found'
        }
    )
})


module.exports = router