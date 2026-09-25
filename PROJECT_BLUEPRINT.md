# AI Interview Coach — Complete Project Blueprint

> **Purpose:** Single source of truth for the entire project. Written to give any AI model 100% context at function level — architecture, data models, every API endpoint, every function signature, business logic, data flow, and frontend component structure.
> **Last Updated:** September 2026

---

## 1. Project Overview

| Field | Value |
|---|---|
| **Project Name** | AI Interview Coach |
| **Type** | Full-Stack Web Application (Final Year Project) |
| **Purpose** | Help college students prepare for campus placement interviews using AI-powered feedback, speech analysis, and personalized question generation |
| **Target Users** | Engineering students preparing for campus placements |
| **AI Provider** | Google Gemini (gemini-2.5-flash) via REST API |
| **Backend** | Node.js + Express.js (REST API, MVC pattern) |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Database** | MongoDB Atlas (via Mongoose ODM) |
| **Auth** | JWT (Bearer token, stored in localStorage) |

---

## 2. Directory Structure

```
Final_Year_Project/
├── PROJECT_BLUEPRINT.md              ← You are here
├── Backend/                          ← Node.js + Express REST API
│   ├── server.js                     ← Entry point
│   ├── .env                          ← Environment variables
│   ├── package.json
│   ├── config/
│   │   ├── db.js                     ← MongoDB connection
│   │   ├── hrQuestions.json          ← 36 HR questions (easy/medium/hard)
│   │   ├── technicalQuestions.json   ← 60+ technical questions (10 skills)
│   │   └── chatbotData.json          ← 7 predefined chatbot Q&A pairs
│   ├── models/
│   │   ├── User.js                   ← User schema
│   │   ├── Interview.js              ← Interview session summary schema
│   │   ├── InterviewAttempt.js       ← Per-question attempt schema
│   │   └── Resume.js                 ← Uploaded resume schema
│   ├── controllers/
│   │   ├── authController.js         ← register, login, getMe
│   │   ├── hrController.js           ← getHrQuestion, submitHrAnswer
│   │   ├── technicalController.js    ← uploadResume, getTechnicalQuestion, submitTechnicalAnswer
│   │   ├── dashboardController.js    ← createInterviewSummary, getDashboardStats, getDashboardHistory
│   │   ├── chatbotController.js      ← handleChatbotMessage (3-tier matching)
│   │   └── aiFeedbackController.js   ← getAiFeedback (standalone endpoint)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── hrRoutes.js
│   │   ├── technicalRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── chatbotRoutes.js
│   │   └── aiFeedbackRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js         ← JWT protect() middleware
│   │   └── errorMiddleware.js        ← notFound, errorHandler
│   └── utils/
│       ├── geminiUtils.js            ← All Gemini AI functions
│       ├── analysisUtils.js          ← Speech metrics calculations
│       ├── generateToken.js          ← JWT generation
│       ├── ApiError.js               ← Custom error class
│       └── asyncHandler.js           ← Async Express wrapper
└── frontend/                         ← React + Vite SPA
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx                  ← App entry point, provider tree
        ├── App.jsx                   ← Route definitions, PrivateRoute
        ├── index.css                 ← Global Tailwind styles
        ├── context/
        │   ├── AuthContext.jsx       ← Global auth state
        │   └── ToastContext.jsx      ← Global toast notifications
        ├── services/
        │   └── api.js                ← Axios instance with JWT interceptor
        ├── layout/
        │   └── DashboardLayout.jsx   ← Sidebar + header shell
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── HrInterviewPage.jsx
        │   └── TechnicalInterviewPage.jsx
        └── components/
            ├── Chatbot.jsx           ← Floating AI chat widget
            ├── GlassCard.jsx         ← Reusable glassmorphism card
            ├── StatCard.jsx          ← Metric display card
            ├── ProgressBar.jsx       ← Animated progress bar
            ├── LoadingScreen.jsx     ← Full-screen loader
            ├── Skeleton.jsx          ← Loading skeleton placeholder
            └── PrimaryButton.jsx     ← Styled button component
```

---

## 3. Environment Variables (Backend/.env)

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.ah0ef6s.mongodb.net/ai-interview-coach
JWT_SECRET=<secret_key>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=<your_key>
GEMINI_MODEL=gemini-2.5-flash
```

---

## 4. Backend — Entry Point (server.js)

- Loads dotenv, connects MongoDB via connectDB()
- Registers CORS middleware (origin from FRONTEND_URL env, fallback `*`)
- Sets JSON body limit: 1mb
- Mounts all route prefixes:
  - GET /api/health → inline health check { status: 'ok' }
  - /api/auth → authRoutes
  - /api/hr → hrRoutes
  - /api/technical → technicalRoutes
  - /api/chatbot → chatbotRoutes
  - /api/dashboard → dashboardRoutes
  - /api/ai-feedback → aiFeedbackRoutes
- Registers `notFound` and `errorHandler` middleware at the end
- Listens on PORT (default 5000)

---

## 5. Database Models

### User.js
```
Collection: users
Fields:
  name          String, required, maxlength 50, trim
  email         String, required, unique, lowercase, trim
  password      String, required, minlength 8, select:false (never returned by default)
  createdAt     Date (auto, timestamps)
  updatedAt     Date (auto, timestamps)

