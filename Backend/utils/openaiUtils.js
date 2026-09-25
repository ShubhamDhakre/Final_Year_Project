const openaiClient = require('../config/openai');
const ApiError = require('./ApiError');

const getModel = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';

const callOpenAIChat = async (messages) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new ApiError(500, 'AI service is not configured');
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: getModel(),
      messages,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new ApiError(500, 'Failed to get response from AI service');
    }

    return content;
  } catch (err) {
    // Handle OpenAI quota errors more gracefully
    const status = err.status || err?.response?.status;
    if (status === 429) {
      throw new ApiError(
        503,
        'AI quota exceeded. Please try again later or contact the administrator.'
      );
    }

    throw new ApiError(502, 'AI service error. Please try again later.');
  }
};

// HR feedback: transcript -> { feedback_text, improved_answer }
const getHrFeedback = async (transcript) => {
  const systemPrompt =
    'You are an interview coach. Given a candidate answer, provide concise constructive feedback and an improved sample answer. Respond in JSON with keys: feedback_text, improved_answer.';

  const userPrompt = `Candidate answer:\n${transcript}\n\nReturn strict JSON object.`;

  try {
    const content = await callOpenAIChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Try to parse JSON; if it fails, wrap in structure
    try {
      const parsed = JSON.parse(content);
      return {
        feedback_text: parsed.feedback_text || '',
        improved_answer: parsed.improved_answer || '',
      };
    } catch (e) {
      return {
        feedback_text: content,
        improved_answer: '',
      };
    }
  } catch (err) {
    // Fallback when AI quota is exceeded or service is unavailable
    return {
      feedback_text:
        'AI feedback service is temporarily unavailable. Based on simple analysis: try to reduce filler words, keep a steady pace, and structure your answer with a clear beginning, middle, and end.',
      improved_answer:
        'AI improved answer is unavailable due to quota limits. Refine your answer by making it more concise, removing filler words, and ending with a confident conclusion about your strengths.',
    };
  }
};

// Chatbot free-form response
const getChatbotResponse = async (message) => {
  const systemPrompt =
    'You are an AI interview and career coach for college students preparing for placements. Answer clearly and concisely.';

  try {
    const content = await callOpenAIChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    return content;
  } catch (err) {
    return 'The AI assistant is currently at its usage limit. Please try again later or discuss these questions with your mentor.';
  }
};

module.exports = {
  getHrFeedback,
  getChatbotResponse,
};

