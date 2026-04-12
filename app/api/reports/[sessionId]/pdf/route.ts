import { chromium } from "playwright";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { formatRecommendation, formatScoreLabel, parseReportJson, renderScoreEntries } from "@/lib/report";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!deploymentUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "NEXT_PUBLIC_CONVEX_URL is required to generate report PDFs.",
      },
      { status: 500 },
    );
  }

  const client = new ConvexHttpClient(deploymentUrl);
  const reportView = await client.query(api.reports.getReportBySessionPublicId, {
    sessionPublicId: sessionId,
  });

  if (!reportView?.reportJson) {
    return NextResponse.json(
      {
        ok: false,
        message: "Report is not ready yet.",
        status: reportView?.status ?? "missing",
      },
      { status: 409 },
    );
  }

  const report = parseReportJson(reportView.reportJson);
  if (!report) {
    return NextResponse.json(
      {
        ok: false,
        message: "Report JSON could not be parsed.",
      },
      { status: 500 },
    );
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    const origin = request.nextUrl.origin;
    const html = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Aperture Report</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #1a1c26; }
            h1, h2 { margin: 0 0 10px; }
            .pill { display: inline-block; padding: 6px 10px; background: #e9fbe9; border-radius: 999px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
            .summary { margin: 18px 0 30px; line-height: 1.7; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { border: 1px solid #d9dde6; border-radius: 16px; padding: 16px; margin-bottom: 18px; }
            .item { margin: 0 0 16px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: .08em; }
            .score { font-size: 26px; font-weight: bold; margin-top: 6px; }
            .footer { margin-top: 28px; color: #666; font-size: 12px; }
            ul { padding-left: 18px; }
          </style>
        </head>
        <body>
          <div class="label">Aperture · AI Interview Report</div>
          <h1>Interview Report</h1>
          <div class="pill">${formatRecommendation(report.finalRecommendation)}</div>
          <p class="summary">${report.summary}</p>
          <div class="grid">
            <div>
              <div class="card">
                <h2>Scores</h2>
                ${renderScoreEntries(report.scores)
                  .map(
                    ([key, value]) =>
                      `<div class="item"><div class="label">${formatScoreLabel(key)}</div><div class="score">${value}</div></div>`,
                  )
                  .join("")}
              </div>
              <div class="card">
                <h2>Strengths</h2>
                <ul>
                  ${report.strengths
                    .map(
                      (entry) =>
                        `<li><strong>${entry.title}</strong>: ${entry.detail} (seq #${entry.evidenceSequence})</li>`,
                    )
                    .join("")}
                </ul>
              </div>
              <div class="card">
                <h2>Concerns</h2>
                <ul>
                  ${report.concerns
                    .map(
                      (entry) =>
                        `<li><strong>${entry.title}</strong>: ${entry.detail} (seq #${entry.evidenceSequence})</li>`,
                    )
                    .join("")}
                </ul>
              </div>
            </div>
            <div>
              <div class="card">
                <h2>Notable moments</h2>
                <ul>
                  ${report.notableMoments
                    .map(
                      (entry) =>
                        `<li><strong>${entry.title}</strong>: ${entry.detail} (${entry.channelKind}, seq #${entry.sequence})</li>`,
                    )
                    .join("")}
                </ul>
              </div>
              <div class="card">
                <h2>Evaluator notes</h2>
                <p><strong>Interviewer guidance:</strong> ${report.interviewerGuidance}</p>
                <p><strong>Teammate interaction:</strong> ${report.teammateInteraction}</p>
                <p><strong>Stress handling:</strong> ${report.stressAnalysis}</p>
              </div>
            </div>
          </div>
          <div class="footer">Generated from ${origin}/reports/${sessionId}</div>
        </body>
      </html>`;

    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "18mm",
        right: "14mm",
        bottom: "18mm",
        left: "14mm",
      },
    });

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${sessionId}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