Pre-save hook:
  Hashes password with bcrypt (salt rounds: 10) only if password field is modified

Instance method:
  matchPassword(enteredPassword) → bcrypt.compare() → returns Boolean Promise
```

### Interview.js
```
Collection: interviews
Purpose: Stores one SESSION summary per completed interview
Fields:
  user_id                   ObjectId, ref:'User', required
  mode                      String, enum:['HR','Technical'], required
  difficulty                String, trim
  average_confidence_score  Number, default:0
  total_filler_words        Number, default:0
  date                      Date, default:Date.now
  createdAt, updatedAt      (timestamps)
```

### InterviewAttempt.js
```
Collection: interviewattempts
Purpose: Stores per-question attempt data (multiple attempts per question tracked)
Fields:
  user_id          ObjectId, ref:'User', required
  question_id      String, required, trim (e.g. "hr-easy-1", "tech-js-hard-1")
  attempt_number   Number, required, min:1 (auto-incremented per question per user)
  confidence_score Number, default:0
  filler_word_count Number, default:0
  speech_speed     Number, default:0 (WPM)
  date             Date, default:Date.now
  createdAt, updatedAt (timestamps)
```

### Resume.js
```
Collection: resumes
Purpose: Stores uploaded PDF resume text and extracted skills per user
Fields:
  user_id          ObjectId, ref:'User', required
  resume_text      String, required (full extracted text from PDF)
  extracted_skills [String], default:[]
  upload_date      Date, default:Date.now
  createdAt, updatedAt (timestamps)
```

---

## 6. Backend Utilities

### utils/ApiError.js
```js
class ApiError extends Error {
  constructor(statusCode, message)
  // Properties: statusCode, isOperational=true
}
// Usage: throw new ApiError(400, 'Bad request')
```

### utils/asyncHandler.js
```js
asyncHandler(fn) → (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next)
// Wraps all async controller functions to auto-forward errors to errorHandler
```

### utils/generateToken.js
```js
generateToken(payload, options={})
// Signs JWT with process.env.JWT_SECRET
// Default expiry: process.env.JWT_EXPIRES_IN (7d)
// payload example: { id: user._id }
// Returns: signed JWT string
```

### utils/analysisUtils.js — Speech Metrics

```js
FILLER_WORDS = [
  'um','uh','like','basically','actually',
  'you know','sort of','kind of','right','okay',
  'literally','honestly','clearly','i mean','just',
  'very','really','stuff','things','whatever'
]
// 20 items — single-word and multi-word both supported

STRUCTURE_KEYWORDS = [
  'first','firstly','second','then','finally','lastly',
  'because','result','therefore','however','for example',
  'situation','task','action','star',
  'in my experience','i learned','the outcome'
]
// Detects STAR-format structured answers

countWords(text) → Number
// Splits text on whitespace, filters empty tokens, returns count

countFillerWords(text) → Number
// Lowercases + strips punctuation
// Single-word fillers: word-boundary regex \bword\b
// Multi-word fillers: substring indexOf loop
// Returns total count of all filler occurrences

calculateSpeechSpeed(wordCount, durationSec=null) → Number (WPM)
// Formula: Math.round((wordCount / seconds) * 60)
// If durationSec not provided → defaults to 30 seconds estimate
// Returns words-per-minute

hasStructuredAnswer(text) → Boolean
// Returns true if any STRUCTURE_KEYWORD found in text

calculateConfidenceScore({ fillerWordCount, speechSpeed, wordCount, answerText='' }) → Number (0-10)
// Scoring breakdown:
//   Filler words (max 3pts):  0=3pts, 1-2=2pts, 3-4=1pt, 5+=0pts
//   Speech speed (max 3pts):  110-170 WPM=3pts, 90-110 or 170-200=2pts, else=1pt
//   Word count   (max 2pts):  60-200 words=2pts, 30-59=1pt, else=0pts
//   Structure    (max 2pts):  hasStructuredAnswer()=2pts, else=0pts
// Returns capped at 10
```

### utils/geminiUtils.js — All AI Functions

#### callGeminiAPI(prompt, systemInstruction=null) → Promise<string>
```
Calls Google Gemini REST API
Endpoint: https://generativelanguage.googleapis.com/v1/models/{GEMINI_MODEL}:generateContent
Config: temperature=0.4, topP=0.85, maxOutputTokens=1024
Strategy: Prepends systemInstruction to prompt as single text block
Error handling:
  429 → ApiError(503, 'AI quota exceeded')
  401/403 → ApiError(500, 'Invalid API key')
  other → ApiError(502, 'AI service error')
  network → ApiError(502, 'AI service error')
