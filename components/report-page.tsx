"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatRecommendation, formatScoreLabel, parseReportJson, renderScoreEntries } from "@/lib/report";

export function ReportPage({ sessionPublicId }: { sessionPublicId: string }) {
  const reportView = useQuery(api.reports.getReportBySessionPublicId, { sessionPublicId });

  if (reportView === undefined) {
    return (
      <main className="page-shell centered-state">
        <div className="loading-card glass-panel">
          <div className="section-title">Loading report</div>
          <h1 className="section-heading">Pulling the latest evaluation</h1>
          <p className="status-copy">
            Convex is synchronizing the final report, recommendation, and PDF artifact status.
          </p>
        </div>
      </main>
    );
  }

  if (reportView === null) {
    return (
      <main className="page-shell centered-state">
        <div className="loading-card glass-panel">
          <div className="section-title">Report unavailable</div>
          <h1 className="section-heading">No report yet</h1>
          <p className="status-copy">
            End the interview session first, then come back here for the final evaluation.
          </p>
          <div className="button-row">
            <Link className="primary-button" href="/">
              Back to start
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const parsed = parseReportJson(reportView.reportJson);

  if (!parsed) {
    return (
      <main className="page-shell report-page">
        <div className="report-shell glass-panel">
          <div className="section-title">Report status</div>
          <h1 className="section-heading">Still generating</h1>
          <p className="status-copy">
            Status: <strong>{reportView.status}</strong>. The interview has ended and the system is
            building the final structured report now.
          </p>
          <div className="button-row" style={{ marginTop: 14 }}>
            <Link className="ghost-button" href="/">
              Back to start
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell report-page">
      <div className="report-shell glass-panel">
        <div className="button-row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="section-title">Final evaluation</div>
            <h1 className="report-heading">Interview Report</h1>
            <div className="report-recommendation">{formatRecommendation(parsed.finalRecommendation)}</div>
          </div>
          <div className="button-row">
            <Link className="ghost-button" href="/">
              Back to start
            </Link>
            <a className="primary-button" href={`/api/reports/${sessionPublicId}/pdf`} rel="noreferrer" target="_blank">
              Download PDF
            </a>
          </div>
        </div>

        <div className="report-grid" style={{ marginTop: 24 }}>
          <section className="stack">
            <article className="report-card">
              <div className="section-title">Summary</div>
              <p className="section-copy">{parsed.summary}</p>
            </article>

            <article className="report-card">
              <div className="section-title">Strengths</div>
              <div className="report-list">
                {parsed.strengths.map((entry) => (
                  <div className="report-list-item" key={`${entry.title}-${entry.evidenceSequence}`}>
                    <div className="report-list-title">{entry.title}</div>
                    <div className="report-list-copy">{entry.detail}</div>
                    <div className="report-sequence">Evidence sequence #{entry.evidenceSequence}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="report-card">
              <div className="section-title">Concerns</div>
              <div className="report-list">
                {parsed.concerns.map((entry) => (
                  <div className="report-list-item" key={`${entry.title}-${entry.evidenceSequence}`}>
                    <div className="report-list-title">{entry.title}</div>
                    <div className="report-list-copy">{entry.detail}</div>
                    <div className="report-sequence">Evidence sequence #{entry.evidenceSequence}</div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="stack">
            <article className="report-card">
              <div className="section-title">Scorecard</div>
              <div className="report-list">
                {renderScoreEntries(parsed.scores).map(([key, value]) => (
                  <div className="report-list-item" key={key}>
                    <div className="report-list-title">{formatScoreLabel(key)}</div>
                    <div className="metric-card__value">{value}</div>
                    <div className="progress">
                      <span style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="report-card">
              <div className="section-title">Notable moments</div>
              <div className="report-list">
                {parsed.notableMoments.map((entry) => (
                  <div className="report-list-item" key={`${entry.sequence}-${entry.title}`}>
                    <div className="report-list-title">{entry.title}</div>
                    <div className="report-list-copy">{entry.detail}</div>
                    <div className="report-sequence">
                      {entry.channelKind} · sequence #{entry.sequence} · {entry.impact}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="report-card">
              <div className="section-title">Evaluator notes</div>
              <div className="report-list">
                <div className="report-list-item">
                  <div className="report-list-title">Interviewer guidance</div>
                  <div className="report-list-copy">{parsed.interviewerGuidance}</div>
                </div>
                <div className="report-list-item">
                  <div className="report-list-title">Teammate interaction</div>
                  <div className="report-list-copy">{parsed.teammateInteraction}</div>
                </div>
                <div className="report-list-item">
                  <div className="report-list-title">Stress handling</div>
                  <div className="report-list-copy">{parsed.stressAnalysis}</div>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
