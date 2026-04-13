import { TEAMMATE_SPECIALIZATIONS, type InterviewKind, type TeammateSpecialization } from "./constants";
import { buildConsultingCaseBlueprint } from "./consulting-case-blueprint";
import {
  getCanonicalMetricsForTrack,
  getMessagingMetricsBlock,
  type MetricTrackId,
} from "./blueprint-metrics";

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
      clarification(
        "volume",
        ["volume", "throughput", "events"],
        "Peak sustained ingest, burst headroom, and partition counts are exactly as listed under Quantified targets in the problem statement.",
      ),
      clarification(
        "freshness",
        ["freshness", "sla", "delay"],
        "Operational vs warehouse freshness and lag targets are exactly as listed under Quantified targets in the problem statement.",
      ),
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

type SessionVariantPack = {
  variantIndex: number;
  displayTitle: string;
  problemLead: string;
  objectiveAddon: string;
  constraintBlock: string;
  /** Exact numeric SLAs for this session (bullet list). */
  metricsBlock: string;
  stressScenario: string;
  focusLines: string[];
  interviewerBrief: string;
};

const MESSAGING_DEEP_VARIANTS: Array<{
  title: string;
  problemLead: string;
  objectiveAddon: string;
  constraints: string[];
  stress: string;
  checklist: string[];
}> = [
  {
    title: "Global Messaging Platform",
    problemLead:
      "You are designing a production-grade messaging layer for a consumer product with global traffic.",
    objectiveAddon:
      "Emphasize durable fan-out, per-conversation ordering, and graceful degradation when individual regions misbehave.",
    constraints: [
      "Groups up to 500 members must not collapse hot-partition throughput for 1:1 chats.",
      "Offline sync must reconcile without exposing internal broker sequence gaps to clients.",
      "Read receipts and typing may drop under load; message delivery may not.",
      "You must quantify ordering scope (per chat vs global) and defend the choice.",
    ],
    stress:
      "A viral burst multiplies writes ~20× in 90 seconds while one region’s shard leadership flaps. Show how you detect it, shed load, and avoid double delivery.",
    checklist: [
      "State 3 measurable SLAs before drawing components.",
      "Trace one cross-region send with IDs, ordering, and retries end-to-end.",
      "Name two explicit backpressure points and who consumes them.",
    ],
  },
  {
    title: "Unified Conversation Service",
    problemLead:
      "Treat chat as a first-class product surface: search, threads, and attachments ride the same pipeline as text.",
    objectiveAddon:
      "Separate hot path (send/ack) from cold path (history, search indexing) without double-charging storage costs.",
    constraints: [
      "Attachments and large payloads cannot block the sub-200ms send acknowledgement path.",
      "Thread replies must stay ordered relative to their parent without a global total order.",
      "Search/indexing may lag minutes; messaging state may not.",
      "Call out how you prevent abusive clients from pinning hot keys indefinitely.",
    ],
    stress:
      "A deploy pushes a bad serialization schema while a campaign drives a 50× burst. Walk through detection, rollback, and safe replay.",
    checklist: [
      "Draw data flow for send vs search with different storage systems if needed.",
      "Explain idempotency keys for at-least-once delivery.",
      "Identify one consistency tradeoff you accept for search freshness.",
    ],
  },
  {
    title: "Regional Messaging Mesh",
    problemLead:
      "Users expect low latency in-region with eventual convergence across regions, not a single global choke point.",
    objectiveAddon:
      "Partition ownership, leader election boundaries, and failover drills are first-class in your story.",
    constraints: [
      "Cross-region traffic must avoid a single writer bottleneck unless you justify it.",
      "You must address network partitions: what happens to sends when regions cannot talk?",
      "Presence may be stale; undelivered messages may not silently disappear.",
      "Describe how you migrate traffic between cells without mass client reconnect storms.",
    ],
    stress:
      "Half of a region’s brokers restart during peak. Show how clients and routers rebalance without stampeding metadata stores.",
    checklist: [
      "List failure domains (AZ, region, global control plane) and blast radius for each.",
      "Give a concrete leader election or ownership story for at least one shard type.",
      "Cover observability: what signals page you at 2am?",
    ],
  },
  {
    title: "Realtime Conversation Infrastructure",
    problemLead:
      "Engineering reliability for mobile + web clients with flaky networks and aggressive backgrounding.",
    objectiveAddon:
      "Client protocol design (reconnect, resume tokens, gap fill) matters as much as server scale.",
    constraints: [
      "Mobile clients may stay offline for days; replay must be bounded and user-visible.",
      "Battery and data usage constrain push/pull frequency. Justify your strategy.",
      "WebSockets vs long polling vs QUIC: pick and defend for your assumed client mix.",
      "Security: token binding, device revocation, and abuse on connection storms.",
    ],
    stress:
      "A client bug causes reconnect loops that amplify write QPS. How does the edge protect the core?",
    checklist: [
      "Sketch client session state machine for connect / resume / gap recovery.",
      "Explain how you cap per-device connection churn.",
      "Tie at least one control-plane vs data-plane boundary to a concrete failure.",
    ],
  },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function rotateArray<T>(items: T[], start: number): T[] {
  if (items.length === 0) {
    return items;
  }
  const n = ((start % items.length) + items.length) % items.length;
  return [...items.slice(n), ...items.slice(0, n)];
}

function buildSessionVariant(track: ScenarioTrack, entropy: string): SessionVariantPack {
  const h = hashString(entropy + track.id);

  if (track.id === "messaging") {
    const idx = h % MESSAGING_DEEP_VARIANTS.length;
    const mv = MESSAGING_DEEP_VARIANTS[idx];
    const { metricsBlock, stressIncident } = getMessagingMetricsBlock(entropy);
    const constraintBlock = mv.constraints.map((c, i) => `${i + 1}. ${c}`).join("\n");
    const stressScenario = `${mv.stress}\n\nQuantified incident: ${stressIncident}`;
    const interviewerBrief = [
      mv.title,
      `${mv.problemLead} ${track.objective}`,
      ...(mv.objectiveAddon ? [mv.objectiveAddon] : []),
      `Quantified targets (canonical; use these exact figures in discussion):\n${metricsBlock}`,
      `Requirements:\n${constraintBlock}`,
      `Here's an incident to work through as you design:\n${stressScenario}`,
    ].join("\n\n");

    return {
      variantIndex: idx,
      displayTitle: mv.title,
      problemLead: `${mv.problemLead} ${track.objective}`,
      objectiveAddon: mv.objectiveAddon,
      constraintBlock,
      metricsBlock,
      stressScenario,
      focusLines: rotateArray(track.focusAreas, h),
      interviewerBrief,
    };
  }

  const idx = h % 3;
  const rotated = rotateArray(track.focusAreas, idx);
  const { metricsBlock, stressIncident } = getCanonicalMetricsForTrack(
    track.id as MetricTrackId,
    entropy,
  );
  const stressAlt = [
    `${track.stressAngle}`,
    `Escalation: ${track.stressAngle} while a dependent service SLO breaches simultaneously.`,
    `Twist: ${track.stressAngle} with a partial data migration in flight.`,
  ][idx % 3];
  const stressScenario = `${stressAlt}\n\nQuantified incident: ${stressIncident}`;

  const constraintBlock = rotated
    .slice(0, 4)
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  const interviewerBrief = [
    track.title,
    track.objective,
    `Quantified targets (canonical; use these exact figures in discussion):\n${metricsBlock}`,
    `Design focus:\n${constraintBlock}`,
    `Here's an incident to work through as you design:\n${stressScenario}`,
  ].join("\n\n");

  return {
    variantIndex: idx,
    displayTitle: track.title,
    problemLead: `${track.title}. ${track.objective}`,
    objectiveAddon: "",
    constraintBlock,
    metricsBlock,
    stressScenario,
    focusLines: rotated,
    interviewerBrief,
  };
}

/** Deterministic variety per session; use public session id or similar. */
export function buildInterviewBlueprint(args: {
  candidateName: string;
  jobDescription: string;
  resumeSummary: string;
  resumeText: string;
  teammateSpecializationOverride?: TeammateSpecialization | null;
  sessionEntropy?: string;
  interviewKind?: InterviewKind;
}): InterviewBlueprint {
  const kind: InterviewKind = args.interviewKind ?? "system_design";
  if (kind === "consulting_case") {
    return buildConsultingCaseBlueprint({
      candidateName: args.candidateName,
      jobDescription: args.jobDescription,
      resumeSummary: args.resumeSummary,
      resumeText: args.resumeText,
      teammateSpecializationOverride: args.teammateSpecializationOverride ?? null,
      sessionEntropy: args.sessionEntropy,
    });
  }

  const entropy = normalizeText(args.sessionEntropy ?? `${args.candidateName}-${args.resumeSummary.length}-${args.resumeText.length}`);
  const combined = normalizeText(
    [args.jobDescription, args.resumeSummary, args.resumeText].filter(Boolean).join("\n"),
  );
  const track = pickTrack(combined, entropy);
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
  const variantPack = buildSessionVariant(track, entropy);
  const sharedContextSeed = [
    `Candidate background: ${candidateSummary || "Generalist systems background."}`,
    `Job focus: ${jobFocus || "General distributed systems and architecture depth."}`,
    `Canonical metrics for this session:\n${variantPack.metricsBlock}`,
    `Scenario extension:\n${variantPack.stressScenario}`,
  ].join("\n");
  const focusAreas = variantPack.focusLines.map((item) => `- ${item}`).join("\n");
  const solutionTemplate = buildSolutionTemplate(track, roleLevel);

  return {
    scenarioId: `generated-${track.id}-s${variantPack.variantIndex}`,
    title: variantPack.displayTitle,
    subtitle: `${track.categoryLabel} · ${roleLevel}`,
    roleLevel,
    problemStatement: [
      variantPack.problemLead,
      variantPack.objectiveAddon ? variantPack.objectiveAddon : null,
      `Quantified targets (canonical for this session):\n${variantPack.metricsBlock}`,
      jobFocus ? `Context from the role: ${jobFocus}` : null,
      candidateSummary ? `Candidate background: ${candidateSummary}` : null,
      variantPack.constraintBlock ? `Requirements:\n${variantPack.constraintBlock}` : null,
      `Areas to cover:\n${focusAreas}`,
      `Scenario extension:\n${variantPack.stressScenario}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    initialInterviewerBrief: variantPack.interviewerBrief,
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
    initialRequirementSummary: variantPack.focusLines.join(" | "),
    initialRiskSummary: variantPack.stressScenario,
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
    `- Core scale / SLA assumptions (use the quantified targets from the brief):`,
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
    sre_infra: `I’m ${teammateName}. I’ll pressure-test availability, capacity, and what breaks first when the room runs the stress scenario we picked for this session.`,
    backend: `I’m ${teammateName}. I’ll stay close to APIs, state ownership, and how the core services behave under load.`,
    data: `I’m ${teammateName}. I’ll focus on data movement, correctness, freshness, and whether the signals stay trustworthy at scale.`,
  };

  return openerBySpecialization[specialization];
}

function pickTrack(text: string, entropy: string): ScenarioTrack {
  const scored = Object.values(scenarioTracks).map((track) => ({
    track,
    score: track.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 2 : 0), 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  const tops = scored.filter((s) => s.score === topScore);
  if (tops.length === 1) {
    return tops[0].track;
  }
  return [...tops].sort((a, b) => hashString(entropy + a.track.id) - hashString(entropy + b.track.id))[0]
    .track;
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
