// ─── Filler Words ────────────────────────────────────────────────────────────
// Expanded from 5 → 20 filler words for more accurate detection
const FILLER_WORDS = [
  'um', 'uh', 'like', 'basically', 'actually',
  'you know', 'sort of', 'kind of', 'right', 'okay',
  'literally', 'honestly', 'clearly', 'i mean', 'just',
  'very', 'really', 'stuff', 'things', 'whatever',
];

// ─── Structure Keywords ───────────────────────────────────────────────────────
// Signals that the candidate is using a structured / STAR-like format
const STRUCTURE_KEYWORDS = [
  'first', 'firstly', 'second', 'then', 'finally', 'lastly',
  'because', 'result', 'therefore', 'however', 'for example',
  'situation', 'task', 'action', 'result', 'star',
  'in my experience', 'i learned', 'the outcome',
];

/**
 * Count total words in a text string.
 */
const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Count filler word occurrences in text.
 * Handles both single-word and multi-word fillers.
 */
const countFillerWords = (text) => {
  if (!text) return 0;
  const clean = text.toLowerCase().replace(/[.,!?]/g, ' ');

  let count = 0;
  for (const filler of FILLER_WORDS) {
    // Use word-boundary regex for single-word fillers
    if (!filler.includes(' ')) {
      const regex = new RegExp(`\\b${filler}\\b`, 'g');
      const matches = clean.match(regex);
      if (matches) count += matches.length;
    } else {
      // Multi-word filler: simple substring count
      let idx = 0;
      while ((idx = clean.indexOf(filler, idx)) !== -1) {
        count++;
        idx += filler.length;
      }
    }
  }
  return count;
};

/**
 * Calculate words-per-minute.
 * @param {number} wordCount   - Total words in the answer
 * @param {number} durationSec - Actual speaking duration in seconds (optional).
 *                               Falls back to 30-second estimate if not provided.
 */
const calculateSpeechSpeed = (wordCount, durationSec = null) => {
  if (!wordCount) return 0;
  const seconds = durationSec && durationSec > 0 ? durationSec : 30;
  return Math.round((wordCount / seconds) * 60);
};

/**
 * Check whether the answer uses structured / STAR-format language.
 */
const hasStructuredAnswer = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return STRUCTURE_KEYWORDS.some((kw) => lower.includes(kw));
};

/**
 * Compute a confidence score out of 10 using expanded rule-based logic.
 *
 * Scoring breakdown (max 10):
 *  - Filler words  → up to 3 pts
 *  - Speech speed  → up to 3 pts
 *  - Word count    → up to 2 pts
 *  - Structure     → up to 2 pts
 */
const calculateConfidenceScore = ({ fillerWordCount, speechSpeed, wordCount, answerText = '' }) => {
  let score = 0;

  // ── Filler words (3 pts) ─────────────────────────────
  if (fillerWordCount === 0) {
    score += 3;              // Perfect — no fillers
  } else if (fillerWordCount <= 2) {
    score += 2;              // Acceptable
  } else if (fillerWordCount <= 4) {
    score += 1;              // Poor
  }
  // 5+ fillers → 0 pts

  // ── Speech speed (3 pts) ─────────────────────────────
  // Ideal range: 110–170 WPM (conversational speech)
  if (speechSpeed >= 110 && speechSpeed <= 170) {
    score += 3;              // Ideal pace
  } else if (
    (speechSpeed >= 90 && speechSpeed < 110) ||
    (speechSpeed > 170 && speechSpeed <= 200)
  ) {
    score += 2;              // Slightly off
  } else if (speechSpeed > 0) {
    score += 1;              // Too fast or too slow
  }

  // ── Answer length (2 pts) ────────────────────────────
  if (wordCount >= 60 && wordCount <= 200) {
    score += 2;              // Well-developed answer
  } else if (wordCount >= 30 && wordCount < 60) {
    score += 1;              // A bit short but okay
  }
  // < 30 words or > 200 words → 0 pts

  // ── Structured / STAR format (2 pts) ─────────────────
  if (hasStructuredAnswer(answerText)) {
    score += 2;
  }

  return Math.min(score, 10);
};

module.exports = {
  countWords,
  countFillerWords,
  calculateSpeechSpeed,
  calculateConfidenceScore,
  hasStructuredAnswer,
  FILLER_WORDS,
  STRUCTURE_KEYWORDS,
};
