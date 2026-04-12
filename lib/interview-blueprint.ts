import { TEAMMATE_SPECIALIZATIONS, type TeammateSpecialization } from "./constants";

export type NoteLabel =
  | "Requirement"
  | "Constraint"
  | "Design note"
  | "Open question"
  | "Assumption"
  | "To revisit";

export type ApprovedClarification = {
  key: string;
  value: string;
  keywords: string[];
};

export type ResumeProfile = {
  candidateName: string | null;
  summary: string;
  skills: string[];
  domains: string[];
  seniority: string;
  resumeText: string;
};

export type BlueprintDefaultNote = {
  label: NoteLabel;
  color: string;
  content: string;
  sortOrder: number;
};

export type InterviewBlueprint = {
  scenarioId: string;
  title: string;
  subtitle: string;
  roleLevel: string;
  problemStatement: string;
  initialInterviewerBrief: string;
  initialTeammateMessage: string;
  teammateSpecialization: TeammateSpecialization;
  teammateName: string;
  teammateLabel: string;
  approvedClarifications: ApprovedClarification[];
  defaultNotes: BlueprintDefaultNote[];
  solutionTemplate: string;
  sharedContextSeed: string;
  initialRequirementSummary: string;
  initialRiskSummary: string;
};

type ScenarioTrackId =
  | "messaging"
  | "fraud_risk"
  | "streaming_data"
  | "collaboration"
  | "marketplace"
  | "notifications"
  | "infra_platform";

type ScenarioTrack = {
  id: ScenarioTrackId;
  title: string;
  categoryLabel: string;
  keywords: string[];
  preferredTeammate: TeammateSpecialization;
  objective: string;
  focusAreas: string[];
  clarifications: ApprovedClarification[];
  defaultNotes: Array<{
    label: NoteLabel;
    color: string;
    content: string;
  }>;
  stressAngle: string;
  solutionFocus: string[];
};

const defaultColors: Record<NoteLabel, string> = {
  Requirement: "#f7ec6e",
  Constraint: "#fde68a",
  "Design note": "#bbf7d0",
  "Open question": "#bfdbfe",
  Assumption: "#fbcfe8",
  "To revisit": "#fecaca",
};

