import { query } from "./_generated/server";
import { v } from "convex/values";

export const healthcheck = query({
  args: {},
  returns: v.object({ ok: v.boolean() }),
  handler: async () => {
    return { ok: true };
  },
});
