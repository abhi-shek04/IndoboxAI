export function FloatingOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {[
        { w: 480, h: 480, l: "-120px", t: "-120px", c: "rgba(255,100,0,0.055)", dur: 18, d: 0 },
        { w: 340, h: 340, l: "60%",    t: "3%",    c: "rgba(188,0,45,0.05)",   dur: 22, d: 4 },
        { w: 260, h: 260, l: "18%",    t: "52%",   c: "rgba(255,210,0,0.03)",  dur: 16, d: 8 },
        { w: 160, h: 160, l: "76%",    t: "62%",   c: "rgba(255,80,0,0.045)",  dur: 20, d: 2 },
      ].map((o, i) => (
        <div key={i} style={{ position: "absolute", width: o.w, height: o.h, borderRadius: "50%", background: `radial-gradient(circle, ${o.c}, transparent 70%)`, left: o.l, top: o.t, animation: `floatOrb ${o.dur}s ease-in-out infinite ${o.d}s` }} />
      ))}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,153,51,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,153,51,0.012) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
    </div>
  );
}

export function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "3px 0" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF9933", animation: `typingDot 1.2s ease-in-out infinite ${i*0.18}s`, opacity: 0.8 }} />
      ))}
    </div>
  );
}
