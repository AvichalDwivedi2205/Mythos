/**
 * Deterministic, session-specific numeric SLAs for every blueprint.
 * Picked by hash(sessionEntropy + track) so different sessions see different magnitudes,
 * but each session has a single canonical set of exact figures.
 */

export type MetricTrackId =
  | "messaging"
  | "fraud_risk"
  | "streaming_data"
  | "collaboration"
  | "marketplace"
  | "notifications"
  | "infra_platform";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickPreset(entropy: string, salt: string): 0 | 1 | 2 {
  return (hashString(`${entropy}:${salt}`) % 3) as 0 | 1 | 2;
}

type MetricPreset = {
  lines: string[];
  stressIncident: string;
};

const MESSAGING_PRESETS: [MetricPreset, MetricPreset, MetricPreset] = [
  {
    lines: [
      "Global accepted throughput: ~2.1M client messages/sec sustained at peak (all regions).",
      "Per-region cap before soft-throttling: ~480k messages/sec (hot region).",
      "Send acknowledgement (client → durable commit): p99 ≤ 240 ms under normal load; p99 ≤ 800 ms during regional stress.",
      "Groups: up to 500 members; a single conversation shard must sustain ≥ 12k messages/sec without starving 1:1 traffic on the same pool.",
      "Offline queue: 7 days retention; max gap-fill replay window per device session ≤ 15 minutes after reconnect.",
      "Viral burst: writes may spike 20× in 90 seconds — capacity must absorb without shedding durable writes.",
    ],
    stressIncident:
      "Region flapping: shard leadership churns 8–12 times in 2 minutes; broker p99 latency 120 ms → 1.1 s; duplicate delivery attempts rise from 0.02% to 0.6%.",
  },
  {
    lines: [
      "Peak: ~1.8M messages/sec globally; 5 data regions; each region targets ≤ 420k messages/sec steady-state.",
      "Edge connections: ≤ 10k concurrent WebSocket connections per edge node; max 140 nodes per region.",
      "Send ack p99: ≤ 200 ms; degraded mode p99 ≤ 650 ms (explicit to clients).",
      "Ordering: per-conversation total order only; cross-conversation ordering is not guaranteed.",
      "Offline sync after 7 days offline: max 5 MiB of backlog per device per sync round-trip.",
    ],
    stressIncident:
      "50× burst from campaign: sustained 12 minutes at 25M messages/min; metadata store CPU 45% → 94%; one AZ loses 20% of brokers in 2 minutes.",
  },
  {
    lines: [
      "Global throughput: ~3.2M messages/sec design target; 3× headroom for 45 minutes burst.",
      "Cross-region replication commit lag: p95 ≤ 400 ms under normal load; p99 ≤ 1.2 s when one region is degraded.",
      "Presence: last-seen may lag up to 30 s; read receipts best-effort with ≤ 5% drop allowed under load.",
      "Message size: 64 KiB max payload; 4 MiB per attachment on cold path; hot path must not exceed 16 KiB inline.",
    ],
    stressIncident:
      "Half of brokers in a region restart during peak: 38k reconnects/sec for 4 minutes; router metadata QPS 12k → 85k; 0.3% clients see 30s+ reconnect stalls.",
  },
];

const FRAUD_PRESETS: [MetricPreset, MetricPreset, MetricPreset] = [
  {
    lines: [
      "Online scoring: risk score must return ≤ 150 ms p99 on the authorization path.",
      "Peak: 25k transactions/sec per region; global sustained 180k TPS.",
      "Model fallback: if primary model latency p99 > 200 ms for 30 s, bounded rule fallback must engage within 5 s.",
      "Chargeback labels: 85% arrive within 72 h; 98% within 5 days.",
      "False-positive target for hard declines: ≤ 4.5% on a rolling 7-day window.",
    ],
    stressIncident:
      "Attack volume +340% in 15 min; card-testing 2.1k TPS; device fingerprint drift 22%; label pipeline delay 18 h → 52 h.",
  },
  {
    lines: [
      "Score SLA: p99 ≤ 120 ms; hard timeout at 175 ms → fallback rules only.",
      "Peak throughput: 40k TPS per region; 12 regions.",
      "Feature store latency: p99 ≤ 40 ms; cache hit rate target ≥ 92%.",
      "Manual review queue: 30k cases/day; SLA first touch ≤ 4 h.",
    ],
    stressIncident:
      "Feature store p99 40 ms → 280 ms for 45 min; model error rate 0.2% → 2.1%; rule fallback covers 62% of traffic.",
  },
  {
    lines: [
      "Authorization path: 180 ms p99 budget including feature fetch + score + rules.",
      "Global 18k TPS sustained; burst 2.5× for 10 min.",
      "Explainability: ≤ 256 tokens per decline reason; 100% of declines must have reason code.",
    ],
    stressIncident:
      "Coordinated fraud ring: 15k accounts; 1.2M edge scoring calls in 5 min; label ingestion backlog +8 h delay.",
  },
];

