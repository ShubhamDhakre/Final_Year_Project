const Interview = require('../models/Interview');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// @route   POST /api/dashboard/summary
// @access  Private
// body: { mode, difficulty, average_confidence_score, total_filler_words, date? }
const createInterviewSummary = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const {
    mode,
    difficulty,
    average_confidence_score,
    total_filler_words,
    date,
  } = req.body;

  if (!mode || !difficulty) {
    throw new ApiError(400, 'Mode and difficulty are required');
  }

  const interview = await Interview.create({
    user_id: userId,
    mode,
    difficulty,
    average_confidence_score,
    total_filler_words,
    date: date || new Date(),
  });

  res.status(201).json({
    status: 'success',
    data: { interview },
  });
});

// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  const interviews = await Interview.find({ user_id: userId }).sort({
    date: 1,
  });

  const totalInterviews = interviews.length;

  const avgConfidence =
    totalInterviews === 0
      ? 0
      : interviews.reduce(
          (sum, i) => sum + (i.average_confidence_score || 0),
          0
        ) / totalInterviews;

  const totalFillerWords = interviews.reduce(
    (sum, i) => sum + (i.total_filler_words || 0),
    0
  );

  const history = interviews.map((i) => ({
    id: i._id,
    mode: i.mode,
    difficulty: i.difficulty,
    average_confidence_score: i.average_confidence_score,
    total_filler_words: i.total_filler_words,
    date: i.date,
  }));

  res.json({
    status: 'success',
    data: {
      total_interviews: totalInterviews,
      average_confidence_score: Number(avgConfidence.toFixed(2)),
      total_filler_words: totalFillerWords,
      history,
    },
  });
});

// @route   GET /api/dashboard/history
// @access  Private
const getDashboardHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  const interviews = await Interview.find({ user_id: userId })
    .sort({ date: -1 })
    .limit(20);

  res.json({
    status: 'success',
    data: interviews,
  });
});

module.exports = {
  createInterviewSummary,
  getDashboardStats,
  getDashboardHistory,
};

