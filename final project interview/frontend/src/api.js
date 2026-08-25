const BASE_URL = "http://localhost:5000/api";

export async function fetchTopics() {
  const res = await fetch(`${BASE_URL}/topics`);
  return res.json();
}

export async function fetchQuestions({ topics, count, difficulty }) {
  const params = new URLSearchParams({
    topics: topics.join(","),
    count: String(count),
    difficulty,
  });
  const res = await fetch(`${BASE_URL}/questions?${params.toString()}`);
  return res.json();
}

export async function generateQuestions({ topics, difficulty, count }) {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topics, difficulty, count }),
  });
  return res.json();
}

export async function evaluateAnswer({ domain, question, answer, modelAnswer }) {
  const res = await fetch(`${BASE_URL}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, question, answer, modelAnswer }),
  });
  return res.json();
}

export async function saveSession({ candidateName, results }) {
  const res = await fetch(`${BASE_URL}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateName, results }),
  });
  return res.json();
}

export async function fetchSessionHistory() {
  const res = await fetch(`${BASE_URL}/sessions`);
  return res.json();
}

export async function fetchStudyTopic(topicName) {
  const res = await fetch(`${BASE_URL}/study/${encodeURIComponent(topicName)}`);
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${BASE_URL}/analytics`);
  return res.json();
}
