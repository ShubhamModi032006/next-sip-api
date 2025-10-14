const cron = require('node-cron');
const { runUpdate } = require('./scripts/updateActiveFunds');

console.log('Cron scheduler started. Waiting for the scheduled time to run the update job.');

// --- The Schedule Definition ---
// This runs the task every day at 7:00 AM.
// Cron syntax: Minute Hour Day-of-Month Month Day-of-Week
// '0 7 * * *' means: 0th minute, 7th hour, every day, every month, every day of the week.
cron.schedule('30 9 * * *', () => {
    console.log(`[${new Date().toISOString()}] Running the daily fund update cron job...`);
    runUpdate();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" // IMPORTANT: Set your timezone
});