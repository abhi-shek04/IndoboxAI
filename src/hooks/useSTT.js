import { useState, useRef, useCallback } from "react";

export function useSTT({ onResult, onError, lang }) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recRef = useRef(null);
  const langRef = useRef(lang);
  langRef.current = lang; // Always keep in sync without re-creating callbacks

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onError?.("not-supported"); return; }

    if (recRef.current) {
      try { recRef.current.abort(); } catch (_) {}
      recRef.current = null;
    }

    // Compute language at call time from ref — not from stale closure
    const sttLang = langRef.current === "JP" ? "ja-JP"
                  : langRef.current === "HI" ? "hi-IN"
                  : "en-US";

    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = sttLang;
      rec.maxAlternatives = 1;

      rec.onstart = () => setListening(true);

      rec.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map(r => r[0].transcript)
          .join(" ")
          .trim();
        if (transcript) onResult(transcript);
      };

      rec.onerror = (e) => {
        setListening(false);
        recRef.current = null;
        if (e.error === "not-allowed") onError?.("not-allowed");
        else if (e.error !== "no-speech" && e.error !== "aborted") onError?.(e.error);
      };

      rec.onend = () => {
        setListening(false);
        recRef.current = null;
      };

      recRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("STT start failed:", err);
      setListening(false);
      onError?.("start-failed");
    }
  }, [onResult, onError]); // No sttLang dependency — reads from ref at call time

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch (_) {}
    recRef.current = null;
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}
