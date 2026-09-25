# AI Interview Coach — PPT Slide Headlines & Content

> Ready-to-use slide titles with bullet points for each slide.
> Total Suggested Slides: 20

---

## SLIDE 1 — Title Slide
**Headline:** AI Interview Coach
**Sub-headline:** An AI-Powered Campus Placement Preparation System
**Details:**
- Final Year Project
- Technology: React • Node.js • MongoDB • Google Gemini AI
- [Your Name] | [College Name] | [Department] | [Year]

---

## SLIDE 2 — Problem Statement
**Headline:** Why Do Students Struggle in Placement Interviews?
**Bullet Points:**
- 70% of students fail interviews not due to lack of knowledge but lack of practice
- No personalized feedback available after mock interviews
- Filler words, poor speech speed, and unstructured answers go unnoticed
- No tool that adapts questions based on individual skill set

---

## SLIDE 3 — Project Objective
**Headline:** What Does This Project Do?
**Bullet Points:**
- Simulates real HR and Technical interviews using AI
- Analyzes voice answers in real-time (filler words, WPM, structure)
- Provides Gemini AI-generated feedback with a model improved answer
- Tracks confidence score improvement across sessions
- Matches technical questions to skills extracted from the user's own resume

---

## SLIDE 4 — Technology Stack
**Headline:** Technologies Used
**Two-column layout:**

| Frontend | Backend |
|---|---|
| React 18 + Vite | Node.js + Express.js |
| Tailwind CSS | MongoDB Atlas |
| Framer Motion | Mongoose ODM |
| Chart.js | JWT Authentication |
| Lucide Icons | bcrypt |
| Axios | Google Gemini AI API |
| Web Speech API | pdf-parse + Multer |

---

## SLIDE 5 — System Architecture
**Headline:** System Architecture — 2 Layers × 4 Modules

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                       │
│  Auth & Nav │ HR Interview │ Technical │ Dashboard│
└──────────────────────┬──────────────────────────┘
                       │  REST API + JWT
┌──────────────────────▼──────────────────────────┐
│                  BACKEND                        │
│  Auth & Security │ Interview Engine │ AI Layer │ Analytics│
└──────────────────────┬──────────────────────────┘
                       │
            Google Gemini AI + MongoDB Atlas
