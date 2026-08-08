import assert from "node:assert/strict";
import test from "node:test";
import { decryptString } from "./githubCrypto.ts";
import { D1GithubDonationRepository } from "./githubDonations.ts";

const encryptionKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(11)));

test("寄付トークンを平文ではD1へ渡さない", async () => {
  let boundValues: unknown[] = [];
  const statement = {
    bind(...values: unknown[]) {
      boundValues = values;
      return this;
    },
    async run() {
      return {};
    },
  };
  const database = {
    prepare() {
      return statement;
    },
  } as unknown as D1Database;
  const repository = new D1GithubDonationRepository(database, encryptionKey);

  await repository.saveDonation({ id: 42, login: "example-user" }, "plaintext-token", true);

  assert.equal(boundValues.includes("plaintext-token"), false);
  assert.equal(boundValues[0], 42);
  assert.equal(boundValues[1], "example-user");
  assert.equal(boundValues[4], 1);
  const ciphertext = boundValues[2];
  const iv = boundValues[3];
  if (typeof ciphertext !== "string" || typeof iv !== "string") {
    throw new Error("Encrypted token was not bound as strings");
  }
  assert.equal(await decryptString({ ciphertext, iv }, encryptionKey), "plaintext-token");
});

test("公開同意したGitHub名だけを総数とともに返す", async () => {
  const database = {
    prepare(sql: string) {
      if (sql.includes("COUNT(*)")) {
        return {
          async first() {
            return { count: 3 };
          },
        };
      }
      return {
        async all() {
          return {
            results: [{ github_login: "alice" }, { github_login: "Bob" }],
          };
        },
      };
    },
  } as unknown as D1Database;
  const repository = new D1GithubDonationRepository(database, encryptionKey);

  assert.deepEqual(await repository.summary(), {
    totalDonations: 3,
    publicDonors: [
      { login: "alice", profileUrl: "https://github.com/alice" },
      { login: "Bob", profileUrl: "https://github.com/Bob" },
    ],
  });
});

test("401を返した失効トークンをD1から削除する", async () => {
  let preparedSql = "";
  let boundValues: unknown[] = [];
  const database = {
    prepare(sql: string) {
      preparedSql = sql;
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
  const repository = new D1GithubDonationRepository(database, encryptionKey);

  await repository.recordResponse(
    { githubUserId: 42, accessToken: "expired-token" },
    new Response(null, { status: 401 }),
  );

  assert.match(preparedSql, /^DELETE FROM github_token_donations/);
  assert.deepEqual(boundValues, [42]);
});

test("429を返したトークンをRetry-Afterまで休止する", async () => {
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
  const repository = new D1GithubDonationRepository(database, encryptionKey);

  await repository.recordResponse(
    { githubUserId: 42, accessToken: "rate-limited-token" },
    new Response(null, {
      status: 429,
      headers: {
        "Retry-After": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "60",
      },
    }),
    1_000,
  );

  assert.equal(boundValues[0], 31_000);
  assert.equal(boundValues[1], 0);
  assert.equal(boundValues[2], 60_000);
  assert.equal(boundValues[3], 1_000);
  assert.equal(boundValues[5], 42);
});
