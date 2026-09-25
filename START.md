# 🚀 START — How to Run & Test the AI Interview Coach

> Quick reference for starting, stopping, and manually testing every part of the project.

---

## ✅ Prerequisites

Make sure you have these installed:

| Tool | Version | Check Command |
|---|---|---|
| Node.js | v18+ (recommended) | `node -v` |
| npm | v9+ | `npm -v` |
| MongoDB | Atlas cloud (already configured in .env) | — |
| Internet | Required for Gemini AI API calls | — |

---

## 📁 Project Structure (for reference)

```
Final_Year_Project/
├── Backend/     → Express API (port 5000)
└── frontend/    → React + Vite app (port 5173)
```

---

## 1️⃣ Start the Backend

```bash
# Navigate to the Backend folder
cd Backend

# Install dependencies (first time only)
npm install

# Start in development mode (auto-restarts on file save)
npm run dev

# OR start in production mode
npm start
```

✅ **Expected output:**
```
MongoDB connected
Server running on port 5000
```

🔗 Backend runs at: **http://localhost:5000**

---

## 2️⃣ Start the Frontend

> Open a **new terminal** (keep backend running)

```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Start the Vite dev server
npm run dev
```

✅ **Expected output:**
```
  VITE v7.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

🔗 Frontend runs at: **http://localhost:5173**

---

## 3️⃣ Environment Variables Check

Before starting, ensure `Backend/.env` has all required values:

```bash
# Quick check — should print all 7 keys
grep -E "^[A-Z]" Backend/.env
```

Required keys:
```
PORT=5000
NODE_ENV=development
MONGO_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

---

## 🧪 Manual API Testing (curl / Postman)

> Base URL: `http://localhost:5000`
> Replace `<TOKEN>` with the JWT received after login.

---

### 🔐 AUTH

#### Register a new user
```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test@1234"}' \
  | python3 -m json.tool
```

#### Login
```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}' \
  | python3 -m json.tool
```
> 📋 Copy the `token` from response — you'll need it below.

#### Get current user profile
```bash
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>" \
  | python3 -m json.tool
```

---

### 💬 HR INTERVIEW

#### Get a random HR question
```bash
# difficulty: easy | medium | hard
curl -s "http://localhost:5000/api/hr/question?difficulty=easy" \
  -H "Authorization: Bearer <TOKEN>" \
  | python3 -m json.tool
```

#### Submit an HR answer
```bash
curl -s -X POST http://localhost:5000/api/hr/submit \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "hr-easy-1",
    "transcript": "I am a final year computer science student. I have worked on several web projects using React and Node.js. I am passionate about building scalable applications and I am excited to apply my skills in a professional environment.",
    "duration_sec": 30
  }' \
  | python3 -m json.tool
```

✅ Expected response fields: `feedback_text`, `improved_answer`, `ai_score`, `missing_elements`, `tone_assessment`, `confidence_score`, `filler_word_count`, `speech_speed`, `word_count`

---

### 💻 TECHNICAL INTERVIEW

#### Upload a PDF resume
```bash
# Replace /path/to/your/resume.pdf with actual path
curl -s -X POST http://localhost:5000/api/technical/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "resume=@/path/to/your/resume.pdf" \
  | python3 -m json.tool
```

✅ Expected: `{ extracted_skills: ["javascript","react","node",...] }`

#### Get a technical question (skill-matched from resume)
```bash
# difficulty: easy | hard
curl -s "http://localhost:5000/api/technical/question?difficulty=easy" \
  -H "Authorization: Bearer <TOKEN>" \
  | python3 -m json.tool
```

#### Submit a technical answer
```bash
curl -s -X POST http://localhost:5000/api/technical/submit \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "tech-js-easy-1",
    "question_text": "What is the difference between let, const, and var in JavaScript?",
    "skill": "javascript",
    "transcript": "var is function scoped and can be redeclared. let is block scoped and cannot be redeclared but can be reassigned. const is also block scoped but cannot be reassigned after declaration. We should prefer const by default and use let when we need to reassign.",
    "duration_sec": 25
  }' \
  | python3 -m json.tool
```

---

