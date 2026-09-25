const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  countWords,
  countFillerWords,
  calculateSpeechSpeed,
  calculateConfidenceScore,
} = require('../utils/analysisUtils');
const { getHrFeedback } = require('../utils/geminiUtils');

/**
 * @route   POST /api/ai-feedback
 * @access  Private
 * @body    { userAnswer: string, question?: string, duration_sec?: number }
 * @returns { feedback_text, improved_answer, ai_score, missing_elements,
 *            tone_assessment, confidence_score, filler_word_count, speech_speed }
 */
const getAiFeedback = asyncHandler(async (req, res) => {
  const { userAnswer, question, duration_sec } = req.body;

  if (!userAnswer || !userAnswer.trim()) {
    throw new ApiError(400, 'userAnswer is required');
  }

  // ── Metrics ─────────────────────────────────────────────────────────────────
  const wordCount       = countWords(userAnswer);
  const fillerWordCount = countFillerWords(userAnswer);
  // Use real duration if sent from frontend speech timer
  const speechSpeed     = calculateSpeechSpeed(wordCount, duration_sec || null);
  const confidenceScore = calculateConfidenceScore({
    fillerWordCount,
    speechSpeed,
    wordCount,
    answerText: userAnswer,
  });

  // ── AI Feedback ──────────────────────────────────────────────────────────────
  const aiResult = await getHrFeedback(userAnswer, question || null, {
    fillerWordCount,
    speechSpeed,
    wordCount,
  });

  res.json({
    status: 'success',
    data: {
      feedback_text:     aiResult.feedback_text,
      improved_answer:   aiResult.improved_answer,
      ai_score:          aiResult.ai_score,          // NEW
      missing_elements:  aiResult.missing_elements,  // NEW
      tone_assessment:   aiResult.tone_assessment,   // NEW
      confidence_score:  confidenceScore,
      filler_word_count: fillerWordCount,
      speech_speed:      speechSpeed,
      word_count:        wordCount,                  // NEW
    },
  });
});

module.exports = {
  getAiFeedback,
};
