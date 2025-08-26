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
import type * as functions_calendar from "../functions/calendar.js";
import type * as functions_classCatalog from "../functions/classCatalog.js";
import type * as functions_eventType from "../functions/eventType.js";
import type * as functions_gradeRubrics from "../functions/gradeRubrics.js";
import type * as functions_grades from "../functions/grades.js";
import type * as functions_group from "../functions/group.js";
import type * as functions_schedule from "../functions/schedule.js";
import type * as functions_schools from "../functions/schools.js";
import type * as functions_student from "../functions/student.js";
import type * as functions_subjet from "../functions/subjet.js";
import type * as functions_termAverages from "../functions/termAverages.js";
import type * as functions_terms from "../functions/terms.js";
import type * as functions_users from "../functions/users.js";
import type * as http from "../http.js";

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
  "functions/calendar": typeof functions_calendar;
  "functions/classCatalog": typeof functions_classCatalog;
  "functions/eventType": typeof functions_eventType;
  "functions/gradeRubrics": typeof functions_gradeRubrics;
  "functions/grades": typeof functions_grades;
  "functions/group": typeof functions_group;
  "functions/schedule": typeof functions_schedule;
  "functions/schools": typeof functions_schools;
  "functions/student": typeof functions_student;
  "functions/subjet": typeof functions_subjet;
  "functions/termAverages": typeof functions_termAverages;
  "functions/terms": typeof functions_terms;
  "functions/users": typeof functions_users;
  http: typeof http;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