const scenarioTracks: Record<ScenarioTrackId, ScenarioTrack> = {
  messaging: {
    id: "messaging",
    title: "Global Messaging Platform",
    categoryLabel: "System Design",
    keywords: [
      "chat",
      "messaging",
      "conversation",
      "presence",
      "websocket",
      "fanout",
      "real time",
      "realtime",
      "delivery receipts",
    ],
    preferredTeammate: "sre_infra",
    objective:
      "Design a global messaging platform that sustains heavy fan-out, durable offline delivery, and predictable ordering under regional load spikes.",
    focusAreas: [
      "ordering guarantees",
      "fan-out and delivery",
      "connection routing",
      "offline sync",
      "regional failover",
    ],
    clarifications: [
      clarification("group_size", ["group", "groups", "member", "members"], "Both DMs and groups are in scope, with groups up to 500 members."),
      clarification("ordering", ["ordering", "order", "sequence"], "Strong ordering is required within each conversation."),
      clarification("offline", ["offline", "retention", "delivery"], "Offline delivery is required for a 7-day window."),
      clarification("presence", ["presence", "last seen", "online"], "Presence indicators are in scope."),
      clarification("receipts", ["receipt", "read receipt", "seen"], "Read receipts are in scope, but best-effort delivery is acceptable."),
    ],
    defaultNotes: [
      note("Requirement", "Strong per-conversation ordering with offline delivery."),
      note("Constraint", "Sub-250ms end-to-end delivery for active conversations."),
      note("Design note", "Regional edge routing plus durable async fan-out."),
      note("Open question", "How do you preserve order during partition leader failover?"),
    ],
    stressAngle:
      "A viral event spikes write traffic 20x in 90 seconds and one region starts flapping leadership for hot shards.",
    solutionFocus: [
      "Request flow from client connection to durable write",
      "Sequencing and id assignment",
      "Fan-out, backpressure, and offline replay",
      "Multi-region failover boundaries",
    ],
  },
  fraud_risk: {
    id: "fraud_risk",
    title: "Real-Time Fraud Detection Platform",
    categoryLabel: "System Design",
    keywords: [
      "fraud",
      "risk",
      "payment",
      "checkout",
      "authorization",
      "transaction",
      "chargeback",
      "identity",
      "abuse",
    ],
    preferredTeammate: "data",
    objective:
      "Design a fraud detection platform that scores transactions in real time while keeping the authorization path fast and explainable.",
    focusAreas: [
      "online scoring",
      "feature freshness",
      "false positive control",
      "feedback loops",
      "model and rules evolution",
    ],
    clarifications: [
      clarification("latency", ["latency", "sla", "p99"], "The risk score must return within 150ms p99 on the online path."),
      clarification("fallback", ["fallback", "degrade", "degradation"], "If the model service is degraded, a bounded rule fallback is required."),
      clarification("feedback", ["feedback", "chargeback", "label"], "Chargeback and manual review outcomes land with hours-to-days latency."),
      clarification("regions", ["region", "multi region", "global"], "Traffic is global, but authorization decisions should stay region-local whenever possible."),
      clarification("explanations", ["explain", "reason code", "appeal"], "Analyst-facing reason codes are required for every hard decline."),
    ],
    defaultNotes: [
      note("Requirement", "Online decisioning must fit the payment authorization latency budget."),
      note("Constraint", "Feature freshness and fallback rules matter as much as model quality."),
      note("Design note", "Separate low-latency scoring path from offline training and feedback ingestion."),
      note("Open question", "How do you prevent stale or missing features from causing unsafe declines?"),
    ],
    stressAngle:
      "A coordinated attack shifts device fingerprints and card-testing volume surges while labels are delayed.",
    solutionFocus: [
      "Feature retrieval and freshness guarantees",
      "Online scoring and fallback rules",
      "Feedback ingestion and training loop",
      "Analyst tooling and reason-code explainability",
    ],
  },
  streaming_data: {
    id: "streaming_data",
    title: "Streaming Event Ingestion Platform",
    categoryLabel: "System Design",
    keywords: [
      "kafka",
      "streaming",
      "events",
      "pipeline",
      "etl",
      "cdc",
      "warehouse",
      "feature store",
      "analytics",
    ],
    preferredTeammate: "data",
    objective:
      "Design a streaming data platform that ingests product and user events reliably and serves downstream analytics plus near-real-time operational use cases.",
    focusAreas: [
      "ingestion durability",
      "schema evolution",
      "backfills and replay",
      "freshness vs cost",
      "consumer isolation",
    ],
    clarifications: [
      clarification("volume", ["volume", "throughput", "events"], "Peak sustained ingest is 5 million events per minute across multiple producers."),
      clarification("freshness", ["freshness", "sla", "delay"], "Operational consumers want data available within 2 minutes."),
      clarification("replay", ["replay", "backfill", "late data"], "Historical replay and backfill are required without breaking downstream consumers."),
      clarification("schema", ["schema", "contracts", "compatibility"], "Schema evolution must be backward compatible for at least one release window."),
      clarification("tenancy", ["tenant", "customer", "workspace"], "The platform is multi-tenant and noisy neighbors are a concern."),
    ],
    defaultNotes: [
      note("Requirement", "Durable ingest with safe replay and consumer isolation."),
      note("Constraint", "Freshness target is minutes, not milliseconds."),
      note("Design note", "Separate producer contracts, transport, and serving layers."),
      note("Open question", "What do you do when a single consumer falls far behind?"),
    ],
    stressAngle:
      "A bad producer deploy emits a schema-breaking payload and a major tenant triggers a replay at the same time.",
    solutionFocus: [
      "Producer contracts and ingestion edge",
      "Transport, partitioning, and replay",
      "Serving layers for analytics and operational reads",
      "Backfill controls and schema governance",
    ],
  },
  collaboration: {
    id: "collaboration",
    title: "Collaborative Editing Platform",
    categoryLabel: "System Design",
    keywords: [
      "collaboration",
      "document",
      "editor",
      "whiteboard",
      "comments",
      "realtime editing",
      "shared workspace",
      "sync",
    ],
    preferredTeammate: "backend",
    objective:
      "Design a collaborative editing product that keeps shared state responsive, conflict-aware, and recoverable during bursty multi-user sessions.",
    focusAreas: [
      "concurrency control",
      "sync protocol",
      "presence and cursors",
      "durability and snapshots",
      "permissioning",
    ],
    clarifications: [
      clarification("participants", ["participants", "editors", "users"], "Documents can have up to 200 concurrent editors."),
      clarification("offline", ["offline", "reconnect"], "Offline edits must reconcile safely after reconnect."),
      clarification("history", ["history", "undo", "version"], "Version history and point-in-time recovery are required."),
      clarification("permissions", ["permission", "share", "acl"], "Workspace permissions are hierarchical and change frequently."),
      clarification("objects", ["rich text", "drawing", "objects"], "The MVP supports rich text, comments, and lightweight embedded objects."),
    ],
    defaultNotes: [
      note("Requirement", "Low-latency shared editing with durable recovery."),
      note("Constraint", "Permission updates and reconnect paths are part of the design."),
      note("Design note", "Operational transform or CRDT choice needs a clear tradeoff story."),
      note("Open question", "How do you compact operation history without losing recovery guarantees?"),
    ],
    stressAngle:
      "A large planning session opens a hot document with many reconnecting clients and permission changes mid-edit.",
    solutionFocus: [
      "Real-time sync protocol",
      "Conflict resolution model",
      "Snapshotting and recovery",
      "Permissioning and reconnect behavior",
    ],
  },
  marketplace: {
    id: "marketplace",
    title: "Marketplace Order Orchestration",
    categoryLabel: "System Design",
    keywords: [
      "marketplace",
      "order",
      "inventory",
      "fulfillment",
      "delivery",
      "cart",
      "merchant",
      "seller",
      "pricing",
    ],
    preferredTeammate: "backend",
    objective:
      "Design an order orchestration system that keeps inventory, payments, and fulfillment state consistent across many sellers and warehouses.",
    focusAreas: [
      "inventory consistency",
      "workflow orchestration",
      "idempotency",
      "failure recovery",
      "seller isolation",
    ],
    clarifications: [
      clarification("inventory", ["inventory", "stock"], "Inventory is eventually synchronized from multiple seller systems."),
      clarification("payment", ["payment", "refund"], "Capture, refund, and partial cancellation flows are in scope."),
      clarification("latency", ["latency", "sla"], "Checkout confirmation should complete within 3 seconds in the common case."),
      clarification("delivery", ["delivery", "shipment"], "Orders can split across warehouses and shipments."),
      clarification("tenant", ["merchant", "seller", "tenant"], "Large sellers should not impact smaller ones during peak campaigns."),
    ],
    defaultNotes: [
      note("Requirement", "Idempotent workflow across inventory, payment, and shipment services."),
      note("Constraint", "Seller systems are inconsistent and partially trusted."),
      note("Design note", "Track workflow state explicitly and embrace compensation paths."),
      note("Open question", "What is the source of truth when inventory and fulfillment disagree?"),
    ],
    stressAngle:
      "A flash sale drives hot inventory contention and a downstream warehouse feed starts lagging badly.",
    solutionFocus: [
      "Checkout and reservation flow",
      "Workflow state machine",
      "Compensation and retries",
      "Seller and warehouse isolation",
    ],
  },
  notifications: {
    id: "notifications",
    title: "Multi-Channel Notification Platform",
    categoryLabel: "System Design",
    keywords: [
      "notification",
      "email",
      "push",
      "sms",
      "engagement",
      "campaign",
      "deliverability",
      "template",
      "preference center",
    ],
    preferredTeammate: "backend",
    objective:
      "Design a notification platform that powers product events and campaigns across channels while respecting user preferences and provider limits.",
    focusAreas: [
      "routing and fallback",
      "user preferences",
      "provider abstraction",
      "deduplication",
      "observability",
    ],
    clarifications: [
      clarification("channels", ["channel", "email", "push", "sms"], "Email, mobile push, in-app, and SMS are in scope."),
      clarification("preferences", ["preference", "opt out", "unsubscribe"], "Per-user preferences and legal opt-out requirements are mandatory."),
      clarification("volume", ["volume", "campaign", "burst"], "Large campaigns can create burst traffic 50x above baseline."),
      clarification("tenant", ["tenant", "workspace", "customer"], "The platform serves multiple products with different compliance profiles."),
      clarification("dedupe", ["dedupe", "duplicate", "repeat"], "Deduplication and rate limiting are required at both template and user levels."),
    ],
    defaultNotes: [
      note("Requirement", "Preference-aware delivery with per-channel fallback."),
      note("Constraint", "Provider limits and compliance requirements shape the design."),
      note("Design note", "Separate event ingestion, orchestration, and provider execution."),
      note("Open question", "How do you avoid duplicate sends during retries or provider failover?"),
    ],
    stressAngle:
      "A major campaign collides with transactional traffic while one SMS provider degrades and push receipts are delayed.",
    solutionFocus: [
      "Preference evaluation and dedupe",
      "Channel routing and provider abstraction",
      "Burst handling and scheduling",
      "Observability and replay",
    ],
  },
  infra_platform: {
    id: "infra_platform",
    title: "Multi-Region Deployment Control Plane",
    categoryLabel: "System Design",
    keywords: [
      "platform",
      "control plane",
      "deployment",
      "kubernetes",
      "cluster",
      "observability",
      "sre",
      "infra",
      "runtime",
    ],
    preferredTeammate: "sre_infra",
    objective:
      "Design a deployment control plane that safely rolls changes across many services and regions with clear rollback, policy, and audit behavior.",
    focusAreas: [
      "rollout orchestration",
      "policy enforcement",
      "observability",
      "rollback safety",
      "multi-region coordination",
    ],
    clarifications: [
      clarification("fleet", ["fleet", "services", "clusters"], "The control plane manages hundreds of services across multiple clusters and regions."),
      clarification("rollout", ["rollout", "canary", "progressive"], "Progressive delivery with automated rollback is required."),
      clarification("audit", ["audit", "compliance", "approval"], "All operator actions and policy overrides must be fully auditable."),
      clarification("blast radius", ["blast", "radius", "dependency"], "Dependency-aware rollout ordering matters for shared infrastructure."),
      clarification("signals", ["signal", "slo", "health"], "Health decisions combine platform signals with service-owned SLO checks."),
    ],
    defaultNotes: [
      note("Requirement", "Progressive rollout plus automated rollback with strong auditability."),
      note("Constraint", "Dependency ordering and blast-radius control are first-class concerns."),
      note("Design note", "Treat control plane state, policy, and execution workers separately."),
      note("Open question", "What happens when health signals disagree across regions?"),
    ],
    stressAngle:
      "A global rollout is halfway through when one region degrades and dependency graphs turn inconsistent.",
    solutionFocus: [
      "Control plane state and workflow engine",
      "Policy enforcement and approvals",
      "Signal collection and rollback",
      "Regional isolation and dependency ordering",
    ],
  },
};

