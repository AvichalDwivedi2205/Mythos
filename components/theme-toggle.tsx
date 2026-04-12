"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle({ title = "Toggle theme" }: { title?: string }) {
  const { toggleTheme } = useTheme();

  return (
    <button className="ibt" onClick={toggleTheme} type="button" title={title} aria-label={title}>
      <span aria-hidden="true">{"\u25D0"}</span>
    </button>
  );
}
