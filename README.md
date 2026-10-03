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
- `RESULT_COOKIE_SECRET` — recommended; signs persisted grading results. If omitted, the server falls back to `GEMINI_API_KEY` for signing.
- `ATTEMPT_LIMIT` — global number of successful grading attempts allowed per browser. Defaults to `1`.

No custom build settings are needed. Vercel will detect Next.js automatically.

The Gemini API key remains server-side and is never exposed to the browser.

## Grading

Gemini scores submitted prompts using **CRAFT**, with five equally weighted categories:

| Category | Points | What is evaluated |
| --- | --- | --- |
| Context | 20 | Café positioning, drink identity and qualities, target audience |
| Role | 20 | An explicit, relevant copywriter or social media expert perspective |
| Action | 20 | Instagram caption request, attention-grabbing hook, relevant call to action |
| Format | 20 | Length, number of options/layout, emoji and hashtag guidance |
| Tone | 20 | Clear voice, fit for the brand/audience, useful wording boundaries |

The fixed scenario remains La Lumière Café's iced Spanish latte. The scenario is a grading reference; the user must communicate the relevant details in their prompt to earn credit. CRAFT headings are optional, equivalent wording counts, and prompt length itself does not earn points.

Gemini returns structured JSON with `score`, `categoryScores`, and `missing`. The server checks that each category is an integer from 0 to 20 and that their sum matches the total. Invalid responses do not consume an attempt. Missing requirements are prefixed with their CRAFT category. The public score/missing response and saved-result format remain compatible with existing attempts; previous scores are not regraded.

The Gemini request is stateless (`store: false`). The rubric and result validation live in `app/api/grade/craft.ts`.

Run the dependency-free CRAFT validation tests with Node.js 22.13+:

```bash
node tests/craft.test.mjs
```

## Attempt-limit rule

After each successful grade, the API increments a signed attempt counter and stores the latest score plus missing-items list in an HTTP-only cookie for one year. On reload, the server verifies the signed state, returns the saved result, and compares `attemptsUsed` against the current `ATTEMPT_LIMIT`. Failed API calls do not consume an attempt.

This is intentionally lightweight for a workshop or exercise. It prevents normal refresh-and-retry behavior, but clearing cookies or switching devices/browsers resets access. True one-attempt-per-person enforcement would require authentication plus persistent storage.


### Raising the limit later

Set `ATTEMPT_LIMIT=1` initially. If everyone has exhausted one attempt and you later change the Vercel environment variable to `ATTEMPT_LIMIT=2`, users with one recorded attempt will have one attempt remaining after the new deployment is active. No cookie reset or database migration is needed.

Existing users from the original one-attempt version are migrated automatically and count as having used one attempt.
