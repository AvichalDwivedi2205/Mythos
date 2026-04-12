"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** compact = sidebar rail; fullscreen = expanded overlay */
  variant?: "default" | "compact" | "fullscreen";
};

export function SolutionMarkdownEditor({
  value,
  onChange,
  disabled,
  placeholder,
  variant = "default",
}: Props) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div
      className={`solution-md-editor solution-md-editor--${variant}${
        disabled ? " solution-md-editor--disabled" : ""
      }`}
    >
      <div className="solution-md-editor__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "write"}
          className={`solution-md-editor__tab${mode === "write" ? " solution-md-editor__tab--on" : ""}`}
          onClick={() => setMode("write")}
        >
          Write
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          className={`solution-md-editor__tab${mode === "preview" ? " solution-md-editor__tab--on" : ""}`}
          onClick={() => setMode("preview")}
        >
          Preview
        </button>
      </div>
      {mode === "write" ? (
        <textarea
          className="solution-md-editor__textarea text-area"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          spellCheck
        />
      ) : (
        <div className="solution-md-editor__preview markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value.trim() ? value : "_Nothing to preview yet._"}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
