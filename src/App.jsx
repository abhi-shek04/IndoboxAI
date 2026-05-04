import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IndoboxLogo, AvatarIcon } from "./components/Branding";
import { FloatingOrbs, TypingDots } from "./components/Effects";
import { FactsTicker, StatPill, MicButton, SpeakButton } from "./components/UIComponents";
import { AgentBanner } from "./components/AgentBanner";
import { useTTS } from "./hooks/useTTS";
import { useSTT } from "./hooks/useSTT";
import { callGroq } from "./services/gemini";
import { buildSystemPrompt, TOPICS } from "./constants/knowledge";
import "./index.css";

const LANG_OPTIONS = [
  { code: "EN", label: "🇬🇧 EN" },
  { code: "JP", label: "🇯🇵 JP" },
  { code: "HI", label: "🇮🇳 HI" },
];

const STORAGE_KEY = "indoboxai_chat_v1";

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} title="Copy response"
      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 6,
        color: copied ? "#FF9933" : "rgba(255,255,255,0.22)", fontSize: 11, fontWeight: 600, transition: "all 0.2s", fontFamily: "inherit" }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function App() {
  const [messages, setMessages]         = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [lang, setLang]                 = useState("EN");
  const [showWelcome, setShowWelcome]   = useState(true);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [errorMsg, setErrorMsg]         = useState(null);
  const [voiceError, setVoiceError]     = useState(null);
  const [lastUserMsg, setLastUserMsg]   = useState(null);
  const [activeProvider, setActiveProvider] = useState(null);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(messages);
  const langRef     = useRef(lang);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  // Persist chat to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
      setShowWelcome(false);
    }
  }, [messages]);

  const { speak, stopSpeak, speakingId } = useTTS();

  const handleVoiceResult = useCallback((transcript) => {
    setVoiceError(null);
    sendMessageDirect(transcript);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVoiceError = useCallback((err) => {
    if (err === "not-supported") setVoiceError("Voice input requires Chrome or Edge browser.");
    else if (err === "not-allowed") setVoiceError("Microphone access denied — please allow mic in browser settings.");
    else if (err !== "no-speech" && err !== "aborted") setVoiceError("Voice error. Please try typing instead.");
  }, []);

  const stt = useSTT({ onResult: handleVoiceResult, onError: handleVoiceError, lang });

  const toggleMic = useCallback(() => {
    if (stt.listening) stt.stop();
    else stt.start();
  }, [stt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!input && textareaRef.current) textareaRef.current.style.height = "auto";
  }, [input]);

  const sendMessageDirect = useCallback(async (text) => {
    if (!text?.trim() || loading) return;
    const trimmed = text.trim();

    setInput("");
    setErrorMsg(null);
    setVoiceError(null);
    setShowWelcome(false);
    setSidebarOpen(false);
    setLastUserMsg(trimmed);
    setActiveProvider(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const prevMessages = messagesRef.current;
    const userMsg = { role: "user", content: trimmed, id: Date.now() };
    const withUser = [...prevMessages, userMsg];
    setMessages(withUser);
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(langRef.current);
      const { reply, provider } = await callGroq(systemPrompt, withUser);
      setActiveProvider(provider);
      const assistantMsg = { role: "assistant", content: reply, id: Date.now() + 1, provider };
      setMessages([...withUser, assistantMsg]);
    } catch (err) {
      console.error("API error:", err);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus?.(), 80);
    }
  }, [loading]);

  const sendMessage = useCallback((textArg) => {
    const text = typeof textArg === "string" ? textArg : input;
    sendMessageDirect(text);
  }, [input, sendMessageDirect]);

  const retryLastMessage = () => {
    if (lastUserMsg) {
      // Remove last assistant message if present
      const msgs = messagesRef.current;
      const trimmed = msgs[msgs.length - 1]?.role === "assistant" ? msgs.slice(0, -1) : msgs;
      setMessages(trimmed);
      setTimeout(() => sendMessageDirect(lastUserMsg), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
    setErrorMsg(null);
    setInput("");
    setLastUserMsg(null);
    setActiveProvider(null);
    stopSpeak();
    localStorage.removeItem(STORAGE_KEY);
  };

  const providerColor = { "Groq": "#7C3AED", "Gemini": "#1A73E8", "Pollinations (Free)": "#16A34A" };

  return (
    <>
      <FloatingOrbs />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100vh", width: "100%", maxWidth: 880, margin: "0 auto", background: "rgba(9,9,9,0.94)", borderLeft: "1px solid rgba(255,153,51,0.06)", borderRight: "1px solid rgba(255,153,51,0.06)" }}>

        {/* HEADER */}
        <header style={{ padding: "0 18px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(11,11,11,0.98)", borderBottom: "1px solid rgba(255,153,51,0.09)", flexShrink: 0, backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IndoboxLogo height={32} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ display: "flex", gap: 3 }}>
              {LANG_OPTIONS.map(({ code, label }) => (
                <button key={code} onClick={() => setLang(code)} className={lang === code ? "lang-active" : ""}
                  style={{ padding: "3px 9px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.42)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setSidebarOpen(p => !p)} title="Quick topics"
              style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,153,51,0.06)", border: "1px solid rgba(255,153,51,0.13)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,153,51,0.75)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {messages.length > 0 && (
              <button onClick={clearChat} title="New conversation"
                style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,60,60,0.05)", border: "1px solid rgba(255,60,60,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,100,100,0.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>
        </header>

        <FactsTicker />

        {/* SIDEBAR */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40, backdropFilter: "blur(2px)" }} />
            <aside className="slide-left" style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 272, zIndex: 50, background: "rgba(12,12,12,0.99)", borderRight: "1px solid rgba(255,153,51,0.11)", display: "flex", flexDirection: "column", boxShadow: "4px 0 28px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,153,51,0.07)" }}>
                <IndoboxLogo height={26} />
                <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.28)", marginTop: 10, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700 }}>Quick Topics</p>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
                {TOPICS.map((t, i) => (
                  <button key={i} className="topic-btn" onClick={() => sendMessage(t.q)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 9, marginBottom: 3, background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,153,51,0.07)", color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 17, flexShrink: 0 }}>{t.icon}</span>
                    <span>{t.label}</span>
                    <span style={{ marginLeft: "auto", color: "rgba(255,153,51,0.28)", fontSize: 13 }}>›</span>
                  </button>
                ))}
              </div>
              <div style={{ padding: "14px 12px", borderTop: "1px solid rgba(255,153,51,0.07)", display: "flex", flexDirection: "column", gap: 6 }}>
                <a href="https://indobox.co.jp/?page_id=80" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", background: "rgba(255,153,51,0.07)", border: "1px solid rgba(255,153,51,0.18)", borderRadius: 9, color: "#FF9933", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                  🌐 Official Website
                </a>
                <a href="https://indigate.jp" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", background: "rgba(188,0,45,0.06)", border: "1px solid rgba(188,0,45,0.18)", borderRadius: 9, color: "#ff6680", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                  🤝 IndiGate Platform
                </a>
              </div>
            </aside>
          </>
        )}

        {/* CHAT AREA */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 4px" }}>

          {showWelcome && messages.length === 0 && (
            <div className="pop-in" style={{ textAlign: "center", padding: "24px 16px 16px" }}>
              <div style={{ display: "inline-block", marginBottom: 18 }}><IndoboxLogo height={42} /></div>
              <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 7, background: "linear-gradient(135deg,#ffffff 20%,#FF9933 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Welcome to IndoboxAI
              </h1>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.38)", marginBottom: 5 }}>日本とインドの融合により、新たな価値を生みだす。</p>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.28)", marginBottom: 24 }}>Ask me anything about Indobox — services, team, India market entry &amp; more.</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 9, flexWrap: "wrap", marginBottom: 26 }}>
                <StatPill value="~7%" label="India GDP" icon="📈" />
                <StatPill value="1.4B" label="Population" icon="🇮🇳" />
                <StatPill value="1400+" label="JP in India" icon="🏢" />
                <StatPill value="2023" label="Founded" icon="🚀" />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 540, margin: "0 auto" }}>
                {TOPICS.map((t, i) => (
                  <button key={i} onClick={() => sendMessage(t.q)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 15px", borderRadius: 22, background: "rgba(255,153,51,0.07)", border: "1px solid rgba(255,153,51,0.17)", color: "rgba(255,255,255,0.72)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.background="rgba(255,153,51,0.14)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="rgba(255,153,51,0.07)"; e.currentTarget.style.transform="translateY(0)"; }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 22, padding: "10px 16px", background: "rgba(255,153,51,0.04)", border: "1px solid rgba(255,153,51,0.1)", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                <span>🎙️</span> Voice input supported — click mic icon to speak (Chrome/Edge)
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              <div className="fade-up" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 4, gap: 9, alignItems: "flex-start" }}>
                {msg.role === "assistant" && <div style={{ flexShrink: 0, marginTop: 2 }}><AvatarIcon size={28} /></div>}
                <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: msg.role === "user" ? "rgba(255,153,51,0.42)" : "rgba(255,255,255,0.25)", textAlign: msg.role === "user" ? "right" : "left", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "center", gap: 6 }}>
                    <span>{msg.role === "user" ? "You" : "IndoboxAI"}</span>
                    <span style={{ fontWeight: 400, opacity: 0.6 }}>{formatTime(msg.id)}</span>
                  </div>
                  <div className="message-content" style={{ padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "linear-gradient(135deg,rgba(255,120,0,0.22),rgba(188,0,45,0.16))" : "rgba(255,255,255,0.038)", border: msg.role === "user" ? "1px solid rgba(255,120,0,0.28)" : "1px solid rgba(255,255,255,0.065)", fontSize: 13.5, lineHeight: 1.7, color: msg.role === "user" ? "rgba(255,255,255,0.92)" : "inherit" }}>
                    {msg.role === "user"
                      ? <span>{msg.content}</span>
                      : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    }
                  </div>
                  {msg.role === "assistant" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 2 }}>
                      <SpeakButton msgId={msg.id} text={msg.content} speakingId={speakingId} onSpeak={speak} />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
                        {speakingId === msg.id ? "Speaking…" : "Read aloud"}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 10 }}>·</span>
                      <CopyButton text={msg.content} />
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 2, background: "linear-gradient(135deg,#FF9933,#BC002D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "white" }}>U</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="fade-up" style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 6 }}>
              <AvatarIcon size={28} />
              <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.038)", border: "1px solid rgba(255,255,255,0.065)", borderRadius: "18px 18px 18px 4px" }}>
                <TypingDots />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="fade-up" style={{ margin: "10px 0", padding: "11px 15px", background: "rgba(255,50,50,0.07)", border: "1px solid rgba(255,50,50,0.18)", borderRadius: 11, color: "rgba(255,155,155,0.9)", fontSize: 13, display: "flex", alignItems: "center", gap: 9 }}>
              <span>⚠️</span>
              <span style={{ flex: 1 }}>{errorMsg}</span>
              {lastUserMsg && (
                <button onClick={retryLastMessage} style={{ background: "rgba(255,100,100,0.12)", border: "1px solid rgba(255,100,100,0.25)", color: "rgba(255,180,180,0.9)", cursor: "pointer", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 7, fontFamily: "inherit" }}>
                  ↺ Retry
                </button>
              )}
              <button onClick={() => setErrorMsg(null)} style={{ background: "none", border: "none", color: "rgba(255,155,155,0.5)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          )}

          {voiceError && (
            <div className="fade-up" style={{ margin: "6px 0", padding: "9px 14px", background: "rgba(255,150,0,0.07)", border: "1px solid rgba(255,150,0,0.2)", borderRadius: 10, color: "rgba(255,190,100,0.9)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🎙️</span>
              <span style={{ flex: 1 }}>{voiceError}</span>
              <button onClick={() => setVoiceError(null)} style={{ background: "none", border: "none", color: "rgba(255,190,100,0.5)", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          )}

          <div ref={bottomRef} style={{ height: 8 }} />
        </div>

        {/* INPUT BAR */}
        <div style={{ padding: "10px 14px 14px", background: "rgba(11,11,11,0.98)", borderTop: "1px solid rgba(255,153,51,0.07)", flexShrink: 0, backdropFilter: "blur(20px)" }}>
          {stt.listening && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, paddingLeft: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF4455", animation: "micPulse 0.8s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, color: "rgba(255,150,150,0.8)", fontWeight: 600 }}>
                Listening in {lang === "JP" ? "Japanese" : lang === "HI" ? "Hindi" : "English"}… speak now
              </span>
            </div>
          )}
          <div className="chat-input-wrap" style={{ display: "flex", gap: 9, alignItems: "flex-end", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,153,51,0.13)", borderRadius: 15, padding: "8px 10px", transition: "border-color 0.2s, box-shadow 0.2s" }}>
            <textarea
              ref={el => { inputRef.current = el; textareaRef.current = el; }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={e => { const t = e.target; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 110) + "px"; }}
              placeholder={lang === "JP" ? "Indoboxについて質問してください..." : lang === "HI" ? "Indobox के बारे में पूछें..." : "Ask anything about Indobox Inc..."}
              rows={1}
              disabled={loading}
              style={{ flex: 1, background: "transparent", border: "none", color: "#e8e8e8", fontSize: 14, resize: "none", fontFamily: "inherit", lineHeight: 1.6, maxHeight: 110, overflowY: "auto", padding: "4px 5px" }}
            />
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <MicButton listening={stt.listening} supported={stt.supported} onToggle={toggleMic} disabled={loading} />
              <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}
                style={{ width: 42, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#FF9933,#e05000)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", flexShrink: 0, boxShadow: "0 2px 14px rgba(255,120,0,0.28)" }}>
                {loading ? (
                  <div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.28)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7, paddingLeft: 3 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.17)" }}>Enter to send · Shift+Enter for new line · 🎙️ mic auto-submits</span>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="mailto:contact@indobox.co.jp" style={{ fontSize: 10.5, color: "rgba(255,153,51,0.35)", textDecoration: "none" }}>contact@indobox.co.jp</a>
              <a href="https://indobox.co.jp" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10.5, color: "rgba(255,153,51,0.35)", textDecoration: "none" }}>indobox.co.jp</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
