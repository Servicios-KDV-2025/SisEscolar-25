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
import type * as functions_assignment from "../functions/assignment.js";
import type * as functions_classCatalog from "../functions/classCatalog.js";
import type * as functions_gradeRubrics from "../functions/gradeRubrics.js";
import type * as functions_grades from "../functions/grades.js";
import type * as functions_group from "../functions/group.js";
import type * as functions_schools from "../functions/schools.js";
import type * as functions_student from "../functions/student.js";
import type * as functions_users from "../functions/users.js";
import type * as http from "../http.js";
import type * as studentClass from "../studentClass.js";
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
  "functions/assignment": typeof functions_assignment;
  "functions/classCatalog": typeof functions_classCatalog;
  "functions/gradeRubrics": typeof functions_gradeRubrics;
  "functions/grades": typeof functions_grades;
  "functions/group": typeof functions_group;
  "functions/schools": typeof functions_schools;
  "functions/student": typeof functions_student;
  "functions/users": typeof functions_users;
  http: typeof http;
  studentClass: typeof studentClass;
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