Returns: Raw text from candidates[0].content.parts[0].text
```

#### safeParseJSON(content) → Object | null  [internal helper]
```
Strips markdown code fences from content
Tries JSON.parse() on cleaned string
If fails: uses regex /\{[\s\S]*\}/ to extract JSON block, tries again
Returns parsed object or null on complete failure
```

#### getHrFeedback(userAnswer, question=null, metrics={}) → Promise<Object>
```
Purpose: Evaluates HR/behavioural interview answer
Parameters:
  userAnswer  - The spoken transcript
  question    - Interview question text (for context)
  metrics     - { fillerWordCount, speechSpeed, wordCount }

System instruction includes:
  - Role: strict but supportive campus placement interview coach
  - 5 evaluation dimensions:
      1. RELEVANCE — does answer address the question?
      2. STAR METHOD — Situation/Task/Action/Result structure?
      3. CLARITY & STRUCTURE — logical and organized?
      4. CONFIDENCE LANGUAGE — avoids vague/filler language?
      5. CONCISENESS — 60-180 words ideal?
  - Speech metrics injected into system prompt for context

Expected JSON response keys from Gemini:
  feedback_text    - Specific 3-4 point feedback referencing actual answer
  improved_answer  - Model STAR-structured answer (100-150 words, first person)
  ai_score         - Integer 1-10
  missing_elements - Array of missing STAR elements or issues
  tone_assessment  - One sentence: confident/hesitant/vague/assertive

Returns: { feedback_text, improved_answer, ai_score, missing_elements, tone_assessment }
Fallback: Static helpful tips, ai_score=null, empty arrays
```

#### getTechnicalFeedback(userAnswer, question=null, skill='', metrics={}) → Promise<Object>
```
Purpose: Evaluates technical interview answer
Parameters:
  userAnswer  - The spoken transcript
  question    - Technical question text
  skill       - Skill being tested (e.g. 'javascript', 'react')
  metrics     - { fillerWordCount, speechSpeed, wordCount }

System instruction includes:
  - Role: senior software engineer + technical interview coach
  - Skill injected into system prompt
  - 5 evaluation dimensions:
      1. TECHNICAL ACCURACY — factually correct and complete?
      2. CONCEPTUAL DEPTH — understands "why" not just "what"?
      3. REAL-WORLD RELEVANCE — mentions practical use cases?
      4. COMMUNICATION — explanation clear to non-expert?
      5. COMPLETENESS — key concepts missing?

Expected JSON response keys:
  feedback_text      - 3-4 point technical feedback (calls out factual errors)
  improved_answer    - Model answer with example (100-180 words)
  ai_score           - Integer 1-10
  missing_elements   - Array of missing concepts
  technical_accuracy - 'accurate' | 'partially accurate' | 'inaccurate'

Returns: { feedback_text, improved_answer, ai_score, missing_elements, technical_accuracy }
```

#### generateDynamicTechnicalQuestion(skills, difficulty='easy') → Promise<string|null>
```
Purpose: Fallback when static question bank has no match for user's skills
Parameters:
  skills     - Array of user skill strings from resume
  difficulty - 'easy' | 'hard'
Prompt: Asks Gemini to generate ONE technical question for given skills+difficulty
Returns: Question text string, or null on failure
Used in: technicalController.getTechnicalQuestion() as fallback path
```

#### getChatbotResponse(message) → Promise<string>
```
Purpose: General interview coaching chatbot
System instruction: Career coach for campus placements at product companies
  - Specialties: resume tips, HR prep, technical strategy, career roadmaps
  - Rules: under 220 words, direct, use bullet points for lists
Prompt: User's raw message
Returns: Response text string
Fallback: Static "usage limit" message on error
```

---

## 7. Backend Middleware

### middleware/authMiddleware.js

#### protect(req, res, next) — JWT Auth Middleware
```
Extracts token from: req.headers.authorization (format: 'Bearer <token>')
Throws ApiError(401) if:
  - No token found in header
  - JWT_SECRET not configured in env
  - jwt.verify() throws TokenExpiredError → 'Token expired, please login again'
  - jwt.verify() throws JsonWebTokenError → 'Invalid token'
  - Decoded user._id not found in DB
