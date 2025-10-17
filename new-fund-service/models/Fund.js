const mongoose = require('mongoose');

// This schema now matches the data structure from the Python script
const fundSchema = new mongoose.Schema({
  code: { 
    type: Number, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return v !== null && !isNaN(v) && v > 0;
      },
      message: props => `${props.value} is not a valid fund code!`
    }
  },
  name: { 
    type: String, 
    required: true, 
    index: true,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: props => 'Name cannot be empty!'
    }
  },
  nav: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return v && !isNaN(parseFloat(v));
      },
      message: props => 'NAV must be a valid number!'
    }
  },
  date: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{2}-\d{2}-\d{4}$/.test(v);
      },
      message: props => 'Date must be in DD-MM-YYYY format!'
    }
  },
  last_updated_on: { type: Date, default: Date.now }
});

// The model will interact with the 'active_funds' collection
const Fund = mongoose.model('Fund', fundSchema, 'active_funds');

module.exports = Fund;
