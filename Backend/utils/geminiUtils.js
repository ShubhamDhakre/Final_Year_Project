// Use global fetch when available (Node 18+), otherwise lazy-load node-fetch (v3 is ESM-only)
const fetch =
  typeof globalThis.fetch === 'function'
    ? globalThis.fetch.bind(globalThis)
    : (...args) =>
        import('node-fetch').then(({ default: nodeFetch }) =>
          nodeFetch(...args)
        );
const ApiError = require('./ApiError');

// Stable v1 Gemini endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models';
const getApiKey = () => process.env.GEMINI_API_KEY;

// Cascade model list in case of temporary 503 / high demand spikes
const MODEL_CASCADE = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
];

/**
 * Call Google Gemini API via REST with automatic model fallback
 * @param {string} prompt             - The user prompt
 * @param {string} systemInstruction  - Optional system instruction
 * @param {object} options            - Optional config overrides (e.g. maxOutputTokens)
 * @returns {Promise<string>}         - The generated text response
 */
const callGeminiAPI = async (prompt, systemInstruction = null, options = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new ApiError(500, 'AI service is not configured');
  }

  // Combine system instruction + prompt into a single text block
  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\n${prompt}`
    : prompt;

  const requestBody = {
    contents: [
      {
        parts: [{ text: fullPrompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature || 0.4,
      topP: 0.85,
      maxOutputTokens: options.maxOutputTokens || 4096,
    },
  };

  let lastError = null;

  for (const model of MODEL_CASCADE) {
    try {
      const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;

        // If 503 high demand or 429 quota, try next model in cascade
        if (status === 503 || status === 429) {
          lastError = new ApiError(status, errorData.error?.message || 'High demand');
          continue;
        }

        if (status === 401 || status === 403) {
          throw new ApiError(500, 'Invalid API key or access denied');
        }

        throw new ApiError(
          502,
          `AI service error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (text) {
        return text;
      }
    } catch (err) {
      if (err.statusCode === 500) throw err;
      lastError = err;
    }
  }

  throw lastError || new ApiError(503, 'AI service is currently busy. Please try again.');
};

// ─── Safe JSON Parser ─────────────────────────────────────────────────────────
const safeParseJSON = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

// ─── HR Feedback ─────────────────────────────────────────────────────────────
const getHrFeedback = async (userAnswer, question = null, metrics = {}) => {
  const { fillerWordCount = 0, speechSpeed = 0, wordCount = 0 } = metrics;

  const systemInstruction = `You are a friendly but direct HR Director evaluating an undergraduate student in an HR interview.
Speech metrics:
- Filler words: ${fillerWordCount}
- Speech speed: ${speechSpeed} WPM
- Word count: ${wordCount}

ALWAYS respond ONLY with a valid JSON object:
{
  "feedback_text": "Specific, honest 3-4 point feedback referencing the actual answer content.",
  "improved_answer": "A model STAR-structured answer in first person, 100-150 words.",
  "ai_score": 8,
  "missing_elements": ["STAR elements or issues"],
  "tone_assessment": "One sentence describing the overall tone."
}`;

  const prompt = question
    ? `Interview Question: "${question}"\n\nCandidate's Answer:\n"${userAnswer}"\n\nEvaluate the answer strictly and return JSON.`
    : `Candidate's Answer:\n"${userAnswer}"\n\nEvaluate the answer strictly and return JSON.`;

  try {
    const content = await callGeminiAPI(prompt, systemInstruction);
    const parsed = safeParseJSON(content);

    if (parsed) {
      return {
        feedback_text:     parsed.feedback_text     || '',
        improved_answer:   parsed.improved_answer   || '',
        ai_score:          parsed.ai_score           || null,
        missing_elements:  parsed.missing_elements  || [],
        tone_assessment:   parsed.tone_assessment   || '',
      };
    }

    return {
      feedback_text:    content,
      improved_answer:  '',
      ai_score:         null,
      missing_elements: [],
      tone_assessment:  '',
    };
  } catch (err) {
    return {
      feedback_text:
        'AI feedback service is temporarily unavailable. Tips: reduce filler words, maintain a steady pace, and structure your answer with STAR method.',
      improved_answer:
        'Refine your answer: be concise, remove filler words, end with a confident conclusion.',
      ai_score:         null,
      missing_elements: [],
      tone_assessment:  '',
    };
  }
};

// ─── Technical Feedback ───────────────────────────────────────────────────────
const getTechnicalFeedback = async (userAnswer, question = null, skill = '', metrics = {}) => {
  const { fillerWordCount = 0, speechSpeed = 0, wordCount = 0 } = metrics;

  const systemInstruction = `You are a senior software engineer evaluating a technical interview answer.
Skill: ${skill || 'general programming'}

Speech metrics:
- Filler words: ${fillerWordCount}
- Speech speed: ${speechSpeed} WPM
- Word count: ${wordCount}

ALWAYS respond ONLY with a valid JSON object:
{
  "feedback_text": "Specific 3-4 point technical feedback.",
  "improved_answer": "A model technical answer.",
  "ai_score": 8,
  "missing_elements": ["concept1", "concept2"],
  "technical_accuracy": "accurate / partially accurate / inaccurate"
}`;

  const prompt = question
    ? `Technical Question: "${question}"\n\nCandidate's Answer:\n"${userAnswer}"\n\nEvaluate and return JSON feedback.`
    : `Candidate's Answer:\n"${userAnswer}"\n\nEvaluate and return JSON feedback.`;

  try {
    const content = await callGeminiAPI(prompt, systemInstruction);
    const parsed = safeParseJSON(content);

    if (parsed) {
      return {
        feedback_text:      parsed.feedback_text      || '',
        improved_answer:    parsed.improved_answer    || '',
        ai_score:           parsed.ai_score           || null,
        missing_elements:   parsed.missing_elements   || [],
        technical_accuracy: parsed.technical_accuracy || '',
      };
    }

    return {
      feedback_text:      content,
      improved_answer:    '',
      ai_score:           null,
      missing_elements:   [],
      technical_accuracy: '',
    };
  } catch {
    return {
      feedback_text:
        'AI technical feedback is temporarily unavailable. Review core concepts and try again.',
      improved_answer:    '',
      ai_score:           null,
      missing_elements:   [],
      technical_accuracy: '',
    };
  }
};

const generateDynamicTechnicalQuestion = async (skills, difficulty = 'easy') => {
  const skillList = skills.join(', ');
  const prompt = `Generate one ${difficulty} technical interview question for a software role. Skills: ${skillList}. Return ONLY question text.`;
  try {
    const content = await callGeminiAPI(prompt);
    return content.trim().replace(/^["']|["']$/g, '');
  } catch {
    return null;
  }
};

const getChatbotResponse = async (message) => {
  const systemInstruction = `You are an AI interview and career coach for college students preparing for placements. Keep responses under 220 words.`;
  try {
    return await callGeminiAPI(message, systemInstruction);
  } catch {
    return 'The AI assistant is currently at its usage limit. Please try again in a moment.';
  }
};

module.exports = {
  callGeminiAPI,
  safeParseJSON,
  getHrFeedback,
  getTechnicalFeedback,
  generateDynamicTechnicalQuestion,
  getChatbotResponse,
};