const STREAMING_PRESETS: [MetricPreset, MetricPreset, MetricPreset] = [
  {
    lines: [
      "Sustained ingest: 5,000,000 events/min at peak (all producers).",
      "Burst: up to 5.5M events/min for ≤ 15 minutes once per day per cell.",
      "Operational / near-real-time sinks: p95 end-to-end latency ≤ 2 minutes from producer acknowledgement to consumer-visible cursor.",
      "Warehouse / batch analytics path: p99 lag ≤ 12 minutes from event timestamp to warehouse commit.",
      "Hot stream retention: 7 days online; cold archive 400 days object store.",
      "Replay: a tenant may request up to 48 hours of replay at 10M events/minute for ≤ 2 hours; fair-share must cap any tenant at ≤ 35% of shared replay bandwidth.",
      "Schema evolution: backward-compatible reads for at least 2 rolling release versions; breaking changes require dual-write ≤ 14 days.",
      "Consumer isolation: noisy neighbor must not consume > 15% of throughput on a shared partition group.",
    ],
    stressIncident:
      "Schema-breaking payload 2.3% of events for 5 min; two tenants start replay (12M + 9M events/min) simultaneously; downstream feature store p99 44 ms → 620 ms; SLO breach: error rate 0.05% → 0.5% over 15 minutes.",
  },
  {
    lines: [
      "Ingest: 3.5M events/min sustained; daily volume ~4.8 TB uncompressed.",
      "Operational freshness: p95 ≤ 90 seconds from publish to operational sink.",
      "Warehouse path: p99 ≤ 18 minutes; batch compaction windows every 30 minutes.",
      "Backfill: max 250B events per job; 30-day lookback window.",
      "Replay fairness: per-tenant queue depth cap 500M events; max parallel replay jobs 4 per cell.",
    ],
    stressIncident:
      "Bad producer deploy: 18% invalid schema 8 min; largest tenant replay at 11M events/min; warehouse writer lag spikes 10 min → 47 min p99.",
  },
  {
    lines: [
      "Peak: 8M events/min; 5 PB/day to lake; 120k partitions.",
      "Operational sinks: p95 ≤ 3 minutes; strict SLA for 3 internal use cases only.",
      "Cost guardrail: $0.18 per million ingested events all-in at 100% utilization target.",
      "Late data: accept events up to 7 days late; mark watermark in analytics.",
    ],
    stressIncident:
      "Concurrent replay + migration: 2 replays each 6M events/min; migration traffic +22% CPU; coordinator failover 2× in 6 min.",
  },
];

const COLLAB_PRESETS: [MetricPreset, MetricPreset, MetricPreset] = [
  {
    lines: [
      "Documents: up to 200 concurrent editors; p99 op latency ≤ 150 ms.",
      "Document size soft limit 50 MB; snapshot every 200 operations or 30 s.",
      "Reconnect: full state sync after ≤ 5 s offline; > 5 min offline requires incremental catch-up capped at 2 MB/s.",
    ],
    stressIncident:
      "Hot doc: 140 concurrent editors; 4k ops/sec; permission flips 85/min; CRDT merge queue depth 12k → 190k.",
  },
  {
    lines: [
      "p99 ≤ 100 ms for local edits; cross-region p99 ≤ 280 ms.",
      "Undo history: 1,000 steps; 24 h point-in-time recovery.",
    ],
    stressIncident:
      "Regional partition 6 min; divergent edits 2.1k; conflict resolution backlog 38 s max before user-visible.",
  },
  {
    lines: [
      "Presence: 1 update per 2 s per cursor max; 400 concurrent viewers per surface.",
      "Binary assets: 25 MB per embed; 5 concurrent uploads per workspace.",
    ],
    stressIncident:
      "Deploy breaks serialization: 12% of clients on bad version; reconnect storm 22k connections/sec.",
  },
];

