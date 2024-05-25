import mongoose from 'mongoose';

const FetchLimitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  lastFetch: {
    type: Date,
    default: Date.now,
  },
});

const FetchLimit = mongoose.models.FetchLimit || mongoose.model('FetchLimit', FetchLimitSchema);

export default FetchLimit;
