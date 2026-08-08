import { sValidator } from "@hono/standard-validator";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import * as v from "valibot";
import type { Bindings } from "./bindings.ts";
import { D1GithubDonationRepository } from "./githubDonations.ts";
import {
  createOAuthTransaction,
  exchangeOAuthCode,
  fetchOAuthUser,
  InvalidOAuthTransactionError,
  oauthAuthorizationUrl,
  openOAuthTransaction,
  revokeOAuthToken,
  sealOAuthTransaction,
  UnexpectedOAuthScopeError,
  type GithubOAuthConfig,
} from "./githubOAuth.ts";

const OAUTH_COOKIE_NAME = "aviutl2-catalog-github-oauth";
const OAUTH_COOKIE_MAX_AGE_SECONDS = 10 * 60;

const oauthStartFormSchema = v.object({
  publishLogin: v.optional(v.literal("on")),
});

const oauthCallbackQuerySchema = v.object({
  code: v.optional(v.pipe(v.string(), v.minLength(1))),
  state: v.optional(v.pipe(v.string(), v.minLength(1))),
  error: v.optional(v.pipe(v.string(), v.minLength(1))),
});

const oauthConfigSchema = v.object({
  clientId: v.pipe(v.string(), v.minLength(1)),
  clientSecret: v.pipe(v.string(), v.minLength(1)),
  encryptionKey: v.pipe(v.string(), v.minLength(1)),
});

type DonationResult =
  | "success"
  | "cancelled"
  | "invalid_request"
  | "authorization_failed"
  | "configuration_error"
  | "storage_error";

class GithubDonationConfigurationError extends Error {}

function oauthConfig(bindings: Bindings): GithubOAuthConfig {
  const parsed = v.safeParse(oauthConfigSchema, {
    clientId: bindings.GITHUB_OAUTH_CLIENT_ID,
    clientSecret: bindings.GITHUB_OAUTH_CLIENT_SECRET,
    encryptionKey: bindings.GITHUB_TOKEN_ENCRYPTION_KEY,
  });
  if (!parsed.success) {
    throw new GithubDonationConfigurationError("GitHub OAuth configuration is incomplete");
  }
  return parsed.output;
}

function donationRepository(bindings: Bindings): D1GithubDonationRepository {
  if (bindings.GITHUB_DONATIONS_DB === undefined) {
    throw new GithubDonationConfigurationError("GitHub donation database is not configured");
  }
  const config = oauthConfig(bindings);
  return new D1GithubDonationRepository(bindings.GITHUB_DONATIONS_DB, config.encryptionKey);
}

function callbackUrl(requestUrl: string): string {
  return new URL("/api/github/oauth/callback", requestUrl).toString();
}

function aboutUrl(requestUrl: string, result: DonationResult): string {
  const url = new URL("/about", requestUrl);
  url.searchParams.set("donation", result);
  return url.toString();
}

function clearOAuthCookie(context: Parameters<typeof deleteCookie>[0], requestUrl: string): void {
  deleteCookie(context, OAUTH_COOKIE_NAME, {
    path: "/",
    secure: new URL(requestUrl).protocol === "https:",
  });
}

async function tryRevoke(
  config: GithubOAuthConfig,
  accessToken: string,
  fetcher: typeof fetch,
): Promise<void> {
  try {
    await revokeOAuthToken(config, accessToken, fetcher);
  } catch (error) {
    console.error("Failed to revoke unused GitHub OAuth token", error);
  }
}

