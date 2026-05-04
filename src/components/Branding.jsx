export function IndoboxLogo({ height = 36 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, userSelect: "none" }}>
      <div style={{ width: height, height: height, borderRadius: height * 0.26, position: "relative", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 18px rgba(255,153,51,0.45), 0 2px 8px rgba(0,0,0,0.4)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "33.3%", background: "#FF9933" }} />
        <div style={{ position: "absolute", top: "33.3%", left: 0, right: 0, height: "33.4%", background: "#FFFFFF" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "33.3%", background: "#138808" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: height * 0.54, height: height * 0.54, borderRadius: "50%", background: "#BC002D", boxShadow: "0 1px 6px rgba(0,0,0,0.35)" }} />
      </div>
      <div>
        <div style={{ lineHeight: 1, display: "flex", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: height * 0.56, color: "#FFFFFF", letterSpacing: "-0.5px" }}>Indo</span>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: height * 0.56, color: "#FF9933", letterSpacing: "-0.5px" }}>box</span>
        </div>
        <div style={{ fontSize: height * 0.2, color: "rgba(255,255,255,0.38)", letterSpacing: "2px", fontWeight: 600, textTransform: "uppercase", marginTop: 1 }}>Japan · India Bridge</div>
      </div>
    </div>
  );
}

export function AvatarIcon({ size = 30 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.26, position: "relative", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 12px rgba(255,153,51,0.4)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "33.3%", background: "#FF9933" }} />
      <div style={{ position: "absolute", top: "33.3%", left: 0, right: 0, height: "33.4%", background: "#FFFFFF" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "33.3%", background: "#138808" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: size * 0.52, height: size * 0.52, borderRadius: "50%", background: "#BC002D" }} />
    </div>
  );
}
