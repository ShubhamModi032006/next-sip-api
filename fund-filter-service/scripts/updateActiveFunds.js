// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// // 2. Import necessary packages
// const mongoose = require('mongoose');
// const fetch = require('node-fetch');
// const Fund = require('../models/Fund');

// const MF_API_URL = 'https://api.mfapi.in/mf';
// const MONGO_URI = process.env.MONGO_URI;

// async function updateActiveFunds() {
//     console.log('🚀 Starting the DETAILED process to find and store active mutual funds...');

//     try {
//         if (!MONGO_URI) throw new Error('MongoDB URI is not defined. Please check your .env file.');
//         await mongoose.connect(MONGO_URI, { dbName: 'funds' });
//         console.log('✅ Successfully connected to MongoDB.');

//         console.log('Fetching the full list of funds from mfapi.in...');
//         const allFundsResponse = await fetch(MF_API_URL);
//         const allFunds = await allFundsResponse.json();
//         console.log(`🔎 Found a total of ${allFunds.length} funds to check.`);

//         const sevenDaysAgo = new Date();
//         sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 5);

//         // --- NEW: Create categories to hold all results ---
//         const categorizedFunds = {
//             active_and_saved: [],
//             rejected_by_isin: [],
//             rejected_by_date: [],
//             rejected_by_error: []
//         };
        
//         const BATCH_SIZE = 100;
//         console.log(`Processing funds in batches of ${BATCH_SIZE}...`);

//         for (let i = 0; i < allFunds.length; i += BATCH_SIZE) {
//             const batch = allFunds.slice(i, i + BATCH_SIZE);
            
//             const promises = batch.map(async (fund) => {
//                 // First, perform the fast, in-memory check
//                 if (!fund.schemeName || fund.isinGrowth === null) {
//                     categorizedFunds.rejected_by_isin.push(fund);
//                     return; // Stop processing this fund
//                 }

//                 try {
//                     // If the first check passes, perform the detailed network check
//                     const detailResponse = await fetch(`https://api.mfapi.in/mf/${fund.schemeCode}`);
//                     if (!detailResponse.ok) {
//                         categorizedFunds.rejected_by_error.push({ ...fund, reason: `HTTP ${detailResponse.status}` });
//                         return;
//                     }
                    
//                     const detailData = await detailResponse.json();
//                     const latestNav = detailData.data?.[0];
                    
//                     if (latestNav && latestNav.date) {
//                         const [day, month, year] = latestNav.date.split('-');
//                         const lastUpdateDate = new Date(`${year}-${month}-${day}`);
                        
//                         if (lastUpdateDate >= sevenDaysAgo) {
//                             // This fund passed all checks!
//                             categorizedFunds.active_and_saved.push({
//                                 schemeCode: fund.schemeCode,
//                                 schemeName: fund.schemeName
//                             });
//                         } else {
//                             // Passed ISIN check, but failed the date check
//                             categorizedFunds.rejected_by_date.push({ ...fund, last_nav_date: latestNav.date });
//                         }
//                     } else {
//                          categorizedFunds.rejected_by_error.push({ ...fund, reason: 'No NAV data found' });
//                     }
//                 } catch (e) {
//                     categorizedFunds.rejected_by_error.push({ ...fund, reason: e.message });
//                 }
//             });

//             await Promise.all(promises);
//             process.stdout.write(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allFunds.length / BATCH_SIZE)}. Active: ${categorizedFunds.active_and_saved.length}\r`);
//         }
        
//         // --- NEW: DETAILED SUMMARY REPORT ---
//         console.log('\n\n--- Analysis Complete ---');
//         console.log(`✅ Active Funds Found:         ${categorizedFunds.active_and_saved.length}`);
//         console.log(`❌ Rejected by ISIN Check:     ${categorizedFunds.rejected_by_isin.length}`);
//         console.log(`❌ Rejected by NAV Date Check: ${categorizedFunds.rejected_by_date.length}`);
//         console.log(`❌ Rejected due to API Error:  ${categorizedFunds.rejected_by_error.length}`);
//         console.log('---------------------------');
//         const totalCategorized = categorizedFunds.active_and_saved.length + categorizedFunds.rejected_by_isin.length + categorizedFunds.rejected_by_date.length + categorizedFunds.rejected_by_error.length;
//         console.log(`Total Funds Processed:      ${totalCategorized}`);

//         // Log some examples of funds rejected by the date check
//         if (categorizedFunds.rejected_by_date.length > 0) {
//             console.log('\n--- Examples of funds rejected by NAV Date ---');
//             for(let k = 0; k < Math.min(5, categorizedFunds.rejected_by_date.length); k++) {
//                 const fund = categorizedFunds.rejected_by_date[k];
//                 console.log(`- ${fund.schemeName} (Code: ${fund.schemeCode}) - Last NAV: ${fund.last_nav_date}`);
//             }
//         }

