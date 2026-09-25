const chatbotData = require('../config/chatbotData.json');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getChatbotResponse } = require('../utils/geminiUtils');

const normalize = (text) =>
  (text || '').toString().trim().toLowerCase().replace(/[?!.,]/g, '');

/**
 * Fuzzy match: returns true if query and item share enough words.
 * Threshold: ≥ 50% of the shorter string's words must appear in the longer.
 */
const fuzzyMatch = (query, item) => {
  const queryWords = new Set(query.split(/\s+/).filter((w) => w.length > 2));
  const itemWords  = new Set(item.split(/\s+/).filter((w) => w.length > 2));

  if (!queryWords.size || !itemWords.size) return false;

  let matchCount = 0;
  for (const word of queryWords) {
    if (itemWords.has(word)) matchCount++;
  }

  const threshold = Math.min(queryWords.size, itemWords.size) * 0.5;
  return matchCount >= threshold;
};

// @route   POST /api/chatbot
// @access  Private
// body: { message: string }
const handleChatbotMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    throw new ApiError(400, 'Message is required');
  }

  const normalizedMessage = normalize(message);

  // 1. Exact match (fastest path)
  let predefined = chatbotData.find(
    (item) => normalize(item.question) === normalizedMessage
  );

  // 2. Substring / partial match
  if (!predefined) {
    predefined = chatbotData.find(
      (item) =>
        normalizedMessage.includes(normalize(item.question)) ||
        normalize(item.question).includes(normalizedMessage)
    );
  }

  // 3. Fuzzy keyword match
  if (!predefined) {
    predefined = chatbotData.find((item) =>
      fuzzyMatch(normalizedMessage, normalize(item.question))
    );
  }

  if (predefined) {
    return res.json({
      status: 'success',
      data: {
        source: 'fixed',
        response: predefined.answer,
      },
    });
  }

  // 4. Fall through to Gemini for everything else
  const aiResponse = await getChatbotResponse(message);

  res.json({
    status: 'success',
    data: {
      source: 'ai',
      response: aiResponse,
    },
  });
});

module.exports = {
  handleChatbotMessage,
};
