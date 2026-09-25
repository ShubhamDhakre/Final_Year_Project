# AI Interview Coach — Project Module Breakdown
### Prepared for Seminar Presentation

> **Project:** AI Interview Coach (Final Year Project)
> **Stack:** React + Node.js + Express + MongoDB + Google Gemini AI
> **Status:** Major Frontend Part & Database Design Completed (5/10 Milestones ✅). Stepping forward to full Gemini AI backend integration.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │  Module 1  │ │  Module 2  │ │  Module 3  │ │ Module 4 │ │
│  │  Auth &    │ │    HR      │ │ Technical  │ │Dashboard │ │
│  │ Navigation │ │ Interview  │ │ Interview  │ │& Chatbot │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │  REST API  (Axios + JWT Bearer Token)
┌─────────────────────────▼───────────────────────────────────┐
│                        BACKEND                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │  Module 1  │ │  Module 2  │ │  Module 3  │ │ Module 4 │ │
│  │  Auth &    │ │ Interview  │ │    AI      │ │Analytics │ │
│  │ Security   │ │  Engine    │ │Intelligence│ │& Storage │ │
│  └────────────┘ └────────────┘ └─────┬──────┘ └──────────┘ │
└───────────────────────────────────┬──┼─────────────────────┘
                                    │  │
                        ┌───────────┘  └──────────────┐
                   Google Gemini AI              MongoDB Atlas
                   (gemini-2.5-flash)           (Cloud Database)
```

---

# 🖥️ FRONTEND — 4 Modules

---

## Frontend Module 1 — Authentication & Navigation

> **Core Idea:** How users securely enter and move through the application.

### Files Involved
| File | Purpose |
|---|---|
| `src/pages/LoginPage.jsx` | Email + password login form |
| `src/pages/RegisterPage.jsx` | New user registration form |
| `src/context/AuthContext.jsx` | Global auth state management |
| `src/App.jsx` | Route definitions + PrivateRoute guard |
| `src/layout/DashboardLayout.jsx` | Sidebar + header navigation shell |
| `src/services/api.js` | Axios instance with JWT auto-interceptor |

### Key Features
- **JWT Authentication** — Token stored in `localStorage`, sent as `Authorization: Bearer` header on every request
- **PrivateRoute Guard** — Unauthenticated users redirected to `/login` automatically
- **AuthContext** — On app load, validates token via `GET /api/auth/me` to restore session
- **Persistent Sessions** — User stays logged in across browser refreshes (7-day token expiry)
- **Sidebar Navigation** — Dashboard, HR Interview, Technical Interview links with active state highlighting
- **Responsive Layout** — Sidebar hidden on mobile, top header on all screen sizes

### User Flow
```
User visits app
  → AuthContext checks localStorage for token
  → If token exists → GET /api/auth/me → set user state
  → If no token → redirect to /login
  → Login/Register → receive JWT → store in localStorage → navigate to /
```

---

## Frontend Module 2 — HR Interview Practice

> **Core Idea:** Voice-based behavioral question practice with AI-powered feedback.

### Files Involved
| File | Purpose |
|---|---|
| `src/pages/HrInterviewPage.jsx` | Main HR interview UI (~430 lines) |
| `src/components/GlassCard.jsx` | Glassmorphism card container |
| `src/components/PrimaryButton.jsx` | Styled action button |
| `src/components/ProgressBar.jsx` | Confidence score visualization |
| `src/components/Skeleton.jsx` | Loading placeholder UI |

### Key Features
- **Difficulty Selector** — Easy / Medium / Hard (12 questions per level, 36 total)
- **Voice Recording** — Web `SpeechRecognition` API (Chrome) → live transcript in textarea
- **Real-time Duration Tracking** — `startTimeRef` records mic start time for accurate WPM calculation
- **Attempt Counter** — Tracks how many times the same question was attempted
- **Session Management** — Multiple questions per session, "End Interview & Save Summary" button
- **Result Panel** shows:
  - Confidence Score (0–10, rule-based: filler words + WPM + word count + structure)
  - AI Score (1–10, from Gemini)
  - Tone Assessment (confident / hesitant / vague / assertive)
  - Missing Elements (pill chips — e.g. "specific example", "quantifiable result")
  - AI Feedback (3–4 specific points)
  - Improved Sample Answer (STAR-structured, emerald panel)

### User Flow
```
Select difficulty → Click "Start Interview"
  → GET /api/hr/question?difficulty=easy
  → Question appears
  → Click "Start Speaking" → SpeechRecognition starts
  → Speak answer → transcript auto-fills
  → Click "Submit"
  → POST /api/hr/submit { question_id, transcript, duration_sec }
  → Result panel appears with all 7 feedback fields
  → "Next Question" OR "End Interview & Save Summary"
  → POST /api/dashboard/summary → saved to dashboard
