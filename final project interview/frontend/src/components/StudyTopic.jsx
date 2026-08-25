import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { fetchStudyTopic } from "../api.js";

export default function StudyTopic({ topicName, onBack }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchStudyTopic(topicName)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [topicName]);

  return (
    <div className="card">
      <span className="link-reset" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <ArrowLeft size={14} /> back to topics
      </span>

      <h2 className="display" style={{ fontSize: 28, margin: "14px 0 4px" }}>
        {topicName}
      </h2>
      <div className="eyebrow" style={{ marginBottom: 18 }}>
        Study mode — read every question and answer, no timer
      </div>

      {loading && <div style={{ color: "var(--chalk-dim)" }}>Loading…</div>}

      {!loading && data && (
        <>
          {data.resource && (
            <div style={{ marginBottom: 26 }}>
              <div className="video-wrap">
                <iframe
                  src={data.resource.embedUrl}
                  title={data.resource.label}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--chalk-dim)" }}>{data.resource.label}</span>
                <a
                  href={data.resource.watchUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: "var(--teal)", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  Watch on YouTube <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          <div className="eyebrow" style={{ color: "var(--chalk-dim)", marginBottom: 10 }}>
            All {data.questions.length} questions in this topic
          </div>

          {data.questions.map((item, i) => (
            <div className="qa-card" key={i}>
              <div className="qa-question">
                <span className="mono qa-index">Q{i + 1}.</span> {item.q}
                {item.difficulty && <span className="difficulty-tag">{item.difficulty}</span>}
              </div>
              <div className="qa-answer">{item.a}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
