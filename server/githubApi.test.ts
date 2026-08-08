import assert from "node:assert/strict";
import test from "node:test";
import type { Bindings } from "./bindings.ts";
import { createGithubApiFetcher } from "./githubApi.ts";
import type { DonatedGithubCredential, GithubDonationCredentialPool } from "./githubDonations.ts";

class FakeDonationPool implements GithubDonationCredentialPool {
  readonly recorded: Array<{ credential: DonatedGithubCredential; status: number }> = [];
  private readonly credentials: DonatedGithubCredential[];

  constructor(credentials: DonatedGithubCredential[]) {
    this.credentials = credentials;
  }

  async acquire(): Promise<DonatedGithubCredential | undefined> {
    return this.credentials.shift();
  }

  async recordResponse(credential: DonatedGithubCredential, response: Response): Promise<void> {
    this.recorded.push({ credential, status: response.status });
  }
}

test("OAuth App、既存トークン、寄付トークンの順で切り替える", async () => {
  const authorizations: Array<string | null> = [];
  const statuses = [403, 429, 200];
  const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => {
    authorizations.push(new Headers(init?.headers).get("Authorization"));
    const status = statuses.shift();
    if (status === undefined) {
      throw new Error("Unexpected GitHub API request");
    }
    return new Response(null, { status });
  }) as typeof fetch;
  const donationPool = new FakeDonationPool([{ githubUserId: 1, accessToken: "donated-token" }]);
  const bindings: Bindings = {
    GITHUB_OAUTH_CLIENT_ID: "client-id",
    GITHUB_OAUTH_CLIENT_SECRET: "client-secret",
    GITHUB_TOKEN: "static-token",
  };

  const response = await createGithubApiFetcher(
    bindings,
    fetcher,
    donationPool,
  )("https://api.github.com/repos/example/repo/releases/latest");

  assert.equal(response.status, 200);
  assert.deepEqual(authorizations, [
    `Basic ${btoa("client-id:client-secret")}`,
    "Bearer static-token",
    "Bearer donated-token",
  ]);
  assert.deepEqual(donationPool.recorded, [
    {
      credential: { githubUserId: 1, accessToken: "donated-token" },
      status: 200,
    },
  ]);
});

test("資格情報がない場合は未認証の既存動作を維持する", async () => {
  let authorization: string | null = "unexpected";
  const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => {
    authorization = new Headers(init?.headers).get("Authorization");
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  const response = await createGithubApiFetcher({}, fetcher, undefined)("https://api.github.com");

  assert.equal(response.status, 200);
  assert.equal(authorization, null);
});

test("GitHub APIの再試行を5資格情報までに制限する", async () => {
  let requestCount = 0;
  let nextUserId = 1;
  const donationPool: GithubDonationCredentialPool = {
    async acquire() {
      const githubUserId = nextUserId;
      nextUserId += 1;
      return { githubUserId, accessToken: `token-${githubUserId}` };
    },
    async recordResponse() {},
  };
  const fetcher = (async () => {
    requestCount += 1;
    return new Response(null, { status: 401 });
  }) as typeof fetch;

  const response = await createGithubApiFetcher(
    {},
    fetcher,
    donationPool,
  )("https://api.github.com");

  assert.equal(response.status, 401);
  assert.equal(requestCount, 5);
});

test("寄付機能の設定途中でも既存トークンを利用する", async () => {
  let authorization: string | null = null;
  const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => {
    authorization = new Headers(init?.headers).get("Authorization");
    return new Response(null, { status: 200 });
  }) as typeof fetch;
  const githubFetcher = createGithubApiFetcher(
    {
      GITHUB_OAUTH_CLIENT_ID: "client-id",
      GITHUB_TOKEN: "static-token",
      GITHUB_TOKEN_ENCRYPTION_KEY: "not-yet-bound",
    },
    fetcher,
  );

  await githubFetcher("https://api.github.com");

  assert.equal(authorization, "Bearer static-token");
});
