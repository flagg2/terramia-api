const Product = require('../model/product');
const User = require('../model/user')
const CronJob = require('cron').CronJob;
const job = new CronJob('* */30 * * * *', async function() {
  const users = await User.find({ watchList: { $exists: true, $not: {$size: 0} } })
  for (const user of users){
    const newList = []
    for (const item of user.watchList){
      const product = await Product.findById(item)
      if (product.available){
        console.log('sending an email')
      }
      else{
        newList.push(item)
      }
    }
    if (newList.length != user.watchList.length){
      user.watchList = newList
      user.markModified('watchList')
    }
    const savedUser = await user.save()
    console.log(savedUser)
    
  }
}, null, true, 'America/Los_Angeles');
job.start()