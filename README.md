# Wise King AI Backend

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com → Import repo
3. In **Settings → Environment Variables**, add:
   - `GEMINI_API_KEY` = your real Gemini key (from ai.google.dev)
4. Redeploy

Your backend will be at `https://your-project.vercel.app/api/chat`

## Get a REAL Gemini API key

1. Visit https://aistudio.google.com/apikey
2. Click **Create API key**
3. Copy it (starts with `AIzaSy...`) — this is different from your Firebase key
