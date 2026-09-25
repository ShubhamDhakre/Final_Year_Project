const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resume_text: {
      type: String,
      required: true,
    },
    extracted_skills: {
      type: [String],
      default: [],
    },
    upload_date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;

