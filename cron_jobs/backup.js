const CronJob = require('cron').CronJob;
const backup = require('mongodb-backup-4x');
const job = new CronJob('0 3 */1 * *', async function() {
backup({
  uri: process.env.DB_CONNECTION,
  root: `./backups/${new Date().toISOString().replace(/:/g, '-')}`
});
})
job.start()