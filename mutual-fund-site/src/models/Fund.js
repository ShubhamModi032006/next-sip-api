import mongoose from 'mongoose';

const fundSchema = new mongoose.Schema({
  code: { 
    type: Number, 
    required: true, 
    unique: true
  },
  name: { 
    type: String, 
    required: true, 
    index: true
  },
  nav: { 
    type: String, 
    required: true
  },
  date: { 
    type: String, 
    required: true
  },
  last_updated_on: { 
    type: Date, 
    default: Date.now 
  }
});

// Check if the model already exists to prevent the "Cannot overwrite model" error
const Fund = mongoose.models.Fund || mongoose.model('Fund', fundSchema, 'active_funds');

export default Fund;