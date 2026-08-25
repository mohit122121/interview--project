import React, { useState } from "react";
import { Flame, Trophy, ChevronDown, ChevronUp } from "lucide-react";

function verdictColor(score) {
  if (score >= 7) return "var(--teal)";
  if (score >= 4) return "var(--amber)";
  return "var(--rust)";
}

export default function History({ history, analytics }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="card">
      <div className="eyebrow">Performance analytics</div>
      <h2 className="display" style={{ fontSize: 28, margin: "8px 0 18px" }}>
        Your progress
      </h2>

      {analytics && (
        <>
          <div className="streak-row">
            <div className="streak-card">
              <Flame size={20} color="var(--amber)" />
              <div>
                <div className="streak-value">{analytics.currentStreak}</div>
                <div className="streak-label">day streak</div>
              </div>
            </div>
            <div className="streak-card">
              <Trophy size={20} color="var(--teal)" />
              <div>
                <div className="streak-value">{analytics.longestStreak}</div>
                <div className="streak-label">best streak</div>
              </div>
            </div>
            <div className="streak-card">
              <div>
                <div className="streak-value">{analytics.totalSessions}</div>
                <div className="streak-label">sessions done</div>
              </div>
            </div>
            <div className="streak-card">
              <div>
                <div className="streak-value">{analytics.overallAverageAllTime}</div>
                <div className="streak-label">avg score (all-time)</div>
              </div>
            </div>
          </div>

          {analytics.perTopic && analytics.perTopic.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <div className="eyebrow" style={{ color: "var(--chalk-dim)", marginBottom: 10 }}>
                Performance by topic
              </div>
              {analytics.perTopic.map((t) => (
                <div className="report-row" key={t.domain}>
                  <span style={{ fontSize: 14 }}>
                    {t.domain} <span style={{ color: "var(--chalk-dim)", fontSize: 12 }}>({t.attempts} attempts)</span>
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${t.average * 10}%`, background: verdictColor(t.average) }}
                      />
                    </div>
                    <span className="mono" style={{ fontSize: 13, width: 34 }}>
                      {t.average.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 30 }}>
        <div className="eyebrow" style={{ color: "var(--chalk-dim)", marginBottom: 10 }}>
          Session history
        </div>
        {history.length === 0 && (
          <div style={{ color: "var(--chalk-dim)", fontSize: 14 }}>No sessions completed yet — go finish one!</div>
        )}
        {history.map((s) => {
          const isOpen = expandedId === s.id;
          return (
            <div key={s.id} style={{ borderBottom: "1px solid var(--panel-line)" }}>
              <div
                className="history-item"
                style={{ cursor: "pointer", alignItems: "center" }}
                onClick={() => setExpandedId(isOpen ? null : s.id)}
              >
                <span>{s.candidateName}</span>
                <span className="mono" style={{ color: verdictColor(s.average) }}>
                  {s.average}/10
                </span>
                <span style={{ color: "var(--chalk-dim)" }}>{new Date(s.timestamp).toLocaleString()}</span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {isOpen && (
                <div style={{ padding: "6px 0 16px" }}>
                  {(s.results || []).map((r, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "8px 0", borderTop: "1px dashed var(--panel-line)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ maxWidth: 500 }}>
                          {r.domain ? `[${r.domain}] ` : ""}
                          {r.question}
                        </span>
                        <span className="mono" style={{ color: verdictColor(r.overall ?? r.score) }}>
                          {r.overall ?? r.score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