```

---

## SLIDE 6 — Frontend Module 1
**Headline:** Frontend Module 1 — Authentication & Navigation
**Bullet Points:**
- Secure login and registration with JWT token storage
- Token auto-attached to every API request via Axios interceptor
- PrivateRoute guard — unauthenticated users redirected to login
- Persistent session — user stays logged in across browser refresh (7-day token)
- Responsive sidebar navigation (Dashboard / HR Interview / Technical Interview)
- AuthContext verifies token on every app load via `/api/auth/me`

---

## SLIDE 7 — Frontend Module 2
**Headline:** Frontend Module 2 — HR Interview Practice
**Bullet Points:**
- 3 difficulty levels: Easy, Medium, Hard (36 questions total)
- Voice recording via Web Speech Recognition API → live transcript
- Real speaking duration tracked for accurate WPM calculation
- Attempt counter — retry same question multiple times
- Result panel shows: Confidence Score, AI Score, Tone Assessment, Missing Elements
- Session ends with "End Interview" → saves summary to Dashboard

---

## SLIDE 8 — Frontend Module 3
**Headline:** Frontend Module 3 — Technical Interview Practice
**Bullet Points:**
- Upload PDF resume → skills auto-extracted (JavaScript, React, Python, etc.)
- Questions personalized to user's own skill set (40+ technology keywords)
- Easy / Hard difficulty modes
- Technical Accuracy Badge: ✅ Accurate / ⚠️ Partially Accurate / ❌ Inaccurate
- Missing Concepts shown as pill tags (e.g. "event loop", "closures")
- Dedicated Gemini AI endpoint for skill-specific technical evaluation

---

## SLIDE 9 — Frontend Module 4
**Headline:** Frontend Module 4 — Dashboard & Analytics
**Bullet Points:**
- 4 Stat Cards: Total Interviews, Avg Confidence (/10), Total Filler Words, Improvement %
- Line Chart (Chart.js) — Confidence Score over time
- Recent Sessions Panel — last 5 interviews with score and filler count
- Improvement % calculated as (latest score − first score) / first score × 100
- Floating AI Chatbot — career advice, platform guidance, roadmaps
- All computations memoized with `useMemo` for optimal performance

---

## SLIDE 10 — Backend Module 1
**Headline:** Backend Module 1 — Authentication & Security
**Bullet Points:**
- User registration with bcrypt password hashing (10 salt rounds)
- JWT signed with secret key, expires in 7 days
- `protect()` middleware validates Bearer token on every private route
- Password field has `select: false` — never returned in any DB query
- TokenExpiredError and JsonWebTokenError handled with clear messages
- Global error handler formats all errors as `{ status, statusCode, message }`

---

## SLIDE 11 — Backend Module 2
**Headline:** Backend Module 2 — Interview Engine
**Bullet Points:**
- 36 HR questions (Easy / Medium / Hard) + 60+ Technical questions (10 skill areas)
- `countFillerWords()` — detects 20 filler patterns (um, uh, like, basically, you know...)
- `calculateSpeechSpeed()` — WPM using real recording duration
- `calculateConfidenceScore()` — 4 dimensions: filler words + WPM + word count + STAR structure
- PDF text extracted with pdf-parse, skills identified from 40+ keyword list
- Every answer attempt saved to DB with attempt number (per question per user)

---

## SLIDE 12 — Backend Module 3
**Headline:** Backend Module 3 — AI Intelligence Layer (Google Gemini)
**Bullet Points:**
- Model: `gemini-2.5-flash` | Temperature: 0.4 (consistent, factual output)
- `getHrFeedback()` — evaluates on 5 STAR dimensions, returns ai_score + tone_assessment
- `getTechnicalFeedback()` — evaluates technical accuracy, depth, real-world relevance
- `generateDynamicTechnicalQuestion()` — AI generates question when static bank has no match
- `getChatbotResponse()` — career coaching with campus placement focus
- Chatbot: 3-tier matching (Exact → Fuzzy → Gemini) before AI call

---

## SLIDE 13 — Backend Module 4
**Headline:** Backend Module 4 — Analytics & Data Storage (MongoDB)
**Bullet Points:**
- MongoDB Atlas cloud database (3 collections: users, interviews, interviewattempts)
- `Interview` schema — stores session-level summary per completed interview
- `InterviewAttempt` schema — stores per-question attempt with metrics
- `getDashboardStats()` — calculates average confidence, total filler words, full history
- Data sorted by date ASC for chart rendering, DESC for history panel
- Resume schema — stores full PDF text + extracted skills for re-use across sessions

---

## SLIDE 14 — AI Feedback Deep Dive
**Headline:** How AI Feedback Works — Step by Step
**Flow Diagram:**
```
User speaks answer
    ↓
Web Speech API → transcript text
    ↓
Backend analyzes:
  • countFillerWords()    → filler_word_count
  • calculateSpeechSpeed() → speech_speed (WPM)
  • calculateConfidenceScore() → confidence_score (0–10)
    ↓
Gemini AI evaluates:
  • 5-dimension scoring
  • Returns: feedback_text, improved_answer, ai_score, missing_elements
    ↓