```

---

## Frontend Module 3 — Technical Interview Practice

> **Core Idea:** Resume-based skill detection + personalized technical interview with AI evaluation.

### Files Involved
| File | Purpose |
|---|---|
| `src/pages/TechnicalInterviewPage.jsx` | Main technical interview UI (~530 lines) |
| `src/components/GlassCard.jsx` | Card containers |
| `src/components/ProgressBar.jsx` | Score visualization |

### Key Features
- **PDF Resume Upload** — Drag & drop or browse, PDF only, max 5MB
- **Skill Extraction** — Backend scans for 40+ tech keywords (JavaScript, React, Node.js, Python, MongoDB, SQL, DSA, etc.)
- **Skill Tags Display** — Extracted skills shown as pill badges
- **Skill-Matched Questions** — Questions filtered to match user's detected skills
- **Difficulty Selector** — Easy / Hard
- **Voice Recording** — Same `SpeechRecognition` flow as HR module
- **Technical Result Panel** shows:
  - Confidence Score (0–10)
  - AI Score (1–10, from Gemini)
  - **Technical Accuracy Badge** — color-coded:
    - 🟢 Accurate (emerald)
    - 🟡 Partially Accurate (yellow)
    - 🔴 Inaccurate (rose)
  - Missing Concepts (e.g. "event loop", "closures")
  - Technical Feedback (3–4 specific points, flags factual errors)
  - Improved Model Answer (with code examples)

### User Flow
```
Upload PDF resume
  → POST /api/technical/upload (multipart/form-data)
  → Extracted skills shown as tags (e.g. javascript, react, node)
  → Select difficulty → "Start Interview"
  → GET /api/technical/question?difficulty=easy
  → Backend matches question to user's skills
  → Speak answer
  → POST /api/technical/submit { question_id, question_text, skill, transcript, duration_sec }
  → Technical result panel with accuracy badge
  → "End Interview & Save Summary"
```

---

## Frontend Module 4 — Dashboard & Analytics

> **Core Idea:** Visualize progress over time + AI-powered interview coaching assistant.

### Files Involved
| File | Purpose |
|---|---|
| `src/pages/DashboardPage.jsx` | Main stats and chart page |
| `src/components/Chatbot.jsx` | Floating AI chat widget |
| `src/components/StatCard.jsx` | Individual metric display cards |
| `src/context/ToastContext.jsx` | Global toast notification system |

### Key Features

#### Dashboard
- **4 Stat Cards:**
  1. Total Interviews (completed sessions)
  2. Average Confidence Score (x.x / 10)
  3. Total Filler Words (across all sessions)
  4. Improvement % (first session → latest session)
- **Confidence Line Chart** (Chart.js) — score over time, y-axis 0–10, date labels
- **Recent Sessions Panel** — last 5 interviews with mode, difficulty, score, filler count
- **Memoized Computation** — `sessionHistory`, `improvementPercent`, `chartData` all wrapped in `React.useMemo`

#### AI Chatbot
- Floating button (bottom-right corner, always visible)
- 7 predefined quick-reply chips (e.g. "Roadmap for SDE", "How does HR mode work?")
- 3-tier matching: Exact → Fuzzy → Gemini AI fallback
- Animated panel with "AI is typing..." indicator
- Context: career coaching, placement prep, platform usage tips

---

---

# ⚙️ BACKEND — 4 Modules

---

## Backend Module 1 — Authentication & Security

> **Core Idea:** Secure user identity management using industry-standard JWT + bcrypt.

### Files Involved
| File | Purpose |
|---|---|
| `controllers/authController.js` | register, login, getMe handlers |
| `models/User.js` | User schema with password hashing |
| `middleware/authMiddleware.js` | JWT protect() middleware |
| `middleware/errorMiddleware.js` | Global error handler |
| `utils/generateToken.js` | JWT creation |
| `utils/ApiError.js` | Custom error class |
| `utils/asyncHandler.js` | Async error wrapper |

### API Endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create new account |
| POST | `/api/auth/login` | Public | Login and get JWT |
| GET | `/api/auth/me` | Private | Get current user info |

### Key Features
- **bcrypt Password Hashing** — salt rounds: 10, applied via Mongoose pre-save hook
- **JWT Token** — 7-day expiry, signed with `JWT_SECRET`
- **protect() Middleware** — validates Bearer token on all private routes, sets `req.user`
- **Password Never Returned** — `select: false` on User.password field
- **Error Handling** — TokenExpiredError, JsonWebTokenError caught and formatted cleanly
- **Global Error Format** — `{ status, statusCode, message }` — stack hidden in production

### Security Flow
```
Client sends: Authorization: Bearer <token>
  → protect() extracts token from header
  → jwt.verify(token, JWT_SECRET) → decoded payload
  → User.findById(decoded.id).select('_id name email')
  → req.user = user document
  → next() → controller runs
