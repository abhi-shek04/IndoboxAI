export function AgentBanner({ intent, action, onDismiss }) {
  if (!intent || intent === "general") return null;

  const configs = {
    contact:     { icon: "📧", color: "#FF9933", label: "Ready to connect?", link: "mailto:contact@indobox.co.jp", linkLabel: "Email Now" },
    pricing:     { icon: "💰", color: "#4CAF50", label: "Explore pricing",    link: "https://indobox.co.jp/?page_id=475", linkLabel: "View Pricing" },
    demo_request:{ icon: "🚀", color: "#2196F3", label: "Book a free demo",   link: "mailto:contact@indobox.co.jp?subject=Demo Request", linkLabel: "Request Demo" },
    job_inquiry: { icon: "💼", color: "#9C27B0", label: "Career opportunity",  link: "mailto:contact@indobox.co.jp?subject=Job Inquiry", linkLabel: "Apply Now" },
    partnership: { icon: "🤝", color: "#FF5722", label: "Explore partnership", link: "mailto:contact@indobox.co.jp?subject=Partnership Inquiry", linkLabel: "Get in Touch" },
  };

  const cfg = configs[intent] || configs.contact;

  return (
    <div className="fade-up" style={{ margin: "8px 0 4px 44px", padding: "10px 14px", background: `rgba(${cfg.color === "#FF9933" ? "255,153,51" : cfg.color === "#4CAF50" ? "76,175,80" : cfg.color === "#2196F3" ? "33,150,243" : cfg.color === "#9C27B0" ? "156,39,176" : "255,87,34"},0.08)`, border: `1px solid ${cfg.color}33`, borderRadius: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 16 }}>{cfg.icon}</span>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: cfg.color, letterSpacing: "0.5px", textTransform: "uppercase" }}>{cfg.label}</div>
        {action && <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{action}</div>}
      </div>
      <a href={cfg.link} target="_blank" rel="noopener noreferrer"
        style={{ padding: "5px 13px", background: cfg.color, borderRadius: 8, color: "#000", fontSize: 11.5, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>
        {cfg.linkLabel}
      </a>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>✕</button>
    </div>
  );
}
