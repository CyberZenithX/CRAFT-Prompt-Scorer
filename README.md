# Good Prompt Analyzer

A one-shot prompt-writing exercise. Users see a deliberately weak prompt for generating an engaging Instagram caption, write a better version, and receive a Gemini score out of 100 plus the rubric requirements they missed.

## Stack

- Next.js App Router
- TypeScript
- Gemini Interactions API, called only from the server
- Vercel-ready
- No database required

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
# Optional:
GEMINI_MODEL=gemini-3.8-flash
```

3. Run:

```bash
npm run dev
```

## Vercel

Import this GitHub repository into Vercel and add this environment variable:

- `GEMINI_API_KEY` — required

Optional:

- `GEMINI_MODEL` — defaults to `gemini-3.8-flash`

No custom build settings are needed. Vercel will detect Next.js automatically.

The Gemini API key remains server-side and is never exposed to the browser.

## Grading

Gemini receives a fixed 100-point rubric covering:

- task and deliverable clarity
- product context
- audience
- core value proposition
- communication goal
- tone and voice
- content guidance
- Instagram-aware formatting
- CTA
- constraints and quality controls

Structured JSON output is required, so the application receives only a numeric score and an array of missing requirements. The Gemini request is stateless (`store: false`).

Prompt length itself does not earn points.

## One-attempt rule

After a successful grade, the API sets an HTTP-only cookie for one year and rejects later submissions from that browser. Failed API calls do not consume the attempt.

This is intentionally lightweight for a workshop or exercise. It prevents normal refresh-and-retry behavior, but clearing cookies or switching devices/browsers resets access. True one-attempt-per-person enforcement would require authentication plus persistent storage.
