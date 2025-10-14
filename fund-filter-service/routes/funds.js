const express = require('express');
const router = express.Router();
// 1. Import the Mongoose model we created. This is our interface to the database.
const Fund = require('../models/Fund');

/**
 * @route   GET /api/funds
 * @desc    Get a paginated and searchable list of active mutual funds
 * @access  Public
 */
router.get('/funds', async (req, res) => {
    try {
        // 2. Get query parameters from the request URL (e.g., /api/funds?page=2&q=tax)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const searchQuery = req.query.q || '';
        
        // 3. Build the query object for MongoDB
        const query = {};
        if (searchQuery) {
            // Use Mongoose's powerful regex for a case-insensitive text search on the schemeName field.
            query.schemeName = { $regex: searchQuery, $options: 'i' };
        }

        // 4. Execute queries against the database using our 'Fund' model
        
        // First, count the total number of documents that match our search query (if any).
        // This is needed to calculate the total number of pages for pagination.
        const totalSchemes = await Fund.countDocuments(query);
        const totalPages = Math.ceil(totalSchemes / limit);

        // Second, find the actual fund documents that match the query, applying pagination.
        const schemes = await Fund.find(query)
            .skip((page - 1) * limit) // Skip documents for previous pages
            .limit(limit);             // Limit the results to the number per page

        // 5. Send the final, structured JSON response back to the client (your Next.js app)
        res.json({
            totalSchemes,
            totalPages,
            currentPage: page,
            schemes,
        });

    } catch (error) {
        console.error("Error fetching funds from MongoDB:", error);
        res.status(500).json({ error: 'An internal server error occurred while fetching funds.' });
    }
});

// 6. Export the router so it can be used by index.js
module.exports = router;

