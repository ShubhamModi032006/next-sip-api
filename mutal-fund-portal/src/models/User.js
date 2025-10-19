// src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
    // We will hash this before saving
  },
  role: {
    type: String,
    required: true,
    enum: ['company_head', 'admin', 'seller', 'customer']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Conceptual Permissions (Not stored directly, derived from role)
// company_head: Manage Admins, View All Data, Configure Settings
// admin: Manage Sellers, View Team Data
// seller: Manage Customers, View Own Data & Commissions
// customer: Manage Own Portfolio & SIPs

// Prevent recompilation of model if it already exists
export default mongoose.models.User || mongoose.model('users', userSchema);
