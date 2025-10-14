import { Schema, model, models } from 'mongoose';

const WatchlistSchema = new Schema({
  // In a real app, this would be a user ID. For now, we can use a session or device ID.
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // We will store an array of the scheme codes the user has watchlisted.
  funds: {
    type: [Number],
    default: [],
  },
});

// This prevents Mongoose from redefining the model on hot reloads
const Watchlist = models.Watchlist || model('Watchlist', WatchlistSchema);

export default Watchlist;
