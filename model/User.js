const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // existing fields
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // new fields
  hasUnlimitedAccess: { type: Boolean, default: false },
  fetchCount: { type: Number, default: 0 },
  subscriptionExpiryDate: { type: Date, default: null },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