Frontend renders complete result panel
```

---

## SLIDE 15 — Confidence Score Formula
**Headline:** How the Confidence Score is Calculated (0–10)

| Parameter | Condition | Points |
|---|---|---|
| Filler Words | 0 fillers | 3 pts |
| Filler Words | 1–2 fillers | 2 pts |
| Filler Words | 3–4 fillers | 1 pt |
| Filler Words | 5+ fillers | 0 pts |
| Speech Speed | 110–170 WPM (ideal) | 3 pts |
| Speech Speed | 90–110 or 170–200 WPM | 2 pts |
| Speech Speed | Outside range | 1 pt |
| Word Count | 60–200 words | 2 pts |
| Word Count | 30–59 words | 1 pt |
| STAR Structure | Keywords detected | 2 pts |
| **Total** | **Max possible** | **10 pts** |

---

## SLIDE 16 — Resume Skill Extraction
**Headline:** Smart Resume Analysis — Skills Auto-Detected
**Bullet Points:**
- User uploads PDF → text extracted using `pdf-parse` library
- System scans for 40+ technology keywords
- Alias deduplication: `reactjs → react`, `nodejs → node`
- Skills displayed as pill badges on screen
- Questions from the static bank are filtered to match detected skills
- If no match found → Gemini AI generates a custom question for those skills

**Examples:**
```
Resume contains: "ReactJS, NodeJS, MongoDB, REST APIs"
Extracted Skills: react, node, mongodb, general
Question served: "Explain the event loop in Node.js"
```

---

## SLIDE 17 — Database Design
**Headline:** Database Schema Design (MongoDB)

```
users
  └── name, email, password(hashed), createdAt

interviews  (1 per session)
  └── user_id, mode, difficulty,
      average_confidence_score, total_filler_words, date

interviewattempts  (1 per question attempt)
  └── user_id, question_id, attempt_number,
      confidence_score, filler_word_count, speech_speed, date

resumes
  └── user_id, resume_text, extracted_skills[], upload_date
```

---

## SLIDE 18 — Project Implementation Progress (10 Milestones)
**Headline:** Project Progress & Completed Milestones
**Sub-headline:** Major Frontend Part & Database Design Completed — Stepping Forward to Advanced AI Backend Integration

> **Status Highlight:** **Major Frontend Part & Database Schemas are 100% DONE ✅**. We are now stepping forward into full Gemini AI backend integration and testing.

| # | Project Milestone | Module | Status |
|---|---|---|---|
| 1 | Auth & User Registration UI | Frontend | ✅ Completed |
| 2 | HR Interview Voice Recording & Practice UI | Frontend | ✅ Completed |
| 3 | Technical Interview & Skill Assessment UI | Frontend | ✅ Completed |
| 4 | Dashboard, Analytics Charts & AI Chatbot UI | Frontend | ✅ Completed |
| 5 | Database Design & MongoDB Schema Definition | Database | ✅ Completed |
| 6 | JWT Authentication & Security API Middleware | Backend | 🔄 In Progress |
| 7 | Speech Metrics Engine (WPM, Filler Words & Confidence Formula) | Backend | 🔄 Stepping Forward |
| 8 | Google Gemini AI Integration (HR & Tech Answer Evaluation) | Backend | 🔄 Stepping Forward |
| 9 | Resume PDF Parsing & Skill Extraction Pipeline | Backend | 🔄 Stepping Forward |
| 10 | End-to-End System Integration & Performance Optimization | Testing | ⏳ Upcoming |

---

## SLIDE 19 — Future Scope
**Headline:** Future Enhancements
**Bullet Points:**
- Add video recording with facial expression analysis
- Multi-language support (Hindi, regional languages)
- Group/panel interview simulation with multiple AI interviewers
- Leaderboard and peer comparison features
- Integration with LinkedIn for skill verification
- Email reports after every interview session
- Mobile app (React Native)

---

## SLIDE 20 — Conclusion
**Headline:** Conclusion

**50-Word Summary for Speech / Slide:**
> "The AI Interview Coach bridges the gap in placement preparation with real-time voice feedback, resume parsing, and Gemini AI evaluation. So far, we have nearly completed the major frontend part along with database design, empowering students to track speech metrics, boost confidence, and step forward into full system integration."

**Key Takeaway Bullet Points:**
- Built a full-stack AI-powered interview preparation platform
- Integrated Google Gemini AI for contextual, skill-specific feedback
- Implemented real speech analysis (filler words, WPM, STAR structure)
- Resume-based personalization makes practice sessions highly relevant
- Dashboard provides clear visibility into improvement over time

**Closing Tagline:** *"Practice smarter. Get hired faster."*

---

*Refer to SEMINAR_MODULES.md for detailed technical content under each headline.*
*Refer to PROJECT_BLUEPRINT.md for complete function-level documentation.*
