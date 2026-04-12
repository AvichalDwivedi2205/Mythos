"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PHASES, TEAMMATE_SPECIALIZATIONS, type InterviewPhase } from "@/lib/constants";
import { computeTimedPhaseFromSession } from "@/lib/timed-phase";
import { formatPhaseLabel, formatSessionElapsed, formatTimer } from "@/lib/utils";
import { ShellTopbar } from "./shell-topbar";
import { SolutionMarkdownEditor } from "./solution-markdown-editor";
import { ThemeToggle } from "./theme-toggle";
import type { Id } from "@/convex/_generated/dataModel";

type ChannelKind = "interviewer" | "teammate";
type TabUnreadState = Record<ChannelKind, boolean>;

type RoomToast = { id: number; title: string; detail: string };

const TIMER_RING_C = 2 * Math.PI * 30;

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
      return "mbg bg-stress";
    case "nudge":
    case "concern":
      return "mbg bg-nudge";
    case "team":
    case "brief":
    case "clarification":
      return "mbg bg-team";
    default:
      return "mbg bg-brief";
  }
}

function speakerClass(speakerType: string) {
  if (speakerType === "interviewer") return "spk si";
  if (speakerType === "teammate") return "spk st";
  return "spk sc";
}

function bubbleClass(speakerType: string) {
  if (speakerType === "candidate") return "bub bc";
  if (speakerType === "interviewer") return "bub bi";
  return "bub bt";
}

function bubbleAccent(badgeKind: string | null, speakerType: string) {
  if (speakerType !== "interviewer") return "";
  if (badgeKind === "nudge" || badgeKind === "concern") return " bnudge";
  if (badgeKind === "stress") return " bstress";
  return "";
}

