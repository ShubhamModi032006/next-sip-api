const mongoose = require('mongoose');

// This schema now matches the data structure from the Python script
const fundSchema = new mongoose.Schema({
  code: { type: Number, required: true, unique: true },
  name: { type: String, required: true, index: true },
  nav: { type: String, required: true },
  date: { type: String, required: true },
  last_updated_on: { type: Date, default: Date.now }
});

// The model will interact with the 'activefunds' collection
const Fund = mongoose.model('Fund', fundSchema, 'activefunds');

module.exports = Fund;
