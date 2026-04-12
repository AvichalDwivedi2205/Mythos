"use client";

import { useDeferredValue, useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PHASES, TEAMMATE_SPECIALIZATIONS, type InterviewPhase } from "@/lib/constants";
import { formatPhaseLabel, formatTimer } from "@/lib/utils";

type ChannelKind = "interviewer" | "teammate";

const defaultNoteColors: Record<string, string> = {
  Requirement: "#f7ec6e",
  Constraint: "#fde68a",
  "Design note": "#bbf7d0",
  "Open question": "#bfdbfe",
  Assumption: "#fbcfe8",
  "To revisit": "#fecaca",
};

function getPhaseState(currentPhase: InterviewPhase, phase: InterviewPhase) {
  const currentIndex = PHASES.indexOf(currentPhase);
  const phaseIndex = PHASES.indexOf(phase);

  if (phaseIndex < currentIndex) {
    return "done";
  }
  if (phaseIndex === currentIndex) {
    return "active";
  }
  return "pending";
}

function formatModeLabel(mode: string) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function getBadgeClass(badgeKind: string | null) {
  switch (badgeKind) {
    case "stress":
      return "message-badge badge--stress";
    case "nudge":
    case "concern":
      return "message-badge badge--nudge";
    case "team":
    case "brief":
    case "clarification":
      return "message-badge badge--team";
    default:
      return "message-badge badge--brief";
  }
}

