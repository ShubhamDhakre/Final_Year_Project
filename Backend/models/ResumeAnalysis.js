const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resume_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: false,
    },
    role: {
      type: String,
      required: true,
    },
    role_level: {
      type: String,
      default: 'Junior / Entry-Level Ready',
    },
    // Overall & Multi-Dimensional Scores
    overall_score: {
      type: Number,
      default: 72,
      min: 0,
      max: 100,
    },
    role_match_score: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    ats_score: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    multi_scores: {
      role_relevance: { type: Number, default: 70 },
      ats_formatting: { type: Number, default: 75 },
      impact_quantification: { type: Number, default: 60 },
      power_language: { type: Number, default: 68 },
      brevity_structure: { type: Number, default: 80 },
    },
    first_impression: {
      verdict: { type: String, default: '' },
      sentiment_badge: { type: String, default: 'Interview Contender' },
      takeaways: { type: [String], default: [] },
      estimated_reading_time: { type: String, default: '45 seconds' },
      word_count: { type: Number, default: 0 },
    },
    summary: {
      type: String,
      default: '',
    },
    // Deep Skills Analysis
    skills_analysis: {
      matched_skills: { type: [String], default: [] },
      missing_critical_skills: { type: [String], default: [] },
      bonus_skills: { type: [String], default: [] },
      all_detected_skills: { type: [String], default: [] },
    },
    // Section-by-Section Forensic Audit
    sections_audit: {
      header: {
        status: { type: String, default: 'Good' },
        detected: { type: [String], default: [] },
        missing: { type: [String], default: [] },
        advice: { type: String, default: '' },
      },
      summary_objective: {
        status: { type: String, default: 'Needs Improvement' },
        critique: { type: String, default: '' },
        recommended_rewrite: { type: String, default: '' },
      },
      experience: {
        status: { type: String, default: 'Good' },
        findings: { type: [String], default: [] },
        metric_bullets_percent: { type: Number, default: 35 },
      },
      projects: {
        status: { type: String, default: 'Good' },
        findings: { type: [String], default: [] },
        role_relevance_rating: { type: String, default: 'Moderate' },
      },
      skills: {
        status: { type: String, default: 'Good' },
        findings: { type: [String], default: [] },
        suggested_categorization: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
      education: {
        status: { type: String, default: 'Good' },
        findings: { type: [String], default: [] },
      },
    },
    // ATS Keyword Heatmap & Gap Analysis
    keyword_gap_analysis: [
      {
        keyword: String,
        status: String, // 'Found' | 'Missing'
        frequency: Number,
        importance: String, // 'Critical' | 'High' | 'Value-Add'
        context_advice: String,
      },
    ],
    // Language & Verbs Deep Analysis
    action_verbs_analysis: {
      strong_verbs: { type: [String], default: [] },
      weak_verbs_found: [
        {
          weak: String,
          replacement: String,
          example: String,
        },
      ],
      buzzwords_detected: { type: [String], default: [] },
      quantification_percentage: { type: Number, default: 30 },
    },
    // ATS Compatibility
    ats_compatibility: {
      score: { type: Number, default: 75 },
      status: { type: String, default: 'Moderate' },
      findings: { type: [String], default: [] },
    },
    // Readiness & Critique
    role_readiness: {
      level: { type: String, default: 'Junior / Entry-Level Ready' },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
    },
    suggestions: { type: [String], default: [] },
    bullet_improvements: [
      {
        original_or_issue: String,
        improved_version: String,
        reason: String,
      },
    ],
    suggested_projects: [
      {
        title: String,
        description: String,
        difficulty: { type: String, default: 'Intermediate' },
        tech_stack: [String],
        key_features: [String],
        skills_bridged: [String],
      },
    ],
    // 30-60-90 Day Role Learning Roadmap
    learning_roadmap: [
      {
        phase: String,
        title: String,
        time_frame: String,
        milestones: [String],
        recommended_tools: [String],
      },
    ],
    // Recruiter Outreach Kit
    recruiter_outreach: {
      elevator_pitch: { type: String, default: '' },
      cold_email_linkedin_message: { type: String, default: '' },
      tailored_cover_letter_hook: { type: String, default: '' },
    },
    interview_questions: [
      {
        question: String,
        category: String,
        answer_strategy: String,
      },
    ],
    raw_resume_text_preview: {
      type: String,
      default: '',
    },
    file_name: {
      type: String,
      default: 'Resume.pdf',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