```

---

## Backend Module 2 — Interview Engine

> **Core Idea:** Delivers questions, processes voice transcripts, and calculates speech metrics.

### Files Involved
| File | Purpose |
|---|---|
| `controllers/hrController.js` | HR question + answer processing |
| `controllers/technicalController.js` | Resume upload + technical Q&A |
| `utils/analysisUtils.js` | All speech metric calculations |
| `config/hrQuestions.json` | 36 HR questions (easy/medium/hard) |
| `config/technicalQuestions.json` | 60+ technical questions (10 skills) |
| `models/InterviewAttempt.js` | Per-question attempt storage |
| `models/Resume.js` | Resume text + extracted skills |

### API Endpoints
| Method | Route | Description |
|---|---|---|
| GET | `/api/hr/question` | Get random HR question by difficulty |
| POST | `/api/hr/submit` | Submit HR answer, get full feedback |
| POST | `/api/technical/upload` | Upload PDF, extract skills |
| GET | `/api/technical/question` | Get skill-matched technical question |
| POST | `/api/technical/submit` | Submit technical answer, get full feedback |

### Speech Metrics Engine (`analysisUtils.js`)
```
Input: transcript text + duration_sec

countWords(text)
  → Split on whitespace → count tokens

countFillerWords(text)
  → 20 filler patterns: um, uh, like, basically, actually,
    you know, sort of, kind of, right, okay, literally,
    honestly, clearly, i mean, just, very, really, stuff,
    things, whatever
  → Word-boundary regex for single words
  → indexOf loop for multi-word fillers

calculateSpeechSpeed(wordCount, durationSec)
  → (wordCount / seconds) × 60 = WPM
  → Default: 30 sec if duration not provided

calculateConfidenceScore({ fillerWordCount, speechSpeed, wordCount, answerText })
  → Filler words (max 3pts): 0=3, 1-2=2, 3-4=1, 5+=0
  → Speech speed (max 3pts): 110-170 WPM=3, else scaled
  → Word count  (max 2pts): 60-200=2, 30-59=1, else=0
  → STAR structure (max 2pts): keyword detection=2, else=0
  → Total: 0–10
```

### Skill Extraction (40+ Keywords)
```
javascript, typescript, react, reactjs→react, angular, vue,
node, nodejs→node, express, python, django, flask, java,
spring, mongodb, mysql, postgresql, redis, firebase, sql,
docker, kubernetes, aws, azure, git, dsa, data structures,
algorithms, machine learning, deep learning, c++, c, php,
swift, kotlin, flutter, android, ios, css, html, tailwind
```

---

## Backend Module 3 — AI Intelligence Layer

> **Core Idea:** All Google Gemini AI integrations — feedback, question generation, chatbot.

### Files Involved
| File | Purpose |
|---|---|
| `utils/geminiUtils.js` | All 5 Gemini AI functions |
| `controllers/chatbotController.js` | 3-tier message matching |
| `controllers/aiFeedbackController.js` | Standalone feedback endpoint |
| `config/chatbotData.json` | 7 predefined Q&A pairs |

### API Endpoints
| Method | Route | Description |
|---|---|---|
| POST | `/api/chatbot` | AI chat with 3-tier matching |
| POST | `/api/ai-feedback` | Standalone answer feedback |

### 5 Gemini Functions

#### 1. `callGeminiAPI(prompt, systemInstruction)`
```
Model: gemini-2.5-flash
Temperature: 0.4 (deterministic, factual)
topP: 0.85
maxOutputTokens: 1024
Error handling: 429→quota, 401/403→key error, network→retry
```

#### 2. `getHrFeedback(userAnswer, question, metrics)`
```
Evaluates on 5 dimensions:
  1. Relevance      — does answer address the question?
  2. STAR Method    — Situation/Task/Action/Result structure?
  3. Clarity        — logical and organized?
  4. Confidence     — avoids vague/filler language?
  5. Conciseness    — 60–180 words ideal

Returns JSON: {
  feedback_text,      // 3-4 specific points
  improved_answer,    // model STAR answer, 100-150 words
  ai_score,           // integer 1-10
  missing_elements,   // array of missing items
  tone_assessment     // one sentence
}
```

#### 3. `getTechnicalFeedback(userAnswer, question, skill, metrics)`
```
Evaluates on 5 dimensions:
  1. Technical Accuracy  — factually correct?
  2. Conceptual Depth    — understands the "why"?
  3. Real-world Usage    — practical examples?
  4. Communication       — clear to non-expert?
  5. Completeness        — key concepts covered?

