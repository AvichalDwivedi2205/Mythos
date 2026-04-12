/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiRuntime from "../aiRuntime.js";
import type * as channels from "../channels.js";
import type * as checkIns from "../checkIns.js";
import type * as lib_aiSchemas from "../lib/aiSchemas.js";
import type * as lib_db from "../lib/db.js";
import type * as lib_llmProvider from "../lib/llmProvider.js";
import type * as lib_scenario from "../lib/scenario.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_visibleResponse from "../lib/visibleResponse.js";
import type * as notes from "../notes.js";
import type * as orchestrator from "../orchestrator.js";
import type * as orchestratorNode from "../orchestratorNode.js";
import type * as reporting from "../reporting.js";
import type * as reportingNode from "../reportingNode.js";
import type * as reports from "../reports.js";
import type * as sessions from "../sessions.js";
import type * as testing from "../testing.js";
import type * as testingNode from "../testingNode.js";
import type * as workspace from "../workspace.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiRuntime: typeof aiRuntime;
  channels: typeof channels;
  checkIns: typeof checkIns;
  "lib/aiSchemas": typeof lib_aiSchemas;
  "lib/db": typeof lib_db;
  "lib/llmProvider": typeof lib_llmProvider;
  "lib/scenario": typeof lib_scenario;
  "lib/validators": typeof lib_validators;
  "lib/visibleResponse": typeof lib_visibleResponse;
  notes: typeof notes;
  orchestrator: typeof orchestrator;
  orchestratorNode: typeof orchestratorNode;
  reporting: typeof reporting;
  reportingNode: typeof reportingNode;
  reports: typeof reports;
  sessions: typeof sessions;
  testing: typeof testing;
  testingNode: typeof testingNode;
  workspace: typeof workspace;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
