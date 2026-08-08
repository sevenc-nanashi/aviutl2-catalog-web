import * as v from "valibot";
import type { GithubDonationSummary } from "../lib/githubDonations.ts";
import { decryptString, encryptString } from "./githubCrypto.ts";
import type { GithubOAuthUser } from "./githubOAuth.ts";

const numericHeaderSchema = v.pipe(
  v.string(),
  v.regex(/^\d+$/),
  v.transform(Number),
  v.integer(),
  v.minValue(0),
);

interface DonationRow {
  github_user_id: number;
  github_login: string;
  token_ciphertext: string;
  token_iv: string;
}

interface DonationCountRow {
  count: number;
}

interface PublicDonorRow {
  github_login: string;
}

export interface DonatedGithubCredential {
  githubUserId: number;
  accessToken: string;
}

export interface GithubDonationCredentialPool {
  acquire(now?: number): Promise<DonatedGithubCredential | undefined>;
  recordResponse(
    credential: DonatedGithubCredential,
    response: Response,
    now?: number,
  ): Promise<void>;
}

function numericHeader(response: Response, name: string): number | undefined {
  const parsed = v.safeParse(numericHeaderSchema, response.headers.get(name));
  return parsed.success ? parsed.output : undefined;
}

function unavailableUntil(response: Response, now: number): number {
  const retryAfter = numericHeader(response, "Retry-After");
  if (retryAfter !== undefined) {
    return now + retryAfter * 1000;
  }
  const resetAt = numericHeader(response, "X-RateLimit-Reset");
  if (resetAt !== undefined) {
    return resetAt * 1000;
  }
  return now + 60_000;
}

export class D1GithubDonationRepository implements GithubDonationCredentialPool {
  private readonly database: D1Database;
  private readonly encryptionKey: string;

  constructor(database: D1Database, encryptionKey: string) {
    this.database = database;
    this.encryptionKey = encryptionKey;
  }

  async saveDonation(
    user: GithubOAuthUser,
    accessToken: string,
    publishLogin: boolean,
  ): Promise<void> {
    const encryptedToken = await encryptString(accessToken, this.encryptionKey);
    const timestamp = new Date().toISOString();
    await this.database
      .prepare(
        `INSERT INTO github_token_donations (
          github_user_id,
          github_login,
          token_ciphertext,
          token_iv,
          publish_login,
          available_at,
          rate_limit_remaining,
          rate_limit_reset_at,
          last_used_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, NULL, NULL, NULL, ?, ?)
        ON CONFLICT(github_user_id) DO UPDATE SET
          github_login = excluded.github_login,
          token_ciphertext = excluded.token_ciphertext,
          token_iv = excluded.token_iv,
          publish_login = excluded.publish_login,
          available_at = 0,
          rate_limit_remaining = NULL,
          rate_limit_reset_at = NULL,
          last_used_at = NULL,
          updated_at = excluded.updated_at`,
      )
      .bind(
        user.id,
        user.login,
        encryptedToken.ciphertext,
        encryptedToken.iv,
        publishLogin ? 1 : 0,
        timestamp,
        timestamp,
      )
      .run();
  }

  async summary(): Promise<GithubDonationSummary> {
    const countRow = await this.database
      .prepare("SELECT COUNT(*) AS count FROM github_token_donations")
      .first<DonationCountRow>();
    if (countRow === null) {
      throw new Error("Donation count query returned no row");
    }
    const publicDonors = await this.database
      .prepare(
        `SELECT github_login
        FROM github_token_donations
        WHERE publish_login = 1
        ORDER BY github_login COLLATE NOCASE ASC`,
      )
      .all<PublicDonorRow>();
    return {
      totalDonations: countRow.count,
      publicDonors: publicDonors.results.map(({ github_login: login }) => ({
        login,
        profileUrl: `https://github.com/${encodeURIComponent(login)}`,
      })),
    };
  }

  async acquire(now = Date.now()): Promise<DonatedGithubCredential | undefined> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const row = await this.database
        .prepare(
          `SELECT github_user_id, github_login, token_ciphertext, token_iv
          FROM github_token_donations
          WHERE available_at <= ?
          ORDER BY last_used_at IS NOT NULL ASC, last_used_at ASC, created_at ASC
          LIMIT 1`,
        )
        .bind(now)
        .first<DonationRow>();
      if (row === null) {
        return undefined;
      }
      try {
        return {
          githubUserId: row.github_user_id,
          accessToken: await decryptString(
            { ciphertext: row.token_ciphertext, iv: row.token_iv },
            this.encryptionKey,
          ),
        };
      } catch (error) {
        console.error(`[github-donation:${row.github_user_id}] Failed to decrypt token`, error);
        await this.deleteDonation(row.github_user_id);
      }
    }
    return undefined;
  }

  async recordResponse(
    credential: DonatedGithubCredential,
    response: Response,
    now = Date.now(),
  ): Promise<void> {
    if (response.status === 401) {
      await this.deleteDonation(credential.githubUserId);
      return;
    }
    const remaining = numericHeader(response, "X-RateLimit-Remaining");
    const resetAt = numericHeader(response, "X-RateLimit-Reset");
    const rateLimited = response.status === 403 || response.status === 429 || remaining === 0;
    const availableAt = rateLimited ? unavailableUntil(response, now) : 0;
    await this.database
      .prepare(
        `UPDATE github_token_donations
        SET available_at = ?,
          rate_limit_remaining = ?,
          rate_limit_reset_at = ?,
          last_used_at = ?,
          updated_at = ?
        WHERE github_user_id = ?`,
      )
      .bind(
        availableAt,
        remaining ?? null,
        resetAt === undefined ? null : resetAt * 1000,
        now,
        new Date(now).toISOString(),
        credential.githubUserId,
      )
      .run();
  }

  private async deleteDonation(githubUserId: number): Promise<void> {
    await this.database
      .prepare("DELETE FROM github_token_donations WHERE github_user_id = ?")
      .bind(githubUserId)
      .run();
  }
}