export function buildInterviewBlueprint(args: {
  candidateName: string;
  jobDescription: string;
  resumeSummary: string;
  resumeText: string;
  teammateSpecializationOverride?: TeammateSpecialization | null;
}): InterviewBlueprint {
  const combined = normalizeText(
    [args.jobDescription, args.resumeSummary, args.resumeText].filter(Boolean).join("\n"),
  );
  const track = pickTrack(combined);
  const roleLevel = detectRoleLevel(combined);
  const candidateSummary = truncateText(
    normalizeText(args.resumeSummary || args.resumeText || args.candidateName),
    220,
  );
  const jobFocus = truncateText(normalizeText(args.jobDescription), 260);
  const teammateSpecialization =
    args.teammateSpecializationOverride ?? inferTeammate(track, combined);
  const teammateMeta =
    TEAMMATE_SPECIALIZATIONS.find((entry) => entry.value === teammateSpecialization) ??
    TEAMMATE_SPECIALIZATIONS[0];
  const sharedContextSeed = [
    `Candidate background: ${candidateSummary || "Generalist systems background."}`,
    `Job focus: ${jobFocus || "General distributed systems and architecture depth."}`,
    `Pressure angle: ${track.stressAngle}`,
  ].join("\n");
  const focusAreas = track.focusAreas.map((item) => `- ${item}`).join("\n");
  const solutionTemplate = buildSolutionTemplate(track, roleLevel);

  return {
    scenarioId: `generated-${track.id}`,
    title: track.title,
    subtitle: `${track.categoryLabel} · ${roleLevel}`,
    roleLevel,
    problemStatement: [
      track.objective,
      jobFocus ? `Use the job description as the framing signal: ${jobFocus}` : null,
      candidateSummary
        ? `Shape the discussion so it feels plausible for ${args.candidateName || "the candidate"} based on this background: ${candidateSummary}`
        : null,
      `Key pressure areas:\n${focusAreas}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    initialInterviewerBrief: [
      `Today’s problem is ${track.title}.`,
      track.objective,
      jobFocus ? `The role leans on: ${jobFocus}` : null,
      `Start by clarifying assumptions, then walk through the architecture, critical data flows, scaling model, failure handling, and tradeoffs.`,
      `Be ready to defend the design under pressure around ${track.stressAngle.toLowerCase()}.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    initialTeammateMessage: buildTeammateOpening(track, teammateMeta.name, teammateSpecialization),
    teammateSpecialization,
    teammateName: teammateMeta.name,
    teammateLabel: teammateMeta.label,
    approvedClarifications: track.clarifications,
    defaultNotes: track.defaultNotes.map((entry, index) => ({
      ...entry,
      sortOrder: index,
    })),
    solutionTemplate,
    sharedContextSeed,
    initialRequirementSummary: track.focusAreas.join(" | "),
    initialRiskSummary: track.stressAngle,
  };
}

export function makeResumeProfile(input?: Partial<ResumeProfile> | null): ResumeProfile {
  return {
    candidateName: normalizeNullableText(input?.candidateName) ?? null,
    summary: normalizeText(input?.summary ?? ""),
    skills: dedupeList(input?.skills ?? []),
    domains: dedupeList(input?.domains ?? []),
    seniority: normalizeText(input?.seniority ?? ""),
    resumeText: normalizeText(input?.resumeText ?? ""),
  };
}

export function serializeClarifications(clarifications: ApprovedClarification[]) {
  return JSON.stringify(clarifications);
}

export function parseClarifications(json: string | null | undefined) {
  if (!json) {
    return [] as ApprovedClarification[];
  }

  try {
    const parsed = JSON.parse(json) as ApprovedClarification[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item) =>
        typeof item?.key === "string" &&
        typeof item?.value === "string" &&
        Array.isArray(item?.keywords),
    );
  } catch {
    return [];
  }
}

