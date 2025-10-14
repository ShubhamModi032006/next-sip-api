const mongoose = require('mongoose');

// The Schema defines the structure for our fund documents.
const fundSchema = new mongoose.Schema({
  schemeCode: {
    type: Number,
    required: true,
    unique: true // Prevents duplicate funds
  },
  schemeName: {
    type: String,
    required: true,
    index: true // Speeds up text-based searching
  }
});

// The Model is our interface to the 'active_funds' collection in MongoDB.
const Fund = mongoose.model('Fund', fundSchema, 'active_funds');

module.exports = Fund;

