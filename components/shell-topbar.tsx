"use client";

import { ThemeToggle } from "./theme-toggle";

export function ShellTopbar({ meta }: { meta?: string }) {
  return (
    <header className="shell-topbar gpanel">
      <div className="brand">
        <div className="bgem">
          <div className="gdot" />
        </div>
        <span className="bname">Aperture</span>
      </div>
      {meta ? <span className="shell-topbar__meta">{meta}</span> : null}
      <div className="spacer" />
      <ThemeToggle />
    </header>
  );
}
