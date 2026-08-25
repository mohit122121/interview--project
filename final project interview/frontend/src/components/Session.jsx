import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, ChevronRight, Lightbulb, Volume2, VolumeX, Video, VideoOff } from "lucide-react";

function verdictColor(score) {
  if (score >= 7) return "var(--teal)";
  if (score >= 4) return "var(--amber)";
  return "var(--rust)";
}

function buildHint(modelAnswer) {
  if (!modelAnswer) return "Think about the core definition, then support it with one concrete example.";
  const words = modelAnswer.trim().split(/\s+/);
  const snippet = words.slice(0, 9).join(" ");
  return snippet + (words.length > 9 ? "…" : "");
}

export default function Session({
  questions,
  results,
  currentIndex,
  secondsLeft,
  duration,
  updateAnswerText,
  onSubmit,
  onNext,
  speechSupported,
  listening,
  toggleListening,
}) {
  const current = results[currentIndex];
  const question = questions[currentIndex];
  const circumference = 2 * Math.PI * 26;
  const dashOffset = circumference * (1 - secondsLeft / duration);
  const progressPct = Math.round(((currentIndex + (current.phase === "reviewed" ? 1 : 0)) / questions.length) * 100);

  const [showHint, setShowHint] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const speechSynthSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Reset the hint whenever we move to a new question
  useEffect(() => {
    setShowHint(false);
  }, [currentIndex]);

  // Voice interview: read the question aloud whenever it changes, if enabled
  useEffect(() => {
    if (!voiceOn || !speechSynthSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.q);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, voiceOn]);

  useEffect(() => {
    return () => {
      if (speechSynthSupported) window.speechSynthesis.cancel();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function toggleCamera() {
    if (cameraOn) {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (err) {
      alert("Could not access the camera. Check your browser's camera permission for this site.");
    }
  }

  return (
    <div className="card">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="session-header">
        <div className="eyebrow">
          Q.{String(currentIndex + 1).padStart(2, "0")} / {questions.length} · {question.domain}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {speechSynthSupported && (
            <button
              className={"mic-btn" + (voiceOn ? " on" : "")}
              title="Read question aloud"
              onClick={() => setVoiceOn((v) => !v)}
            >
              {voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          )}
          <button className={"mic-btn" + (cameraOn ? " on" : "")} title="Camera on/off" onClick={toggleCamera}>
            {cameraOn ? <Video size={15} /> : <VideoOff size={15} />}
          </button>
          <div className="timer-ring">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" stroke="var(--panel-line)" strokeWidth="4" fill="none" />
              <circle
                cx="30"
                cy="30"
                r="26"
                stroke={secondsLeft <= 10 ? "var(--rust)" : "var(--amber)"}
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
              />
            </svg>
            <div className="timer-value mono">{secondsLeft}</div>
          </div>
        </div>
      </div>

      {cameraOn && (
        <div className="camera-preview">
          <video ref={videoRef} autoPlay muted playsInline />
          <span className="camera-note">Camera preview only — not recorded or analyzed.</span>
        </div>
      )}

      <h2 className="display" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.4 }}>
        {question.q}
      </h2>

      {current.phase !== "reviewed" && (
        <>
          <div className="hint-row">
            <button className="hint-btn" onClick={() => setShowHint((v) => !v)}>
              <Lightbulb size={14} /> {showHint ? "Hide hint" : "Show hint"}
            </button>
          </div>
          {showHint && <div className="hint-box">💡 {buildHint(question.a)}</div>}

          <textarea
            placeholder="Type your answer here — or use the mic to speak it out loud."
            value={current.answerText}
            onChange={(e) => updateAnswerText(currentIndex, e.target.value)}
            disabled={current.phase === "evaluating"}
          />
          <div className="btn-row">
            <button className="primary-btn" disabled={current.phase === "evaluating"} onClick={onSubmit}>
              {current.phase === "evaluating" ? "Evaluating…" : "Submit answer"}
              <ChevronRight size={16} />
            </button>
            {speechSupported && (
              <button className={"mic-btn" + (listening ? " on" : "")} onClick={toggleListening}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
                {listening ? "Stop" : "Speak"}
              </button>
            )}
          </div>
        </>
      )}

      {current.phase === "reviewed" && (
        <div className="feedback-box">
          <div className="score-badge" style={{ color: verdictColor(current.overall ?? current.score) }}>
            {current.overall ?? current.score}/10 — {current.verdict}
          </div>

          <div className="subscore-row">
            <div className="subscore">
              <span className="subscore-label">Technical</span>
              <span className="subscore-value">{current.technicalScore}/10</span>
            </div>
            <div className="subscore">
              <span className="subscore-label">Communication</span>
              <span className="subscore-value">{current.communicationScore}/10</span>
            </div>
            <div className="subscore">
              <span className="subscore-label">Confidence</span>
              <span className="subscore-value">{current.confidenceScore}/10</span>
            </div>
          </div>

          <p style={{ marginTop: 14, fontSize: 14 }}>{current.feedback}</p>
          <div style={{ marginTop: 14, fontSize: 13, color: "var(--chalk-dim)" }}>
            <strong style={{ color: "var(--chalk)" }}>Model answer: </strong>
            {current.modelAnswer}
          </div>
          <button className="primary-btn" style={{ marginTop: 18 }} onClick={onNext}>
            {currentIndex < questions.length - 1 ? "Next question" : "View report"}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="ledger">
        {results.map((r, i) => (
          <div
            key={i}
            className="ledger-item"
            style={{
              borderColor: i === currentIndex ? "var(--amber)" : "var(--panel-line)",
              color: r.phase === "reviewed" ? verdictColor(r.overall ?? r.score) : "var(--chalk-dim)",
            }}
          >
            {r.phase === "reviewed" ? r.overall ?? r.score : i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
