"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MODES, TEAMMATE_SPECIALIZATIONS, type InterviewMode, type TeammateSpecialization } from "@/lib/constants";

const modeCopy: Record<InterviewMode, string> = {
  assessment: "Minimal help. Highest interview pressure and the strictest evaluation framing.",
  practice: "Balanced challenge with directional nudges when you drift or skip a critical step.",
  coaching: "Guided mode with richer collaboration and more explicit support from the room.",
};

export function StartInterviewPage() {
  const router = useRouter();
  const createSession = useMutation(api.sessions.createSession);
  const [isPending, startTransition] = useTransition();
  const [candidateName, setCandidateName] = useState("Avi");
  const [mode, setMode] = useState<InterviewMode>("practice");
  const [teammateSpecialization, setTeammateSpecialization] =
    useState<TeammateSpecialization>("sre_infra");
  const [error, setError] = useState<string | null>(null);

  const selectedTeammate = useMemo(
    () =>
      TEAMMATE_SPECIALIZATIONS.find((entry) => entry.value === teammateSpecialization) ??
      TEAMMATE_SPECIALIZATIONS[0],
    [teammateSpecialization],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await createSession({
          candidateName: candidateName.trim() || "Candidate",
          mode,
          teammateSpecialization,
        });
        router.push(`/interview/${result.sessionPublicId}`);
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Unable to create the interview room.",
        );
      }
    });
  }

  return (
    <main className="page-shell">
      <div className="hero-grid">
        <div className="brand-lockup">
          <div className="brand-gem">
            <div className="brand-dot" />
          </div>
          <div className="brand-name">Aperture</div>
        </div>

        <section className="hero-layout">
          <div className="hero-copy glass-panel">
            <div className="eyebrow">
              <span className="live-dot" />
              Multi-Agent Interview Room
            </div>
            <h1 className="hero-title">Practice a real system design room, not a chatbot.</h1>
            <p className="hero-subtitle">
              Launch a dual-channel interview with a formal interviewer and a specialist teammate.
              The session stays phase-driven, evidence-backed, and fully integrated with Convex so
              every turn, signal, note, and final report stays live.
            </p>

            <div className="hero-stats">
              <div className="stat-card glass-panel">
                <div className="stat-value">2</div>
                <div className="stat-label">Active agents</div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-value">6</div>
                <div className="stat-label">Interview phases</div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-value">1</div>
                <div className="stat-label">Evidence-backed report</div>
              </div>
            </div>
          </div>

          <form className="hero-card glass-panel" onSubmit={onSubmit}>
            <div>
              <div className="section-title">Session setup</div>
              <h2 className="section-heading">Start Interview</h2>
              <p className="section-copy">
                The room follows the UI contract in `UI.md`: formal interviewer lane, teammate lane,
                private scratch pad, live signals, and a final report with PDF export.
              </p>
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="field-label">Candidate name</span>
                <input
                  className="text-input"
                  value={candidateName}
                  onChange={(event) => setCandidateName(event.target.value)}
                  placeholder="Enter your name"
                />
              </label>

              <div className="field">
                <span className="field-label">Mode</span>
                <div className="segmented">
                  {MODES.map((entry) => (
                    <button
                      key={entry}
                      className="choice-card"
                      data-selected={mode === entry}
                      type="button"
                      onClick={() => setMode(entry)}
                    >
                      <span className="choice-pill">{entry}</span>
                      <span className="choice-card__title">
                        {entry.charAt(0).toUpperCase() + entry.slice(1)}
                      </span>
                      <span className="choice-card__copy">{modeCopy[entry]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span className="field-label">Teammate specialization</span>
                <div className="segmented segmented--two">
                  {TEAMMATE_SPECIALIZATIONS.map((entry) => (
                    <button
                      key={entry.value}
                      className="choice-card"
                      data-selected={teammateSpecialization === entry.value}
                      type="button"
                      onClick={() => setTeammateSpecialization(entry.value)}
                    >
                      <span className="choice-pill">{entry.shortLabel}</span>
                      <span className="choice-card__title">{entry.name}</span>
                      <span className="choice-card__copy">
                        Specialist lens: {entry.label}. This agent challenges assumptions without
                        solving the interview for you.
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mini-card glass-panel">
              <div className="section-title">Interview contract</div>
              <p className="section-copy">
                Scenario: Real-Time Chat at Scale. The teammate for this run will be{" "}
                <strong>{selectedTeammate.name}</strong> from the <strong>{selectedTeammate.label}</strong>{" "}
                track.
              </p>
            </div>

            {error ? <div className="error-copy">{error}</div> : null}

            <div className="button-row">
              <button className="primary-button" disabled={isPending} type="submit">
                {isPending ? "Opening room..." : "Start interview"}
              </button>
              <div className="status-copy">
                Convex handles the session state, channels, notes, live signals, and report flow in
                the same Next.js app.
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
