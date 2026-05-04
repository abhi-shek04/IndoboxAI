// ═══════════════════════════════════════════════════════════
//  Multi-Provider AI Service — Auto-Fallback Chain
//  Order: Groq → Gemini → Pollinations (always free, no key)
// ═══════════════════════════════════════════════════════════

const CHAT_MODEL_GROQ    = 'llama-3.3-70b-versatile';
const CHAT_MODEL_GEMINI  = 'gemini-2.5-flash';

// ─── Provider Definitions ───────────────────────────────────
const PROVIDERS = {
  groq: {
    name: 'Groq',
    call: async (systemPrompt, messages, maxTokens = 512) => {
      const keys = [
        import.meta.env.VITE_GROQ_API_KEY,
        import.meta.env.VITE_GROQ_API_KEY_2,
        import.meta.env.VITE_GROQ_API_KEY_3,
      ].filter(Boolean);

      if (keys.length === 0) throw new Error('NO_KEY');

      for (const key of keys) {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({
            model: CHAT_MODEL_GROQ,
            messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-6)],
            temperature: 0.7,
            max_tokens: maxTokens,
          }),
        });
        if (res.status === 429) { console.warn('Groq key rate limited, trying next...'); continue; }
        if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.error?.message || 'Groq error'); }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
      }
      throw new Error('RATE_LIMITED'); // All Groq keys exhausted
    },
  },

  gemini: {
    name: 'Gemini',
    call: async (systemPrompt, messages, maxTokens = 512) => {
      const key = import.meta.env.VITE_GEMINI_API_KEY;
      if (!key) throw new Error('NO_KEY');

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL_GEMINI}:generateContent?key=${key}`;
      const formattedMessages = messages.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: formattedMessages,
          generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
        }),
      });
      if (res.status === 429 || res.status === 403) throw new Error('RATE_LIMITED');
      if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.error?.message || 'Gemini error'); }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },
  },

  pollinations: {
    name: 'Pollinations (Free)',
    call: async (systemPrompt, messages) => {
      // 100% free, no key required, always available as final fallback
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-6)],
          temperature: 0.7,
        }),
      });
      if (!res.ok) throw new Error('Pollinations error');
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    },
  },
};

// ─── Fallback Chain ──────────────────────────────────────────
const PROVIDER_ORDER = ['groq', 'gemini', 'pollinations'];

async function callWithFallback(systemPrompt, messages, maxTokens) {
  for (const providerKey of PROVIDER_ORDER) {
    const provider = PROVIDERS[providerKey];
    try {
      console.log(`[AI] Trying provider: ${provider.name}`);
      const result = await provider.call(systemPrompt, messages, maxTokens);
      if (result) {
        console.log(`[AI] Success with: ${provider.name}`);
        return { reply: result, provider: provider.name };
      }
    } catch (err) {
      if (err.message === 'NO_KEY') { continue; }
      if (err.message === 'RATE_LIMITED') { console.warn(`[AI] ${provider.name}: Rate limited.`); continue; }
      console.warn(`[AI] ${provider.name} error: ${err.message}. Trying next...`);
      continue;
    }
  }
  throw new Error("All AI providers are currently unavailable. Please try again in a moment.");
}

export async function callGroq(systemPrompt, messages) {
  return callWithFallback(systemPrompt, messages, 512);
}

export async function getFollowUps(FOLLOWUP_SYSTEM, conversationHistory) {
  try {
    const excerpt = conversationHistory.slice(-4)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 150)}`)
      .join('\n');

    const result = await callWithFallback(
      FOLLOWUP_SYSTEM,
      [{ role: 'user', content: `Conversation:\n${excerpt}\n\nGive 3 short follow-up questions:` }],
      150
    );

    return result
      .split('\n')
      .map(l => l.replace(/^\d+[\).\-\s]*/, '').trim())
      .filter(l => l.length > 5 && l.length < 80)
      .slice(0, 3);
  } catch (err) {
    console.warn('Follow-up skipped:', err.message);
    return [];
  }
}

export async function classifyIntent(INTENT_SYSTEM, userMessage) {
  try {
    const text = await callWithFallback(
      INTENT_SYSTEM,
      [{ role: 'user', content: userMessage }],
      100
    );
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { intent: 'unknown' };
  }
}