Returns JSON: {
  feedback_text,
  improved_answer,    // with code example
  ai_score,
  missing_elements,
  technical_accuracy  // 'accurate'|'partially accurate'|'inaccurate'
}
```

#### 4. `generateDynamicTechnicalQuestion(skills, difficulty)`
```
Triggered only when static question bank has no skill match
Input: user's extracted skill array + difficulty
Returns: one generated question string or null
```

#### 5. `getChatbotResponse(message)`
```
System role: Career coach for campus placements
Rules: under 220 words, direct, bullet points
Specialties: resume, HR prep, technical strategy, roadmaps
```

### Chatbot 3-Tier Matching
```
normalize(text) = lowercase + strip punctuation

Tier 1 — Exact:      normalize(q) === normalize(msg)
Tier 2 — Substring:  one string contains the other
Tier 3 — Fuzzy:      ≥50% of words overlap between strings
Tier 4 — AI:         getChatbotResponse(message) via Gemini

Returns: { source: 'fixed'|'ai', response }
```

---

## Backend Module 4 — Analytics & Data Storage

> **Core Idea:** Persisting interview data and serving aggregated progress insights.

### Files Involved
| File | Purpose |
|---|---|
| `controllers/dashboardController.js` | Summary creation + stats aggregation |
| `models/Interview.js` | Session-level interview summary schema |
| `models/InterviewAttempt.js` | Per-question attempt schema |
| `config/db.js` | MongoDB Atlas connection |

### API Endpoints
| Method | Route | Description |
|---|---|---|
| POST | `/api/dashboard/summary` | Save completed session summary |
| GET | `/api/dashboard/stats` | Aggregated stats + history for chart |
| GET | `/api/dashboard/history` | Last 20 interview sessions |

### Database Schemas

#### Interview (Session Summary)
```
Collection: interviews
Fields:
  user_id                  ObjectId → users
  mode                     'HR' | 'Technical'
  difficulty               String
  average_confidence_score Number (0–10)
  total_filler_words       Number
  date                     Date
```

#### InterviewAttempt (Per-Question)
```
Collection: interviewattempts
Fields:
  user_id          ObjectId → users
  question_id      String   (e.g. "hr-easy-1")
  attempt_number   Number   (auto-incremented per user per question)
  confidence_score Number
  filler_word_count Number
  speech_speed     Number   (WPM)
  date             Date
```

### Stats Aggregation Logic
```javascript
// Fetch all sessions for user, sorted by date ASC
const interviews = await Interview.find({ user_id }).sort({ date: 1 });

total_interviews        = interviews.length
average_confidence_score = sum(scores) / total_interviews
total_filler_words      = sum(filler_counts)
history                 = interviews mapped to chart-friendly format

// Improvement % (computed on frontend)
= ((lastScore - firstScore) / firstScore) × 100
  capped at ±100%
```

### Data Flow — Full Session
```
User completes interview session
  → Frontend collects: mode, difficulty, avg_confidence, total_filler_words
  → POST /api/dashboard/summary
  → Interview.create() in MongoDB Atlas
  → On Dashboard load: GET /api/dashboard/stats
  → Aggregated stats returned
  → Line chart rendered with sessionHistory
  → Recent sessions panel updated
```

---

## 📊 Module Comparison Table

| # | Frontend Module | Backend Module | Technology |
|---|---|---|---|
| 1 | Auth & Navigation | Auth & Security | JWT, bcrypt, React Context |
| 2 | HR Interview Practice | Interview Engine | SpeechRecognition, analysisUtils, Gemini HR |
| 3 | Technical Interview Practice | AI Intelligence Layer | PDF parse, skill match, Gemini Technical |
| 4 | Dashboard & Analytics | Analytics & Storage | Chart.js, useMemo, MongoDB aggregation |

---

## 🔗 Module Dependency Map

```
Frontend M1 (Auth)
  └──► All other frontend modules (protected routes)

Frontend M2 (HR)
  └──► Backend M2 (Interview Engine) → Backend M3 (AI Layer) → Backend M4 (Storage)

Frontend M3 (Technical)
  └──► Backend M2 (Interview Engine) → Backend M3 (AI Layer) → Backend M4 (Storage)

Frontend M4 (Dashboard)
  └──► Backend M4 (Storage) — reads aggregated data
  └──► Backend M3 (AI Layer) — chatbot

Backend M1 (Auth)
  └──► Protects all Backend M2, M3, M4 endpoints via protect() middleware
```

---

*Use this document for seminar slides, viva preparation, and project reports.*
*For function-level details of every file, refer to PROJECT_BLUEPRINT.md*
