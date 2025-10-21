import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "process-billing-rules",
  { hourUTC: 15, minuteUTC: 28 },
  internal.functions.billingRule.applyBillingPolicies
);

export default crons;