export function InterviewRoom({ sessionPublicId }: { sessionPublicId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ChannelKind>("interviewer");
  const [draftInterviewer, setDraftInterviewer] = useState("");
  const [draftTeammate, setDraftTeammate] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteLabel, setNoteLabel] = useState<
    "Requirement" | "Constraint" | "Design note" | "Open question" | "Assumption" | "To revisit"
  >("Design note");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [signalsOpen, setSignalsOpen] = useState(false);
  const [isSending, startSending] = useTransition();
  const [isEnding, startEnding] = useTransition();
  const [isSubmittingFinal, startFinalSubmit] = useTransition();
  const [streamResponses, setStreamResponses] = useState(true);
  const [solutionDraft, setSolutionDraft] = useState("");
  const [solutionExpanded, setSolutionExpanded] = useState(false);
  const [briefExpanded, setBriefExpanded] = useState(false);
  const [toasts, setToasts] = useState<RoomToast[]>([]);
  const [tabUnread, setTabUnread] = useState<TabUnreadState>({
    interviewer: false,
    teammate: false,
  });
  const solutionSeededRef = useRef(false);
  const notifyBootstrappedRef = useRef(false);
  const lastAgentInterviewerIdRef = useRef<Id<"messages"> | null>(null);
  const lastAgentTeammateIdRef = useRef<Id<"messages"> | null>(null);
  const toastSeqRef = useRef(0);

  useEffect(() => {
    if (!briefExpanded) {
      return;
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setBriefExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [briefExpanded]);

  const pushToast = useCallback((title: string, detail: string) => {
    const id = ++toastSeqRef.current;
    setToasts((list) => [...list, { id, title, detail }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  const markTabRead = useEffectEvent((channelKind: ChannelKind) => {
    setTabUnread((current) =>
      current[channelKind] ? { ...current, [channelKind]: false } : current,
    );
  });

  const handleUnreadReply = useEffectEvent(
    (channelKind: ChannelKind, title: string, detail: string, notificationBody: string) => {
      setTabUnread((current) =>
        current[channelKind] ? current : { ...current, [channelKind]: true },
      );
      pushToast(title, detail);
      if (
        typeof document !== "undefined" &&
        document.hidden &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, {
            body: notificationBody,
          });
        } catch {
          /* ignore */
        }
      }
    },
  );

  const seedSolutionDraft = useEffectEvent((draftContent: string) => {
    setSolutionDraft(draftContent);
    solutionSeededRef.current = true;
  });

  const deferredNoteSearch = useDeferredValue(noteSearch);
  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const signalsRef = useRef<HTMLButtonElement | null>(null);
  const scratchComposerRef = useRef<HTMLDivElement | null>(null);

  const room = useQuery(api.sessions.getRoom, { sessionPublicId });
  const workspace = useQuery(api.workspace.getSharedWorkspace, { sessionPublicId });
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
  const channelStreamInterviewer = useQuery(api.channels.getChannelStreamingResponse, {
    sessionPublicId,
    channelKind: "interviewer",
  });
  const channelStreamTeammate = useQuery(api.channels.getChannelStreamingResponse, {
    sessionPublicId,
    channelKind: "teammate",
  });
  const channelStream =
    activeTab === "interviewer" ? channelStreamInterviewer : channelStreamTeammate;
  const sendMessage = useMutation(api.channels.sendCandidateMessage);
  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);
  const endSession = useMutation(api.sessions.endSession);
  const saveSolutionDraft = useMutation(api.workspace.saveSolutionDraft);
  const submitFinalSolution = useMutation(api.workspace.submitFinalSolution);

  useEffect(() => {
    if (sessionStatus?.sessionStatus === "completed") {
      router.prefetch(`/reports/${sessionPublicId}`);
    }
  }, [router, sessionPublicId, sessionStatus?.sessionStatus]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!signalsRef.current?.contains(event.target as Node)) {
        setSignalsOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const activeMessages = activeTab === "interviewer" ? interviewerMessages : teammateMessages;
  const activeMessageTail = activeMessages?.[activeMessages.length - 1]?.id ?? null;
  const teammateMeta =
    TEAMMATE_SPECIALIZATIONS.find((entry) => entry.name === room?.channels[1]?.agentRole) ??
    TEAMMATE_SPECIALIZATIONS.find((entry) => entry.value === room?.channels[1]?.specialization) ??
    TEAMMATE_SPECIALIZATIONS[0];

  const remainingMs = room ? Math.max(0, room.timeBudgetMs - (now - room.startedAt)) : 0;
  const timer = room ? formatTimer(remainingMs) : "30:00";
  const elapsedMs = room ? Math.min(Math.max(0, now - room.startedAt), room.timeBudgetMs) : 0;
  const timerProgress = room ? elapsedMs / room.timeBudgetMs : 0;
  const timerDashOffset = TIMER_RING_C * (1 - timerProgress);
  const totalMinutes = room ? Math.round(room.timeBudgetMs / 60000) : 30;

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
  }, [
    activeMessageTail,
    activeTab,
    channelStreamInterviewer?.content,
    channelStreamInterviewer?.status,
    channelStreamTeammate?.content,
    channelStreamTeammate?.status,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    markTabRead(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!interviewerMessages || !teammateMessages) {
      return;
    }
    if (!notifyBootstrappedRef.current) {
      const iv = [...interviewerMessages]
        .reverse()
        .find((m) => m.speakerType === "interviewer");
      const tm = [...teammateMessages].reverse().find((m) => m.speakerType === "teammate");
      lastAgentInterviewerIdRef.current = iv?.id ?? null;
      lastAgentTeammateIdRef.current = tm?.id ?? null;
      notifyBootstrappedRef.current = true;
      return;
    }

    const iv = [...interviewerMessages]
      .reverse()
      .find((m) => m.speakerType === "interviewer");
    if (iv && iv.id !== lastAgentInterviewerIdRef.current) {
      lastAgentInterviewerIdRef.current = iv.id;
      if (activeTab !== "interviewer") {
        handleUnreadReply(
          "interviewer",
          "Interviewer replied",
          "Open the Interviewer tab to read the latest message.",
          "There is a new message on the interviewer channel.",
        );
      }
    }

    const tm = [...teammateMessages].reverse().find((m) => m.speakerType === "teammate");
    const teammateLabel = room?.channels[1]?.agentRole ?? "Teammate";
    if (tm && tm.id !== lastAgentTeammateIdRef.current) {
      lastAgentTeammateIdRef.current = tm.id;
      if (activeTab !== "teammate") {
        handleUnreadReply(
          "teammate",
          `${teammateLabel} replied`,
          "Open the teammate tab to read the latest message.",
          "There is a new message on the teammate channel.",
        );
      }
    }
  }, [interviewerMessages, teammateMessages, activeTab, room]);

  useEffect(() => {
    solutionSeededRef.current = false;
    notifyBootstrappedRef.current = false;
    lastAgentInterviewerIdRef.current = null;
    lastAgentTeammateIdRef.current = null;
  }, [sessionPublicId]);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    if (!solutionSeededRef.current) {
      seedSolutionDraft(workspace.solution.draftContent);
    }
  }, [workspace]);

  useEffect(() => {
    if (!solutionSeededRef.current) {
      return;
    }
    const handle = window.setTimeout(() => {
      void saveSolutionDraft({ sessionPublicId, draftContent: solutionDraft });
    }, 900);
    return () => window.clearTimeout(handle);
  }, [solutionDraft, sessionPublicId, saveSolutionDraft]);

  const interviewerChannelState = room?.channels.find((c) => c.kind === "interviewer");
  const teammateChannelState = room?.channels.find((c) => c.kind === "teammate");
  const agentBusyInterviewer =
    interviewerChannelState?.status === "thinking" ||
    interviewerChannelState?.status === "streaming";
  const agentBusyTeammate =
    teammateChannelState?.status === "thinking" || teammateChannelState?.status === "streaming";
  const agentBusy =
    activeTab === "interviewer" ? agentBusyInterviewer : agentBusyTeammate;
  const showStreamPreview =
    streamResponses && channelStream && channelStream.content.trim().length > 0;
  const showThinkingIndicator =
    agentBusy && (!streamResponses || !channelStream || channelStream.content.trim().length === 0);

  async function onSendMessage() {
    const channelKind = activeTab;
    const content =
      (channelKind === "interviewer" ? draftInterviewer : draftTeammate).trim();
    if (!content) {
      return;
    }

    const busyForChannel =
      channelKind === "interviewer" ? agentBusyInterviewer : agentBusyTeammate;
    if (busyForChannel) {
      return;
    }

    setError(null);
    startSending(async () => {
      try {
        const result = await sendMessage({
          sessionPublicId,
          channelKind,
          content,
          streamResponse: streamResponses,
        });
        if (result.blocked && result.warning) {
          return;
        }
        if (channelKind === "interviewer") {
          setDraftInterviewer("");
        } else {
          setDraftTeammate("");
        }
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

  function onSubmitFinalSolution() {
    setError(null);
    startFinalSubmit(async () => {
      try {
        await submitFinalSolution({
          sessionPublicId,
          content: solutionDraft,
        });
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "Unable to submit final solution.",
        );
      }
    });
  }

  function renderMessages(
    messages: NonNullable<typeof interviewerMessages>,
    sessionStartedAt: number,
  ) {
    let lastPhase: string | null = null;
    return messages.flatMap((message) => {
      const out: ReactNode[] = [];
      if (message.phase !== lastPhase) {
        lastPhase = message.phase;
        out.push(
          <div className="phdiv" key={`phase-${message.id}`}>
            {formatPhaseLabel(message.phase as InterviewPhase)}
          </div>,
        );
      }
      out.push(
        <article className="msg" key={message.id}>
          <div className="mhd">
            <strong className={speakerClass(message.speakerType)}>{message.speakerLabel}</strong>
            {message.badgeKind ? (
              <span className={getBadgeClass(message.badgeKind)}>{message.badgeKind}</span>
            ) : null}
            <span className="mt">{formatSessionElapsed(message.createdAt, sessionStartedAt)}</span>
          </div>
          <div
            className={`${bubbleClass(message.speakerType)}${bubbleAccent(
              message.badgeKind,
              message.speakerType,
            )}`}
          >
            {message.content}
          </div>
          {message.eventSummary ? (
            <div className="mev">
              <span
                className="edot"
                style={{
                  background:
                    message.speakerType === "teammate"
                      ? "var(--blue)"
                      : message.badgeKind === "stress"
                        ? "var(--red)"
                        : "var(--amber)",
                }}
              />
              {message.eventSummary}
            </div>
          ) : null}
        </article>,
      );
      return out;
    });
  }

  if (
    room === undefined ||
    interviewerMessages === undefined ||
    teammateMessages === undefined ||
    notes === undefined
  ) {
    return (
      <main className="page-shell page-shell--app">
        <ShellTopbar meta="Live session" />
        <div className="centered-state">
          <div className="loading-card glass-panel gpanel">
            <div className="section-title">Loading room</div>
            <h1 className="section-heading">Connecting to Convex</h1>
            <p className="status-copy">
              Pulling the live session state, channels, notes, and signals into the interview shell.
            </p>
            <p className="loading-card__hint">
              Session <span className="mono-pill">{sessionPublicId}</span>
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (room === null) {
    return (
      <main className="page-shell page-shell--app">
        <ShellTopbar meta="Live session" />
        <div className="centered-state">
          <div className="loading-card glass-panel gpanel">
            <div className="section-title">Session missing</div>
            <h1 className="section-heading">No interview found</h1>
            <p className="status-copy">
              This session ID is invalid or the room has not been created yet.
            </p>
            <div className="button-row" style={{ marginTop: 8 }}>
              <Link className="primary-button" href="/">
                Back to start
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const displayPhase = computeTimedPhaseFromSession(room.startedAt, room.timeBudgetMs, now);
  const phaseNum = PHASES.indexOf(displayPhase) + 1;
  const teammateName = room.channels[1]?.agentRole ?? "Teammate";
  const teammateTabLabel = `${teammateName} · ${teammateMeta.shortLabel}`;

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

          <div className="tw">
            <svg className="rsvg" width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
              <circle className="ttrack" cx="34" cy="34" r="30" transform="rotate(-90 34 34)" />
              <circle
                className="tprog"
                cx="34"
                cy="34"
                r="30"
                transform="rotate(-90 34 34)"
                strokeDasharray={TIMER_RING_C}
                strokeDashoffset={timerDashOffset}
              />
            </svg>
            <div className="tnum">{timer}</div>
            <div className="tof">of {totalMinutes} min</div>
          </div>

          <div>
            <div className="rl" style={{ marginBottom: 7 }}>
              Phases
            </div>
            <div className="phases">
              {PHASES.map((phase) => (
                <div key={phase} className={`ph ${getPhaseState(displayPhase, phase)}`}>
                  <div className="pip" />
                  <span className="phn">{formatPhaseLabel(phase)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-solution">
            <div className="rl" style={{ marginBottom: 6 }}>
              Solution workspace
            </div>
            <SolutionMarkdownEditor
              variant="compact"
              value={solutionDraft}
              onChange={setSolutionDraft}
              placeholder="Markdown · autosaves"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="primary-button"
                type="button"
                onClick={() => setSolutionExpanded(true)}
                style={{ flex: 1, minWidth: 120, fontSize: 12, padding: "6px 10px" }}
              >
                Expand editor
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={isSubmittingFinal || !solutionDraft.trim()}
                onClick={onSubmitFinalSolution}
                style={{ flex: 1, minWidth: 120, fontSize: 12, padding: "6px 10px" }}
              >
                {isSubmittingFinal
                  ? "…"
                  : workspace?.solution.finalSubmittedAt
                    ? "Update final"
                    : "Submit final"}
              </button>
            </div>
            {workspace?.solution.finalSubmittedAt ? (
              <div className="status-copy" style={{ fontSize: 10, opacity: 0.85 }}>
                Locked {new Date(workspace.solution.finalSubmittedAt).toLocaleTimeString()}
              </div>
            ) : null}
          </div>

          <div>
            <div className="rl" style={{ marginBottom: 7 }}>
              In this room
            </div>
            <div className="agents">
              {room.channels.map((channel) => (
                <div className="ag" key={channel.kind}>
                  <div
                    className={`agav ${channel.kind === "interviewer" ? "avi" : "avt"}`}
                  >
                    {channel.kind === "interviewer"
                      ? "I"
                      : (channel.agentRole?.charAt(0) ?? "T").toUpperCase()}
                  </div>
                  <div className="agin">
                    <div className="agn">{channel.agentRole}</div>
                    <div className="agr">
                      {channel.kind === "interviewer"
                        ? `${formatModeLabel(room.mode)} · ${channel.mode}`
                        : channel.specialization ?? teammateMeta.label}
                    </div>
                  </div>
                  <div className="pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="spacer" />

          <div className="rfoot">
            <div className="mbadge2">{formatModeLabel(room.mode)}</div>
            <div className="fbtns">
              <button
                className={`ibt strig${signalsOpen ? " open" : ""}`}
                ref={signalsRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setSignalsOpen((o) => !o);
                }}
                type="button"
                title="Live signals"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <polyline
                    points="22 12 18 12 15 21 9 3 6 12 2 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="spop">
                  <div className="sph">Live Signals</div>
                  {(
                    [
                      ["Requirements", room.signals.requirementsScore, "var(--sage)"],
                      ["Architecture", room.signals.architectureScore, "var(--blue)"],
                      ["Tradeoffs", room.signals.tradeoffScore, "var(--amber)"],
                      ["Collaboration", room.signals.collaborationScore, "var(--sage)"],
                    ] as const
                  ).map(([label, value, color]) => (
                    <div className="sr" key={label}>
                      <div className="snm">{label}</div>
                      <div className="str">
                        <div className="sfi" style={{ width: `${value}%`, background: color }} />
                      </div>
                      <div className="svl">{value}</div>
                    </div>
                  ))}
                  <div className="sr">
                    <div className="snm">Nudges given</div>
                    <div className="str">
                      <div
                        className="sfi"
                        style={{
                          width: `${Math.min(100, room.signals.nudgesGiven * 18)}%`,
                          background: "var(--red)",
                        }}
                      />
                    </div>
                    <div className="svl">{room.signals.nudgesGiven}</div>
                  </div>
                  <div className="sr">
                    <div className="snm">Stress</div>
                    <div className="str">
                      <div
                        className="sfi"
                        style={{
                          width: `${Math.min(100, room.counters.stressCount * 20)}%`,
                          background: "var(--amber)",
                        }}
                      />
                    </div>
                    <div className="svl">{room.counters.stressCount}</div>
                  </div>
                </div>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <section className="room-main" id="center">
          <div className="ctop gpanel">
            <div>
              <div className="sname">{room.title}</div>
              <div className="ssub">
                {room.subtitle} · {room.candidateName}
              </div>
            </div>
            <div className="pchip">
              <span className="pcdot" />
              Phase {phaseNum} · {formatPhaseLabel(displayPhase)}
            </div>
            <button className="endbtn" onClick={onEndSession} disabled={isEnding} type="button">
              {isEnding ? "Ending…" : "End Session"}
            </button>
          </div>

          <div className="tabs gpanel">
            <button
              className={`tab${activeTab === "interviewer" ? " on-i" : ""}`}
              data-active={activeTab === "interviewer"}
              data-tab="interviewer"
              data-pending={agentBusyInterviewer ? "true" : "false"}
              onClick={() => setActiveTab("interviewer")}
              type="button"
            >
              <span className="tav tavi">I</span>
              Interviewer
              {tabUnread.interviewer ? <span className="tab-ping" aria-label="Unread" /> : null}
              <span className="tsdot" title={agentBusyInterviewer ? "Responding…" : undefined} />
            </button>
            <button
              className={`tab${activeTab === "teammate" ? " on-t" : ""}`}
              data-active={activeTab === "teammate"}
              data-tab="teammate"
              data-pending={agentBusyTeammate ? "true" : "false"}
              onClick={() => setActiveTab("teammate")}
              type="button"
            >
              <span className="tav tavt">{(teammateName.charAt(0) || "T").toUpperCase()}</span>
              {teammateTabLabel}
              {tabUnread.teammate ? <span className="tab-ping" aria-label="Unread" /> : null}
              <span className="tsdot bl" title={agentBusyTeammate ? "Responding…" : undefined} />
            </button>
          </div>

          <div className="conversation">
            <div className="msgs" data-testid="message-scroll" ref={messageScrollRef}>
              <div className="sysln">
                <span>
                  {activeTab === "interviewer"
                    ? `Interviewer channel · ${formatModeLabel(room.mode)} mode · Rubric ${room.rubricVersion} · Use the teammate tab to brainstorm tradeoffs with your specialist peer.`
                    : `${teammateName} · ${room.channels[1]?.specialization ?? teammateMeta.label} · Teammate channel · Bounce ideas and risks here; switch to Interviewer for formal probes.`}
                </span>
              </div>

              {activeMessages && room ? renderMessages(activeMessages, room.startedAt) : null}
              {showThinkingIndicator ? (
                <article className="msg" aria-live="polite">
                  <div className="mhd">
                    <strong className={speakerClass(activeTab)}>
                      {activeTab === "interviewer" ? "Interviewer" : teammateName}
                    </strong>
                    <span className="mbg bg-team">thinking</span>
                    <span className="mt">…</span>
                  </div>
                  <div className={`${bubbleClass(activeTab === "interviewer" ? "interviewer" : "teammate")} typing-dots`}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </article>
              ) : null}
              {showStreamPreview ? (
                <article className="msg" aria-live="polite">
                  <div className="mhd">
                    <strong className={speakerClass(activeTab)}>
                      {activeTab === "interviewer" ? "Interviewer" : teammateName}
                    </strong>
                    <span className="mbg bg-team">streaming</span>
                    <span className="mt">live</span>
                  </div>
                  <div
                    className={`${bubbleClass(activeTab === "interviewer" ? "interviewer" : "teammate")} stream-preview`}
                  >
                    {channelStream?.content}
                  </div>
                </article>
              ) : null}
            </div>

            <div
              className={`inpa composer composer--${activeTab === "interviewer" ? "interviewer" : "teammate"}`}
            >
              <div className="inpr">
                <textarea
                  className={`inp inp--${activeTab === "interviewer" ? "interviewer" : "teammate"}`}
                  value={activeTab === "interviewer" ? draftInterviewer : draftTeammate}
                  onChange={(event) =>
                    activeTab === "interviewer"
                      ? setDraftInterviewer(event.target.value)
                      : setDraftTeammate(event.target.value)
                  }
                  onKeyDown={onComposerKeyDown}
                  disabled={agentBusy}
                  placeholder={
                    activeTab === "interviewer"
                      ? "Reply to interviewer…"
                      : `Reply to ${teammateName}…`
                  }
                  rows={1}
                />
                <button
                  className={`snd${activeTab === "teammate" ? " bl" : ""}`}
                  disabled={isSending || agentBusy}
                  onClick={() => void onSendMessage()}
                  type="button"
                  aria-label="Send"
                >
                  {isSending ? (
                    <span style={{ fontSize: 16, letterSpacing: 1, opacity: 0.85 }}>…</span>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="inh" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <label style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={streamResponses}
                    onChange={(event) => setStreamResponses(event.target.checked)}
                    disabled={agentBusy}
                  />
                  <span>Stream assistant replies</span>
                </label>
                <span style={{ opacity: 0.7 }}>Enter to send · Shift+Enter for new line</span>
              </div>
              {error ? <div className="error-copy" style={{ marginTop: 10 }}>{error}</div> : null}
            </div>
          </div>
        </section>

        <aside className="room-side gpanel" id="right">
          <div className="nhd">
            <div className="ntitle">Shared brief</div>
            <button
              className="abtn"
              type="button"
              title="View brief full screen"
              aria-label="View brief full screen"
              onClick={() => setBriefExpanded(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 3H5a2 2 0 0 0-2 2v4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M15 21h4a2 2 0 0 0 2-2v-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="nbody room-brief-nbody">
            {workspace?.notifications && workspace.notifications.length > 0 ? (
              <div style={{ marginBottom: 10 }}>
                <div className="rl" style={{ marginBottom: 6 }}>
                  Alerts
                </div>
                {workspace.notifications.map((note) => (
                  <div
                    key={`${note.type}-${note.createdAt}`}
                    className="mev"
                    style={{ marginBottom: 8, textAlign: "left" }}
                  >
                    <span
                      className="edot"
                      style={{
                        background:
                          note.type === "stress_event_started"
                            ? "var(--red)"
                            : note.type === "integrity_warning"
                              ? "var(--amber)"
                              : "var(--blue)",
                      }}
                    />
                    <div>
                      <strong style={{ fontSize: 12 }}>{note.title}</strong>
                      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>{note.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="sysln" style={{ textAlign: "left", padding: "4px 0 6px" }}>
              <span>Problem + pool context</span>
            </div>
            <div className="sticky" style={{ background: "#e0e7ff" }}>
              <div className="shd">
                <div className="slbl">Problem</div>
              </div>
              <div className="sta sta--readonly" style={{ userSelect: "text" }}>
                {workspace?.problemStatement ?? room.title}
              </div>
            </div>
            {workspace?.jobDescription ? (
              <div className="sticky" style={{ background: "#fef3c7", marginTop: 8 }}>
                <div className="shd">
                  <div className="slbl">Job description</div>
                </div>
                <div className="sta sta--readonly" style={{ userSelect: "text" }}>
                  {workspace.jobDescription}
                </div>
              </div>
            ) : null}
            {workspace?.sharedContextSeed ? (
              <div className="sticky" style={{ background: "#dbeafe", marginTop: 8 }}>
                <div className="shd">
                  <div className="slbl">Shared pool seed</div>
                </div>
                <div className="sta sta--readonly" style={{ userSelect: "text" }}>
                  {workspace.sharedContextSeed}
                </div>
              </div>
            ) : null}
          </div>

          <div className="nhd">
            <div className="ntitle">Scratch Pad</div>
            <button
              className="abtn"
              type="button"
              title="Scroll to new note"
              aria-label="Scroll to new note"
              onClick={() =>
                scratchComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
              }
            >
              +
            </button>
          </div>

          <input
            className="text-input scratch-search"
            value={noteSearch}
            onChange={(event) => setNoteSearch(event.target.value)}
            placeholder="Search notes…"
          />

          <div className="nbody notes-list-scroll">
            {visibleNotes && visibleNotes.length > 0 ? (
              visibleNotes.map((note) => (
                <div className="sticky" key={note.id} style={{ background: note.color }}>
                  <div className="shd">
                    <div className="slbl">{note.label}</div>
                    <button
                      className="scls"
                      type="button"
                      aria-label="Remove note"
                      onClick={() => void deleteNote({ noteId: note.id })}
                    >
                      {"\u2715"}
                    </button>
                  </div>
                  <textarea
                    className="sta"
                    value={note.content}
                    onChange={(event) => {
                      void updateNote({
                        noteId: note.id,
                        content: event.target.value,
                        label: note.label,
                      });
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="empty-copy note-empty">
                No notes match this search. Add a note below.
              </div>
            )}

            <div className="scratch-composer" ref={scratchComposerRef}>
              <select
                className="select-input"
                value={noteLabel}
                onChange={(event) => setNoteLabel(event.target.value as typeof noteLabel)}
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
        </aside>
      </div>

      {briefExpanded ? (
        <div
          className="solution-expand-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Shared brief"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setBriefExpanded(false);
            }
          }}
        >
          <div
            className="solution-expand-panel brief-expand-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="solution-expand-panel__hd">
              <span>Shared brief</span>
              <button className="endbtn" type="button" onClick={() => setBriefExpanded(false)}>
                Close
              </button>
            </div>
            <div className="solution-expand-panel__bd brief-expand-body">
              {workspace?.notifications && workspace.notifications.length > 0 ? (
                <div className="brief-expand-block">
                  <h3>Alerts</h3>
                  {workspace.notifications.map((note) => (
                    <div key={`${note.type}-${note.createdAt}`} style={{ marginBottom: 12 }}>
                      <strong style={{ display: "block", marginBottom: 4 }}>{note.title}</strong>
                      <p>{note.detail}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="brief-expand-block">
                <h3>Problem</h3>
                <p>{workspace?.problemStatement ?? room.title}</p>
              </div>
              {workspace?.jobDescription ? (
                <div className="brief-expand-block">
                  <h3>Job description</h3>
                  <p>{workspace.jobDescription}</p>
                </div>
              ) : null}
              {workspace?.sharedContextSeed ? (
                <div className="brief-expand-block">
                  <h3>Shared pool seed</h3>
                  <p>{workspace.sharedContextSeed}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {solutionExpanded ? (
        <div
          className="solution-expand-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded solution editor"
        >
          <div className="solution-expand-panel">
            <div className="solution-expand-panel__hd">
              <span>Solution workspace · Markdown</span>
              <button className="endbtn" type="button" onClick={() => setSolutionExpanded(false)}>
                Close
              </button>
            </div>
            <div className="solution-expand-panel__bd">
              <SolutionMarkdownEditor
                variant="fullscreen"
                value={solutionDraft}
                onChange={setSolutionDraft}
                placeholder="Write your full design write-up: headings, lists, code fences. Autosaves."
              />
            </div>
            <div className="solution-expand-panel__ft">
              <button className="primary-button" type="button" onClick={onSubmitFinalSolution}>
                {isSubmittingFinal
                  ? "Submitting…"
                  : workspace?.solution.finalSubmittedAt
                    ? "Update final submission"
                    : "Submit final solution"}
              </button>
              {workspace?.solution.finalSubmittedAt ? (
                <span className="status-copy" style={{ alignSelf: "center" }}>
                  Last submitted {new Date(workspace.solution.finalSubmittedAt).toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="room-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className="room-toast"
            onClick={() => setToasts((list) => list.filter((t) => t.id !== toast.id))}
          >
            <strong>{toast.title}</strong>
            {toast.detail}
          </button>
        ))}
      </div>
    </main>
  );
}
