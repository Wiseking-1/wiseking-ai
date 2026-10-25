// api/chat.js — Wise King AI Backend Proxy
export const config = { runtime: 'edge' };

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_TOKENS = 8192;

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const { contents, systemInstruction, model } = body;

    if (!contents || !Array.isArray(contents)) {
      return json({ error: 'Missing "contents" array' }, 400);
    }

    // Get API key from env (set this in Vercel dashboard)
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return json({ error: 'Server misconfigured: GEMINI_API_KEY missing' }, 500);
    }

    const useModel = model || GEMINI_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${GEMINI_KEY}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: systemInstruction || undefined,
        contents: contents,
        generationConfig: {
          maxOutputTokens: MAX_TOKENS,
          temperature: 0.8,
          topP: 0.95,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', geminiRes.status, errText);
      return json({
        error: 'Gemini API error',
        status: geminiRes.status,
        detail: errText.slice(0, 500),
      }, geminiRes.status);
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!reply) {
      return json({ error: 'Empty response from Gemini', raw: data }, 502);
    }

    return json({ reply, provider: 'gemini', model: useModel });

  } catch (err) {
    console.error('Backend error:', err);
    return json({ error: err.message || 'Unknown server error' }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
