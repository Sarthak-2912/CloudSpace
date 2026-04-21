const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    default: 'application/octet-stream',
  },
  data: {
    type: String, // Base64 encoded
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sharedWith: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  public: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('File', fileSchema);