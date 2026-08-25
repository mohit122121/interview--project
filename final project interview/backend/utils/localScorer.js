// localScorer.js
// Offline fallback scorer used when no ANTHROPIC_API_KEY is configured, or when
// the Claude API call fails. Produces the same shape of result as the AI path:
// technicalScore, communicationScore, confidenceScore, overall, verdict,
// feedback, modelAnswer, strengths, weaknesses — so the UI never has to branch
// on whether AI or offline scoring was used.

const FILLERS = ["um", "uh", "like", "actually", "basically", "you know", "kind of", "sort of"];
const HEDGES = ["maybe", "i think", "i guess", "not sure", "probably", "perhaps", "i suppose"];

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function countOccurrences(text, phrases) {
  const lower = (text || "").toLowerCase();
  return phrases.reduce((count, phrase) => count + (lower.split(phrase).length - 1), 0);
}

function technicalCoverageScore(userAnswer, modelAnswer) {
  const answerTokens = new Set(tokenize(userAnswer));
  const modelTokens = new Set(tokenize(modelAnswer));
  if (modelTokens.size === 0) return 5;
  let overlap = 0;
  modelTokens.forEach((t) => {
    if (answerTokens.has(t)) overlap += 1;
  });
  const coverage = overlap / modelTokens.size;
  return Math.max(1, Math.min(10, Math.round(coverage * 10)));
}

function communicationScore(userAnswer) {
  const words = (userAnswer || "").trim().split(/\s+/).filter(Boolean);
  const sentenceCount = ((userAnswer || "").match(/[.!?]/g) || []).length || (words.length > 0 ? 1 : 0);
  let score = 5;
  if (words.length >= 20) score += 1;
  if (words.length >= 45) score += 1;
  if (sentenceCount >= 2) score += 1;
  if (sentenceCount >= 4) score += 1;
  const fillerCount = countOccurrences(userAnswer, FILLERS);
  score -= Math.min(3, fillerCount);
  return Math.max(0, Math.min(10, Math.round(score)));
}

function confidenceScore(userAnswer) {
  const hedgeCount = countOccurrences(userAnswer, HEDGES);
  let score = 8 - hedgeCount * 1.5;
  if (!userAnswer || userAnswer.trim().length === 0) score = 0;
  return Math.max(0, Math.min(10, Math.round(score)));
}

function buildStrengthsWeaknesses(domain, technical, communication, confidence) {
  const strengths = [];
  const weaknesses = [];

  if (technical >= 7) strengths.push(`Solid grasp of ${domain} fundamentals`);
  else if (technical < 5) weaknesses.push(`Needs a deeper review of ${domain} concepts`);

  if (communication >= 7) strengths.push("Clear, well-structured explanation");
  else if (communication < 5) weaknesses.push("Answer could be more detailed and structured");

  if (confidence >= 7) strengths.push("Answered with confidence, no hedging");
  else if (confidence < 5) weaknesses.push('Sounded hesitant — avoid phrases like "maybe" or "I think"');

  if (strengths.length === 0) strengths.push("Attempted the question directly");
  if (weaknesses.length === 0) weaknesses.push("Keep practicing to build more depth");

  return { strengths, weaknesses };
}

function localScore(userAnswer, modelAnswer, domain = "General") {
  if (!userAnswer || userAnswer.trim().length === 0) {
    return {
      score: 0,
      technicalScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      overall: 0,
      verdict: "Weak",
      feedback: "No answer was submitted. Try to at least outline the key idea, even if you are unsure of the full explanation.",
      modelAnswer,
      strengths: [],
      weaknesses: ["No answer was given for this question"],
      offline: true,
    };
  }

  const technical = technicalCoverageScore(userAnswer, modelAnswer);
  const communication = communicationScore(userAnswer);
  const confidence = confidenceScore(userAnswer);
  const overall = Math.round((technical + communication + confidence) / 3);

  let verdict = "Weak";
  if (overall >= 8) verdict = "Excellent";
  else if (overall >= 6) verdict = "Good";
  else if (overall >= 4) verdict = "Needs Improvement";

  const feedback =
    overall >= 6
      ? "Good coverage of the key ideas. Compare with the model answer to see if you can add more precise technical terms or a concrete example."
      : "This answer is missing several key concepts expected here. Read the model answer closely and try re-explaining it in your own words.";

  const { strengths, weaknesses } = buildStrengthsWeaknesses(domain, technical, communication, confidence);

  return {
    score: overall,
    technicalScore: technical,
    communicationScore: communication,
    confidenceScore: confidence,
    overall,
    verdict,
    feedback,
    modelAnswer,
    strengths,
    weaknesses,
    offline: true,
  };
}

module.exports = { localScore };
