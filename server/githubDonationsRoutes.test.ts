import assert from "node:assert/strict";
import test from "node:test";
import type { Bindings } from "./bindings.ts";
import { decryptString } from "./githubCrypto.ts";
import { createGithubDonationsRoutes } from "./githubDonationsRoutes.ts";

const encryptionKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(13)));

function testBindings(database: D1Database): Bindings {
  return {
    GITHUB_DONATIONS_DB: database,
    GITHUB_OAUTH_CLIENT_ID: "client-id",
    GITHUB_OAUTH_CLIENT_SECRET: "client-secret",
    GITHUB_TOKEN_ENCRYPTION_KEY: encryptionKey,
  };
}

function cookieHeader(response: Response): string {
  const setCookie = response.headers.get("Set-Cookie");
  if (setCookie === null) {
    throw new Error("OAuth start response has no Set-Cookie header");
  }
  const cookie = setCookie.split(";")[0];
  if (cookie === undefined) {
    throw new Error("OAuth cookie is empty");
  }
  return cookie;
}

test("OAuth開始からcallback成功までトークンを暗号化保存する", async () => {
  let boundValues: unknown[] = [];
  const database = {
    prepare() {
      return {
        bind(...values: unknown[]) {
          boundValues = values;
          return this;
        },
        async run() {
          return {};
        },
      };
    },
  } as unknown as D1Database;
  const fetcher = (async (input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (url === "https://github.com/login/oauth/access_token") {
      return Response.json({ access_token: "donated-token", token_type: "bearer", scope: "" });
    }
    if (url === "https://api.github.com/user") {
      return Response.json({ id: 42, login: "example-user" });
    }
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  const routes = createGithubDonationsRoutes(fetcher);
  const bindings = testBindings(database);

  const startResponse = await routes.request(
    "http://localhost/api/github/oauth/start",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "publishLogin=on",
    },
    bindings,
  );

  assert.equal(startResponse.status, 303);
  assert.match(startResponse.headers.get("Set-Cookie") ?? "", /HttpOnly/);
  assert.match(startResponse.headers.get("Set-Cookie") ?? "", /SameSite=Lax/);
  assert.equal(startResponse.headers.get("Cache-Control"), "no-store");
  assert.equal(startResponse.headers.get("Referrer-Policy"), "no-referrer");
  const authorizationUrl = new URL(startResponse.headers.get("Location") ?? "");
  const state = authorizationUrl.searchParams.get("state");
  if (state === null) {
    throw new Error("OAuth authorization URL has no state");
  }

  const callbackResponse = await routes.request(
    `http://localhost/api/github/oauth/callback?code=oauth-code&state=${encodeURIComponent(state)}`,
    { headers: { Cookie: cookieHeader(startResponse) } },
    bindings,
  );

  assert.equal(callbackResponse.status, 303);
  assert.equal(callbackResponse.headers.get("Location"), "http://localhost/about?donation=success");
  assert.equal(boundValues.includes("donated-token"), false);
  assert.equal(boundValues[0], 42);
  assert.equal(boundValues[1], "example-user");
  assert.equal(boundValues[4], 1);
  const ciphertext = boundValues[2];
  const iv = boundValues[3];
  if (typeof ciphertext !== "string" || typeof iv !== "string") {
    throw new Error("Callback did not bind an encrypted token");
  }
  assert.equal(await decryptString({ ciphertext, iv }, encryptionKey), "donated-token");
});

test("stateが一致しないcallbackをGitHubへ送らず拒否する", async () => {
  let githubRequestCount = 0;
  const database = {} as D1Database;
  const fetcher = (async () => {
    githubRequestCount += 1;
    return new Response(null, { status: 500 });
  }) as typeof fetch;
  const routes = createGithubDonationsRoutes(fetcher);
  const bindings = testBindings(database);
  const startResponse = await routes.request(
    "http://localhost/api/github/oauth/start",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "",
    },
    bindings,
  );

  const callbackResponse = await routes.request(
    "http://localhost/api/github/oauth/callback?code=oauth-code&state=wrong-state",
    { headers: { Cookie: cookieHeader(startResponse) } },
    bindings,
  );

  assert.equal(callbackResponse.status, 303);
  assert.equal(
    callbackResponse.headers.get("Location"),
    "http://localhost/about?donation=invalid_request",
  );
  assert.equal(githubRequestCount, 0);
});

test("追加scope付きトークンを保存せずGitHubで失効する", async () => {
  let databaseRequestCount = 0;
  let revokeRequestCount = 0;
  const database = {
    prepare() {
      databaseRequestCount += 1;
      throw new Error("Scoped token must not reach D1");
    },
  } as unknown as D1Database;
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (url === "https://github.com/login/oauth/access_token") {
      return Response.json({ access_token: "scoped-token", token_type: "bearer", scope: "repo" });
    }
    if (url === "https://api.github.com/applications/client-id/token") {
      revokeRequestCount += 1;
      assert.equal(init?.method, "DELETE");
      assert.equal(init?.body, JSON.stringify({ access_token: "scoped-token" }));
      return new Response(null, { status: 204 });
    }
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  const routes = createGithubDonationsRoutes(fetcher);
  const bindings = testBindings(database);
  const startResponse = await routes.request(
    "http://localhost/api/github/oauth/start",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "",
    },
    bindings,
  );
  const authorizationUrl = new URL(startResponse.headers.get("Location") ?? "");
  const state = authorizationUrl.searchParams.get("state");
  if (state === null) {
    throw new Error("OAuth authorization URL has no state");
  }

  const callbackResponse = await routes.request(
    `http://localhost/api/github/oauth/callback?code=oauth-code&state=${encodeURIComponent(state)}`,
    { headers: { Cookie: cookieHeader(startResponse) } },
    bindings,
  );

  assert.equal(
    callbackResponse.headers.get("Location"),
    "http://localhost/about?donation=authorization_failed",
  );
  assert.equal(revokeRequestCount, 1);
  assert.equal(databaseRequestCount, 0);
});