const MARKETPLACE_PRESETS: [MetricPreset, MetricPreset, MetricPreset] = [
  {
    lines: [
      "Checkout confirmation: p99 ≤ 3.0 s; timeout hard 8 s.",
      "Peak: 12,000 orders/min per region; 2× on campaign days.",
      "Inventory sync latency from sellers: 15–60 s typical; reconciliation job every 5 min.",
    ],
    stressIncident:
      "Warehouse feed lag 8 s → 6 min; oversell risk window: 0.4% of SKUs; compensation queue 14k orders.",
  },
  {
    lines: [
      "Payment capture: 500 ms p99; refund processing ≤ 5 s p99.",
      "Split shipments: max 6 shipments per checkout; partial cancel ≤ 0.5% double-charge.",
    ],
    stressIncident:
      "Flash sale: 80× inventory check rate; 3 downstream services SLO breach; 0.8% duplicate charge attempts.",
  },
  {
    lines: [
      "Global cart: 2M active carts; 450 ms p99 read cart.",
      "Idempotency: duplicate submits ≤ 0.01% at 20k TPS.",
    ],
    stressIncident:
      "Seller API outage: 35% of merchants affected; stale inventory 12 min median.",
  },
];

const NOTIFICATIONS_PRESETS: [MetricPreset, MetricPreset, MetricPreset] = [
  {
    lines: [
      "Baseline: 8M sends/day; burst 50× above baseline (campaign) for ≤ 45 min.",
      "Dispatch to provider queue: p99 ≤ 500 ms; end-user delivery best-effort per channel SLA.",
      "Dedupe: ≤ 1 duplicate per 100k sends per user per week.",
    ],
    stressIncident:
      "Transactional + campaign collision: SMS provider 34% throttle; queue depth 2.1M; oldest message 6 min delay.",
  },
  {
    lines: [
      "Push: 120k TPS; email: 2M/hour batch windows.",
      "Preference evaluation: p99 ≤ 50 ms on hot path.",
    ],
    stressIncident:
      "Provider failover: 3 hops; 2× latency for 22 min; opt-out compliance scan backlog 400k users.",
  },
  {
    lines: [
      "Global rate limits: 50 sends/user/hour soft cap; hard cap 200.",
      "Compliance: SMS opt-out within 5 s of request in UI.",
    ],
    stressIncident:
      "Burst 50× + transactional spike; receipt webhook delay 2×; 0.7% duplicate sends.",
  },
];

const INFRA_PRESETS: [MetricPreset, MetricPreset, MetricPreset] = [
  {
    lines: [
      "Fleet: ~480 services; 9 regions; progressive rollout 5% → 25% → 100% with 30 min bake per stage.",
      "Automated rollback: must complete within 15 minutes from first failing SLO signal.",
      "Audit: 100% of operator actions retained 400 days.",
    ],
    stressIncident:
      "Region halfway: 2× dependency graph inconsistency; 18 services stuck mid-rollout; canary error rate 0.2% → 1.8% for 20 min.",
  },
  {
    lines: [
      "Rollout: max 12 concurrent service rollouts; blast radius 1 cell at a time.",
      "Health signals: 5 SLOs per service; any 2 breaches trigger halt.",
    ],
    stressIncident:
      "Cross-region health disagree: 3 regions green, 1 red; policy engine split-brain 4 min.",
  },
  {
    lines: [
      "Policy evaluation: p99 ≤ 200 ms; 400k policy checks/min.",
      "Emergency bypass: ≤ 10 per month; all must be audited.",
    ],
    stressIncident:
      "Global rollout: 40% complete; one region CPU throttling; 0.3% failed health checks cascading.",
  },
];

const BY_TRACK: Record<MetricTrackId, [MetricPreset, MetricPreset, MetricPreset]> = {
  messaging: MESSAGING_PRESETS,
  fraud_risk: FRAUD_PRESETS,
  streaming_data: STREAMING_PRESETS,
  collaboration: COLLAB_PRESETS,
  marketplace: MARKETPLACE_PRESETS,
  notifications: NOTIFICATIONS_PRESETS,
  infra_platform: INFRA_PRESETS,
};

function formatPreset(p: MetricPreset): string {
  return p.lines.map((line) => `• ${line}`).join("\n");
}

/** Full messaging block (messaging track uses deep variants separately). */
export function getMessagingMetricsBlock(entropy: string): { metricsBlock: string; stressIncident: string } {
  const i = pickPreset(entropy, "messaging-metrics");
  const p = MESSAGING_PRESETS[i];
  return { metricsBlock: formatPreset(p), stressIncident: p.stressIncident };
}

export function getCanonicalMetricsForTrack(
  trackId: MetricTrackId,
  entropy: string,
): { metricsBlock: string; stressIncident: string } {
  const i = pickPreset(entropy, `metrics-${trackId}`);
  const p = BY_TRACK[trackId][i];
  return { metricsBlock: formatPreset(p), stressIncident: p.stressIncident };
}
