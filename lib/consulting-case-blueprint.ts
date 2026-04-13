import type {
  ApprovedClarification,
  BlueprintDefaultNote,
  InterviewBlueprint,
  NoteLabel,
} from "./interview-blueprint";
import { TEAMMATE_SPECIALIZATIONS, type TeammateSpecialization } from "./constants";

type ConsultingTrackId =
  | "profitability"
  | "market_entry"
  | "growth_turnaround"
  | "operations"
  | "pricing";

type ConsultingScenarioTrack = {
  id: ConsultingTrackId;
  title: string;
  keywords: string[];
  preferredTeammate: TeammateSpecialization;
  clientGoal: string;
  situationLead: string;
  focusAreas: string[];
  clarifications: ApprovedClarification[];
  defaultNotes: Array<{
    label: NoteLabel;
    color: string;
    content: string;
  }>;
  stressAngle: string;
  /** Hypothesis / driver-tree branches for the outline deep dive */
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

const consultingTracks: Record<ConsultingTrackId, ConsultingScenarioTrack> = {
  profitability: {
    id: "profitability",
    title: "Regional Restaurant Chain: Profitability Decline",
    keywords: [
      "profit",
      "margin",
      "ebitda",
      "cost",
      "food",
      "restaurant",
      "pricing",
      "decline",
    ],
    preferredTeammate: "data",
    clientGoal:
      "The CEO wants to understand why operating profit has fallen over the last 18 months and what to do next.",
    situationLead:
      "A mid-sized restaurant chain with company-owned locations in three states has seen same-store sales flatten while costs rose.",
    focusAreas: [
      "Revenue drivers (volume, price mix, channels)",
      "Variable vs fixed cost structure",
      "Competitive and labor shocks",
      "Unit economics by store archetype",
    ],
    clarifications: [
      clarification("geography", ["region", "state", "footprint"], "All analysis is for the three-state footprint; no international stores."),
      clarification("ownership", ["franchise", "franchisee"], "Locations are company-owned; franchise economics are out of scope unless you justify why they matter."),
      clarification("timeline", ["18 months", "time horizon"], "The profit decline trend is measured over the last 18 months vs prior baseline."),
      clarification("goal", ["ceo", "objective"], "The client wants a prioritized set of initiatives with rough sizing, not a full implementation plan."),
      clarification("competition", ["competitor", "market"], "Competitors have held list prices steady while the client raised menu prices once."),
    ],
    defaultNotes: [
      note("Requirement", "Separate revenue vs cost drivers before recommending initiatives."),
      note("Constraint", "Exhibit figures are authoritative; flag any extra assumptions explicitly."),
      note("Design note", "Use a driver tree or profit bridge — keep buckets MECE."),
      note("Open question", "What changed in labor productivity or food cost per cover?"),
    ],
    stressAngle:
      "Labor regulations raised hourly costs 8% in two states while delivery mix shifted to lower-margin aggregator orders.",
    solutionFocus: [
      "Profit bridge from baseline to today",
      "Hypothesis: price/mix vs cost buckets",
      "Quant checks on same-store traffic and basket",
      "Initiative portfolio: revenue, cost, footprint",
    ],
  },
  market_entry: {
    id: "market_entry",
    title: "EV Charging Network: New City Entry",
    keywords: [
      "market entry",
      "expansion",
      "new market",
      "geography",
      "launch",
      "strategy",
      "charging",
      "ev",
    ],
    preferredTeammate: "backend",
    clientGoal:
      "Decide whether to enter a new metro market and, if yes, what sequence of investments and partnerships minimizes downside.",
    situationLead:
      "A venture-backed operator of public fast-charging stations is considering a launch in a dense metro with entrenched incumbents.",
    focusAreas: [
      "Market attractiveness (demand, utilization, willingness to pay)",
      "Competitive dynamics and differentiation",
      "Capex and rollout economics",
      "Regulatory and site-access risks",
    ],
    clarifications: [
      clarification("scope", ["product", "hardware"], "Focus is network build-out and operations, not vehicle OEM partnerships."),
      clarification("timeline", ["horizon", "years"], "The board wants a 5-year view with a clear near-term pilot."),
      clarification("capital", ["capex", "budget"], "Total expansion capital is capped; tradeoffs between speed and coverage are expected."),
      clarification("demand", ["utilization", "traffic"], "Fleet demand exists but commuter utilization is uncertain."),
      clarification("incumbent", ["competitor"], "Two incumbents already operate about 60% of high-speed stalls in the core metro."),
    ],
    defaultNotes: [
      note("Requirement", "State a clear go / no-go criterion before diving into tactics."),
      note("Constraint", "Do not conflate market size with capture — separate TAM from realistic share path."),
      note("Design note", "Structure: market → economics → risks → recommendation."),
      note("Open question", "What has to be true about utilization for NPV to clear the hurdle?"),
    ],
    stressAngle:
      "A subsidy rule change is rumored that would compress tariffs for public charging just as the pilot ramps.",
    solutionFocus: [
      "Market definition and customer segments",
      "Unit economics per stall / hub",
      "Competitive response scenarios",
      "Phased rollout and kill criteria",
    ],
  },
  growth_turnaround: {
    id: "growth_turnaround",
    title: "B2B SaaS: Growth Deceleration",
    keywords: [
      "saas",
      "churn",
      "retention",
      "growth",
      "arr",
      "expansion",
      "pipeline",
      "software",
    ],
    preferredTeammate: "data",
    clientGoal:
      "Explain the slowdown in net new ARR and recommend the highest-leverage moves for the next 4 quarters.",
    situationLead:
      "A vertical SaaS company selling to mid-market logistics firms saw logo growth slow while NRR remained positive but fading.",
    focusAreas: [
      "New logo vs expansion vs churn decomposition",
      "Sales capacity and funnel conversion",
      "Product gaps vs competitive substitutes",
      "Pricing and packaging levers",
    ],
    clarifications: [
      clarification("segment", ["mid-market", "customer"], "Primary ICP is mid-market logistics; enterprise pilots exist but are few."),
      clarification("contract", ["annual", "contract"], "Most contracts are annual with quarterly true-ups on usage."),
      clarification("competition", ["substitute", "competitor"], "A well-funded competitor launched a lighter-weight SKU with faster time-to-value."),
      clarification("sales", ["ae", "pipeline"], "AE headcount was flat last year while marketing spend rose."),
      clarification("churn", ["churn", "logo"], "Logo churn ticked up in one vertical slice only — confirm before generalizing."),
    ],
    defaultNotes: [
      note("Requirement", "Quantify the ARR bridge: beginning + new + expansion - churn - contraction."),
      note("Constraint", "Avoid one-factor stories; at least two hypotheses should be tested."),
      note("Design note", "Link qualitative sales anecdotes to funnel metrics."),
      note("Open question", "Is the issue demand gen, win rate, or sales cycle length?"),
    ],
    stressAngle:
      "The CFO mandates a hiring freeze while the CRO asks for more SDRs — you must reconcile the tradeoff with evidence.",
    solutionFocus: [
      "ARR waterfall and cohort behavior",
      "Funnel diagnostics and capacity model",
      "Competitive win/loss hypotheses",
      "Prioritized growth levers under constraints",
    ],
  },
  operations: {
    id: "operations",
    title: "Academic Medical Center: Throughput & Margin",
    keywords: [
      "operations",
      "throughput",
      "capacity",
      "hospital",
      "utilization",
      "wait time",
      "cost",
    ],
    preferredTeammate: "sre_infra",
    clientGoal:
      "Improve patient throughput and surgical suite utilization without breaching safety or compliance constraints.",
    situationLead:
      "A tertiary hospital faces rising length-of-stay in key service lines and OR blocks that are under-utilized.",
    focusAreas: [
      "Bottleneck identification (ED, imaging, beds, OR)",
      "Scheduling and staffing levers",
      "Clinical vs operational constraints",
      "Change management and stakeholder alignment",
    ],
    clarifications: [
      clarification("scope", ["clinical", "quality"], "Clinical protocols are fixed; process redesign within protocols is in scope."),
      clarification("metric", ["throughput", "los"], "Leadership tracks OR minutes, first-case starts, and inpatient LOS."),
      clarification("capacity", ["bed", "icu"], "Bed capacity is tight on weekdays; weekend slack exists."),
      clarification("union", ["labor", "nursing"], "Nursing staffing ratios are negotiated — overtime is costly but flexible."),
      clarification("safety", ["risk", "readmission"], "Leadership will reject plans that increase readmission risk."),
    ],
    defaultNotes: [
      note("Requirement", "Name the system constraint before proposing local optimizations."),
      note("Constraint", "Throughput gains must not ignore quality guardrails."),
      note("Design note", "Use a process view: arrival → diagnosis → treatment → discharge."),
      note("Open question", "Is the bottleneck upstream scheduling or downstream discharge?"),
    ],
    stressAngle:
      "A flu surge is forecast in 6 weeks while two OR teams are short-staffed — stress-test your sequencing.",
    solutionFocus: [
      "Value-chain map and bottleneck math",
      "OR block redesign options",
      "Bed flow and discharge planning",
      "Implementation risks and metrics",
    ],
  },
  pricing: {
    id: "pricing",
    title: "Low-Cost Carrier: Yield & Ancillary Revenue",
    keywords: ["airline", "pricing", "yield", "fare", "ancillary", "load factor", "revenue management"],
    preferredTeammate: "data",
    clientGoal:
      "Recommend pricing and ancillary tactics to restore RASK without collapsing load factor on competitive routes.",
    situationLead:
      "A budget airline competes on short-haul routes where rivals have matched base fares but under-index on ancillaries.",
    focusAreas: [
      "Fare structure vs elasticity",
      "Ancillary attach and willingness to pay",
      "Competitive signaling and game theory (light touch)",
      "Operational constraints (turn times, crew)",
    ],
    clarifications: [
      clarification("network", ["route", "hub"], "Analysis focuses on a competitive triangle of six short-haul routes."),
      clarification("customer", ["leisure", "business"], "Mix skews leisure; business travelers are a thin tail."),
      clarification("regulation", ["fee", "disclosure"], "Ancillary bundles must stay compliant with fare transparency rules."),
      clarification("data", ["elasticity"], "Historical elasticity estimates are noisy post-pandemic — treat them carefully."),
      clarification("cost", ["fuel", "cost"], "Fuel is hedged short-term; do not hinge the case on fuel volatility."),
    ],
    defaultNotes: [
      note("Requirement", "Separate base fare moves from ancillary levers in the P&L impact."),
      note("Constraint", "Quantified targets in the brief are the baseline — state any deviations explicitly."),
      note("Design note", "Customer segmentation should be MECE and tied to behaviors."),
      note("Open question", "Where is the brand elastic vs inelastic on add-ons?"),
    ],
    stressAngle:
      "A price war on one trunk route forces a 12% fare cut while fixed costs are sticky — defend a path to margin.",
    solutionFocus: [
      "Route-level revenue decomposition",
      "Segment-level pricing hypotheses",
      "Ancillary bundle design",
      "Competitive response playbook",
    ],
  },
};

type SessionVariantPack = {
  variantIndex: number;
  displayTitle: string;
  problemLead: string;
  constraintBlock: string;
  metricsBlock: string;
  stressScenario: string;
  focusLines: string[];
  interviewerBrief: string;
};

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

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
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

function buildConsultingExhibitBlock(track: ConsultingScenarioTrack, entropy: string): string {
  const h = hashString(entropy + track.id);
  const bump = (base: number, spread: number) => base + (h % (spread + 1));

  const lines: string[] = [];

  switch (track.id) {
    case "profitability":
      lines.push(`Revenue (LTM): $${bump(418, 18)}M`);
      lines.push(`Gross margin: ${bump(31, 4)}.${h % 10}%`);
      lines.push(`Store count: ${bump(214, 12)} company-owned locations`);
      lines.push(`Same-store traffic YoY: ${h % 2 === 0 ? "-" : ""}${bump(3, 2)}.${h % 10}%`);
      lines.push(`Hourly labor cost index: +${bump(6, 3)}% vs prior year`);
      break;
    case "market_entry":
      lines.push(`Metro population: ${bump(4, 1)}.${h % 10}M`);
      lines.push(`Estimated annual charging demand (MWh): ${bump(920, 40)}k`);
      lines.push(`Incumbent stall share (fast): ${bump(58, 6)}%`);
      lines.push(`Blended gross margin per session (industry bench): ${bump(22, 5)}%`);
      lines.push(`Pilot capex budget: $${bump(42, 8)}M cap`);
      break;
    case "growth_turnaround":
      lines.push(`Beginning ARR: $${bump(118, 9)}M`);
      lines.push(`Net new ARR (last 4Q): $${bump(14, 4)}M`);
      lines.push(`Logo churn (last 4Q): ${bump(6, 2)}.${h % 10}%`);
      lines.push(`NRR: ${bump(108, 5)}%`);
      lines.push(`Sales headcount YoY: ${h % 2 === 0 ? "flat" : `+${bump(1, 3)}%`}`);
      break;
    case "operations":
      lines.push(`Average inpatient LOS: ${bump(5, 1)}.${h % 10} days`);
      lines.push(`First-case on-time start: ${bump(72, 8)}%`);
      lines.push(`OR utilization (prime blocks): ${bump(78, 7)}%`);
      lines.push(`ED boarding hours (p90): ${bump(6, 2)}.${h % 10}h`);
      lines.push(`Cost per discharge (index): ${bump(102, 6)} vs peer median 100`);
      break;
    case "pricing":
      lines.push(`System load factor: ${bump(81, 5)}.${h % 10}%`);
      lines.push(`RASK index YoY: ${h % 2 === 0 ? "-" : ""}${bump(4, 2)}.${h % 10}%`);
      lines.push(`Ancillary revenue per passenger: $${bump(34, 4)}.${h % 10}`);
      lines.push(`Competitive fare index on trunk routes: ${bump(96, 4)}% of 2019 baseline`);
      lines.push(`Short-haul stage length: ${bump(780, 25)} miles (avg)`);
      break;
    default:
      lines.push("See case narrative for quantitative anchors.");
  }

  return lines.map((line, i) => `${i + 1}. ${line}`).join("\n");
}

function pickConsultingTrack(text: string, entropy: string): ConsultingScenarioTrack {
  const scored = Object.values(consultingTracks).map((track) => ({
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

function inferConsultingTeammate(track: ConsultingScenarioTrack, text: string): TeammateSpecialization {
  if (track.preferredTeammate === "data") {
    return "data";
  }
  if (track.preferredTeammate === "sre_infra") {
    return "sre_infra";
  }
  if (/\b(data|quant|excel|model|margin|arr|churn|elastic)\b/i.test(text)) {
    return "data";
  }
  return "backend";
}

function detectConsultingRoleLevel(text: string) {
  const t = text.toLowerCase();
  if (t.includes("partner") || t.includes("principal")) {
    return "Partner track";
  }
  if (t.includes("manager") || t.includes("em")) {
    return "Manager / EM track";
  }
  if (t.includes("associate") || t.includes("consultant")) {
    return "Associate consultant";
  }
  if (t.includes("mba") || t.includes("intern")) {
    return "MBA / intern track";
  }
  return "Consulting candidate";
}

function buildConsultingSessionVariant(track: ConsultingScenarioTrack, entropy: string): SessionVariantPack {
  const h = hashString(entropy + track.id);
  const idx = h % 3;
  const rotated = rotateArray(track.focusAreas, idx);
  const metricsBlock = buildConsultingExhibitBlock(track, entropy);
  const stressAlt = [
    track.stressAngle,
    `Twist: ${track.stressAngle} while leadership disagrees on the primary success metric.`,
    `Escalation: ${track.stressAngle} and a key exhibit may be incomplete — say what you still need.`,
  ][idx % 3];
  /** In-world complication only; method/rubric lives in agent instructions, not candidate-visible copy. */
  const stressScenario = stressAlt;

  const constraintBlock = rotated
    .slice(0, 4)
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  const interviewerBrief = [
    track.title,
    `${track.situationLead} ${track.clientGoal}`,
    `Exhibit anchors (canonical for this session):\n${metricsBlock}`,
    `Exploration focus:\n${constraintBlock}`,
    `There's another complication to fold into your thinking:\n${stressScenario}`,
  ].join("\n\n");

  return {
    variantIndex: idx,
    displayTitle: track.title,
    problemLead: `${track.situationLead} ${track.clientGoal}`,
    constraintBlock,
    metricsBlock,
    stressScenario,
    focusLines: rotated,
    interviewerBrief,
  };
}

function buildConsultingSolutionTemplate(track: ConsultingScenarioTrack, roleLevel: string) {
  const focusList = track.solutionFocus.map((item) => `- ${item}`).join("\n");

  return [
    `# Case Write-Up`,
    ``,
    `## Clarify`,
    `- Client objective (one line):`,
    `- Key question we are solving:`,
    `- What we still need to know:`,
    ``,
    `## Structure (MECE)`,
    `- Top-level buckets (mutually exclusive, collectively exhaustive):`,
    `- Why this structure fits the problem:`,
    ``,
    `## Analysis`,
    `- Hypotheses (ranked):`,
    `- Quant / exhibit work (show assumptions):`,
    `- Synthesis so far:`,
    ``,
    `## Recommendation`,
    `- Recommendation and rationale:`,
    `- Risks and mitigations:`,
    `- Next steps / what data would refine this:`,
    ``,
    `## Deep-dive checklist`,
    focusList,
    ``,
    `---`,
    `Role framing: ${roleLevel}`,
    `Use exhibit numbers from the brief; label any new assumptions explicitly.`,
  ].join("\n");
}

function buildConsultingTeammateOpening(
  teammateName: string,
  specialization: TeammateSpecialization,
) {
  const openerBySpecialization: Record<TeammateSpecialization, string> = {
    sre_infra: `I’m ${teammateName}. I’ll push on bottlenecks, feasibility, and whether your plan survives real-world ops constraints — tell me where you want pressure first.`,
    backend: `I’m ${teammateName}. I’ll stress-test your logic chain and whether the commercial story hangs together — especially go-to-market and competitive moves.`,
    data: `I’m ${teammateName}. I’ll focus on the numbers: bridges, sanity checks, and whether the exhibits actually support your hypotheses.`,
  };

  return openerBySpecialization[specialization];
}

/** Consulting / case interview blueprint (strategy case style: MECE, hypothesis-led, exhibit-grounded). */
export function buildConsultingCaseBlueprint(args: {
  candidateName: string;
  jobDescription: string;
  resumeSummary: string;
  resumeText: string;
  teammateSpecializationOverride?: TeammateSpecialization | null;
  sessionEntropy?: string;
}): InterviewBlueprint {
  const entropy = normalizeText(
    args.sessionEntropy ?? `${args.candidateName}-${args.resumeSummary.length}-${args.resumeText.length}`,
  );
  const combined = normalizeText(
    [args.jobDescription, args.resumeSummary, args.resumeText].filter(Boolean).join("\n"),
  );
  const track = pickConsultingTrack(combined, entropy);
  const roleLevel = detectConsultingRoleLevel(combined);
  const candidateSummary = truncateText(
    normalizeText(args.resumeSummary || args.resumeText || args.candidateName),
    220,
  );
  const jobFocus = truncateText(normalizeText(args.jobDescription), 260);
  const teammateSpecialization =
    args.teammateSpecializationOverride ?? inferConsultingTeammate(track, combined);
  const teammateMeta =
    TEAMMATE_SPECIALIZATIONS.find((entry) => entry.value === teammateSpecialization) ??
    TEAMMATE_SPECIALIZATIONS[0];
  const variantPack = buildConsultingSessionVariant(track, entropy);
  const sharedContextSeed = [
    `Candidate background: ${candidateSummary || "General professional background."}`,
    `Role / prep signal: ${jobFocus || "General consulting / strategy interview practice."}`,
    `Exhibit anchors (authoritative for this session):\n${variantPack.metricsBlock}`,
    `Additional complication:\n${variantPack.stressScenario}`,
  ].join("\n");
  const focusAreas = variantPack.focusLines.map((item) => `- ${item}`).join("\n");
  const solutionTemplate = buildConsultingSolutionTemplate(track, roleLevel);

  return {
    scenarioId: `consulting-${track.id}-s${variantPack.variantIndex}`,
    title: variantPack.displayTitle,
    subtitle: `Consulting case · ${roleLevel}`,
    roleLevel,
    problemStatement: [
      variantPack.problemLead,
      `Exhibit anchors (canonical for this session):\n${variantPack.metricsBlock}`,
      jobFocus ? `Context from the role: ${jobFocus}` : null,
      candidateSummary ? `Candidate background: ${candidateSummary}` : null,
      variantPack.constraintBlock ? `Exploration focus:\n${variantPack.constraintBlock}` : null,
      `Areas to cover:\n${focusAreas}`,
      `Additional complication:\n${variantPack.stressScenario}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    initialInterviewerBrief: variantPack.interviewerBrief,
    initialTeammateMessage: buildConsultingTeammateOpening(teammateMeta.name, teammateSpecialization),
    teammateSpecialization,
    teammateName: teammateMeta.name,
    teammateLabel: teammateMeta.label,
    approvedClarifications: track.clarifications,
    defaultNotes: track.defaultNotes.map((entry, index) => ({
      ...entry,
      sortOrder: index,
    })) as BlueprintDefaultNote[],
    solutionTemplate,
    sharedContextSeed,
    initialRequirementSummary: variantPack.focusLines.join(" | "),
    initialRiskSummary: variantPack.stressScenario,
  };
}
