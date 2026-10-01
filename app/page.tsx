"use client";

import { FormEvent, useEffect, useState } from "react";

type GradeResult = {
  score: number;
  missing: string[];
};

const BAD_PROMPT = "Write an engaging Instagram caption for this app.";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/grade", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAttempted(Boolean(data.attempted)))
      .catch(() => {})
      .finally(() => setCheckingAttempt(false));
  }, []);

  async function submitPrompt(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || attempted || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) setAttempted(true);
        throw new Error(data.error || "Could not grade your prompt.");
      }

      setResult(data);
      setAttempted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div className="eyebrow"><span className="dot" /> PROMPT LAB</div>
        <h1>One prompt.<br />One shot.</h1>
        <p>
          Rewrite a weak prompt into one that gives an AI everything it needs to create a strong Instagram caption.
          Gemini grades your first successful submission out of 100.
        </p>
      </header>

      <section className="brief card">
        <div>
          <span className="label">THE SCENARIO</span>
          <h2>Launch caption for FocusFlow</h2>
        </div>
        <div className="briefGrid">
          <p><b>Product</b><span>FocusFlow, an AI study-planning app launching today.</span></p>
          <p><b>Audience</b><span>University students aged 18–24.</span></p>
          <p><b>Key value</b><span>Turns deadlines into a realistic daily study plan in seconds.</span></p>
          <p><b>Goal</b><span>Build curiosity and drive people to try the app.</span></p>
        </div>
      </section>

      <section className="workspace">
        <article className="card badCard">
          <div className="cardTop">
            <span className="label">BAD PROMPT</span>
            <span className="pill bad">Too vague</span>
          </div>
          <p className="badPrompt">“{BAD_PROMPT}”</p>
          <div className="whyBad">
            <span>Missing audience</span>
            <span>Missing tone</span>
            <span>Missing format</span>
            <span>Missing CTA</span>
          </div>
        </article>

        <form className="card goodCard" onSubmit={submitPrompt}>
          <div className="cardTop">
            <span className="label">YOUR BETTER PROMPT</span>
            <span className="pill">1 attempt</span>
          </div>

          <textarea
            aria-label="Your improved prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write the prompt you would give an AI..."
            maxLength={5000}
            disabled={attempted || loading || checkingAttempt}
          />

          <div className="inputFooter">
            <span>{prompt.length}/5000</span>
            <button disabled={!prompt.trim() || attempted || loading || checkingAttempt}>
              {checkingAttempt ? "Checking…" : loading ? "Grading…" : attempted ? "Attempt used" : "Grade my prompt"}
            </button>
          </div>

          {error && <p className="error">{error}</p>}
        </form>
      </section>

      {result && (
        <section className="result card" aria-live="polite">
          <div className="scoreWrap">
            <span className="label">YOUR SCORE</span>
            <div className="score">{result.score}<small>/100</small></div>
            <p>
              {result.score >= 85
                ? "Excellent prompt."
                : result.score >= 70
                  ? "Strong foundation."
                  : result.score >= 50
                    ? "Decent, but important context is missing."
                    : "The AI still has to guess too much."}
            </p>
          </div>

          <div className="missing">
            <span className="label">WHAT YOU FAILED TO MENTION</span>
            {result.missing.length === 0 ? (
              <div className="perfect">Nothing critical — your prompt covered the full rubric.</div>
            ) : (
              <ul>{result.missing.map((item) => <li key={item}>{item}</li>)}</ul>
            )}
          </div>
        </section>
      )}

      {!result && attempted && !checkingAttempt && (
        <section className="used card">
          <span className="label">ATTEMPT COMPLETE</span>
          <p>This browser has already used its one grading attempt.</p>
        </section>
      )}

      <footer>Prompt quality is graded against a fixed rubric, not prompt length.</footer>
    </main>
  );
}
