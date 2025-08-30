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
import type * as clerkWebhook from "../clerkWebhook.js";
import type * as companies from "../companies.js";
import type * as interviewQuestions from "../interviewQuestions.js";
import type * as interviewResponses from "../interviewResponses.js";
import type * as interviewSessions from "../interviewSessions.js";
import type * as jobDescriptions from "../jobDescriptions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  clerkWebhook: typeof clerkWebhook;
  companies: typeof companies;
  interviewQuestions: typeof interviewQuestions;
  interviewResponses: typeof interviewResponses;
  interviewSessions: typeof interviewSessions;
  jobDescriptions: typeof jobDescriptions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
