import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  hasUnlimitedAccess: {
    type: Boolean,
    default: false,
  },
  stripeCustomerId: {
    type: String,
    required: true,
  },
  // Other fields as needed
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
