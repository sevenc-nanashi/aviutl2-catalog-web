import assert from "node:assert/strict";
import test from "node:test";
import {
  createOAuthTransaction,
  exchangeOAuthCode,
  InvalidOAuthTransactionError,
  oauthAuthorizationUrl,
  openOAuthTransaction,
  sealOAuthTransaction,
  UnexpectedOAuthScopeError,
  type GithubOAuthConfig,
} from "./githubOAuth.ts";

const config: GithubOAuthConfig = {
  clientId: "oauth-client-id",
  clientSecret: "oauth-client-secret",
  encryptionKey: btoa(String.fromCharCode(...new Uint8Array(32).fill(9))),
};

test("OAuthトランザクションを暗号化して検証する", async () => {
  const transaction = await createOAuthTransaction(true, 1_000);
  const sealed = await sealOAuthTransaction(transaction, config.encryptionKey);

  assert.deepEqual(
    await openOAuthTransaction(sealed, config.encryptionKey, transaction.state, 2_000),
    transaction,
  );
  await assert.rejects(
    openOAuthTransaction(sealed, config.encryptionKey, "different-state", 2_000),
    InvalidOAuthTransactionError,
  );
  await assert.rejects(
    openOAuthTransaction(sealed, config.encryptionKey, transaction.state, 601_001),
    InvalidOAuthTransactionError,
  );
});

test("GitHub認可URLへstateとPKCEを設定しscopeを要求しない", async () => {
  const transaction = {
    state: "test-state-test-state-test-state-test-state",
    verifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
    publishLogin: false,
    createdAt: Date.now(),
  };
  const url = new URL(
    await oauthAuthorizationUrl(
      transaction,
      config.clientId,
      "https://example.com/api/github/oauth/callback",
    ),
  );

  assert.equal(url.origin, "https://github.com");
  assert.equal(url.pathname, "/login/oauth/authorize");
  assert.equal(url.searchParams.get("client_id"), config.clientId);
  assert.equal(url.searchParams.get("state"), transaction.state);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(
    url.searchParams.get("code_challenge"),
    "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  );
  assert.equal(url.searchParams.has("scope"), true);
  assert.equal(url.searchParams.get("scope"), "");
});

test("scopeが空のOAuthトークンだけを受け取る", async () => {
  let requestBody: string | undefined;
  const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => {
    requestBody = init?.body?.toString();
    return Response.json({ access_token: "oauth-token", token_type: "bearer", scope: "" });
  }) as typeof fetch;

  assert.deepEqual(
    await exchangeOAuthCode(
      config,
      "oauth-code",
      "pkce-verifier",
      "https://example.com/callback",
      fetcher,
    ),
    { accessToken: "oauth-token", scope: "" },
  );
  assert.match(requestBody ?? "", /code=oauth-code/);
  assert.match(requestBody ?? "", /code_verifier=pkce-verifier/);
});

test("追加scope付きOAuthトークンを拒否して失効用トークンを保持する", async () => {
  const fetcher = (async () =>
    Response.json({
      access_token: "scoped-token",
      token_type: "bearer",
      scope: "repo",
    })) as typeof fetch;

  await assert.rejects(
    exchangeOAuthCode(
      config,
      "oauth-code",
      "pkce-verifier",
      "https://example.com/callback",
      fetcher,
    ),
    (error: unknown) =>
      error instanceof UnexpectedOAuthScopeError && error.accessToken === "scoped-token",
  );
});
