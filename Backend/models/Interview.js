const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mode: {
      type: String,
      enum: ['HR', 'Technical'],
      required: true,
    },
    difficulty: {
      type: String,
      trim: true,
    },
    average_confidence_score: {
      type: Number,
      default: 0,
    },
    total_filler_words: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;

