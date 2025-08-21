/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as functions_SchoolCicles from "../functions/SchoolCicles.js";
import type * as functions_attendance from "../functions/attendance.js";
import type * as functions_classCatalog from "../functions/classCatalog.js";
import type * as functions_schedule from "../functions/schedule.js";
import type * as functions_schools from "../functions/schools.js";
import type * as functions_subjet from "../functions/subjet.js";
import type * as functions_users from "../functions/users.js";
import type * as gradeRubrics from "../gradeRubrics.js";
import type * as grades from "../grades.js";
import type * as group from "../group.js";
import type * as http from "../http.js";
import type * as termAverages from "../termAverages.js";
import type * as terms from "../terms.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/SchoolCicles": typeof functions_SchoolCicles;
  "functions/attendance": typeof functions_attendance;
  "functions/classCatalog": typeof functions_classCatalog;
  "functions/schedule": typeof functions_schedule;
  "functions/schools": typeof functions_schools;
  "functions/subjet": typeof functions_subjet;
  "functions/users": typeof functions_users;
  gradeRubrics: typeof gradeRubrics;
  grades: typeof grades;
  group: typeof group;
  http: typeof http;
  termAverages: typeof termAverages;
  terms: typeof terms;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