On success: Sets req.user = User document (with _id, name, email)
Applied to: ALL private/protected routes
```

### middleware/errorMiddleware.js

#### notFound(req, res, next)
```
Triggered when no route matched
Calls: next(new ApiError(404, 'Not Found - ${req.originalUrl}'))
```

#### errorHandler(err, req, res, next)
```
Global error handler (4-argument Express middleware, registered last)
Response format: { status:'error', statusCode, message, stack? }
stack only included when NODE_ENV !== 'production'
Uses err.statusCode if available, otherwise defaults to 500
```

---

## 8. API Endpoints — Complete Reference

### Auth Routes (/api/auth)

| Method | Route | Auth | Body | Response |
|---|---|---|---|---|
| POST | /api/auth/register | Public | { name, email, password } | { status, data: { user:{id,name,email}, token } } |
| POST | /api/auth/login | Public | { email, password } | { status, data: { user:{id,name,email}, token } } |
| GET | /api/auth/me | Private | — | { status, data: { user:{id,name,email} } } |

**register:** Validates fields present → checks email unique (409 conflict) → User.create() → generateToken() → returns user+token

**login:** Finds user by lowercase email with .select('+password') → user.matchPassword(password) bcrypt compare → returns user+token

**getMe:** Uses req.user.id set by protect middleware → returns current user's name and email

---

### HR Interview Routes (/api/hr)

| Method | Route | Auth | Body/Query | Response |
|---|---|---|---|---|
| GET | /api/hr/question | Private | ?difficulty=easy/medium/hard | { status, data:{ question:{id,difficulty,question} } } |
| POST | /api/hr/submit | Private | { question_id, transcript, duration_sec? } | Full feedback object |

**getHrQuestion:** Filters hrQuestions.json by difficulty → returns random question from filtered set

**submitHrAnswer body:** question_id (required), transcript (required), duration_sec (optional, in seconds)

**submitHrAnswer logic:**
1. countWords(transcript)
2. countFillerWords(transcript)
3. calculateSpeechSpeed(wordCount, duration_sec) — uses real duration if provided
4. calculateConfidenceScore({ fillerWordCount, speechSpeed, wordCount, answerText:transcript })
5. getHrFeedback(transcript, questionText, metrics) — Gemini AI
6. InterviewAttempt.create() — auto-increments attempt_number for that question+user

**submitHrAnswer response:**
```json
{
  "status": "success",
  "data": {
    "transcript": "...",
    "question": { "id": "hr-easy-1", "difficulty": "easy", "question": "..." },
    "feedback_text": "...",
    "improved_answer": "...",
    "ai_score": 7,
    "missing_elements": ["specific example", "quantifiable result"],
    "tone_assessment": "The answer was hesitant with vague language.",
    "confidence_score": 8,
    "filler_word_count": 2,
    "speech_speed": 145,
    "word_count": 87
  }
}
```

---

### Technical Interview Routes (/api/technical)

| Method | Route | Auth | Body/Query | Response |
|---|---|---|---|---|
| POST | /api/technical/upload | Private | multipart/form-data { resume: PDF } | { status, data:{ resume_id, extracted_skills[] } } |
| GET | /api/technical/question | Private | ?difficulty=easy/hard | { status, data:{ question, skills[] } } |
| POST | /api/technical/submit | Private | { question_id, question_text, skill, transcript, duration_sec? } | Full feedback object |

**uploadResume:** multer memory storage, PDF only, max 5MB → pdf-parse extracts text → extractSkillsFromText() → Resume.create()

**extractSkillsFromText(text):**
- Scans for 40+ skill keywords (javascript, typescript, react, reactjs, angular, vue, node, nodejs, express, python, django, flask, java, spring, mongodb, mysql, postgresql, redis, firebase, sql, docker, kubernetes, aws, azure, git, dsa, data structures, algorithms, etc.)
- Alias deduplication: reactjs→react, nodejs→node, expressjs→express
- Returns deduplicated array of canonical skill strings

**getTechnicalQuestion:**
1. Fetches user's latest Resume from DB (sorted by upload_date DESC)
2. Filters technicalQuestions.json by difficulty
3. If user has skills → narrows to skill-matched candidates
4. If no static match → generateDynamicTechnicalQuestion(skills, difficulty) via Gemini
5. Returns { question, skills:userSkills }

**submitTechnicalAnswer:** Same metrics pipeline as HR submit → getTechnicalFeedback() → InterviewAttempt.create() → returns technical_accuracy instead of tone_assessment

---

### Dashboard Routes (/api/dashboard)

| Method | Route | Auth | Body | Response |
|---|---|---|---|---|
| POST | /api/dashboard/summary | Private | { mode, difficulty, average_confidence_score, total_filler_words, date? } | { status, data:{ interview } } |
| GET | /api/dashboard/stats | Private | — | Stats + history object |
| GET | /api/dashboard/history | Private | — | Last 20 Interview docs |

**createInterviewSummary:** Called by frontend at END of each interview session → Interview.create()

**getDashboardStats:**
- Fetches ALL Interview docs for user, sorted date ASC
- Calculates: total_interviews (count), average_confidence_score (mean), total_filler_words (sum)
- Returns history array of all sessions for Chart.js rendering

**getDashboardHistory:** Returns last 20 Interview docs sorted by date DESC

---

### Chatbot Route (/api/chatbot)

| Method | Route | Auth | Body | Response |
|---|---|---|---|---|
| POST | /api/chatbot | Private | { message:string } | { status, data:{ source:'fixed'/'ai', response:string } } |

**handleChatbotMessage — 3-Tier Matching:**
```
normalize(text) = text.toString().trim().toLowerCase().replace(/[?!.,]/g, '')

