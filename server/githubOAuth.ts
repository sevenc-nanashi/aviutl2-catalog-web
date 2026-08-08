import * as v from "valibot";
import {
  bytesToArrayBuffer,
  decryptString,
  encodeBase64Url,
  encryptString,
  randomBase64Url,
  timingSafeEqual,
} from "./githubCrypto.ts";

const OAUTH_TRANSACTION_MAX_AGE_MS = 10 * 60 * 1000;

const oauthTransactionSchema = v.object({
  state: v.pipe(v.string(), v.minLength(32)),
  verifier: v.pipe(v.string(), v.minLength(43)),
  publishLogin: v.boolean(),
  createdAt: v.pipe(v.number(), v.integer()),
});

const oauthTokenSchema = v.object({
  access_token: v.pipe(v.string(), v.minLength(1)),
  token_type: v.pipe(v.string(), v.toLowerCase(), v.literal("bearer")),
  scope: v.string(),
});

const githubUserSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)),
  login: v.pipe(v.string(), v.minLength(1)),
});

export interface GithubOAuthConfig {
  clientId: string;
  clientSecret: string;
  encryptionKey: string;
}

export interface OAuthTransaction {
  state: string;
  verifier: string;
  publishLogin: boolean;
  createdAt: number;
}

export interface GithubOAuthToken {
  accessToken: string;
  scope: string;
}

export interface GithubOAuthUser {
  id: number;
  login: string;
}

export class InvalidOAuthTransactionError extends Error {}

export class UnexpectedOAuthScopeError extends Error {
  readonly accessToken: string;

  constructor(accessToken: string) {
    super("GitHub returned a token with unexpected scopes");
    this.accessToken = accessToken;
  }
}

export async function createOAuthTransaction(
  publishLogin: boolean,
  now = Date.now(),
): Promise<OAuthTransaction> {
  return {
    state: randomBase64Url(),
    verifier: randomBase64Url(),
    publishLogin,
    createdAt: now,
  };
}

export async function sealOAuthTransaction(
  transaction: OAuthTransaction,
  encryptionKey: string,
): Promise<string> {
  const encrypted = await encryptString(JSON.stringify(transaction), encryptionKey);
  return `${encrypted.iv}.${encrypted.ciphertext}`;
}

export async function openOAuthTransaction(
  sealedTransaction: string,
  encryptionKey: string,
  returnedState: string,
  now = Date.now(),
): Promise<OAuthTransaction> {
  const [iv, ciphertext, ...remaining] = sealedTransaction.split(".");
  if (iv === undefined || ciphertext === undefined || remaining.length > 0) {
    throw new InvalidOAuthTransactionError("OAuth transaction has an invalid format");
  }
  try {
    const transaction = v.parse(
      oauthTransactionSchema,
      JSON.parse(await decryptString({ iv, ciphertext }, encryptionKey)),
    );
    if (!timingSafeEqual(transaction.state, returnedState)) {
      throw new InvalidOAuthTransactionError("OAuth state does not match");
    }
    if (now < transaction.createdAt || now - transaction.createdAt > OAUTH_TRANSACTION_MAX_AGE_MS) {
      throw new InvalidOAuthTransactionError("OAuth transaction has expired");
    }
    return transaction;
  } catch (error) {
    if (error instanceof InvalidOAuthTransactionError) {
      throw error;
    }
    throw new InvalidOAuthTransactionError("OAuth transaction could not be opened", {
      cause: error,
    });
  }
}

export async function oauthAuthorizationUrl(
  transaction: OAuthTransaction,
  clientId: string,
  callbackUrl: string,
): Promise<string> {
  const challenge = await crypto.subtle.digest(
    "SHA-256",
    bytesToArrayBuffer(new TextEncoder().encode(transaction.verifier)),
  );
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("state", transaction.state);
  url.searchParams.set("code_challenge", encodeBase64Url(new Uint8Array(challenge)));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("scope", "");
  return url.toString();
}

export async function exchangeOAuthCode(
  config: GithubOAuthConfig,
  code: string,
  verifier: string,
  callbackUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<GithubOAuthToken> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: callbackUrl,
    code_verifier: verifier,
  });
  const response = await fetcher("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "aviutl2-catalog-web",
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`GitHub OAuth token exchange failed: HTTP ${response.status}`);
  }
  const token = v.parse(oauthTokenSchema, await response.json());
  if (token.scope.trim().length > 0) {
    throw new UnexpectedOAuthScopeError(token.access_token);
  }
  return {
    accessToken: token.access_token,
    scope: token.scope,
  };
}

export async function fetchOAuthUser(
  accessToken: string,
  fetcher: typeof fetch = fetch,
): Promise<GithubOAuthUser> {
  const response = await fetcher("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "aviutl2-catalog-web",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub OAuth user request failed: HTTP ${response.status}`);
  }
  return v.parse(githubUserSchema, await response.json());
}

export async function revokeOAuthToken(
  config: GithubOAuthConfig,
  accessToken: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const response = await fetcher(
    `https://api.github.com/applications/${encodeURIComponent(config.clientId)}/token`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
        "Content-Type": "application/json",
        "User-Agent": "aviutl2-catalog-web",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ access_token: accessToken }),
    },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`GitHub OAuth token revocation failed: HTTP ${response.status}`);
  }
}
