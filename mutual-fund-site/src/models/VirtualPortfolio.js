import mongoose from 'mongoose';

const VirtualPortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  schemeCode: { type: String, required: true },
  schemeName: { type: String, required: true },
  units: { type: Number, required: true },
  avgPrice: { type: Number, required: true },
  investmentDate: { type: Date, required: true },
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

// The key change is here:
// We are explicitly telling Mongoose to use the 'virtual_portfolio' collection.
// This prevents any potential errors from Mongoose's automatic pluralization.
export default mongoose.models.VirtualPortfolio || mongoose.model('VirtualPortfolio', VirtualPortfolioSchema, 'virtual_portfolio');