function buildSolutionTemplate(track: ScenarioTrack, roleLevel: string) {
  const focusList = track.solutionFocus.map((item) => `- ${item}`).join("\n");

  return [
    `# Final Solution Outline`,
    ``,
    `## Problem Framing`,
    `- Target role level: ${roleLevel}`,
    `- Primary objective:`,
    `- Core scale / SLA assumptions:`,
    `- Explicitly out of scope:`,
    ``,
    `## Requirements`,
    `- Functional requirements:`,
    `- Non-functional requirements:`,
    `- Clarifications that change the design:`,
    ``,
    `## High-Level Architecture`,
    `- Main components:`,
    `- Primary request/data flow:`,
    `- Storage and state boundaries:`,
    ``,
    `## Deep Dive`,
    focusList,
    ``,
    `## Reliability And Tradeoffs`,
    `- Failure modes and mitigations:`,
    `- Capacity / scaling model:`,
    `- Key tradeoffs and why this design wins:`,
    ``,
    `## Final Recommendation`,
    `- What I would ship first:`,
    `- What I would defer:`,
    `- Biggest remaining risk:`,
  ].join("\n");
}

function buildTeammateOpening(
  track: ScenarioTrack,
  teammateName: string,
  specialization: TeammateSpecialization,
) {
  const openerBySpecialization: Record<TeammateSpecialization, string> = {
    sre_infra: `I’m ${teammateName}. I’ll pressure-test availability, capacity, and what breaks first under ${track.stressAngle.toLowerCase()}.`,
    backend: `I’m ${teammateName}. I’ll stay close to APIs, state ownership, and how the core services behave under load.`,
    data: `I’m ${teammateName}. I’ll focus on data movement, correctness, freshness, and whether the signals stay trustworthy at scale.`,
  };

  return openerBySpecialization[specialization];
}