export function InterviewRoom({ sessionPublicId }: { sessionPublicId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ChannelKind>("interviewer");
  const [draft, setDraft] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteLabel, setNoteLabel] = useState<
    "Requirement" | "Constraint" | "Design note" | "Open question" | "Assumption" | "To revisit"
  >("Design note");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [isSending, startSending] = useTransition();
  const [isEnding, startEnding] = useTransition();
  const deferredNoteSearch = useDeferredValue(noteSearch);
  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const room = useQuery(api.sessions.getRoom, { sessionPublicId });
  const sessionStatus = useQuery(api.sessions.getSessionStatus, { sessionPublicId });
  const interviewerMessages = useQuery(api.channels.listChannelMessages, {
    sessionPublicId,
    channelKind: "interviewer",
  });
  const teammateMessages = useQuery(api.channels.listChannelMessages, {
    sessionPublicId,
    channelKind: "teammate",
  });
  const notes = useQuery(api.notes.listNotes, { sessionPublicId });
  const sendMessage = useMutation(api.channels.sendCandidateMessage);
  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);
  const endSession = useMutation(api.sessions.endSession);

  useEffect(() => {
    if (sessionStatus?.sessionStatus === "completed") {
      router.prefetch(`/reports/${sessionPublicId}`);
    }
  }, [router, sessionPublicId, sessionStatus?.sessionStatus]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const activeMessages = activeTab === "interviewer" ? interviewerMessages : teammateMessages;
  const activeMessageTail = activeMessages?.[activeMessages.length - 1]?.id ?? null;
  const teammateMeta =
    TEAMMATE_SPECIALIZATIONS.find((entry) => entry.name === room?.channels[1]?.agentRole) ??
    TEAMMATE_SPECIALIZATIONS.find((entry) => entry.value === room?.channels[1]?.specialization) ??
    TEAMMATE_SPECIALIZATIONS[0];

  const timer = room ? formatTimer(room.timeBudgetMs - (now - room.startedAt)) : "60:00";
  const normalizedNoteSearch = deferredNoteSearch.trim().toLowerCase();
  const visibleNotes = notes?.filter((note) => {
    if (!normalizedNoteSearch) {
      return true;
    }

    return `${note.label} ${note.content}`.toLowerCase().includes(normalizedNoteSearch);
  });

  useEffect(() => {
    const node = messageScrollRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior: "smooth",
    });
  }, [activeMessageTail, activeTab]);

  async function onSendMessage() {
    const content = draft.trim();
    if (!content) {
      return;
    }

    setError(null);
    startSending(async () => {
      try {
        await sendMessage({
          sessionPublicId,
          channelKind: activeTab,
          content,
        });
        setDraft("");
      } catch (sendError) {
        setError(sendError instanceof Error ? sendError.message : "Unable to send message.");
      }
    });
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void onSendMessage();
    }
  }

  async function onCreateNote() {
    const content = noteDraft.trim();
    if (!content) {
      return;
    }

    setError(null);
    try {
      await createNote({
        sessionPublicId,
        label: noteLabel,
        color: defaultNoteColors[noteLabel],
        content,
      });
      setNoteDraft("");
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Unable to create note.");
    }
  }

  async function onEndSession() {
    setError(null);
    startEnding(async () => {
      try {
        await endSession({ sessionPublicId });
        router.push(`/reports/${sessionPublicId}`);
      } catch (endError) {
        setError(endError instanceof Error ? endError.message : "Unable to end session.");
      }
    });
  }

  if (room === undefined || interviewerMessages === undefined || teammateMessages === undefined || notes === undefined) {
    return (
      <main className="page-shell centered-state">
        <div className="loading-card glass-panel">
          <div className="section-title">Loading room</div>
          <h1 className="section-heading">Connecting to Convex</h1>
          <p className="status-copy">
            Pulling the live session state, channels, notes, and signals into the interview shell.
          </p>
        </div>
      </main>
    );
  }

  if (room === null) {
    return (
      <main className="page-shell centered-state">
        <div className="loading-card glass-panel">
          <div className="section-title">Session missing</div>
          <h1 className="section-heading">No interview found</h1>
          <p className="status-copy">
            This session ID is invalid or the room has not been created yet.
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

  return (
    <main className="page-shell page-shell--interview">
      <div className="interview-shell glass-panel">
        <aside className="sidebar">
          <div className="brand-lockup">
            <div className="brand-gem">
              <div className="brand-dot" />
            </div>
            <div className="brand-name">Aperture</div>
          </div>

          <div className="timer-ring">
            <div className="timer-value">{timer}</div>
            <div className="timer-label">Time remaining</div>
          </div>

          <div>
            <div className="section-title">Phases</div>
            <div className="phase-list" style={{ marginTop: 8 }}>
              {PHASES.map((phase) => (
                <div
                  key={phase}
                  className="phase-item"
                  data-state={getPhaseState(room.currentPhase, phase)}
                >
                  <div className="phase-dot" />
                  <div className="phase-name">{formatPhaseLabel(phase)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="section-title">Agents</div>
            <div className="agent-list" style={{ marginTop: 8 }}>
              {room.channels.map((channel) => (
                <div className="agent-card" key={channel.kind}>
                  <div
                    className={`agent-avatar ${channel.kind === "interviewer" ? "avatar--sage" : "avatar--blue"}`}
                  >
                    {channel.kind === "interviewer" ? "IN" : "TM"}
                  </div>
                  <div className="agent-meta">
                    <div className="agent-name">{channel.agentRole}</div>
                    <div className="agent-role">
                      {channel.kind === "interviewer"
                        ? `${channel.mode} mode`
                        : channel.specialization ?? "Teammate"}
                    </div>
                  </div>
                  <div className="presence-dot" />
                </div>
              ))}
            </div>
          </div>

          <div className="spacer" />

          <div className="mini-card glass-panel">
            <div className="section-title">Live signals</div>
            <div className="section-copy" style={{ marginTop: 10 }}>
              Requirements {room.signals.requirementsScore} · Architecture {room.signals.architectureScore} ·
              Tradeoffs {room.signals.tradeoffScore} · Collaboration {room.signals.collaborationScore}
            </div>
          </div>
        </aside>

        <section className="room-main">
          <div className="room-topbar">
            <div>
              <div className="room-title">{room.title}</div>
              <div className="room-subtitle">
                {room.subtitle} · {room.candidateName} · {room.rubricVersion}
              </div>
            </div>
            <div className="button-row">
              <div className="mode-badge">
                <span className="live-dot" />
                {formatModeLabel(room.mode)} mode
              </div>
              <button className="danger-button" onClick={onEndSession} disabled={isEnding} type="button">
                {isEnding ? "Ending..." : "End session"}
              </button>
            </div>
          </div>

          <div className="tabs">
            <button
              className="tab-button"
              data-active={activeTab === "interviewer"}
              onClick={() => setActiveTab("interviewer")}
              type="button"
            >
              <span className="tab-avatar avatar--sage">IN</span>
              Interviewer
            </button>
            <button
              className="tab-button"
              data-active={activeTab === "teammate"}
              onClick={() => setActiveTab("teammate")}
              type="button"
            >
              <span className="tab-avatar avatar--blue">{teammateMeta.shortLabel}</span>
              {room.channels[1]?.agentRole ?? "Teammate"}
            </button>
          </div>

          <div className="conversation">
            <div className="message-scroll" data-testid="message-scroll" ref={messageScrollRef}>
              <div className="system-line">
                <span>
                  {activeTab === "interviewer"
                    ? `Interviewer channel · ${formatModeLabel(room.mode)} mode · Rubric ${room.rubricVersion}`
                    : `${room.channels[1]?.agentRole ?? "Teammate"} · ${
                        room.channels[1]?.specialization ?? teammateMeta.label
                      } · Teammate channel`}
                </span>
              </div>

              <div className="system-line system-line--phase">
                <span>
                  Phase: {formatPhaseLabel(room.currentPhase)} · Status: {sessionStatus?.sessionStatus ?? room.status}
                </span>
              </div>

              <div className="message-list">
                {activeMessages?.map((message) => (
                  <article className="message" key={message.id}>
                    <div className="message-meta">
                      <strong className={`speaker--${message.speakerType}`}>{message.speakerLabel}</strong>
                      {message.badgeKind ? (
                        <span className={getBadgeClass(message.badgeKind)}>{message.badgeKind}</span>
                      ) : null}
                      {message.eventSummary ? <span className="agent-role">{message.eventSummary}</span> : null}
                    </div>
                    <div
                      className={`bubble ${
                        message.speakerType === "candidate"
                          ? "bubble--candidate"
                          : message.speakerType === "interviewer"
                            ? "bubble--interviewer"
                            : "bubble--teammate"
                      }`}
                    >
                      {message.content}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="composer">
              <div className="composer-row">
                <textarea
                  className="text-area"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder={`Reply in the ${activeTab} lane...`}
                  rows={1}
                />
                <button className="primary-button" disabled={isSending} onClick={onSendMessage} type="button">
                  {isSending ? "Sending..." : "Send"}
                </button>
              </div>
              {error ? <div className="error-copy" style={{ marginTop: 10 }}>{error}</div> : null}
            </div>
          </div>
        </section>

        <aside className="room-side">
          <div className="stack">
            <div className="info-card glass-panel">
              <div className="section-title">Safe live signals</div>
              <div className="metric-grid" style={{ marginTop: 12 }}>
                {[
                  ["Requirements", room.signals.requirementsScore],
                  ["Architecture", room.signals.architectureScore],
                  ["Tradeoffs", room.signals.tradeoffScore],
                  ["Collaboration", room.signals.collaborationScore],
                ].map(([label, value]) => (
                  <div className="metric-card" key={label}>
                    <div className="metric-card__label">{label}</div>
                    <div className="metric-card__value">{value}</div>
                    <div className="progress">
                      <span style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-card glass-panel">
              <div className="section-title">Counters</div>
              <div className="section-copy" style={{ marginTop: 10 }}>
                Nudges {room.counters.nudgeCount} · Stress {room.counters.stressCount} · Clarifications{" "}
                {room.counters.clarificationCount} · Concerns {room.counters.teammateConcernCount}
              </div>
            </div>
          </div>

          <div className="info-card glass-panel notes-panel">
            <div className="notes-panel__header">
              <div>
                <div className="section-title">Private scratch pad</div>
                <div className="notes-panel__meta">
                  {normalizedNoteSearch
                    ? `${visibleNotes?.length ?? 0} of ${notes.length} notes`
                    : `${notes.length} notes`}
                </div>
              </div>
            </div>

            <div className="notes-panel__controls">
              <input
                className="text-input note-search-input"
                value={noteSearch}
                onChange={(event) => setNoteSearch(event.target.value)}
                placeholder="Search notes, requirements, and tradeoffs..."
              />
            </div>

            <div className="notes-list-scroll notes-scroll">
              <div className="note-list">
                {visibleNotes && visibleNotes.length > 0 ? (
                  visibleNotes.map((note) => (
                    <div className="note-card" key={note.id}>
                      <div className="note-label">
                        <span className="note-swatch" style={{ background: note.color }} />
                        {note.label}
                      </div>
                      <textarea
                        className="text-area"
                        value={note.content}
                        onChange={(event) => {
                          void updateNote({
                            noteId: note.id,
                            content: event.target.value,
                            label: note.label,
                          });
                        }}
                      />
                      <button className="ghost-button" onClick={() => void deleteNote({ noteId: note.id })} type="button">
                        Delete note
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-copy note-empty">
                    No notes match this search yet. Try a different term or add a new note below.
                  </div>
                )}
              </div>

              <div className="note-card notes-composer">
                <div className="note-label">
                  <span className="note-swatch" style={{ background: defaultNoteColors[noteLabel] }} />
                  New note
                </div>
                <select
                  className="select-input"
                  value={noteLabel}
                  onChange={(event) =>
                    setNoteLabel(event.target.value as typeof noteLabel)
                  }
                >
                  {Object.keys(defaultNoteColors).map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
                <textarea
                  className="text-area"
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Capture a requirement, risk, tradeoff, or open question."
                />
                <button className="primary-button" onClick={onCreateNote} type="button">
                  Add note
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
