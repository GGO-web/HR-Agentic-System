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
import type * as attachments from "../attachments.js";
import type * as companies from "../companies.js";
import type * as hooks_useCreateAttachmentsMutation from "../hooks/useCreateAttachmentsMutation.js";
import type * as hooks_useGetAttachmentsQuery from "../hooks/useGetAttachmentsQuery.js";
import type * as interviewInvitations from "../interviewInvitations.js";
import type * as interviewQuestions from "../interviewQuestions.js";
import type * as interviewResponses from "../interviewResponses.js";
import type * as interviewSessions from "../interviewSessions.js";
import type * as jobDescriptions from "../jobDescriptions.js";
import type * as resumeEvaluations from "../resumeEvaluations.js";
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
  attachments: typeof attachments;
  companies: typeof companies;
  "hooks/useCreateAttachmentsMutation": typeof hooks_useCreateAttachmentsMutation;
  "hooks/useGetAttachmentsQuery": typeof hooks_useGetAttachmentsQuery;
  interviewInvitations: typeof interviewInvitations;
  interviewQuestions: typeof interviewQuestions;
  interviewResponses: typeof interviewResponses;
  interviewSessions: typeof interviewSessions;
  jobDescriptions: typeof jobDescriptions;
  resumeEvaluations: typeof resumeEvaluations;
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
