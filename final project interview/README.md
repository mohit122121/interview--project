# Mohit Raj Interview Prep — BTech CSE Session

> **New here / just want it to work with Live Server?** Skip everything below and open
> **`standalone/index.html`** with the VS Code Live Server extension (or just double-click it).
> It's a single self-contained file — no `npm install`, no backend, no terminal commands at all.
> See [`standalone/README.md`](./standalone/README.md) for details. The rest of this README
> covers the **full version** (React + Node.js backend) with real AI-powered scoring.

A full-stack **AI Interview Preparation Platform** for BTech CSE students. Practice mock interview
questions across the full core syllabus — DSA, OOP, DBMS, Operating Systems, Computer Networks,
System Design, and HR/Behavioral — with a live timer, optional voice answers, AI-powered scoring
and feedback, and a final mark-sheet style report.

Built with **React (Vite)** on the frontend and **Node.js + Express** on the backend, so it runs
entirely on your own machine in VS Code and can be pushed straight to GitHub.

---

## ✨ Features

- **13+ CS topics, 100+ ready-made questions with model answers** — Arrays, Strings, Linked List,
  Stacks & Queues, Trees, Graphs, Sorting, Searching, Recursion & Backtracking, Dynamic Programming,
  Greedy Algorithms, Hashing, Bit Manipulation, OOP, DBMS, Operating Systems, Computer Networks,
  System Design Basics, and HR/Behavioral.
- **Study mode** — click "Study all questions" on any topic tile to open every question and model
  answer for that topic on one page (no timer, no quiz), with a recommended YouTube video/playlist
  embedded right at the top (DSA, DBMS, OOP, OS, and CN all have curated playlists).
- **Voice interview** — Claude reads each question aloud (🔊 toggle, browser text-to-speech), and
  you can answer by speaking instead of typing (🎙️ mic button, browser speech-to-text).
- **AI feedback with 3 sub-scores** — every answer is scored on **Technical**, **Communication**,
  and **Confidence**, plus an overall verdict, written feedback, strengths, and weaknesses — either
  by Claude (if you add an API key) or by a built-in offline heuristic scorer.
- **Countdown timer** per question, auto-submits when time runs out.
- **Progress bar** showing how far through the session you are.
- **💡 Hints** — an optional hint (a teaser from the model answer) before you commit to an answer.
- **📹 Camera on/off** — optional self-view while answering (practice aid only — not recorded or
  analyzed).
- **Final dashboard** — Technical / Communication / Confidence / Overall scores, strengths,
  weaknesses, and a per-topic breakdown.
- **📄 Download PDF report** — export the full mark sheet (scores, strengths, weaknesses,
  question-by-question feedback) as a PDF.
- **💾 Interview history + 🏆 streaks & analytics** — every session is saved on the backend; a
  dedicated History page shows your day streak, best streak, all-time average, performance by
  topic, and every past session (expandable to see each question's score).
- **🌙 Light / Dark mode** toggle (saved to your browser).
- **🧠 Randomized questions** — a fresh, shuffled set of questions every time you start a session on
  the same topic.
- **Works fully offline** — a built-in question bank and a local scorer mean the app runs
  end-to-end even with no internet connection and no API key. Add a key any time to unlock
  AI-generated questions and Claude-written feedback.
- **Works fully offline** — a built-in question bank and a local keyword-based scorer mean the app
  runs end-to-end even with no internet connection and no API key.
- **Optional real AI mode** — plug in an Anthropic API key and the backend will generate fresh
  questions and score every answer using Claude, with detailed written feedback and a model answer.
- **Live countdown timer** per question (auto-submits when time runs out).
- **Speak your answer** using the browser's built-in speech recognition (optional, Chrome-based
  browsers work best).
- **Session history** — every completed session is saved to the backend (`sessions.json`) so a
  student can track their progress across multiple mock-interview attempts.
- **Mark-sheet report** — average score, per-topic breakdown, and question-by-question feedback.

