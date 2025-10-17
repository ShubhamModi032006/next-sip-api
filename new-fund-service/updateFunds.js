// ==================== CONFIGURATION ====================
require('dotenv').config();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const fs = require('fs');
const Fund = require('./models/Fund');

const API_BASE_URL = "https://api.mfapi.in/mf";

// --- Stability Settings (from Python script) ---
const CONCURRENCY_LIMIT = 10;
const RETRY_COUNT = 4;
const RETRY_DELAY_SECONDS = 3;

// --- Filtering & Output ---
const DAYS_THRESHOLD = 14;
const OUTPUT_FILENAME = "active_funds_backup.json";

// --- MONGODB SETTINGS ---
const MONGO_URI = process.env.MONGO_URI;
// =======================================================


/**
 * Parses a DD-MM-YYYY date string into a Date object.
 * @param {string} dateStr - The date string to parse.
 * @returns {Date | null}
 */
function parseDDMMYYYY(dateStr) {
    if (!dateStr) return null;
    try {
        const [day, month, year] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    } catch (e) {
        return null;
    }
}

/**
 * Fetches details for a single fund with robust retries.
 * @param {object} fund - The fund object from the master list.
 * @returns {Promise<object | null>}
 */
async function fetchFundDetails(fund) {
    const schemeCode = fund.schemeCode;
    // Ensure schemeCode is a valid number
    if (!schemeCode || isNaN(Number(schemeCode))) return null;

    const url = `${API_BASE_URL}/${schemeCode}`;

    for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
        try {
            const response = await fetch(url, { timeout: 30000 });
            if (response.status === 200) {
                const data = await response.json();
                const navData = data?.data;

                if (!Array.isArray(navData) || navData.length === 0) return null;

                const latestNav = navData[0];
                const navDate = parseDDMMYYYY(latestNav?.date);

                if (!navDate) return null;

                const dateThreshold = new Date();
                dateThreshold.setDate(dateThreshold.getDate() - DAYS_THRESHOLD);

                if (navDate >= dateThreshold) {
                    return {
                        code: schemeCode,
                        name: data?.meta?.scheme_name || "N/A",
                        nav: latestNav?.nav,
                        date: latestNav?.date,
                        last_updated_on: new Date()
                    };
                }
                return null; // Fund is not active
            } else {
                console.warn(`\n⚠️ Status ${response.status} for fund ${schemeCode} (Attempt ${attempt + 1}/${RETRY_COUNT})`);
            }
        } catch (e) {
            console.warn(`\n⚠️ Error fetching fund ${schemeCode} (Attempt ${attempt + 1}/${RETRY_COUNT}): ${e.message}`);
        }

        if (attempt < RETRY_COUNT - 1) {
            await new Promise(res => setTimeout(res, RETRY_DELAY_SECONDS * 1000 * (attempt + 1)));
        }
    }
    console.error(`\n❌ Failed to fetch fund ${schemeCode} after ${RETRY_COUNT} retries.`);
    return null;
}


/**
 * Connect to MongoDB
 */
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, {
            dbName: 'test'
        });
        console.log('📦 Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

/**
 * Main function to run the entire process.
 */
async function main() {
    console.log("🚀 Starting the mutual fund updater...");
    if (!MONGO_URI) {
        console.error("❌ CRITICAL ERROR: MONGO_URI is not set in your .env file.");
        return;
    }

    try {
        // Connect to MongoDB
        await connectDB();
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB. Exiting.");
        return;
    }

    let allFunds;

    try {
        console.log("📡 Fetching the master list of all funds...");
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        allFunds = await response.json();
    } catch (e) {
        console.error(`❌ Critical Error: Could not fetch master fund list. ${e}`);
        return;
    }

    const totalFunds = allFunds.length;
    console.log(`✅ Found ${totalFunds} total funds to check.`);

    const activeFunds = [];
    let progressCounter = 0;

    for (let i = 0; i < totalFunds; i += CONCURRENCY_LIMIT) {
        const batch = allFunds.slice(i, i + CONCURRENCY_LIMIT);
        const promises = batch.map(fund => fetchFundDetails(fund));
        const results = await Promise.all(promises);

        results.forEach(result => {
            progressCounter++;
            // Enhanced validation to ensure we only include valid funds
            if (result && 
                result.code && 
                !isNaN(Number(result.code)) && 
                result.name && 
                result.nav && 
                result.date) {
                activeFunds.push(result);
            }
        });
        process.stdout.write(`⚙️  Processing: ${progressCounter}/${totalFunds} funds | Found: ${activeFunds.length} active\r`);
    }

    console.log("\n\n✅ Processing complete.");
    console.log("=" * 30);
    console.log(`📊 FINAL RESULTS:`);
    console.log(`   - ✅ Active Funds:    ${activeFunds.length}`);
    console.log(`   - ❌ Inactive/Failed: ${totalFunds - activeFunds.length}`);
    console.log("=" * 30);

    if (activeFunds.length > 0) {
        try {
            console.log("\n💾 Connected to MongoDB...");

            console.log("🗑️  Deleting all old documents from 'active_funds' collection...");
            const { deletedCount } = await Fund.deleteMany({});
            console.log(`   -> ${deletedCount} documents deleted.`);

            console.log(`✍️  Inserting ${activeFunds.length} new active funds into MongoDB...`);
            await Fund.insertMany(activeFunds, { 
                ordered: false,  // Continue processing even if some documents fail
                collection: 'active_funds'
            }).catch(err => {
                console.warn("Warning: Some documents failed to insert:", err.message);
                // Continue execution even if there are some failures
            });
            console.log("   -> Successfully inserted valid documents.");

            console.log("\n🎉 MongoDB update complete.");
        } catch (e) {
            console.error(`\n❌ CRITICAL ERROR: Could not update MongoDB. Error: ${e}`);
        } finally {
            await mongoose.connection.close();
            console.log("🔒 MongoDB connection closed.");
        }
    }

    console.log(`\n💾 Saving local backup to '${OUTPUT_FILENAME}'...`);
    fs.writeFileSync(OUTPUT_FILENAME, JSON.stringify(activeFunds, null, 2));
    console.log("🎉 All done!");
}


// --- RUN SCRIPT ---
main();