### 📊 DASHBOARD

#### Save an interview session summary
```bash
curl -s -X POST http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "HR",
    "difficulty": "easy",
    "average_confidence_score": 7.5,
    "total_filler_words": 3
  }' \
  | python3 -m json.tool
```

#### Get dashboard stats (for charts)
```bash
curl -s http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer <TOKEN>" \
  | python3 -m json.tool
```

#### Get recent interview history
```bash
curl -s http://localhost:5000/api/dashboard/history \
  -H "Authorization: Bearer <TOKEN>" \
  | python3 -m json.tool
```

---

### 🤖 CHATBOT

#### Send a message to the chatbot
```bash
# Test predefined answer (exact match)
curl -s -X POST http://localhost:5000/api/chatbot \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Roadmap for SDE"}' \
  | python3 -m json.tool

# Test fuzzy match
curl -s -X POST http://localhost:5000/api/chatbot \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "How does the HR interview mode work?"}' \
  | python3 -m json.tool

# Test Gemini fallback (custom question)
curl -s -X POST http://localhost:5000/api/chatbot \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I prepare for Amazon SDE interviews?"}' \
  | python3 -m json.tool
```

---

### ✨ STANDALONE AI FEEDBACK

#### Get AI feedback for any answer (without saving to DB)
```bash
curl -s -X POST http://localhost:5000/api/ai-feedback \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userAnswer": "Um, basically I think I am a good team player. Like, I always try to help my teammates. Actually I have worked in many group projects in college.",
    "question": "Tell me about yourself.",
    "duration_sec": 15
  }' \
  | python3 -m json.tool
```

---

### 🏥 HEALTH CHECK (No auth needed)

```bash
curl -s http://localhost:5000/api/health
# Expected: {"status":"ok"}
```

---

## 🧪 Quick Test All APIs (One Script)

Save the following as `test_api.sh` in your project root and run it after login:

```bash
#!/bin/bash

BASE="http://localhost:5000"
EMAIL="test@example.com"
PASS="Test@1234"

echo "=== 1. Register ==="
curl -s -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | python3 -m json.tool

echo ""
echo "=== 2. Login & Get Token ==="
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo "Token: $TOKEN"

echo ""
echo "=== 3. Health Check ==="
curl -s $BASE/api/health

echo ""
echo "=== 4. Get HR Question ==="
curl -s "$BASE/api/hr/question?difficulty=easy" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== 5. Dashboard Stats ==="
curl -s $BASE/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== 6. Chatbot ==="
curl -s -X POST $BASE/api/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"How to improve confidence score?"}' | python3 -m json.tool

echo ""
echo "✅ All basic API tests done!"
```

Run it:
```bash
chmod +x test_api.sh
./test_api.sh
```

---

## ⚠️ Common Issues & Fixes

| Problem | Likely Cause | Fix |
|---|---|---|
| `MongoDB connection error` | MONGO_URI wrong or Atlas IP not whitelisted | Check .env MONGO_URI, whitelist IP in Atlas |
| `AI service is not configured` | GEMINI_API_KEY missing in .env | Add GEMINI_API_KEY to Backend/.env |
| `Token expired` | JWT older than 7 days | Login again to get a fresh token |
| `Failed to get response from AI service` | Gemini quota exceeded | Wait or upgrade Gemini plan |
| `CORS error` in browser | Frontend URL mismatch | Make sure FRONTEND_URL in .env matches Vite's port |
| `Cannot find module` | node_modules missing | Run `npm install` in Backend/ and frontend/ |
| PDF upload fails | File is not a valid PDF or >5MB | Use a proper PDF file under 5MB |
| `Port 5000 already in use` | Another process on port 5000 | `kill $(lsof -t -i:5000)` then restart |
| `Port 5173 already in use` | Another Vite instance running | `kill $(lsof -t -i:5173)` then restart |

---

## 🛑 Stop the Servers

```bash
# In each terminal, press:
Ctrl + C
```

---

## 📦 Build Frontend for Production

```bash
cd frontend
npm run build
# Output goes to frontend/dist/
```

---

*For full architecture and function-level details, see PROJECT_BLUEPRINT.md*