Tier 1 — Exact match:
  normalize(item.question) === normalizedMessage

Tier 2 — Substring match:
  normalizedMessage.includes(normalize(item.question)) OR
  normalize(item.question).includes(normalizedMessage)

Tier 3 — Fuzzy keyword match:
  Both strings split into words >2 chars
  Match count = words in query that appear in item
  Threshold = 50% of shorter string's word count
  If matchCount >= threshold → match

Tier 4 — Gemini fallback:
  getChatbotResponse(message) → AI response
```

---

### AI Feedback Route (/api/ai-feedback)

| Method | Route | Auth | Body | Response |
|---|---|---|---|---|
| POST | /api/ai-feedback | Private | { userAnswer, question?, duration_sec? } | Full feedback + metrics |

Standalone feedback endpoint — not linked to a specific session, does NOT save to DB.
Same calculation pipeline as HR submit. Returns all metrics + ai_score + missing_elements + tone_assessment + word_count.

---

## 9. Question Banks

### config/hrQuestions.json — 36 Questions
Format: { id, difficulty, question }

- **easy (12):** Tell me about yourself, Why interested in role, Key strengths, Educational background, Choice of field, Company knowledge, Hobbies, Relocation, Salary expectations, Internship experience, Motivation, Time management
- **medium (12):** Challenging situation, Handling feedback, Team effectiveness, Taking initiative, Priority management, Disagreement resolution, Learning quickly, Pressure handling, Proud project, Staying updated, Missed deadline, Handling ambiguity
- **hard (12):** Failure & learning, 5-year vision, Convincing skeptics, Disagreeing with manager, Decision with incomplete info, Competing priorities, Unpopular decision, Mentoring peers, Off-track project, Biggest weakness, Defining success, Adapting communication style

### config/technicalQuestions.json — 60+ Questions
Format: { id, skill, difficulty, question }

| Skill | Easy | Hard | Topics |
|---|---|---|---|
| javascript | 5 | 5 | let/const/var, closures, ==vs===, arrow fns, Promises, event loop, prototypal inheritance, async/await, generators, memory management |
| react | 5 | 5 | components/props, state vs props, JSX, virtual DOM, events, hooks, useEffect, Context API, memo/useMemo, lifecycle |
| node | 3 | 3 | what is Node.js, npm, sync vs async, middleware, concurrency, streams |
| python | 3 | 2 | lists/tuples/dicts, generators, decorators, GIL, multiprocessing vs multithreading |
| mongodb | 2 | 2 | NoSQL vs SQL, documents, aggregation pipeline, indexing |
| sql | 2 | 2 | JOINs, primary/foreign keys, normalization, indexing |
| git | 2 | 1 | version control, merge vs rebase, conflicts |
| dsa | 3 | 3 | Big O, stack vs queue, linked list, binary search, dynamic programming, BFS vs DFS |
| java | 2 | 2 | interface vs abstract class, OOP pillars, HashMap vs Hashtable, multithreading |
| css | 2 | 1 | box model, flexbox vs grid, specificity |
| general | 2 | 2 | HTTP vs HTTPS, REST API, auth vs authorization, URL to render lifecycle |

### config/chatbotData.json — 7 Predefined Q&A Entries
IDs: roadmap-sde, how-to-use, hr-mode, technical-mode, confidence-score, tips-technical, why-platform
Format: { id, question, answer }

---

## 10. Frontend Architecture

### Entry Point (src/main.jsx) — Provider Tree
```
React.StrictMode
  BrowserRouter
    AuthProvider       ← Global auth state (user, loading, login, logout)
      ToastProvider    ← Global toast notifications (addToast)
        App            ← Route definitions