function pickTrack(text: string) {
  let bestTrack = scenarioTracks.messaging;
  let bestScore = -1;

  for (const track of Object.values(scenarioTracks)) {
    const score = track.keywords.reduce((total, keyword) => {
      return total + (text.includes(keyword) ? 2 : 0);
    }, 0);
    if (score > bestScore) {
      bestTrack = track;
      bestScore = score;
    }
  }

  return bestTrack;
}

function inferTeammate(track: ScenarioTrack, text: string): TeammateSpecialization {
  if (track.preferredTeammate === "data") {
    return "data";
  }

  if (
    track.preferredTeammate === "sre_infra" ||
    includesOneOf(text, ["sre", "kubernetes", "platform", "observability", "infra"])
  ) {
    return "sre_infra";
  }

  if (includesOneOf(text, ["fraud", "risk", "analytics", "feature", "model", "warehouse"])) {
    return "data";
  }

  return "backend";
}

function detectRoleLevel(text: string) {
  if (text.includes("principal")) {
    return "Principal Engineer";
  }
  if (text.includes("staff")) {
    return "Staff Engineer";
  }
  if (text.includes("lead")) {
    return "Lead Engineer";
  }
  if (text.includes("senior")) {
    return "Senior Engineer";
  }
  return "Software Engineer";
}

function includesOneOf(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function clarification(key: string, keywords: string[], value: string): ApprovedClarification {
  return { key, keywords, value };
}

function note(label: NoteLabel, content: string) {
  return {
    label,
    color: defaultColors[label],
    content,
  };
}

function normalizeNullableText(value: string | null | undefined) {
  const normalized = normalizeText(value ?? "");
  return normalized || null;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function dedupeList(values: string[]) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}
