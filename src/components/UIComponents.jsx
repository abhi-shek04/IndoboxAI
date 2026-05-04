import { useState, useEffect } from 'react';
import { FACTS } from '../constants/knowledge';

export function FactsTicker() {
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);
  
  useEffect(() => {
    const t = setInterval(() => {
      setVis(false);
      setTimeout(() => { setIdx(p => (p + 1) % FACTS.length); setVis(true); }, 350);
    }, 4500);
    return () => clearInterval(t);
  }, []);
  
  return (
    <div style={{ background: "rgba(255,153,51,0.035)", borderBottom: "1px solid rgba(255,153,51,0.07)", padding: "6px 20px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "2px", color: "rgba(255,153,51,0.45)", whiteSpace: "nowrap", flexShrink: 0 }}>LIVE FACT</span>
      <div style={{ width: 1, height: 12, background: "rgba(255,153,51,0.12)", flexShrink: 0 }} />
      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", opacity: vis ? 1 : 0, transition: "opacity 0.35s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{FACTS[idx]}</span>
    </div>
  );
}

export function StatPill({ value, label, icon }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 14px", background: "rgba(255,153,51,0.05)", border: "1px solid rgba(255,153,51,0.12)", borderRadius: 14, minWidth: 76 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 16, fontWeight: 900, color: "#FF9933", letterSpacing: "-0.5px" }}>{value}</span>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: "0.7px", textTransform: "uppercase", fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

export function FollowUpChips({ questions, onSelect }) {
  if (!questions?.length) return null;
  return (
    <div style={{ paddingLeft: 44, marginTop: 8, display: "flex", flexWrap: "wrap", gap: 7 }}>
      {questions.map((q, i) => (
        <button key={i} onClick={() => onSelect(q)}
          style={{ background: "rgba(255,153,51,0.07)", border: "1px solid rgba(255,153,51,0.2)", borderRadius: 20, padding: "6px 14px", color: "rgba(255,255,255,0.68)", fontSize: 12, cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit" }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(255,153,51,0.16)"; e.currentTarget.style.color="#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background="rgba(255,153,51,0.07)"; e.currentTarget.style.color="rgba(255,255,255,0.68)"; }}
        >{q}</button>
      ))}
    </div>
  );
}

export function MicButton({ listening, supported, onToggle, disabled }) {
  if (!supported) return null;
  return (
    <button onClick={onToggle} disabled={disabled && !listening}
      title={listening ? "Stop listening" : "Speak your question"}
      style={{ width: 42, height: 42, borderRadius: "50%", background: listening ? "linear-gradient(135deg,#BC002D,#FF4455)" : "rgba(255,153,51,0.08)", border: listening ? "2px solid rgba(255,80,80,0.55)" : "1px solid rgba(255,153,51,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: (disabled && !listening) ? "not-allowed" : "pointer", transition: "all 0.2s", flexShrink: 0, animation: listening ? "micPulse 1s ease-in-out infinite" : "none", opacity: (disabled && !listening) ? 0.4 : 1, position: "relative" }}>
      {listening ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="11" rx="3" fill="rgba(255,153,51,0.9)"/>
          <path d="M5 11a7 7 0 0 0 14 0" stroke="rgba(255,153,51,0.9)" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <line x1="12" y1="18" x2="12" y2="22" stroke="rgba(255,153,51,0.9)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="8" y1="22" x2="16" y2="22" stroke="rgba(255,153,51,0.9)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
      {listening && <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "2px solid rgba(255,80,80,0.4)", animation: "voiceRing 1s ease-out infinite", pointerEvents: "none" }} />}
    </button>
  );
}

export function SpeakButton({ msgId, text, speakingId, onSpeak }) {
  const isActive = speakingId === msgId;
  return (
    <button onClick={() => onSpeak(msgId, text)}
      title={isActive ? "Stop speaking" : "Read aloud"}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 6, opacity: isActive ? 1 : 0.45, transition: "opacity 0.15s", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
      onMouseLeave={e => e.currentTarget.style.opacity = isActive ? "1" : "0.45"}
    >
      {isActive ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF9933" strokeWidth="2.5" strokeLinecap="round">
          <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      )}
    </button>
  );
}