```

### Routing (src/App.jsx)
```
/login                → LoginPage               (public)
/register             → RegisterPage            (public)
/                     → PrivateRoute (protected)
                        → DashboardLayout (sidebar + header shell)
  index               → DashboardPage
  hr-interview        → HrInterviewPage
  technical-interview → TechnicalInterviewPage
*                     → Navigate to /           (catch-all redirect)

PrivateRoute:
  Uses useAuth() → { user, loading }
  If loading → <LoadingScreen />
  If !user   → <Navigate to="/login" replace />
  If user    → renders children
```

### HTTP Service (src/services/api.js)
```js
axios instance:
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
  withCredentials: false

Request interceptor:
  Reads from localStorage key: 'ai_interview_token'
  Sets: config.headers.Authorization = `Bearer ${token}`

Import: import api from '../services/api'
Usage:  api.get('/api/...'), api.post('/api/...', body)
```

### Auth Context (src/context/AuthContext.jsx)
```js
State: user (object|null), loading (boolean)

useEffect on mount:
  Reads 'ai_interview_token' from localStorage
  If exists → GET /api/auth/me
    success → setUser(res.data.data.user)
    fail    → removeItem token, setUser(null)
  finally → setLoading(false)

login(data)  → localStorage.setItem('ai_interview_token', data.token) + setUser(data.user)
logout()     → localStorage.removeItem('ai_interview_token') + setUser(null)

Hook: useAuth() → { user, loading, login, logout }
```

### Toast Context (src/context/ToastContext.jsx)
```js
State: toasts array of { id, message, type }

addToast(message, type='success'):
  Creates toast with id=Date.now()
  Auto-removes after 3000ms via setTimeout

Renders toast UI inside Provider:
  position: fixed top-4 right-4, z-50
  Style: glassmorphism, text-red-300 for 'error', text-emerald-300 for 'success'

Hook: useToast() → { addToast }
```

---

## 11. Frontend Pages

### LoginPage.jsx
- Form: email + password
- On submit: POST /api/auth/login
- On success: auth.login(data) → navigate('/')
- On error: addToast(errorMessage, 'error')

### RegisterPage.jsx
- Form: name + email + password
- On submit: POST /api/auth/register
- On success: auth.login(data) → navigate('/')
- On error: addToast(errorMessage, 'error')

### DashboardPage.jsx
```
State: stats (object|null), loading (boolean)

On mount: GET /api/dashboard/stats → setStats(res.data.data)

Computed:
  improvementPercent = ((lastScore - firstScore) / firstScore) * 100
  Edge: first=0 → 100% if last>0, else 0

Renders:
  4 StatCards: Total Interviews | Avg Confidence (x.x/10) | Total Filler Words | Improvement %
  Line Chart (Chart.js): confidence score over time, y-axis 0-10, date labels
  Recent Sessions panel: last 5 sessions, most recent first (history.slice(-5).reverse())

Loading: Skeleton components
Empty state: instruction text to start practicing
```

### HrInterviewPage.jsx (~14KB)
```
States: question, transcript, result, loading, recording, difficulty

User Flow:
  1. Select difficulty (easy/medium/hard) → button click
  2. GET /api/hr/question?difficulty=... → sets question state
  3. Record voice via Web Speech API (SpeechRecognition)
  4. Timer tracks duration_sec during recording
  5. POST /api/hr/submit { question_id, transcript, duration_sec }
  6. Display result panel:
       feedback_text, improved_answer, ai_score, missing_elements,
       tone_assessment, confidence_score, filler_word_count, speech_speed, word_count
  7. POST /api/dashboard/summary { mode:'HR', difficulty, average_confidence_score, total_filler_words }
```

### TechnicalInterviewPage.jsx (~17KB)
```
States: uploadedSkills, question, transcript, result, loading, recording, difficulty

User Flow:
  1. Upload PDF resume → POST /api/technical/upload (multipart)
  2. Display extracted skills as tags
  3. Select difficulty (easy/hard)
  4. GET /api/technical/question?difficulty=... → skill-matched question
  5. Record voice → transcript
  6. POST /api/technical/submit { question_id, question_text, skill, transcript, duration_sec }
  7. Display result panel:
       feedback_text, improved_answer, ai_score, missing_elements,
       technical_accuracy, confidence_score, filler_word_count, speech_speed, word_count
  8. POST /api/dashboard/summary { mode:'Technical', difficulty, ... }
```

---

## 12. Frontend Components

### DashboardLayout.jsx
```
Layout: flex row — sidebar (hidden md:flex) + main content area