export function createGithubDonationsRoutes(fetcher: typeof fetch = fetch) {
  const routes = new Hono<{ Bindings: Bindings }>();

  routes.use("/api/github/oauth/*", async (context, next) => {
    await next();
    context.header("Cache-Control", "no-store");
    context.header("Referrer-Policy", "no-referrer");
  });

  routes.post(
    "/api/github/oauth/start",
    sValidator("form", oauthStartFormSchema, (result, context) => {
      if (!result.success) {
        return context.redirect(aboutUrl(context.req.url, "invalid_request"), 303);
      }
    }),
    async (context) => {
      try {
        const config = oauthConfig(context.env);
        donationRepository(context.env);
        const form = context.req.valid("form");
        const transaction = await createOAuthTransaction(form.publishLogin === "on");
        const sealedTransaction = await sealOAuthTransaction(transaction, config.encryptionKey);
        setCookie(context, OAUTH_COOKIE_NAME, sealedTransaction, {
          httpOnly: true,
          maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
          path: "/",
          sameSite: "Lax",
          secure: new URL(context.req.url).protocol === "https:",
        });
        return context.redirect(
          await oauthAuthorizationUrl(transaction, config.clientId, callbackUrl(context.req.url)),
          303,
        );
      } catch (error) {
        console.error("Failed to start GitHub token donation", error);
        return context.redirect(aboutUrl(context.req.url, "configuration_error"), 303);
      }
    },
  );

  routes.get(
    "/api/github/oauth/callback",
    sValidator("query", oauthCallbackQuerySchema, (result, context) => {
      if (!result.success) {
        clearOAuthCookie(context, context.req.url);
        return context.redirect(aboutUrl(context.req.url, "invalid_request"), 303);
      }
    }),
    async (context) => {
      const query = context.req.valid("query");
      if (query.error !== undefined) {
        clearOAuthCookie(context, context.req.url);
        return context.redirect(
          aboutUrl(
            context.req.url,
            query.error === "access_denied" ? "cancelled" : "authorization_failed",
          ),
          303,
        );
      }
      const sealedTransaction = getCookie(context, OAUTH_COOKIE_NAME);
      clearOAuthCookie(context, context.req.url);
      if (
        sealedTransaction === undefined ||
        query.code === undefined ||
        query.state === undefined
      ) {
        return context.redirect(aboutUrl(context.req.url, "invalid_request"), 303);
      }

      let config: GithubOAuthConfig;
      try {
        config = oauthConfig(context.env);
      } catch (error) {
        console.error("GitHub token donation callback is not configured", error);
        return context.redirect(aboutUrl(context.req.url, "configuration_error"), 303);
      }

      let transaction;
      try {
        transaction = await openOAuthTransaction(
          sealedTransaction,
          config.encryptionKey,
          query.state,
        );
      } catch (error) {
        if (!(error instanceof InvalidOAuthTransactionError)) {
          console.error("Failed to validate GitHub OAuth transaction", error);
        }
        return context.redirect(aboutUrl(context.req.url, "invalid_request"), 303);
      }

      let accessToken: string | undefined;
      let user;
      try {
        const token = await exchangeOAuthCode(
          config,
          query.code,
          transaction.verifier,
          callbackUrl(context.req.url),
          fetcher,
        );
        accessToken = token.accessToken;
        user = await fetchOAuthUser(accessToken, fetcher);
      } catch (error) {
        if (error instanceof UnexpectedOAuthScopeError) {
          await tryRevoke(config, error.accessToken, fetcher);
        } else {
          console.error("Failed to authorize GitHub token donation", error);
          if (accessToken !== undefined) {
            await tryRevoke(config, accessToken, fetcher);
          }
        }
        return context.redirect(aboutUrl(context.req.url, "authorization_failed"), 303);
      }

      if (accessToken === undefined) {
        throw new Error("GitHub OAuth access token is unexpectedly undefined");
      }

      try {
        await donationRepository(context.env).saveDonation(
          user,
          accessToken,
          transaction.publishLogin,
        );
      } catch (error) {
        console.error(`[github-donation:${user.id}] Failed to save donated token`, error);
        await tryRevoke(config, accessToken, fetcher);
        return context.redirect(aboutUrl(context.req.url, "storage_error"), 303);
      }
      return context.redirect(aboutUrl(context.req.url, "success"), 303);
    },
  );

  routes.get("/api/github/donations", async (context) => {
    try {
      const summary = await donationRepository(context.env).summary();
      context.header("Cache-Control", "public, max-age=60");
      return context.json(summary);
    } catch (error) {
      console.error("Failed to load GitHub token donation summary", error);
      return context.json({ error: "GitHub token donation summary is unavailable" }, 503);
    }
  });

  return routes;
}
