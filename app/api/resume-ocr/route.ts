import { getResumeOcrLanguageModel } from "@/convex/lib/llmProvider";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

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

const extractionPrompt = [
  "You are extracting structured information from a resume.",
  "Perform OCR if needed and return only valid JSON matching the requested schema.",
  "Rules:",
  "- Preserve the resume text faithfully in resumeText.",
  "- summary should be 2-4 sentences and mention the candidate's strongest systems/distributed/backend/data signals.",
  "- skills should be concise technologies or domain phrases.",
  "- domains should be product or platform areas like payments, messaging, analytics, infra, collaboration, etc.",
  "- If a field is missing, use an empty string, empty array, or null.",
  "- Do not wrap the JSON in markdown fences.",
].join("\n");

export async function POST(request: Request) {
  let model;
  try {
    model = getResumeOcrLanguageModel();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume OCR is not configured.";
    return NextResponse.json({ error: message }, { status: 500 });
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

  try {
    const result =
      mimeType === "text/plain"
        ? await generateObject({
            model,
            schema: responseSchema,
            temperature: 0.1,
            maxOutputTokens: 8192,
            messages: [
              {
                role: "user",
                content: `${extractionPrompt}\n\n---\nResume text:\n${bytes.toString("utf8")}`,
              },
            ],
          })
        : await generateObject({
            model,
            schema: responseSchema,
            temperature: 0.1,
            maxOutputTokens: 8192,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: extractionPrompt },
                  {
                    type: "file",
                    data: new Uint8Array(bytes),
                    mediaType: mimeType,
                    filename: file.name || "resume",
                  },
                ],
              },
            ],
          });

    return NextResponse.json(result.object);
  } catch {
    return NextResponse.json(
      { error: "Resume OCR returned an unexpected payload. Please try a clearer PDF or image." },
      { status: 502 },
    );
  }
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
