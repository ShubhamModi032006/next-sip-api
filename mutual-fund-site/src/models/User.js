import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // We can add more fields like name, password hash, etc., later.
  // For now, email is enough to uniquely identify a user.
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  username: {
    type: String,
    required: [true, 'Please provide a username.'],
    unique: true,
  },
}, {
  timestamps: true,
  // Explicitly set the collection name to 'users'
  collection: 'users'
});

export default mongoose.models.User || mongoose.model('User', UserSchema);