//         // Atomically update the database with the good list
//         if (categorizedFunds.active_and_saved.length > 0) {
//             console.log('\n💾 Updating the database...');
//             await Fund.deleteMany({});
//             await Fund.insertMany(categorizedFunds.active_and_saved);
//             console.log('✅ Database update successful!');
//         }

//     } catch (error) {
//         console.error('\n❌ A critical error occurred:', error);
//     } finally {
//         await mongoose.connection.close();
//         console.log('MongoDB connection closed.');
//     }
// }

// updateActiveFunds();





// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// const mongoose = require('mongoose');
// const fetch = require('node-fetch');
// const Fund = require('../models/Fund');

// const MF_API_URL = 'https://api.mfapi.in/mf';
// const MONGO_URI = process.env.MONGO_URI;

// const runUpdate = async () => {
//     console.log(`[${new Date().toISOString()}] 🚀 Starting the scheduled process to update active funds...`);
//     let connection;

//     try {
//         if (!MONGO_URI) throw new Error('MongoDB URI is not defined.');
        
//         connection = await mongoose.connect(MONGO_URI, { dbName: 'funds' });
//         console.log('✅ Successfully connected to MongoDB.');

//         console.log('Fetching the full list of funds from mfapi.in...');
//         const allFundsResponse = await fetch(MF_API_URL);
//         if (!allFundsResponse.ok) throw new Error(`Failed to fetch fund list: ${allFundsResponse.statusText}`);
        
//         const allFunds = await allFundsResponse.json();
//         console.log(`🔎 Found a total of ${allFunds.length} funds to check.`);

//         const sevenDaysAgo = new Date();
//         sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//         const categorizedFunds = {
//             active_and_saved: [],
//             rejected_by_isin: [],
//             rejected_by_date: [],
//             rejected_by_error: []
//         };
        
//         const BATCH_SIZE = 100;
//         console.log(`Processing funds in batches of ${BATCH_SIZE}...`);

//         for (let i = 0; i < allFunds.length; i += BATCH_SIZE) {
//             const batch = allFunds.slice(i, i + BATCH_SIZE);
//             const promises = batch.map(async (fund) => {
//                 if (!fund.schemeName || fund.isinGrowth === null) {
//                     categorizedFunds.rejected_by_isin.push(fund);
//                     return;
//                 }

//                 try {
//                     const detailResponse = await fetch(`https://api.mfapi.in/mf/${fund.schemeCode}`);
//                     if (!detailResponse.ok) {
//                         categorizedFunds.rejected_by_error.push({ ...fund, reason: `HTTP ${detailResponse.status}` });
//                         return;
//                     }
                    
//                     const detailData = await detailResponse.json();
//                     const latestNav = detailData.data?.[0];
                    
//                     if (latestNav && latestNav.date) {
//                         const [day, month, year] = latestNav.date.split('-');
//                         const lastUpdateDate = new Date(`${year}-${month}-${day}`);
                        
//                         if (lastUpdateDate >= sevenDaysAgo) {
//                             categorizedFunds.active_and_saved.push({
//                                 schemeCode: fund.schemeCode,
//                                 schemeName: fund.schemeName
//                             });
//                         } else {
//                             categorizedFunds.rejected_by_date.push({ ...fund, last_nav_date: latestNav.date });
//                         }
//                     } else {
//                          categorizedFunds.rejected_by_error.push({ ...fund, reason: 'No NAV data found' });
//                     }
//                 } catch (e) {
//                     categorizedFunds.rejected_by_error.push({ ...fund, reason: e.message });
//                 }
//             });

//             await Promise.all(promises);
//             process.stdout.write(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allFunds.length / BATCH_SIZE)}. Active: ${categorizedFunds.active_and_saved.length}\r`);
//         }
        
//         console.log('\n\n--- Analysis Complete ---');
//         console.log(`✅ Active Funds Found:         ${categorizedFunds.active_and_saved.length}`);
//         console.log(`❌ Rejected (ISIN Check):      ${categorizedFunds.rejected_by_isin.length}`);
//         console.log(`❌ Rejected (NAV Date Check):  ${categorizedFunds.rejected_by_date.length}`);
//         console.log(`❌ Rejected (API Error):       ${categorizedFunds.rejected_by_error.length}`);
//         console.log('---------------------------');
//         const totalCategorized = categorizedFunds.active_and_saved.length + categorizedFunds.rejected_by_isin.length + categorizedFunds.rejected_by_date.length + categorizedFunds.rejected_by_error.length;
//         console.log(`Total Funds Processed:      ${totalCategorized}`);

//         if (categorizedFunds.active_and_saved.length > 0) {
//             console.log('\n💾 Updating the database...');
//             await Fund.deleteMany({});
//             await Fund.insertMany(categorizedFunds.active_and_saved);
//             console.log('✅ Database update successful!');
//         } else {
//             console.log('⚠️ No active funds were found to update.');
//         }

