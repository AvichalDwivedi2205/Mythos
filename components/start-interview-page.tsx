"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MODES, PHASES, type InterviewMode } from "@/lib/constants";
import { formatPhaseLabel } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildInterviewBlueprint, makeResumeProfile } from "@/lib/interview-blueprint";
import { INTERVIEW_JOB_DESCRIPTION } from "@/lib/interview-config";

const modeCopy: Record<InterviewMode, { short: string; detail: string }> = {
  assessment: {
    short: "Assessment",
    detail: "Minimal help. Highest pressure and strictest framing.",
  },
  practice: {
    short: "Practice",
    detail: "Balanced challenge with directional nudges when you drift.",
  },
  coaching: {
    short: "Coaching",
    detail: "Guided mode with richer collaboration from the room.",
  },
};

export function StartInterviewPage() {
  const router = useRouter();
  const createSession = useMutation(api.sessions.createSession);
  const [isPending, startTransition] = useTransition();
  const [candidateName, setCandidateName] = useState("Avi");
  const [mode, setMode] = useState<InterviewMode>("practice");
  const [resumeText, setResumeText] = useState("");
  const [resumeSummary, setResumeSummary] = useState("");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blueprintPreview = useMemo(() => {
    return buildInterviewBlueprint({
      candidateName: candidateName.trim() || "Candidate",
      jobDescription: INTERVIEW_JOB_DESCRIPTION,
      resumeSummary,
      resumeText,
      teammateSpecializationOverride: null,
    });
  }, [candidateName, resumeSummary, resumeText]);

  async function onResumeFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setError(null);
    setOcrBusy(true);
    try {
      const body = new FormData();
      body.set("resume", file);
      const response = await fetch("/api/resume-ocr", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        error?: string;
        candidateName?: string | null;
        summary?: string;
        skills?: string[];
        resumeText?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Resume OCR failed.");
      }

      const profile = makeResumeProfile({
        candidateName: payload.candidateName,
        summary: payload.summary,
        skills: payload.skills,
        resumeText: payload.resumeText,
      });

      setResumeFileName(file.name);
      setResumeText(profile.resumeText);
      setResumeSummary(profile.summary || profile.resumeText.slice(0, 400));
      if (profile.candidateName && !candidateName.trim()) {
        setCandidateName(profile.candidateName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read that resume.");
    } finally {
      setOcrBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await createSession({
          candidateName: candidateName.trim() || "Candidate",
          mode,
          jobDescription: INTERVIEW_JOB_DESCRIPTION,
          resumeText: resumeText.trim(),
          resumeSummary: resumeSummary.trim() || resumeText.trim().slice(0, 600),
          ...(resumeFileName?.trim() ? { resumeFileName: resumeFileName.trim() } : {}),
        });
        router.push(`/interview/${result.sessionPublicId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to create the interview room.");
      }
    });
  }

  return (
    <main className="page-shell page-shell--interview">
      <div className="interview-shell">
        <aside className="sidebar gpanel" id="left">
          <div className="brand">
            <div className="bgem">
              <div className="gdot" />
            </div>
            <span className="bname">Aperture</span>
          </div>

          <div>
            <div className="rl" style={{ marginBottom: 7 }}>
              Scenario
            </div>
            <div className="ag" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="agav avi" style={{ width: 20, height: 20, fontSize: 9 }}>
                  SC
                </div>
                <div className="agn" style={{ fontSize: 12 }}>
                  {blueprintPreview.title}
                </div>
              </div>
              <div className="agr" style={{ paddingLeft: 28 }}>
                {blueprintPreview.subtitle} · matched from JD + resume
              </div>
            </div>
          </div>

          <div>
            <div className="rl" style={{ marginBottom: 7 }}>
              Phases
            </div>
            <div className="phases">
              {PHASES.map((phase) => (
                <div key={phase} className="ph pending">
                  <div className="pip" />
                  <span className="phn">{formatPhaseLabel(phase)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="rl" style={{ marginBottom: 7 }}>
              In this room
            </div>
            <div className="agents">
              <div className="ag">
                <div className="agav avi">I</div>
                <div className="agin">
                  <div className="agn">Interviewer</div>
                  <div className="agr">Formal · structured</div>
                </div>
              </div>
              <div className="ag">
                <div className="agav avt">
                  {(blueprintPreview.teammateName.charAt(0) || "T").toUpperCase()}
                </div>
                <div className="agin">
                  <div className="agn">{blueprintPreview.teammateName}</div>
                  <div className="agr">{blueprintPreview.teammateLabel} · auto-matched</div>
                </div>
              </div>
            </div>
          </div>

          <div className="spacer" />

          <div className="rfoot">
            <div className="mbadge2">{modeCopy[mode].short}</div>
            <div className="fbtns">
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <section className="room-main" id="center">
          <div className="ctop gpanel">
            <div>
              <div className="sname">Start a new session</div>
              <div className="ssub">Configure and launch your interview room</div>
            </div>
            <div className="pchip">
              <span className="pcdot" />
              Not started
            </div>
          </div>

          <div className="tabs gpanel">
            <div className="tab on-i" style={{ cursor: "default" }}>
              <span className="tav tavi">C</span>
              Candidate
              <span className="tsdot" />
            </div>
            <div className="tab" style={{ cursor: "default", opacity: 0.45 }}>
              <span className="tav tavi">I</span>
              Interviewer
            </div>
            <div className="tab" style={{ cursor: "default", opacity: 0.45 }}>
              <span className="tav avt">
                {(blueprintPreview.teammateName.charAt(0) || "T").toUpperCase()}
              </span>
              {blueprintPreview.teammateName}
            </div>
          </div>

          <div className="conversation">
            <form className="msgs setup-form" id="mi" onSubmit={onSubmit}>
              <div className="sysln">
                <span>
                  Session setup · Problem is generated from your job description and resume · Rubric v3.0
                </span>
              </div>

              <div className="setup-section">
                <div className="rl" style={{ marginBottom: 8 }}>
                  Resume (optional)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <label className="primary-button" style={{ cursor: "pointer", margin: 0 }}>
                    {ocrBusy ? "Reading resume…" : "Upload resume"}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                      className="sr-only"
                      disabled={ocrBusy || isPending}
                      onChange={(ev) => void onResumeFileChange(ev)}
                      style={{ display: "none" }}
                    />
                  </label>
                  {resumeFileName ? (
                    <span style={{ fontSize: 12, color: "var(--txt2)" }}>{resumeFileName}</span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--txt2)" }}>
                      PDF or image
                    </span>
                  )}
                </div>
              </div>

              <div className="setup-section">
                <div className="rl" style={{ marginBottom: 8 }}>
                  Role description (fixed for this room)
                </div>
                <div
                  className="inp setup-inp"
                  style={{
                    minHeight: 100,
                    resize: "none",
                    userSelect: "text",
                    opacity: 0.92,
                    cursor: "default",
                  }}
                >
                  {INTERVIEW_JOB_DESCRIPTION}
                </div>
                <div className="inh" style={{ marginTop: 6 }}>
                  Scenario is inferred from this posting plus your resume. Override with{" "}
                  <code className="mono-pill">NEXT_PUBLIC_INTERVIEW_JOB_DESCRIPTION</code> at build
                  time if needed.
                </div>
              </div>

              <div className="setup-section">
                <div className="rl" style={{ marginBottom: 8 }}>
                  Your name
                </div>
                <input
                  className="inp setup-inp"
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="phdiv">Interview mode</div>
              <div className="setup-section">
                <div className="setup-choice-grid">
                  {MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`setup-choice${mode === m ? " setup-choice--on" : ""}`}
                      onClick={() => setMode(m)}
                    >
                      <div className="setup-choice__pill">{modeCopy[m].short}</div>
                      <div className="setup-choice__detail">{modeCopy[m].detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="phdiv">Resume summary (editable)</div>
              <div className="setup-section">
                <textarea
                  className="inp setup-inp"
                  style={{ minHeight: 72, resize: "vertical" }}
                  value={resumeSummary}
                  onChange={(e) => setResumeSummary(e.target.value)}
                  placeholder="Short summary of your background for the interview context (filled after upload, or type manually)."
                />
              </div>

              {error ? (
                <div
                  className="mev"
                  style={{
                    background: "var(--red-d)",
                    borderColor: "rgba(248,113,113,.2)",
                    color: "var(--red)",
                    maxWidth: "100%",
                    padding: "8px 12px",
                  }}
                >
                  {error}
                </div>
              ) : null}
            </form>

            <div className="inpa">
              <div className="inpr">
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--txt2)" }}>
                    Candidate: <strong style={{ color: "var(--txt)" }}>{candidateName || "—"}</strong>
                    {" · "}Mode:{" "}
                    <strong style={{ color: "var(--sage)" }}>{modeCopy[mode].short}</strong>
                    {" · "}Teammate:{" "}
                    <strong style={{ color: "var(--blue)" }}>{blueprintPreview.teammateName}</strong>
                  </span>
                </div>
                <button
                  className="snd"
                  disabled={isPending || ocrBusy}
                  type="submit"
                  aria-label="Start interview"
                  form="mi"
                  style={{ width: "auto", padding: "0 18px", borderRadius: "var(--r)" }}
                >
                  {isPending ? "Opening…" : "Start Interview"}
                </button>
              </div>
              <div className="inh">Click Start Interview to launch the live room</div>
            </div>
          </div>
        </section>

        <aside className="room-side gpanel" id="right">
          <div className="nhd">
            <div className="ntitle">What to expect</div>
          </div>

          <div className="nbody">
            <div className="sysln" style={{ textAlign: "left", padding: "4px 0 10px" }}>
              <span>Interview contract</span>
            </div>

            <div className="sticky" style={{ background: "#bbf7d0" }}>
              <div className="shd">
                <div className="slbl">Scenario</div>
              </div>
              <div
                className="sta"
                style={{ minHeight: "auto", resize: "none", userSelect: "text" }}
              >
                {blueprintPreview.title}
              </div>
            </div>

            <div className="sticky" style={{ background: "#bfdbfe" }}>
              <div className="shd">
                <div className="slbl">Duration</div>
              </div>
              <div
                className="sta"
                style={{ minHeight: "auto", resize: "none", userSelect: "text" }}
              >
                60 minutes · 6 phases
              </div>
            </div>

            <div className="sticky" style={{ background: "#fde68a" }}>
              <div className="shd">
                <div className="slbl">Channels</div>
              </div>
              <div
                className="sta"
                style={{ minHeight: "auto", resize: "none", userSelect: "text" }}
              >
                Interviewer lane + {blueprintPreview.teammateName} ({blueprintPreview.teammateLabel})
              </div>
            </div>

            <div className="sticky" style={{ background: "#f7ec6e" }}>
              <div className="shd">
                <div className="slbl">Mode</div>
              </div>
              <div
                className="sta"
                style={{ minHeight: "auto", resize: "none", userSelect: "text" }}
              >
                {modeCopy[mode].short} — {modeCopy[mode].detail}
              </div>
            </div>

            <div className="sticky" style={{ background: "#fecaca" }}>
              <div className="shd">
                <div className="slbl">Output</div>
              </div>
              <div
                className="sta"
                style={{ minHeight: "auto", resize: "none", userSelect: "text" }}
              >
                Shared interview brief, solution template, evidence-backed report + PDF
              </div>
            </div>

            <div className="sticky" style={{ background: "#fbcfe8" }}>
              <div className="shd">
                <div className="slbl">Notes</div>
              </div>
              <div
                className="sta"
                style={{ minHeight: "auto", resize: "none", userSelect: "text" }}
              >
                Private scratch pad throughout the session
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
