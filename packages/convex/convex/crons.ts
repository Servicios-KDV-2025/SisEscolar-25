import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "process-billing-rules",
  { hourUTC: 6, minuteUTC: 0 },
  internal.functions.billingRule.applyBillingPolicies, {}
);

export default crons;

