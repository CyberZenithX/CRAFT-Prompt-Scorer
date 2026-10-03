"use client";

import { FormEvent, useEffect, useState } from "react";

type GradeResult = {
  score: number;
  missing: string[];
};

type AttemptRecord = {
  prompt: string;
  score: number;
  missing: string[];
};

const BAD_PROMPT = "Write a nice Instagram caption about our coffee.";
const HISTORY_KEY = "prompt_lab_attempt_history_v1";
const DRAFT_KEY = "prompt_lab_draft_v1";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [canAttempt, setCanAttempt] = useState(true);
  const [checkingAttempt, setCheckingAttempt] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let savedHistory: AttemptRecord[] = [];

    try {
      const rawHistory = localStorage.getItem(HISTORY_KEY);
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) {
          savedHistory = parsed.filter(
            (item) =>
              item &&
              typeof item.prompt === "string" &&
              typeof item.score === "number" &&
              Array.isArray(item.missing)
          );
          setHistory(savedHistory);
        }
      }

      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) setPrompt(savedDraft);
    } catch {
      // Ignore malformed browser storage and continue with server state.
    }

    fetch("/api/grade", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const used = Number(data.attemptsUsed) || 0;
        const limit = Number(data.attemptLimit) || 1;
        const allowed = Boolean(data.canAttempt);

        setAttemptsUsed(used);
        setAttemptLimit(limit);
        setCanAttempt(allowed);

        // Completed attempts should open in read-only mode. If this browser
        // predates prompt-history storage, we can still restore the server result.
        if (savedHistory.length > 0 || used > 0) {
          setShowEditor(false);
        }

        if (
          savedHistory.length === 0 &&
          data.result &&
          typeof data.result.score === "number" &&
          Array.isArray(data.result.missing)
        ) {
          setHistory([
            {
              prompt: "",
              score: data.result.score,
              missing: data.result.missing
            }
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAttempt(false));
  }, []);

  useEffect(() => {
    if (showEditor && prompt) {
      localStorage.setItem(DRAFT_KEY, prompt);
    } else if (!prompt) {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [prompt, showEditor]);

  function startAnotherAttempt() {
    if (!canAttempt) return;
    setPrompt("");
    setError("");
    localStorage.removeItem(DRAFT_KEY);
    setShowEditor(true);
  }

  async function submitPrompt(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || !canAttempt || loading) return;

    const submittedPrompt = prompt.trim();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: submittedPrompt })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setCanAttempt(false);
          if (typeof data.attemptsUsed === "number") setAttemptsUsed(data.attemptsUsed);
          if (typeof data.attemptLimit === "number") setAttemptLimit(data.attemptLimit);
        }
        throw new Error(data.error || "Could not grade your prompt.");
      }

      const record: AttemptRecord = {
        prompt: submittedPrompt,
        score: data.score,
        missing: Array.isArray(data.missing) ? data.missing : []
      };

      const updatedHistory = [...history.filter((item) => item.prompt !== ""), record];
      setHistory(updatedHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      localStorage.removeItem(DRAFT_KEY);

      const newAttemptsUsed = Number(data.attemptsUsed) || attemptsUsed + 1;
      const newAttemptLimit = Number(data.attemptLimit) || attemptLimit;
      setAttemptsUsed(newAttemptsUsed);
      setAttemptLimit(newAttemptLimit);
      setCanAttempt(Boolean(data.canAttempt));
      setPrompt("");
      setShowEditor(false);
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
        <h1>One prompt.<br />Make it count.</h1>
        <p>
          Turn a vague request into a clear, useful prompt for an Instagram coffee caption.
          Give the AI the information it needs, then see how your prompt scores.
        </p>
      </header>

      <section className="brief card">
        <div>
          <span className="label">THE SCENARIO</span>
          <h2>Instagram caption for La Lumière Café</h2>
        </div>
        <div className="briefGrid">
          <p><b>Café</b><span>La Lumière Café — a premium, modern café.</span></p>
          <p><b>Coffee</b><span>A signature iced Spanish latte with rich espresso and a smooth, creamy taste.</span></p>
          <p><b>Audience</b><span>Young coffee lovers who enjoy premium café experiences.</span></p>
          <p><b>Goal</b><span>Make people want to visit the café and try the drink.</span></p>
        </div>
      </section>

      <section className="promptGuide">
        <div className="guideHeader">
          <div>
            <span className="label">THE CRAFT FRAMEWORK</span>
            <h2>Five ingredients. 100 points.</h2>
          </div>
          <p>
            Context, Role, Action, Format, and Tone. Each is worth 20 points; useful detail matters more than length.
          </p>
        </div>

        <div className="guideGrid craftGuide">
          <article className="guideCard">
            <span className="guideNumber">C · 20 POINTS</span>
            <h3>Context</h3>
            <p>Name the café, drink, its key qualities, and the audience.</p>
          </article>
          <article className="guideCard">
            <span className="guideNumber">R · 20 POINTS</span>
            <h3>Role</h3>
            <p>Give the AI a relevant role, such as a social media copywriter.</p>
          </article>
          <article className="guideCard">
            <span className="guideNumber">A · 20 POINTS</span>
            <h3>Action</h3>
            <p>Ask for an Instagram caption, a strong hook, and a call to visit or try the drink.</p>
          </article>
          <article className="guideCard">
            <span className="guideNumber">F · 20 POINTS</span>
            <h3>Format</h3>
            <p>Specify length, number of options, layout, and emoji and hashtag preferences.</p>
          </article>
          <article className="guideCard">
            <span className="guideNumber">T · 20 POINTS</span>
            <h3>Tone</h3>
            <p>Choose a voice that suits the café and audience, with wording to avoid.</p>
          </article>
        </div>
      </section>

      {history.length === 0 && showEditor && (
        <section className="workspace">
          <article className="card badCard">
            <div className="cardTop">
              <span className="label">BAD PROMPT</span>
              <span className="pill bad">Too vague</span>
            </div>
            <p className="badPrompt">“{BAD_PROMPT}”</p>
            <p className="badNote">
              The AI has to make almost every important decision itself.
            </p>
          </article>

          <PromptForm
            prompt={prompt}
            setPrompt={setPrompt}
            submitPrompt={submitPrompt}
            loading={loading}
            checkingAttempt={checkingAttempt}
            canAttempt={canAttempt}
            attemptsUsed={attemptsUsed}
            attemptLimit={attemptLimit}
            error={error}
          />
        </section>
      )}

      {history.length > 0 && (
        <section className="attemptsSection">
          <div className="attemptsHeader">
            <div>
              <span className="label">YOUR ATTEMPTS</span>
              <h2>Your submitted prompt{history.length > 1 ? "s" : ""}</h2>
            </div>
            <span className="pill">{Math.max(0, attemptLimit - attemptsUsed)} of {attemptLimit} left</span>
          </div>

          <div className="attemptList">
            {history.map((attempt, index) => (
              <article className="attemptCard card" key={index}>
                <div className="attemptPrompt">
                  <div className="cardTop">
                    <span className="label">ATTEMPT {index + 1} · YOUR PROMPT</span>
                    <span className="readOnlyBadge">READ ONLY</span>
                  </div>
                  {attempt.prompt ? (
                    <p>{attempt.prompt}</p>
                  ) : (
                    <p className="legacyPrompt">
                      This score was created before prompt saving was enabled, so the original prompt cannot be restored.
                    </p>
                  )}
                </div>

                <div className="attemptFeedback">
                  <div className="attemptScore">
                    <span className="label">SCORE</span>
                    <strong>{attempt.score}<small>/100</small></strong>
                  </div>

                  <div className="recommendations">
                    <span className="label">AI RECOMMENDATIONS</span>
                    {attempt.missing.length === 0 ? (
                      <div className="perfect">No major improvements suggested.</div>
                    ) : (
                      <ul>
                        {attempt.missing.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && canAttempt && !showEditor && !checkingAttempt && (
        <section className="retryBar card">
          <div>
            <span className="label">ANOTHER TRY AVAILABLE</span>
            <p>You have {Math.max(0, attemptLimit - attemptsUsed)} attempt{Math.max(0, attemptLimit - attemptsUsed) === 1 ? "" : "s"} remaining.</p>
          </div>
          <button onClick={startAnotherAttempt}>Make another attempt</button>
        </section>
      )}

      {history.length > 0 && showEditor && canAttempt && (
        <section className="retryEditor">
          <div className="retryEditorHeader">
            <div>
              <span className="label">NEW ATTEMPT</span>
              <h2>Try improving your prompt</h2>
            </div>
            <span className="pill">{Math.max(0, attemptLimit - attemptsUsed)} of {attemptLimit} left</span>
          </div>

          <PromptForm
            prompt={prompt}
            setPrompt={setPrompt}
            submitPrompt={submitPrompt}
            loading={loading}
            checkingAttempt={checkingAttempt}
            canAttempt={canAttempt}
            attemptsUsed={attemptsUsed}
            attemptLimit={attemptLimit}
            error={error}
          />
        </section>
      )}

      {!canAttempt && history.length > 0 && !checkingAttempt && (
        <section className="used card">
          <span className="label">ATTEMPTS COMPLETE</span>
          <p>Your submitted prompt, score, and AI recommendations are saved above.</p>
        </section>
      )}

      <footer>Prompt quality is graded using CRAFT: Context, Role, Action, Format, and Tone.</footer>
    </main>
  );
}

function PromptForm({
  prompt,
  setPrompt,
  submitPrompt,
  loading,
  checkingAttempt,
  canAttempt,
  attemptsUsed,
  attemptLimit,
  error
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  submitPrompt: (event: FormEvent) => void;
  loading: boolean;
  checkingAttempt: boolean;
  canAttempt: boolean;
  attemptsUsed: number;
  attemptLimit: number;
  error: string;
}) {
  return (
    <form className="card goodCard standaloneForm" onSubmit={submitPrompt}>
      <div className="cardTop">
        <span className="label">YOUR BETTER PROMPT</span>
        <span className="pill">{Math.max(0, attemptLimit - attemptsUsed)} of {attemptLimit} left</span>
      </div>

      <textarea
        aria-label="Your improved prompt"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Write the prompt you would give an AI..."
        maxLength={5000}
        disabled={!canAttempt || loading || checkingAttempt}
        autoFocus={attemptsUsed > 0}
      />

      <div className="inputFooter">
        <span>{prompt.length}/5000</span>
        <button disabled={!prompt.trim() || !canAttempt || loading || checkingAttempt}>
          {checkingAttempt ? "Checking…" : loading ? "Grading…" : "Grade my prompt"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