---

## 🗂️ Project Structure

```
mohit-raj-interview-prep/
├── backend/
│   ├── data/
│   │   ├── questionBank.js      # all topics + questions + model answers
│   │   └── sessions.json        # auto-created, stores completed session history
│   ├── routes/
│   │   └── interview.js         # all API routes
│   ├── utils/
│   │   ├── claudeClient.js      # Claude API wrapper (question gen + evaluation)
│   │   └── localScorer.js       # offline fallback scorer
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Setup.jsx
    │   │   ├── Session.jsx
    │   │   └── Report.jsx
    │   ├── api.js                # calls the backend
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🚀 How to run it in VS Code

### 1. Open the project
Open the `mohit-raj-interview-prep` folder in VS Code, then open two terminals (Terminal → Split Terminal).

### 2. Start the backend (Terminal 1)
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
The backend will run at **http://localhost:5000**. You should see:
```
✅ Mohit Raj Interview Prep backend running on http://localhost:5000
```

> **Optional — enable real AI scoring:** open `backend/.env` and paste your key:
> `ANTHROPIC_API_KEY=sk-ant-xxxxxxxx`
> Get a key from https://console.anthropic.com — a small pay-as-you-go balance is enough for a
> college project. If you skip this step, the app still works fully offline.

### 3. Start the frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Open the URL it prints — usually **http://localhost:5173** — in your browser.

### 4. Use the app
1. Enter your name, pick one or more topics, a difficulty, and how many questions you want.
2. Answer each question by typing (or press **Speak** to answer out loud).
3. Get an instant score, feedback, and model answer after each question.
4. See your final mark sheet at the end, broken down by topic.

---

## 🧠 How the AI evaluation works

- If `ANTHROPIC_API_KEY` is set in `backend/.env`, every submitted answer is sent to Claude along
  with the question and a model answer, and Claude returns a JSON score (0–10), a verdict, written
  feedback, and a model answer — this is real, current AI evaluation.
- If no key is set (or the API call fails, e.g. no internet), the backend automatically falls back
  to `utils/localScorer.js`, which scores the answer by comparing keyword overlap with the model
  answer already stored in the question bank. This means your project **never breaks during a demo
  or viva**, even without internet access.

---

## 📤 Pushing this to GitHub

```bash
cd mohit-raj-interview-prep
git init
git add .
git commit -m "Initial commit: AI Interview Prep Platform - BTech CSE"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

Your `.env` file (with any API key) is already excluded via `.gitignore`, so it will never be
pushed to GitHub. Anyone cloning the repo can copy `backend/.env.example` to `.env` and add their
own key, or just run it offline.

---

## 📚 Adding more questions

Open `backend/data/questionBank.js`. Each topic is a key with an array of objects:

```js
Arrays: [
  { q: "Your question here?", a: "The model answer here.", difficulty: "Easy" },
  // add as many as you like
],
```

Add a brand-new topic simply by adding a new key — it will automatically show up in the app's
topic picker with no other code changes needed.

---

## 🎓 Ideas for extending this project (great for a viva "future scope" slide)

- Add user login (JWT auth) so each student has their own private history instead of a shared file.
- Swap the JSON file storage for MongoDB or PostgreSQL for proper persistence at scale.
- Add a resume upload that generates questions tailored to the student's listed skills/projects.
- Add a leaderboard so classmates can compare average scores by topic.
- Export the mark-sheet report as a downloadable PDF.
- Deploy the backend (Render/Railway) and frontend (Vercel/Netlify) so it's usable from a phone.

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | React 18, Vite, lucide-react icons  |
| Backend    | Node.js, Express                     |
| AI         | Anthropic Claude API (optional)      |
| Storage    | Local JSON file (`sessions.json`)    |
| Voice input| Browser Web Speech API               |

---

Built as a BTech CSE mini/major project — feel free to fork, extend, and make it your own.