//     } catch (error) {
//         console.error('\n❌ A critical error occurred during the update process:', error);
//     } finally {
//         if (connection) {
//             await connection.disconnect();
//             console.log('MongoDB connection closed.');
//         }
//     }
// };

// if (require.main === module) {
//     runUpdate();
// }

// module.exports = { runUpdate };








// 1. Configure Environment Variables
// Uses the 'path' module to reliably find the .env file in the parent directory.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 2. Import necessary packages
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const Fund = require('../models/Fund'); // Import our Mongoose model

// 3. Define Constants
const MF_API_URL = 'https://api.mfapi.in/mf';
const MONGO_URI = process.env.MONGO_URI;

// Match the Python script's configuration for an exact, fair comparison.
const DAYS_THRESHOLD = 5;   // Using the stricter 3-day window.
const BATCH_SIZE = 100;     // The number of funds to check concurrently.

/**
 * The main function to fetch, filter, and store active mutual funds.
 */
const runUpdate = async () => {
    console.log(`[${new Date().toISOString()}] 🚀 Starting the process to update active funds...`);
    let connection;

    try {
        // A. Connect to MongoDB
        if (!MONGO_URI) {
            throw new Error('MongoDB URI is not defined. Please check your .env file.');
        }
        
        connection = await mongoose.connect(MONGO_URI, { dbName: 'funds' });
        console.log('✅ Successfully connected to MongoDB.');

        // B. Fetch the full list of funds
        console.log('Fetching the full list of funds from mfapi.in...');
        const allFundsResponse = await fetch(MF_API_URL);
        if (!allFundsResponse.ok) {
            throw new Error(`Failed to fetch fund list: ${allFundsResponse.statusText}`);
        }
        
        const allFunds = await allFundsResponse.json();
        console.log(`🔎 Found a total of ${allFunds.length} funds to check.`);

        // C. Define the date threshold for "activeness"
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - DAYS_THRESHOLD);

        let activeFunds = [];
        console.log(`Processing funds in batches of ${BATCH_SIZE}...`);

        // D. Process all funds in parallel batches
        for (let i = 0; i < allFunds.length; i += BATCH_SIZE) {
            const batch = allFunds.slice(i, i + BATCH_SIZE);
            
            const promises = batch.map(async (fund) => {
                // LOGIC CHANGE: The strict 'isinGrowth' check has been REMOVED.
                // We now only check for a valid schemeName and schemeCode, just like the Python script.
                if (!fund.schemeName || !fund.schemeCode) {
                    return null;
                }

                try {
                    // Fetch the detailed data for the fund.
                    const detailResponse = await fetch(`https://api.mfapi.in/mf/${fund.schemeCode}`, { timeout: 20000 });
                    if (!detailResponse.ok) return null;
                    
                    const detailData = await detailResponse.json();
                    const latestNav = detailData.data?.[0]; // Get the most recent NAV entry
                    
                    if (latestNav && latestNav.date) {
                        const [day, month, year] = latestNav.date.split('-');
                        const lastUpdateDate = new Date(`${year}-${month}-${day}`);
                        
                        // LOGIC CHANGE: Using the stricter 3-day threshold to match the Python script.
                        if (lastUpdateDate >= dateThreshold) {
                            // If the fund is active, return its data.
                            return { schemeCode: fund.schemeCode, schemeName: fund.schemeName };
                        }
                    }
                } catch (e) {
                    // Add logging for individual errors to help with debugging, just like the Python version.
                    console.warn(`\n⚠️ Error processing fund ${fund.schemeCode}: ${e.message}`);
                    return null; 
                }
                // If any check fails, return null for this fund.
                return null;
            });

            // Wait for the current batch to finish processing
            const batchResults = await Promise.all(promises);
            // Add all the non-null (i.e., active) funds from the batch to our main list.
            activeFunds.push(...batchResults.filter(Boolean));
            // Update the progress line in the console.
            process.stdout.write(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allFunds.length / BATCH_SIZE)}. Active funds found: ${activeFunds.length}\r`);
        }
        
        console.log(`\n\n✅ Finished checking. Total active funds found: ${activeFunds.length}`);

        // E. Update the database
        if (activeFunds.length > 0) {
            console.log('💾 Updating the database with the new list of active funds...');
            // Atomically replace the entire collection content.
            await Fund.deleteMany({});
            await Fund.insertMany(activeFunds);
            console.log('✅ Database update successful!');
        } else {
            console.log('⚠️ No active funds were found to update.');
        }

    } catch (error) {
        console.error('\n❌ A critical error occurred during the update process:', error);
    } finally {
        // F. Ensure the database connection is always closed
        if (connection) {
            await connection.disconnect();
            console.log('MongoDB connection closed.');
        }
    }
};

// This allows the script to be run directly from the command line with `npm run update-data`
if (require.main === module) {
    runUpdate();
}

// This exports the function so our cron job can use it.
module.exports = { runUpdate };
