// api/search.js — Real web search via DuckDuckGo + page scraping
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: cors(),
    });
  }
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  try {
    const { query } = await req.json();
    if (!query) return json({ error: 'Missing query' }, 400);

    // DuckDuckGo Instant Answer API (no key needed)
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl, {
      headers: { 'User-Agent': 'WiseKingAI/1.0' },
    });
    const ddg = await ddgRes.json();

    const results = [];

    if (ddg.AbstractText) {
      results.push({
        title: ddg.Heading || 'Summary',
        snippet: ddg.AbstractText,
        url: ddg.AbstractURL,
      });
    }

    if (Array.isArray(ddg.RelatedTopics)) {
      for (const topic of ddg.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0].slice(0, 80),
            snippet: topic.Text.slice(0, 300),
            url: topic.FirstURL,
          });
        }
      }
    }

    // Wikipedia fallback
    if (results.length === 0) {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      try {
        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wiki = await wikiRes.json();
          if (wiki.extract) {
            results.push({
              title: wiki.title,
              snippet: wiki.extract,
              url: wiki.content_urls?.desktop?.page || '',
            });
          }
        }
      } catch (e) {}
    }

    return json({ query, results, count: results.length });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