Sidebar:
  Logo: "AI Interview Coach" gradient icon + text
  Nav: Dashboard(/), HR Interview(/hr-interview), Technical(/technical-interview)
    Active state: gradient indigo-purple bg + shadow-glow
  Footer: user.name + user.email + logout button (LogOut icon → logout() + navigate('/login'))

Header (top bar, h-16):
  Mobile: logo
  Desktop: "Interview Analytics" + "Welcome back, {user.name}"
  Right: animated "Practice session ready" emerald badge (Framer Motion)

Content: <Outlet /> (renders active route's page component)
Chatbot: <Chatbot /> rendered at layout root (floating, always visible)
```

### Chatbot.jsx
```
State: open (bool), messages ([{from:'user'|'ai', text}]), input (string), loading (bool)

Floating button: bottom-6 right-6, z-40, gradient indigo-purple-fuchsia
  onClick: toggles open state

Panel (AnimatePresence, w-360px, max-w-90vw):
  Header: "AI Interview Assistant" + Online indicator + X close button
  Suggested chips: 7 hardcoded topics (horizontal scroll)
  Messages area (max-h-80, overflow-y-auto):
    User msg: right-aligned gradient bubble
    AI msg:   left-aligned glass bubble
    Loading:  bouncing dots + "AI is typing"
  Input form: text input + Send button

sendMessage(text):
  Appends {from:'user', text} to messages
  POST /api/chatbot { message: text }
  On success: appends {from:'ai', text: response}
  On error: addToast('Failed to contact AI assistant', 'error')
```

### StatCard.jsx
```
Props: label, value, subtitle, icon (Lucide component), tone ('indigo'|'emerald'|'rose')
Renders: GlassCard containing icon with tinted bg, large value text, label, subtitle
```

### GlassCard.jsx
```
Props: className, children
Renders: div with glassmorphism — bg-white/5, backdrop-blur-xl, border border-white/10
```

### ProgressBar.jsx
```
Props: value (0-100), tone
Renders: animated progress bar with gradient fill
```

### LoadingScreen.jsx
```
Full-screen loading state shown while AuthContext resolves user on app mount
Displays gradient animation / spinner
```

### Skeleton.jsx
```
Props: className
Renders: animate-pulse div for loading placeholder state
```

### PrimaryButton.jsx
```
Props: children, onClick, disabled, loading
Renders: gradient styled button with loading spinner state
```

---

## 13. Styling System

- **Framework:** Tailwind CSS v3 (utility-first)
- **Theme:** Dark mode only — slate-950/slate-900 backgrounds
- **Glassmorphism pattern:** bg-white/5 backdrop-blur-xl border border-white/10
- **Accent gradient:** from-indigo-500 via-purple-500 to-fuchsia-500
- **Success:** emerald palette | **Danger:** rose palette
- **Animations:** Framer Motion for panel open/close and page transitions
- **Custom utility:** shadow-glow (defined in tailwind.config.js)
- **Layout:** Responsive grid — grid-cols-1 sm:grid-cols-2 xl:grid-cols-4

---

## 14. Data Flow — End-to-End

### Registration
```
User fills form
→ POST /api/auth/register { name, email, password }
→ User.create() — password auto-hashed by pre-save hook
→ generateToken({ id: user._id })
→ Response: { user, token }
→ Frontend: auth.login(data) → localStorage + setUser
→ navigate('/')
```

### HR Interview Session
```
User selects difficulty
→ GET /api/hr/question?difficulty=easy
→ hrQuestions.json filtered → random question returned

User speaks aloud → Web SpeechRecognition API
Timer tracks duration_sec

→ POST /api/hr/submit { question_id, transcript, duration_sec }
→ Backend:
    1. countWords(transcript)
    2. countFillerWords(transcript)                    ← 20 filler types
    3. calculateSpeechSpeed(wordCount, duration_sec)   ← real WPM
    4. calculateConfidenceScore({ ..., answerText })   ← 4-dimension score
    5. getHrFeedback(transcript, question, metrics)    ← Gemini AI
         → systemPrompt with 5 dimensions
         → returns feedback_text, improved_answer, ai_score,
                  missing_elements, tone_assessment
    6. InterviewAttempt.create() in MongoDB

→ Frontend displays full result panel

→ POST /api/dashboard/summary { mode:'HR', difficulty, avg_confidence, total_filler_words }
→ Interview.create() → saved for dashboard chart
```

### Technical Interview Session
```
User uploads PDF
→ POST /api/technical/upload (multipart/form-data)
→ multer buffers file → pdfParse extracts text
→ extractSkillsFromText() → 40+ keywords, alias-deduplicated
→ Resume.create() in MongoDB

User selects difficulty
→ GET /api/technical/question?difficulty=easy
→ Backend: fetches latest Resume → gets extracted_skills
   → filters technicalQuestions.json by difficulty + skill match
   → If no match: generateDynamicTechnicalQuestion(skills, difficulty) via Gemini
→ Returns question + skills

User speaks → transcript
→ POST /api/technical/submit { question_id, question_text, skill, transcript, duration_sec }
→ Same metrics pipeline as HR
→ getTechnicalFeedback(transcript, question_text, skill, metrics)
→ InterviewAttempt.create()
→ Frontend shows technical results
→ POST /api/dashboard/summary
```

### Chatbot Interaction
```
User types/clicks suggested question
→ POST /api/chatbot { message }
→ normalize(message)
→ Tier 1: exact string match in chatbotData.json
→ Tier 2: substring containment check
→ Tier 3: fuzzy keyword overlap (>=50% word match)
→ Tier 4: getChatbotResponse(message) via Gemini
→ { source:'fixed'|'ai', response }
→ Frontend appends AI bubble to messages array
```

---

## 15. Key Business Rules

1. **Password never returned:** select:false on User.password — never included in any query result unless explicitly .select('+password')
2. **Attempt tracking:** attempt_number auto-incremented per (question_id + user_id) pair — not globally
3. **Resume persistence:** Latest resume fetched by upload_date DESC; old resumes NOT deleted automatically
4. **Confidence score is rule-based (0-10):** Calculated entirely server-side — NOT from Gemini
5. **ai_score (1-10):** IS from Gemini — separate field from confidence_score
6. **Speech speed:** Falls back to 30-second estimate if duration_sec not sent from frontend
7. **Dynamic questions:** Only generated via Gemini when static bank has no skill match
8. **Dashboard summary:** Must be explicitly POSTed by frontend after session ends — not auto-created
9. **CORS:** Locked to FRONTEND_URL env; falls back to * in development
10. **Error response format:** Always { status:'error', statusCode, message } — stack trace hidden in production

---

## 16. Dependencies

### Backend (package.json)
```
bcryptjs ^2.4.3      — Password hashing
cors ^2.8.5          — CORS middleware
dotenv ^16.4.5       — Environment variables
express ^4.19.2      — HTTP framework
jsonwebtoken ^9.0.3  — JWT auth
mongoose ^9.2.1      — MongoDB ODM
multer ^1.4.5-lts.1  — File upload middleware
node-fetch ^3.3.2    — HTTP fetch for Gemini (Node 16 fallback)
pdf-parse ^1.1.1     — PDF text extraction

devDependencies:
nodemon ^3.1.11      — Auto-restart dev server
```

### Frontend (package.json)
```
axios ^1.6.8              — HTTP client
chart.js ^4.5.1           — Charting library
framer-motion ^11.18.2    — Animation library
lucide-react ^0.460.0     — Icon library
react ^18.3.1             — UI framework
react-chartjs-2 ^5.3.1   — Chart.js React wrapper
react-dom ^18.3.1         — React DOM
react-router-dom ^6.28.0  — Client-side routing

devDependencies:
vite ^7.3.1, tailwindcss ^3.4.1, postcss, autoprefixer, eslint
```

---

## 17. Running the Project

### Backend
```bash
cd Backend
npm install
# Make sure .env is configured
npm run dev     # nodemon server.js on port 5000
npm start       # node server.js (production)
```

### Frontend
```bash
cd frontend
npm install
# Optionally create .env: VITE_API_URL=http://localhost:5000
npm run dev     # Vite dev server on port 5173
```

---

## 18. Known Limitations & TODOs

| # | Issue | Location | Fix |
|---|---|---|---|
| 1 | duration_sec must be sent from frontend for accurate WPM | HrInterviewPage, TechnicalInterviewPage | Track recording time in JS, send with submit body |
| 2 | Old resumes accumulate — never deleted/pruned | Resume model | Upsert or keep only latest per user |
| 3 | No refresh token mechanism | authController | Add /api/auth/refresh endpoint |
| 4 | CORS fallback to * if FRONTEND_URL not set | server.js | Lock to specific origin in production |
| 5 | No rate limiting | server.js | Add express-rate-limit middleware |
| 6 | New fields (ai_score, missing_elements, tone_assessment) not yet displayed in frontend | HrInterviewPage, TechnicalInterviewPage | Add result UI sections for these fields |
| 7 | No email format validation | authController | Add regex or validator library |
| 8 | chatbotData.json only has 7 entries | config/chatbotData.json | Expand to 30+ common questions |
| 9 | No loading state for resume skill extraction | TechnicalInterviewPage | Add upload progress indicator |

---

*End of Blueprint — All sections reflect the current state of the codebase as of the last update.*
