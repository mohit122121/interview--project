import React from "react";
import { Sparkles, PlayCircle } from "lucide-react";

export default function Setup({
  topics,
  aiConfigured,
  candidateName,
  setCandidateName,
  selectedTopics,
  toggleTopic,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount,
  useAIGeneration,
  setUseAIGeneration,
  loading,
  onStart,
  onOpenStudy,
}) {
  return (
    <div className="card">
      <div className="field-label">Your name (shown on the final mark sheet)</div>
      <input
        className="name-input"
        placeholder="e.g. Mohit Raj"
        value={candidateName}
        onChange={(e) => setCandidateName(e.target.value)}
      />

      <div className="field-label" style={{ marginTop: 22 }}>
        Step 1 — choose your topics
      </div>
      <div className="domain-grid">
        {topics.map((t) => (
          <div
            key={t.name}
            className={"domain-tile" + (selectedTopics.includes(t.name) ? " selected" : "")}
            onClick={() => toggleTopic(t.name)}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t.name}</span>
              <span className="count">{t.count} Qs</span>
            </div>
            <button
              className="study-link"
              onClick={(e) => {
                e.stopPropagation();
                onOpenStudy(t.name);
              }}
            >
              <PlayCircle size={13} />
              {t.hasVideo ? "Study + video" : "Study all questions"}
            </button>
          </div>
        ))}
      </div>

      <div className="field-label">Step 2 — difficulty</div>
      <div className="pill-row">
        {["Easy", "Medium", "Hard"].map((lvl) => (
          <button
            key={lvl}
            className={"pill" + (difficulty === lvl ? " active" : "")}
            onClick={() => setDifficulty(lvl)}
          >
            {lvl}
          </button>
        ))}
        <button
          className={"pill" + (difficulty === "Any" ? " active" : "")}
          onClick={() => setDifficulty("Any")}
        >
          Any
        </button>
      </div>

      <div className="field-label">Step 3 — number of questions</div>
      <div className="pill-row">
        {[3, 5, 8, 10].map((n) => (
          <button
            key={n}
            className={"pill" + (questionCount === n ? " active" : "")}
            onClick={() => setQuestionCount(n)}
          >
            {n} questions
          </button>
        ))}
      </div>

      <div className="field-label">Step 4 — question source</div>
      <div className="pill-row">
        <button
          className={"pill" + (!useAIGeneration ? " active" : "")}
          onClick={() => setUseAIGeneration(false)}
        >
          Question bank (offline)
        </button>
        <button
          className={"pill" + (useAIGeneration ? " active" : "")}
          onClick={() => setUseAIGeneration(true)}
          disabled={!aiConfigured}
        >
          AI-generated {!aiConfigured && "(needs API key)"}
        </button>
      </div>

      <button className="start-btn" disabled={selectedTopics.length === 0 || loading} onClick={onStart}>
        <Sparkles size={16} />
        {loading ? "Preparing questions…" : "Start session"}
      </button>

      {selectedTopics.length === 0 && <div className="hint">Pick at least one topic to begin.</div>}

      <div className="offline-note">
        {aiConfigured
          ? "AI evaluation is active — every answer will be scored by Claude with detailed feedback."
          : "No ANTHROPIC_API_KEY detected in backend/.env — running in fully offline mode using the built-in question bank and a local keyword-based scorer. Add a key any time to unlock AI-generated questions and richer feedback."}
      </div>
    </div>
  );
}
