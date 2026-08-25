const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const questionBank = require("../data/questionBank");
const { topicResources, getEmbedUrl } = require("../data/topicResources");
const { askClaude, parseJSONResponse, isConfigured } = require("../utils/claudeClient");
const { localScore } = require("../utils/localScorer");

const SESSIONS_FILE = path.join(__dirname, "..", "data", "sessions.json");

function readSessions() {
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeSessions(sessions) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// GET /api/topics -> list of all available topic/category names
router.get("/topics", (req, res) => {
  const topics = Object.keys(questionBank).map((name) => ({
    name,
    count: questionBank[name].length,
    hasVideo: Boolean(topicResources[name]),
  }));
  res.json({ topics, aiConfigured: isConfigured() });
});

// GET /api/resources -> the full topic -> YouTube resource map (for reference/debugging)
router.get("/resources", (req, res) => {
  res.json({ resources: topicResources });
});

// GET /api/study/:topic -> ALL questions + model answers for a topic, plus its
// recommended YouTube video/playlist, so a student can read everything at once
// instead of going through the timed quiz flow.
router.get("/study/:topic", (req, res) => {
  const topic = decodeURIComponent(req.params.topic);
  const questions = questionBank[topic] || [];
  const resource = topicResources[topic] || null;
  res.json({
    topic,
    questions,
    resource: resource
      ? { ...resource, embedUrl: getEmbedUrl(resource) }
      : null,
  });
});

// GET /api/questions?topics=Arrays,DBMS&count=5&difficulty=Medium
// Pulls questions from the static bank (works fully offline).
router.get("/questions", (req, res) => {
  const { topics, count, difficulty } = req.query;
  const selectedTopics = topics ? topics.split(",").map((t) => t.trim()) : Object.keys(questionBank);
  const wantCount = parseInt(count, 10) || 5;

  let pool = [];
  selectedTopics.forEach((topic) => {
    if (questionBank[topic]) {
      questionBank[topic].forEach((item) => pool.push({ domain: topic, ...item }));
    }
  });

  if (difficulty && difficulty !== "Any") {
    const filtered = pool.filter((q) => q.difficulty === difficulty);
    if (filtered.length > 0) pool = filtered;
  }

  const chosen = shuffle(pool).slice(0, wantCount);
  res.json({ questions: chosen });
});

// POST /api/generate  { topics: [...], difficulty, count }
// Uses Claude to generate fresh questions. Falls back to the static bank on failure.
router.post("/generate", async (req, res) => {
  const { topics = [], difficulty = "Intermediate", count = 5 } = req.body;

  if (!isConfigured()) {
    return res.json({ questions: buildFallback(topics, count), source: "offline-bank" });
  }

  const prompt = `Generate exactly ${count} technical interview practice questions for a BTech Computer Science student preparing for campus placement interviews.
Distribute the questions evenly across these topics: ${topics.join(", ")}.
Difficulty level: ${difficulty}.
Return ONLY a raw JSON array, no markdown code fences, no other text, in exactly this shape:
[{"domain": "topic name", "q": "question text"}]
Each question should be realistic and specific, one or two sentences long.`;

  try {
    const raw = await askClaude(prompt, 1200);
    const parsed = parseJSONResponse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("empty");
    res.json({ questions: parsed.slice(0, count), source: "claude" });
  } catch (err) {
    res.json({ questions: buildFallback(topics, count), source: "offline-bank-fallback", error: err.message });
  }
});

function buildFallback(topics, count) {
  let pool = [];
  topics.forEach((topic) => {
    if (questionBank[topic]) {
      questionBank[topic].forEach((item) => pool.push({ domain: topic, ...item }));
    }
  });
  if (pool.length === 0) {
    Object.keys(questionBank).forEach((topic) => {
      questionBank[topic].forEach((item) => pool.push({ domain: topic, ...item }));
    });
  }
  return shuffle(pool).slice(0, count);
}

// POST /api/evaluate  { domain, question, answer, modelAnswer }
// Uses Claude to score the answer. Falls back to a local keyword-overlap scorer if
// the API key isn't set or the call fails, so the app always works end-to-end.
router.post("/evaluate", async (req, res) => {
  const { domain, question, answer, modelAnswer } = req.body;

  if (!isConfigured()) {
    return res.json(localScore(answer, modelAnswer, domain));
  }

  const prompt = `You are a strict but fair interview panel member evaluating a BTech CSE student's mock interview answer, including how they communicated it.
Topic: ${domain}
Question: ${question}
Candidate's answer: ${answer && answer.trim() ? answer : "(No answer was given - the candidate ran out of time.)"}
Evaluate the answer on three dimensions, each an integer 0-10:
- technicalScore: correctness and depth of the technical content
- communicationScore: clarity, structure, and completeness of the explanation
- confidenceScore: how confidently and directly the answer is written (penalize excessive hedging like "maybe" or "I think", reward direct, assured statements)
Return ONLY raw JSON, no markdown code fences, no extra text, in exactly this shape:
{"technicalScore": integer 0-10, "communicationScore": integer 0-10, "confidenceScore": integer 0-10, "overall": integer 0-10 (the rounded average of the three), "verdict": "Excellent" or "Good" or "Needs Improvement" or "Weak", "feedback": "2-3 sentences of specific constructive feedback", "modelAnswer": "a concise ideal answer in 3-5 sentences", "strengths": ["short strength", "short strength"], "weaknesses": ["short weakness", "short weakness"]}`;

  try {
    const raw = await askClaude(prompt, 800);
    const parsed = parseJSONResponse(raw);
    res.json({ ...parsed, score: parsed.overall, offline: false });
  } catch (err) {
    res.json(localScore(answer, modelAnswer, domain));
  }
});

// POST /api/session  { candidateName, results: [...] } -> saves a completed session
// Each result item is expected to carry: domain, question, score/overall,
// technicalScore, communicationScore, confidenceScore, verdict, feedback.
router.post("/session", (req, res) => {
  const { candidateName, results } = req.body;
  const sessions = readSessions();
  const count = results && results.length > 0 ? results.length : 0;
  const avgOf = (key) => (count > 0 ? Number((results.reduce((s, r) => s + (r[key] || 0), 0) / count).toFixed(2)) : 0);

  const entry = {
    id: Date.now(),
    candidateName: candidateName || "Anonymous Candidate",
    timestamp: new Date().toISOString(),
    results,
    average: avgOf("overall") || avgOf("score"),
    technicalAvg: avgOf("technicalScore"),
    communicationAvg: avgOf("communicationScore"),
    confidenceAvg: avgOf("confidenceScore"),
  };
  sessions.unshift(entry);
  writeSessions(sessions.slice(0, 200)); // keep the last 200 sessions
  res.json({ saved: true, session: entry });
});

// GET /api/sessions -> history of past sessions (for a candidate progress view)
router.get("/sessions", (req, res) => {
  res.json({ sessions: readSessions() });
});

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

function computeStreaks(dateStrings) {
  const uniqueSorted = [...new Set(dateStrings)].sort(); // ascending
  let longest = 0;
  let run = 0;
  let prev = null;
  uniqueSorted.forEach((d) => {
    if (prev) {
      const diffDays = Math.round((new Date(d) - new Date(prev)) / 86400000);
      run = diffDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  });

  const set = new Set(uniqueSorted);
  let current = 0;
  const cursor = new Date();
  if (!set.has(dateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // allow "yesterday" to still count as an active streak
  }
  while (set.has(dateStr(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, longest };
}

// GET /api/analytics -> streaks + overall stats + per-topic performance, computed
// from every saved session, for the History / Performance Analytics dashboard.
router.get("/analytics", (req, res) => {
  const sessions = readSessions();
  const totalSessions = sessions.length;

  const { current: currentStreak, longest: longestStreak } = computeStreaks(
    sessions.map((s) => s.timestamp.slice(0, 10))
  );

  const domainTotals = {};
  sessions.forEach((s) => {
    (s.results || []).forEach((r) => {
      const dom = r.domain || "Unknown";
      if (!domainTotals[dom]) domainTotals[dom] = { sum: 0, count: 0 };
      domainTotals[dom].sum += r.overall ?? r.score ?? 0;
      domainTotals[dom].count += 1;
    });
  });
  const perTopic = Object.entries(domainTotals)
    .map(([domain, v]) => ({ domain, average: Number((v.sum / v.count).toFixed(2)), attempts: v.count }))
    .sort((a, b) => b.average - a.average);

  const overallAverageAllTime =
    totalSessions > 0 ? Number((sessions.reduce((s, x) => s + (x.average || 0), 0) / totalSessions).toFixed(2)) : 0;

  res.json({ totalSessions, currentStreak, longestStreak, overallAverageAllTime, perTopic });
});

module.exports = router;
