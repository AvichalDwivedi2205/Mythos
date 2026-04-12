"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatRecommendation, formatScoreLabel, parseReportJson, renderScoreEntries } from "@/lib/report";
import { ThemeToggle } from "@/components/theme-toggle";

function RecommendationChip({ value }: { value: string }) {
  const isHire = value.toLowerCase().includes("hire") && !value.toLowerCase().includes("no");
  const color = isHire ? "var(--sage)" : value.toLowerCase().includes("no") ? "var(--red)" : "var(--amber)";
  const bg = isHire ? "var(--sage-d)" : value.toLowerCase().includes("no") ? "var(--red-d)" : "var(--amber-d)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 6,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: ".5px",
        textTransform: "uppercase",
        background: bg,
        color,
      }}
    >
      {value}
    </span>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color =
    value >= 75 ? "var(--sage)" : value >= 50 ? "var(--blue)" : value >= 30 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 3, borderRadius: 3, background: "var(--border2)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 1s var(--ease)" }} />
      </div>
    </div>
  );
}

export function ReportPage({ sessionPublicId }: { sessionPublicId: string }) {
  const reportView = useQuery(api.reports.getReportBySessionPublicId, { sessionPublicId });

  /* ── loading ── */
  if (reportView === undefined) {
    return (
      <main className="page-shell page-shell--interview">
        <div className="interview-shell" style={{ gridTemplateColumns: "200px 1fr" }}>
          <aside className="sidebar gpanel" id="left">
            <div className="brand">
              <div className="bgem"><div className="gdot" /></div>
              <span className="bname">Aperture</span>
            </div>
            <div className="spacer" />
            <div className="rfoot">
              <div className="mbadge2">Report</div>
              <div className="fbtns"><ThemeToggle /></div>
            </div>
          </aside>
          <section className="room-main" id="center">
            <div className="ctop gpanel">
              <div>
                <div className="sname">Interview report</div>
                <div className="ssub">Loading evaluation…</div>
              </div>
            </div>
            <div className="msgs" style={{ alignItems: "center", justifyContent: "center" }}>
              <div className="sysln"><span>Pulling report from Convex — hang tight</span></div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* ── no report ── */
  if (reportView === null) {
    return (
      <main className="page-shell page-shell--interview">
        <div className="interview-shell" style={{ gridTemplateColumns: "200px 1fr" }}>
          <aside className="sidebar gpanel" id="left">
            <div className="brand">
              <div className="bgem"><div className="gdot" /></div>
              <span className="bname">Aperture</span>
            </div>
            <div className="spacer" />
            <div className="rfoot">
              <div className="mbadge2">Report</div>
              <div className="fbtns"><ThemeToggle /></div>
            </div>
          </aside>
          <section className="room-main" id="center">
            <div className="ctop gpanel">
              <div>
                <div className="sname">No report found</div>
                <div className="ssub">End the session first to generate the evaluation</div>
              </div>
              <Link className="endbtn" href="/" style={{ textDecoration: "none" }}>
                Back to start
              </Link>
            </div>
            <div className="msgs">
              <div className="sysln"><span>Session {sessionPublicId} · No report yet</span></div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const parsed = parseReportJson(reportView.reportJson);

  /* ── still generating ── */
  if (!parsed) {
    return (
      <main className="page-shell page-shell--interview">
        <div className="interview-shell" style={{ gridTemplateColumns: "200px 1fr" }}>
          <aside className="sidebar gpanel" id="left">
            <div className="brand">
              <div className="bgem"><div className="gdot" /></div>
              <span className="bname">Aperture</span>
            </div>
            <div className="spacer" />
            <div className="rfoot">
              <div className="mbadge2">Pending</div>
              <div className="fbtns"><ThemeToggle /></div>
            </div>
          </aside>
          <section className="room-main" id="center">
            <div className="ctop gpanel">
              <div>
                <div className="sname">Report is generating</div>
                <div className="ssub">Status: {reportView.status}</div>
              </div>
              <div className="pchip">
                <span className="pcdot" />
                In progress
              </div>
              <Link className="endbtn" href="/" style={{ textDecoration: "none" }}>
                Back to start
              </Link>
            </div>
            <div className="msgs">
              <div className="sysln">
                <span>Session {sessionPublicId} · Building evaluation — check back in a moment</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const scores = renderScoreEntries(parsed.scores);
  const recommendation = formatRecommendation(parsed.finalRecommendation);

  return (
    <main className="page-shell page-shell--interview">
      <div className="interview-shell">

        {/* ── LEFT: overview ── */}
        <aside className="sidebar gpanel" id="left" style={{ overflowY: "auto" }}>
          <div className="brand">
            <div className="bgem"><div className="gdot" /></div>
            <span className="bname">Aperture</span>
          </div>

          {/* Recommendation */}
          <div>
            <div className="rl" style={{ marginBottom: 7 }}>Verdict</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <RecommendationChip value={recommendation} />
              <div className="agr" style={{ fontSize: 11, lineHeight: 1.5 }}>
                {parsed.summary.slice(0, 120)}{parsed.summary.length > 120 ? "…" : ""}
              </div>
            </div>
          </div>

          {/* Scores mini-list */}
          <div>
            <div className="rl" style={{ marginBottom: 7 }}>Scores</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {scores.map(([key, val]) => (
                <div key={key} className="sr" style={{ padding: 0 }}>
                  <div className="snm" style={{ fontSize: 10.5, width: 80 }}>{formatScoreLabel(key)}</div>
                  <div className="str">
                    <div
                      className="sfi"
                      style={{
                        width: `${val}%`,
                        background:
                          val >= 75 ? "var(--sage)" : val >= 50 ? "var(--blue)" : "var(--amber)",
                      }}
                    />
                  </div>
                  <div className="svl">{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="spacer" />

          <div className="rfoot">
            <div className="mbadge2">Report</div>
            <div className="fbtns"><ThemeToggle /></div>
          </div>
        </aside>

        {/* ── CENTER: strengths + concerns ── */}
        <section className="room-main" id="center">
          <div className="ctop gpanel">
            <div>
              <div className="sname">Interview report</div>
              <div className="ssub">
                Session {sessionPublicId} · {recommendation}
              </div>
            </div>
            <div className="button-row" style={{ gap: 8 }}>
              <Link className="endbtn" href="/" style={{ textDecoration: "none" }}>
                ← Start
              </Link>
              <a
                className="endbtn"
                href={`/api/reports/${sessionPublicId}/pdf`}
                rel="noreferrer"
                target="_blank"
                style={{ textDecoration: "none", borderColor: "rgba(134,239,172,.25)", color: "var(--sage)" }}
              >
                PDF ↗
              </a>
            </div>
          </div>

          {/* Tabs as section dividers */}
          <div className="tabs gpanel">
            <div className="tab on-i" style={{ cursor: "default" }}>
              <span className="tav tavi">S</span>
              Strengths
            </div>
            <div className="tab on-t" style={{ cursor: "default" }}>
              <span className="tav" style={{ background: "var(--amber)", color: "var(--bg)" }}>C</span>
              Concerns
            </div>
          </div>

          <div className="msgs" style={{ gap: 0 }}>
            <div className="sysln">
              <span>
                Final evaluation · Evidence-backed · Rubric v{reportView.status === "ready" ? "2.1" : "…"}
              </span>
            </div>

            {/* Summary bubble */}
            <article className="msg">
              <div className="mhd">
                <strong className="spk si">Summary</strong>
                <span className="mbg bg-brief">Overview</span>
              </div>
              <div className="bub bi">{parsed.summary}</div>
            </article>

            <div className="phdiv">Strengths</div>

            {parsed.strengths.map((s) => (
              <article className="msg" key={`${s.title}-${s.evidenceSequence}`}>
                <div className="mhd">
                  <strong className="spk si">{s.title}</strong>
                  <span className="mbg bg-brief">Strength</span>
                  <span className="mt">#{s.evidenceSequence}</span>
                </div>
                <div className="bub bi">{s.detail}</div>
              </article>
            ))}

            <div className="phdiv">Concerns</div>

            {parsed.concerns.map((c) => (
              <article className="msg" key={`${c.title}-${c.evidenceSequence}`}>
                <div className="mhd">
                  <strong className="spk" style={{ color: "var(--amber)" }}>{c.title}</strong>
                  <span className="mbg bg-nudge">Concern</span>
                  <span className="mt">#{c.evidenceSequence}</span>
                </div>
                <div className="bub bnudge" style={{ borderLeft: "2.5px solid var(--amber)", background: "var(--amber-d)", borderRadius: "3px var(--r2) var(--r2) var(--r2)", padding: "11px 15px", fontSize: 13.5, lineHeight: 1.7, border: "1px solid var(--border)" }}>
                  {c.detail}
                </div>
              </article>
            ))}

            <div className="phdiv">Evaluator notes</div>

            <article className="msg">
              <div className="mhd">
                <strong className="spk si">Interviewer guidance</strong>
              </div>
              <div className="bub bi">{parsed.interviewerGuidance}</div>
            </article>

            <article className="msg">
              <div className="mhd">
                <strong className="spk st">Teammate interaction</strong>
              </div>
              <div className="bub bt">{parsed.teammateInteraction}</div>
            </article>

            <article className="msg">
              <div className="mhd">
                <strong className="spk" style={{ color: "var(--red)" }}>Stress handling</strong>
                <span className="mbg bg-stress">Stress</span>
              </div>
              <div className="bub bstress" style={{ borderLeft: "2.5px solid var(--red)", background: "var(--red-d)", borderRadius: "3px var(--r2) var(--r2) var(--r2)", padding: "11px 15px", fontSize: 13.5, lineHeight: 1.7, border: "1px solid var(--border)" }}>
                {parsed.stressAnalysis}
              </div>
            </article>
          </div>
        </section>

        {/* ── RIGHT: scorecard + moments ── */}
        <aside className="room-side gpanel" id="right" style={{ overflowY: "auto" }}>
          <div className="nhd">
            <div className="ntitle">Scorecard</div>
          </div>

          <div className="nbody" style={{ gap: 14 }}>
            {/* Scores as sticky notes */}
            {scores.map(([key, val]) => {
              const color =
                val >= 75 ? "#bbf7d0" : val >= 50 ? "#bfdbfe" : val >= 30 ? "#fde68a" : "#fecaca";
              return (
                <div className="sticky" key={key} style={{ background: color }}>
                  <div className="shd">
                    <div className="slbl">{formatScoreLabel(key)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(0,0,0,.6)", fontFamily: "var(--font-fraunces), serif" }}>
                      {val}
                    </div>
                  </div>
                  <ScoreBar value={val} />
                </div>
              );
            })}

            {parsed.notableMoments.length > 0 && (
              <>
                <div className="rl" style={{ marginTop: 6 }}>Notable moments</div>
                {parsed.notableMoments.map((m) => (
                  <div
                    className="sticky"
                    key={`${m.sequence}-${m.title}`}
                    style={{ background: m.impact === "positive" ? "#bbf7d0" : m.impact === "negative" ? "#fecaca" : "#fde68a" }}
                  >
                    <div className="shd">
                      <div className="slbl">{m.channelKind} · #{m.sequence}</div>
                    </div>
                    <div className="sta" style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(0,0,0,.7)", minHeight: "auto" }}>
                      {m.title}
                    </div>
                    <div className="sta" style={{ fontSize: 11, color: "rgba(0,0,0,.55)", minHeight: "auto", marginTop: 4 }}>
                      {m.detail}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

      </div>
    </main>
  );
}
