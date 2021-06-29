const CronJob = require("cron").CronJob;
const User = require("../model/user");
const moment = require("moment");
const tm = require("../utils/templateMailer");
const job = new CronJob("0 17 */1 * *", async function () {
   const users = await User.find({
      tempUser: false,
      scheduledMails: {
         $exists: true,
      },
   });
   const today = moment().format("DD/MM/YYYY");
   for (const user of users) {
      if (user.scheduledMails[today]) {
         for (const mail of user.scheduledMails[today]) {
            await tm.sendTemplate({
               name: mail,
               email: user.email,
            });
            console.log(`Sending email to ${user.email}`);
         }
      }
   }
});
job.start();
