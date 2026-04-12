import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const GEMINI_OCR_MODEL = "gemini-3.1-flash-lite-preview";
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

const responseSchema = z.object({
  candidateName: z.string().nullable(),
  summary: z.string().default(""),
  skills: z.array(z.string()).default([]),
  domains: z.array(z.string()).default([]),
  seniority: z.string().default(""),
  resumeText: z.string().default(""),
});

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Resume file is too large. Please upload a file under 8MB." },
      { status: 400 },
    );
  }

  const mimeType = file.type || guessMimeType(file.name);
  if (!allowedMimeTypes.has(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF, image, or text resume." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const prompt = [
    "You are extracting structured information from a resume.",
    "Perform OCR if needed and return only valid JSON with this exact shape:",
    "{",
    '  "candidateName": string | null,',
    '  "summary": string,',
    '  "skills": string[],',
    '  "domains": string[],',
    '  "seniority": string,',
    '  "resumeText": string',
    "}",
    "Rules:",
    "- Preserve the resume text faithfully in resumeText.",
    "- summary should be 2-4 sentences and mention the candidate's strongest systems/distributed/backend/data signals.",
    "- skills should be concise technologies or domain phrases.",
    "- domains should be product or platform areas like payments, messaging, analytics, infra, collaboration, etc.",
    "- If a field is missing, use an empty string, empty array, or null.",
    "- Do not wrap the JSON in markdown fences.",
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_OCR_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: bytes.toString("base64"),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: `Resume OCR failed: ${errorText || response.statusText}` },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };
  const rawText =
    payload.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text ??
    "";
  const cleanedText = stripJsonFences(rawText);

  let parsed: z.infer<typeof responseSchema>;
  try {
    parsed = responseSchema.parse(JSON.parse(cleanedText));
  } catch {
    return NextResponse.json(
      { error: "Resume OCR returned an unexpected payload. Please try a clearer PDF or image." },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed);
}

function stripJsonFences(value: string) {
  return value.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

function guessMimeType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}
