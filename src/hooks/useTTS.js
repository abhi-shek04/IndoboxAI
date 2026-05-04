import { useState, useRef, useEffect, useCallback } from "react";

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-•·]\s*/gm, "")
    .replace(/━+/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 800);
}

export function useTTS() {
  const [speakingId, setSpeakingId] = useState(null);
  const utterRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.getVoices(); // Populate voices
    const handler = () => synth.getVoices();
    synth.addEventListener("voiceschanged", handler);
    return () => synth.removeEventListener("voiceschanged", handler);
  }, []);

  const speak = useCallback((id, text) => {
    const synth = synthRef.current;
    if (!synth) return;

    if (speakingId === id) {
      synth.cancel();
      setSpeakingId(null);
      utterRef.current = null;
      return;
    }

    synth.cancel();
    const clean = stripMarkdown(text);
    if (!clean) return;

    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 0.92;
    utt.pitch = 1.05;
    utt.volume = 1;

    const voices = synth.getVoices();
    const preferred =
      voices.find(v => v.lang.startsWith("en") && /samantha|google us|zira|aria/i.test(v.name)) ||
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0];
    
    if (preferred) utt.voice = preferred;

    utt.onstart = () => setSpeakingId(id);
    utt.onend = () => { setSpeakingId(null); utterRef.current = null; };
    utt.onerror = (e) => {
      if (e.error !== "interrupted") console.warn("TTS error:", e.error);
      setSpeakingId(null);
      utterRef.current = null;
    };

    utterRef.current = utt;
    synth.speak(utt);
    setSpeakingId(id);
  }, [speakingId]);

  const stopSpeak = useCallback(() => {
    synthRef.current?.cancel();
    setSpeakingId(null);
    utterRef.current = null;
  }, []);

  return { speak, stopSpeak, speakingId };
}
