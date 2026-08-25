import React from "react";
import { RotateCcw, Download } from "lucide-react";
import { jsPDF } from "jspdf";

function verdictColor(score) {
  if (score >= 7) return "var(--teal)";
  if (score >= 4) return "var(--amber)";
  return "var(--rust)";
}

function average(arr, key) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length;
}

export default function Report({ questions, results, candidateName, onRestart }) {
  const avg = average(results, "overall") || average(results, "score");
  const techAvg = average(results, "technicalScore");
  const commAvg = average(results, "communicationScore");
  const confAvg = average(results, "confidenceScore");

  let overallRating = "Weak";
  if (avg >= 8) overallRating = "Excellent";
  else if (avg >= 6) overallRating = "Good";
  else if (avg >= 4) overallRating = "Needs Improvement";

  const byDomain = {};
  results.forEach((r, i) => {
    const dom = questions[i].domain;
    if (!byDomain[dom]) byDomain[dom] = [];
    byDomain[dom].push(r.overall ?? r.score ?? 0);
  });

  const allStrengths = [...new Set(results.flatMap((r) => r.strengths || []))].slice(0, 6);
  const allWeaknesses = [...new Set(results.flatMap((r) => r.weaknesses || []))].slice(0, 6);

  function downloadPDF() {
    const doc = new jsPDF();
    const marginX = 14;
    let y = 20;

    doc.setFontSize(18);
    doc.text("AI Interview Prep — Mark Sheet", marginX, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Candidate: ${candidateName || "N/A"}`, marginX, y);
    y += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, marginX, y);
    y += 6;
    doc.text(`Overall Rating: ${overallRating} (${avg.toFixed(1)}/10)`, marginX, y);
    y += 6;
    doc.text(
      `Technical: ${techAvg.toFixed(1)}  |  Communication: ${commAvg.toFixed(1)}  |  Confidence: ${confAvg.toFixed(1)}`,
      marginX,
      y
    );
    y += 12;

    if (allStrengths.length > 0) {
      doc.setFontSize(13);
      doc.text("Strengths", marginX, y);
      y += 7;
      doc.setFontSize(10);
      allStrengths.forEach((s) => {
        const lines = doc.splitTextToSize(`- ${s}`, 180);
        doc.text(lines, marginX, y);
        y += lines.length * 6;
      });
      y += 6;
    }

    if (allWeaknesses.length > 0) {
      doc.setFontSize(13);
      doc.text("Areas to improve", marginX, y);
      y += 7;
      doc.setFontSize(10);
      allWeaknesses.forEach((w) => {
        const lines = doc.splitTextToSize(`- ${w}`, 180);
        doc.text(lines, marginX, y);
        y += lines.length * 6;
      });
      y += 6;
    }

    doc.setFontSize(13);
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.text("Question-by-question", marginX, y);
    y += 8;
    doc.setFontSize(10);

    questions.forEach((q, i) => {
      const r = results[i];
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      const qLines = doc.splitTextToSize(`Q${i + 1}. [${r.overall ?? r.score}/10] ${q.q}`, 180);
      doc.text(qLines, marginX, y);
      y += qLines.length * 6 + 2;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const fbLines = doc.splitTextToSize(`Feedback: ${r.feedback || "-"}`, 180);
      doc.text(fbLines, marginX, y);
      y += fbLines.length * 6 + 8;
    });

    doc.save(`${(candidateName || "interview").replace(/\s+/g, "_")}-report.pdf`);
  }

  return (
    <div className="card">
      <div className="eyebrow">Mark sheet — {candidateName || "Candidate"}</div>
      <h2 className="display" style={{ fontSize: 44, margin: "10px 0 4px" }}>
        {avg.toFixed(1)} <span style={{ fontSize: 18, color: "var(--chalk-dim)" }}>/ 10 — {overallRating}</span>
      </h2>

      <div className="score-grid">
        <div className="score-card">
          <div className="score-card-label">Technical</div>
          <div className="score-card-value" style={{ color: verdictColor(techAvg) }}>
            {techAvg.toFixed(1)}
          </div>
        </div>
        <div className="score-card">
          <div className="score-card-label">Communication</div>
          <div className="score-card-value" style={{ color: verdictColor(commAvg) }}>
            {commAvg.toFixed(1)}
          </div>
        </div>
        <div className="score-card">
          <div className="score-card-label">Confidence</div>
          <div className="score-card-value" style={{ color: verdictColor(confAvg) }}>
            {confAvg.toFixed(1)}
          </div>
        </div>
        <div className="score-card">
          <div className="score-card-label">Overall</div>
          <div className="score-card-value" style={{ color: verdictColor(avg) }}>
            {avg.toFixed(1)}
          </div>
        </div>
      </div>

      {(allStrengths.length > 0 || allWeaknesses.length > 0) && (
        <div className="sw-grid">
          <div>
            <div className="eyebrow" style={{ color: "var(--teal)" }}>
              Strengths
            </div>
            <ul className="sw-list">
              {allStrengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="eyebrow" style={{ color: "var(--rust)" }}>
              Areas to improve
            </div>
            <ul className="sw-list">
              {allWeaknesses.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <div className="eyebrow" style={{ color: "var(--chalk-dim)", marginBottom: 6 }}>
          By topic
        </div>
        {Object.entries(byDomain).map(([dom, scores]) => {
          const domAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
          return (
            <div className="report-row" key={dom}>
              <span style={{ fontSize: 14 }}>{dom}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${domAvg * 10}%`, background: verdictColor(domAvg) }} />
                </div>
                <span className="mono" style={{ fontSize: 13, width: 34 }}>
                  {domAvg.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28 }}>
        <div className="eyebrow" style={{ color: "var(--chalk-dim)", marginBottom: 10 }}>
          Question-by-question
        </div>
        {questions.map((q, i) => (
          <div key={i} style={{ borderBottom: "1px solid var(--panel-line)", padding: "14px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 14, maxWidth: 560 }}>{q.q}</div>
              <div className="mono" style={{ color: verdictColor(results[i].overall ?? results[i].score), fontWeight: 600 }}>
                {results[i].overall ?? results[i].score}/10
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--chalk-dim)", marginTop: 6 }}>{results[i].feedback}</div>
          </div>
        ))}
      </div>

      <div className="btn-row" style={{ marginTop: 24 }}>
        <button className="start-btn" onClick={onRestart}>
          <RotateCcw size={16} />
          Start a new session
        </button>
        <button className="primary-btn" onClick={downloadPDF}>
          <Download size={16} />
          Download PDF report
        </button>
      </div>
    </div>
  );
}
