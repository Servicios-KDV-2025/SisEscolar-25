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
import type * as functions_attendance from "../functions/attendance.js";
import type * as functions_classCatalog from "../functions/classCatalog.js";
import type * as functions_gradeRubrics from "../functions/gradeRubrics.js";
import type * as functions_grades from "../functions/grades.js";
import type * as functions_group from "../functions/group.js";
import type * as functions_schedule from "../functions/schedule.js";
import type * as functions_schoolCycles from "../functions/schoolCycles.js";
import type * as functions_schools from "../functions/schools.js";
import type * as functions_student from "../functions/student.js";
import type * as functions_subjet from "../functions/subjet.js";
<<<<<<< HEAD
import type * as functions_termAverages from "../functions/termAverages.js";
=======
>>>>>>> a9dc088 (terms)
import type * as functions_terms from "../functions/terms.js";
import type * as functions_users from "../functions/users.js";
import type * as http from "../http.js";
<<<<<<< HEAD
=======
import type * as termAverages from "../termAverages.js";
>>>>>>> a9dc088 (terms)

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/attendance": typeof functions_attendance;
  "functions/classCatalog": typeof functions_classCatalog;
  "functions/gradeRubrics": typeof functions_gradeRubrics;
  "functions/grades": typeof functions_grades;
  "functions/group": typeof functions_group;
  "functions/schedule": typeof functions_schedule;
  "functions/schoolCycles": typeof functions_schoolCycles;
  "functions/schools": typeof functions_schools;
  "functions/student": typeof functions_student;
  "functions/subjet": typeof functions_subjet;
<<<<<<< HEAD
  "functions/termAverages": typeof functions_termAverages;
=======
>>>>>>> a9dc088 (terms)
  "functions/terms": typeof functions_terms;
  "functions/users": typeof functions_users;
  http: typeof http;
<<<<<<< HEAD
=======
  termAverages: typeof termAverages;
>>>>>>> a9dc088 (terms)
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
