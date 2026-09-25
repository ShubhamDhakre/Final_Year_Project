const hrQuestions = require('../config/hrQuestions.json');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  countWords,
  countFillerWords,
  calculateSpeechSpeed,
  calculateConfidenceScore,
} = require('../utils/analysisUtils');
const { getHrFeedback } = require('../utils/geminiUtils');
const InterviewAttempt = require('../models/InterviewAttempt');

// @route   GET /api/hr/question?difficulty=easy|medium|hard
// @access  Private
const getHrQuestion = asyncHandler(async (req, res) => {
  const difficulty = (req.query.difficulty || 'easy').toLowerCase();

  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new ApiError(400, 'Invalid difficulty');
  }

  const filtered = hrQuestions.filter((q) => q.difficulty === difficulty);
  if (!filtered.length) {
    throw new ApiError(404, 'No questions found for this difficulty');
  }

  const question = filtered[Math.floor(Math.random() * filtered.length)];

  res.json({
    status: 'success',
    data: { question },
  });
});

// @route   POST /api/hr/submit
// @access  Private
// Expected body: { question_id, transcript, duration_sec? }
const submitHrAnswer = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const { question_id, transcript, duration_sec } = req.body;

  if (!question_id || !transcript) {
    throw new ApiError(400, 'question_id and transcript are required');
  }

  const question = hrQuestions.find((q) => q.id === question_id) || null;

  // ── Metrics ───────────────────────────────────────────────────────
  const wordCount       = countWords(transcript);
  const fillerWordCount = countFillerWords(transcript);
  // Use real duration from frontend if provided; falls back to 30-sec estimate
  const speechSpeed     = calculateSpeechSpeed(wordCount, duration_sec || null);
  const confidenceScore = calculateConfidenceScore({
    fillerWordCount,
    speechSpeed,
    wordCount,
    answerText: transcript,   // enables structure-keyword scoring
  });

  const questionText = question?.question || '';

  // ── AI Feedback (with richer metrics context) ─────────────────────
  const aiResult = await getHrFeedback(transcript, questionText, {
    fillerWordCount,
    speechSpeed,
    wordCount,
  });

  // ── Persist attempt ───────────────────────────────────────────────
  if (userId) {
    const lastAttempt = await InterviewAttempt.findOne({
      user_id: userId,
      question_id,
    })
      .sort({ attempt_number: -1 })
      .lean();

    const nextAttemptNumber = (lastAttempt?.attempt_number || 0) + 1;

    await InterviewAttempt.create({
      user_id: userId,
      question_id,
      attempt_number: nextAttemptNumber,
      confidence_score: confidenceScore,
      filler_word_count: fillerWordCount,
      speech_speed: speechSpeed,
      date: new Date(),
    });
  }

  res.json({
    status: 'success',
    data: {
      transcript,
      question,
      feedback_text:      aiResult.feedback_text,
      improved_answer:    aiResult.improved_answer,
      ai_score:           aiResult.ai_score,           // NEW: Gemini's own score
      missing_elements:   aiResult.missing_elements,   // NEW: what was missing
      tone_assessment:    aiResult.tone_assessment,    // NEW: tone analysis
      confidence_score:   confidenceScore,
      filler_word_count:  fillerWordCount,
      speech_speed:       speechSpeed,
      word_count:         wordCount,
    },
  });
});

module.exports = {
  getHrQuestion,
  submitHrAnswer,
};
