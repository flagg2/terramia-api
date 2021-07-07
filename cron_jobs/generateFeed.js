//TODO finish
const mfg = require("../utils/merchantFeedGenerator");
const CronJob = require("cron").CronJob;
const job = new CronJob("0 23 * * *", async function () {
   mfg.exportProducts();
});
job.start();
