const multer = require('multer');
const pdfParse = require('pdf-parse');
const technicalQuestions = require('../config/technicalQuestions.json');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const Resume = require('../models/Resume');
const {
  countWords,
  countFillerWords,
  calculateSpeechSpeed,
  calculateConfidenceScore,
} = require('../utils/analysisUtils');
const {
  getTechnicalFeedback,
  generateDynamicTechnicalQuestion,
} = require('../utils/geminiUtils');
const InterviewAttempt = require('../models/InterviewAttempt');

// ─── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new ApiError(400, 'Only PDF files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ─── Skill Extraction ──────────────────────────────────────────────────────────
// Expanded from 12 → 40+ skill keywords with aliases
const SKILL_KEYWORDS = [
  // Web Frontend
  'javascript', 'typescript', 'react', 'reactjs', 'react.js',
  'angular', 'vue', 'vuejs', 'html', 'css', 'sass', 'bootstrap', 'tailwind',
  'nextjs', 'next.js', 'redux',
  // Backend
  'node', 'nodejs', 'node.js', 'express', 'expressjs',
  'python', 'django', 'flask', 'fastapi',
  'java', 'spring', 'springboot',
  'c++', 'c#', 'dotnet', '.net', 'golang', 'go',
  // Databases
  'mongodb', 'mysql', 'postgresql', 'sqlite', 'redis',
  'firebase', 'supabase', 'sql',
  // DevOps / Cloud
  'docker', 'kubernetes', 'aws', 'azure', 'gcp',
  'linux', 'bash', 'git', 'github', 'ci/cd',
  // CS Fundamentals
  'data structures', 'algorithms', 'dsa', 'oops',
  'system design', 'rest api', 'graphql',
  // General
  'general',
];

const extractSkillsFromText = (text) => {
  const lowerText = text.toLowerCase();
  const found = SKILL_KEYWORDS.filter((skill) => lowerText.includes(skill));

  // Deduplicate aliases → canonical names
  const aliasMap = {
    'reactjs': 'react', 'react.js': 'react',
    'nodejs': 'node', 'node.js': 'node',
    'expressjs': 'express',
    'vuejs': 'vue',
    'next.js': 'nextjs',
  };

  const canonical = found.map((s) => aliasMap[s] || s);
  return Array.from(new Set(canonical));
};

// @route   POST /api/technical/upload
// @access  Private
const uploadResume = [
  upload.single('resume'),
  asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id;

    if (!req.file) {
      throw new ApiError(400, 'Resume file is required');
    }

    const data = await pdfParse(req.file.buffer);
    const resumeText = data.text || '';

    if (!resumeText.trim()) {
      throw new ApiError(400, 'Could not extract text from PDF');
    }

    const skills = extractSkillsFromText(resumeText);

    const resume = await Resume.create({
      user_id: userId,
      resume_text: resumeText,
      extracted_skills: skills,
      upload_date: new Date(),
    });

    res.status(201).json({
      status: 'success',
      data: {
        resume_id: resume._id,
        extracted_skills: skills,
      },
    });
  }),
];

// @route   GET /api/technical/question?difficulty=easy|hard
// @access  Private
const getTechnicalQuestion = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const difficulty = (req.query.difficulty || 'easy').toLowerCase();

  if (!['easy', 'hard'].includes(difficulty)) {
    throw new ApiError(400, 'Invalid difficulty');
  }

  const latestResume = await Resume.findOne({ user_id: userId })
    .sort({ upload_date: -1 })
    .lean();

  const userSkills = latestResume?.extracted_skills || [];

  // Filter by difficulty first
  let candidates = technicalQuestions.filter((q) => q.difficulty === difficulty);

  // Then narrow by user's skills if available
  if (userSkills.length) {
    const skillSet = new Set(userSkills.map((s) => s.toLowerCase()));
    const skillMatched = candidates.filter((q) =>
      skillSet.has(q.skill.toLowerCase())
    );
    if (skillMatched.length) {
      candidates = skillMatched;
    }
  }

  let question;

  if (candidates.length) {
    // Pick random from static bank
    question = {
      ...candidates[Math.floor(Math.random() * candidates.length)],
      source: 'static',
    };
  } else {
    // Fallback: use Gemini to dynamically generate a question
    const dynamicText = await generateDynamicTechnicalQuestion(
      userSkills.length ? userSkills : ['general programming'],
      difficulty
    );

    if (dynamicText) {
      question = {
        id: `dynamic-${Date.now()}`,
        skill: userSkills[0] || 'general',
        difficulty,
        question: dynamicText,
        source: 'ai',
      };
    } else {
      throw new ApiError(404, 'No technical questions available');
    }
  }

  res.json({
    status: 'success',
    data: { question, skills: userSkills },
  });
});

// @route   POST /api/technical/submit
// @access  Private
// Expected body: { question_id, question_text, skill, transcript, duration_sec? }
const submitTechnicalAnswer = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const { question_id, question_text, skill, transcript, duration_sec } = req.body;

  if (!transcript || !transcript.trim()) {
    throw new ApiError(400, 'transcript is required');
  }

  // ── Metrics ───────────────────────────────────────────────────────
  const wordCount       = countWords(transcript);
  const fillerWordCount = countFillerWords(transcript);
  const speechSpeed     = calculateSpeechSpeed(wordCount, duration_sec || null);
  const confidenceScore = calculateConfidenceScore({
    fillerWordCount,
    speechSpeed,
    wordCount,
    answerText: transcript,
  });

  // ── AI Feedback ───────────────────────────────────────────────────
  const aiResult = await getTechnicalFeedback(
    transcript,
    question_text || null,
    skill || '',
    { fillerWordCount, speechSpeed, wordCount }
  );

  // ── Persist attempt ───────────────────────────────────────────────
  if (userId && question_id) {
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
      feedback_text:      aiResult.feedback_text,
      improved_answer:    aiResult.improved_answer,
      ai_score:           aiResult.ai_score,
      missing_elements:   aiResult.missing_elements,
      technical_accuracy: aiResult.technical_accuracy,
      confidence_score:   confidenceScore,
      filler_word_count:  fillerWordCount,
      speech_speed:       speechSpeed,
      word_count:         wordCount,
    },
  });
});

module.exports = {
  uploadResume,
  getTechnicalQuestion,
  submitTechnicalAnswer,
};
