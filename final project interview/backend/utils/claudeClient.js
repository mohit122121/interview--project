// claudeClient.js
// Thin wrapper around the Anthropic Claude API.
// Requires ANTHROPIC_API_KEY to be set in backend/.env (see .env.example).
// Get a key from https://console.anthropic.com

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function askClaude(promptText, maxTokens = 800) {
  if (!isConfigured()) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: promptText }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  return text;
}

function parseJSONResponse(raw) {
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

module.exports = { askClaude, parseJSONResponse, isConfigured };
