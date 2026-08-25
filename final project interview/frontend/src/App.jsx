import React, { useState, useEffect, useRef } from "react";
import { Sun, Moon, History as HistoryIcon, Home } from "lucide-react";
import Setup from "./components/Setup.jsx";
import Session from "./components/Session.jsx";
import Report from "./components/Report.jsx";
import StudyTopic from "./components/StudyTopic.jsx";
import History from "./components/History.jsx";
import {
  fetchTopics,
  fetchQuestions,
  generateQuestions,
  evaluateAnswer,
  saveSession,
  fetchSessionHistory,
  fetchAnalytics,
} from "./api.js";

const DURATIONS = { Easy: 60, Medium: 90, Hard: 120, Any: 90 };

export default function App() {
  const [screen, setScreen] = useState("setup"); // setup | study | session | report | history
  const [studyTopicName, setStudyTopicName] = useState(null);
  const [topics, setTopics] = useState([]);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("interviewPrepTheme") || "dark";
  });

  const [candidateName, setCandidateName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [useAIGeneration, setUseAIGeneration] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const speechSupported =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("interviewPrepTheme", theme);
  }, [theme]);

  function refreshHistoryAndAnalytics() {
    fetchSessionHistory()
      .then((data) => setHistory(data.sessions || []))
      .catch(() => {});
    fetchAnalytics()
      .then((data) => setAnalytics(data))
      .catch(() => {});
  }

  useEffect(() => {
    fetchTopics()
      .then((data) => {
        setTopics(data.topics || []);
        setAiConfigured(Boolean(data.aiConfigured));
        if (data.topics && data.topics.length > 0) {
          setSelectedTopics([data.topics[0].name]);
        }
      })
      .catch(() => {
        console.error(
          "Could not reach the backend at http://localhost:5000. Make sure you ran 'npm run dev' inside the backend folder."
        );
      });

    refreshHistoryAndAnalytics();
  }, []);

  function openStudy(name) {
    setStudyTopicName(name);
    setScreen("study");
  }

  function closeStudy() {
    setStudyTopicName(null);
    setScreen("setup");
  }

  function toggleTopic(name) {
    setSelectedTopics((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }

  async function startSession() {
    if (selectedTopics.length === 0) return;
    setLoadingSetup(true);
    try {
      let qs = [];
      if (useAIGeneration && aiConfigured) {
        const data = await generateQuestions({ topics: selectedTopics, difficulty, count: questionCount });
        qs = data.questions || [];
      } else {
        const data = await fetchQuestions({ topics: selectedTopics, count: questionCount, difficulty });
        qs = data.questions || [];
      }
      if (qs.length === 0) throw new Error("No questions returned");
      beginSession(qs);
    } catch (err) {
      alert(
        "Could not load questions. Make sure the backend server is running at http://localhost:5000 (run 'npm run dev' inside the backend folder)."
      );
    } finally {
      setLoadingSetup(false);
    }
  }

  function beginSession(qs) {
    setQuestions(qs);
    setResults(
      qs.map(() => ({
        phase: "answering",
        answerText: "",
        score: null,
        technicalScore: null,
        communicationScore: null,
        confidenceScore: null,
        overall: null,
        verdict: null,
        feedback: null,
        modelAnswer: null,
        strengths: [],
        weaknesses: [],
      }))
    );
    setCurrentIndex(0);
    setScreen("session");
  }

  function resetAll() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setListening(false);
    setScreen("setup");
    setQuestions([]);
    setResults([]);
    setCurrentIndex(0);
    refreshHistoryAndAnalytics();
  }

  function updateAnswerText(index, textOrFn) {
    setResults((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, answerText: typeof textOrFn === "function" ? textOrFn(r.answerText) : textOrFn }
          : r
      )
    );
  }

  // Countdown timer for the current question
  useEffect(() => {
    if (screen !== "session") return;
    const current = results[currentIndex];
    if (!current || current.phase !== "answering") return;

    const duration = DURATIONS[difficulty] || 90;
    setSecondsLeft(duration);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, screen, results[currentIndex]?.phase]);

  async function submitAnswer() {
    const current = results[currentIndex];
    if (!current || current.phase !== "answering") return;
    if (listening) toggleListening();

    setResults((prev) => prev.map((r, i) => (i === currentIndex ? { ...r, phase: "evaluating" } : r)));
    const q = questions[currentIndex];

    try {
      const evalResult = await evaluateAnswer({
        domain: q.domain,
        question: q.q,
        answer: current.answerText,
        modelAnswer: q.a || "",
      });
      setResults((prev) =>
        prev.map((r, i) =>
          i === currentIndex
            ? {
                ...r,
                phase: "reviewed",
                score: evalResult.overall ?? evalResult.score,
                technicalScore: evalResult.technicalScore ?? evalResult.score,
                communicationScore: evalResult.communicationScore ?? evalResult.score,
                confidenceScore: evalResult.confidenceScore ?? evalResult.score,
                overall: evalResult.overall ?? evalResult.score,
                verdict: evalResult.verdict,
                feedback: evalResult.feedback,
                modelAnswer: evalResult.modelAnswer || q.a,
                strengths: evalResult.strengths || [],
                weaknesses: evalResult.weaknesses || [],
              }
            : r
        )
      );
    } catch (err) {
      setResults((prev) =>
        prev.map((r, i) =>
          i === currentIndex
            ? {
                ...r,
                phase: "reviewed",
                score: 0,
                technicalScore: 0,
                communicationScore: 0,
                confidenceScore: 0,
                overall: 0,
                verdict: "Unavailable",
                feedback: "Could not reach the backend to evaluate this answer. Check that the server is running.",
                modelAnswer: q.a || "Not available.",
                strengths: [],
                weaknesses: [],
              }
            : r
        )
      );
    }
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const fullResults = questions.map((q, i) => ({ domain: q.domain, question: q.q, ...results[i] }));
      saveSession({ candidateName, results: fullResults })
        .then(refreshHistoryAndAnalytics)
        .catch(() => {});
      setScreen("report");
    }
  }

  function toggleListening() {
    if (!speechSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      updateAnswerText(currentIndex, (prevText) => (prevText ? prevText + " " + transcript : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch (e) {
      setListening(false);
    }
  }

  const duration = DURATIONS[difficulty] || 90;

  return (
    <div className="app-shell">
      <div className="shell-inner">
        <div className="top-header">
          <div>
            <div className="eyebrow">AI Interview Prep · BTech CSE</div>
            <h1 className="display" style={{ fontSize: 34, fontWeight: 600, margin: "8px 0 0" }}>
              Mohit Raj — Viva Session
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {candidateName && screen !== "setup" && <div className="candidate-tag">Candidate: {candidateName}</div>}
            <button
              className="nav-icon-btn"
              title={screen === "history" ? "Back home" : "Interview history & analytics"}
              onClick={() => {
                if (screen === "history") {
                  setScreen("setup");
                } else {
                  refreshHistoryAndAnalytics();
                  setScreen("history");
                }
              }}
            >
              {screen === "history" ? <Home size={16} /> : <HistoryIcon size={16} />}
            </button>
            <button
              className="nav-icon-btn"
              title="Toggle light/dark mode"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 26 }}>
          {screen === "setup" && (
            <Setup
              topics={topics}
              aiConfigured={aiConfigured}
              candidateName={candidateName}
              setCandidateName={setCandidateName}
              selectedTopics={selectedTopics}
              toggleTopic={toggleTopic}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              questionCount={questionCount}
              setQuestionCount={setQuestionCount}
              useAIGeneration={useAIGeneration}
              setUseAIGeneration={setUseAIGeneration}
              loading={loadingSetup}
              onStart={startSession}
              onOpenStudy={openStudy}
            />
          )}

          {screen === "study" && studyTopicName && (
            <StudyTopic topicName={studyTopicName} onBack={closeStudy} />
          )}

          {screen === "session" && questions.length > 0 && (
            <Session
              questions={questions}
              results={results}
              currentIndex={currentIndex}
              secondsLeft={secondsLeft}
              duration={duration}
              updateAnswerText={updateAnswerText}
              onSubmit={submitAnswer}
              onNext={goNext}
              speechSupported={speechSupported}
              listening={listening}
              toggleListening={toggleListening}
            />
          )}

          {screen === "report" && (
            <Report questions={questions} results={results} candidateName={candidateName} onRestart={resetAll} />
          )}

          {screen === "history" && <History history={history} analytics={analytics} />}
        </div>

        {screen !== "setup" && screen !== "study" && screen !== "history" && (
          <div style={{ marginTop: 20 }}>
            <span className="link-reset" onClick={resetAll}>
              ↺ abandon session and start over
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
