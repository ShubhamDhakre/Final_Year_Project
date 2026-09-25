const mongoose = require('mongoose');

const interviewAttemptSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Stores question identifier like "hr-easy-1" or technical question id
    question_id: {
      type: String,
      required: true,
      trim: true,
    },
    attempt_number: {
      type: Number,
      required: true,
      min: 1,
    },
    confidence_score: {
      type: Number,
      default: 0,
    },
    filler_word_count: {
      type: Number,
      default: 0,
    },
    speech_speed: {
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

const InterviewAttempt = mongoose.model(
  'InterviewAttempt',
  interviewAttemptSchema
);

module.exports = InterviewAttempt;

