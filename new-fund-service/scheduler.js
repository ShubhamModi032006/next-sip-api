const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

// Validate cron expression for 9:45 AM daily
if (!cron.validate('45 9 * * *')) {
    console.error('Invalid cron expression!');
    process.exit(1);
}

console.log('📅 Fund Update Scheduler Started');
console.log('⏰ Scheduled to run every day at 9:45 AM');

// Schedule the task to run at 9:45 AM every day
cron.schedule('45 9 * * *', () => {
    console.log(`\n🚀 Starting scheduled fund update at ${new Date().toLocaleString()}`);
    
    // Get the absolute path to updateFunds.js
    const scriptPath = path.join(__dirname, 'updateFunds.js');
    
    // Spawn the update script as a child process
    const updateProcess = spawn('node', [scriptPath], {
        stdio: 'inherit' // This will pipe the child process stdout/stderr to parent
    });

    // Handle process completion
    updateProcess.on('close', (code) => {
        if (code === 0) {
            console.log(`\n✅ Scheduled update completed successfully at ${new Date().toLocaleString()}`);
        } else {
            console.error(`\n❌ Scheduled update failed with code ${code} at ${new Date().toLocaleString()}`);
        }
    });

    // Handle process errors
    updateProcess.on('error', (err) => {
        console.error(`\n❌ Failed to start update process: ${err.message}`);
    });
});

// Handle application termination
process.on('SIGINT', () => {
    console.log('\n👋 Scheduler shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Scheduler shutting down...');
    process.exit(0);
});

// Log that the scheduler is running
console.log('✅ Scheduler is now running. Press Ctrl+C to exit.');