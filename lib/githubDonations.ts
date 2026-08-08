import * as v from "valibot";

export const publicGithubDonorSchema = v.object({
  login: v.string(),
  profileUrl: v.pipe(v.string(), v.url()),
});

export const githubDonationSummarySchema = v.object({
  totalDonations: v.pipe(v.number(), v.integer(), v.minValue(0)),
  publicDonors: v.array(publicGithubDonorSchema),
});

export const githubDonationResultSchema = v.picklist([
  "success",
  "cancelled",
  "invalid_request",
  "authorization_failed",
  "configuration_error",
  "storage_error",
]);

export type GithubDonationSummary = v.InferOutput<typeof githubDonationSummarySchema>;
export type GithubDonationResult = v.InferOutput<typeof githubDonationResultSchema>;
