import type { Bindings } from "./bindings.ts";
import {
  D1GithubDonationRepository,
  type DonatedGithubCredential,
  type GithubDonationCredentialPool,
} from "./githubDonations.ts";
import * as v from "valibot";

const nonEmptyCredentialSchema = v.pipe(v.string(), v.minLength(1));

type GithubCredential =
  | { kind: "application"; authorization: string }
  | { kind: "static"; authorization: string }
  | { kind: "donation"; authorization: string; donation: DonatedGithubCredential };

function configuredApplicationCredential(bindings: Bindings): GithubCredential | undefined {
  const clientId = bindings.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = bindings.GITHUB_OAUTH_CLIENT_SECRET;
  const parsedCredentials = v.safeParse(
    v.object({
      clientId: nonEmptyCredentialSchema,
      clientSecret: nonEmptyCredentialSchema,
    }),
    { clientId, clientSecret },
  );
  if (!parsedCredentials.success) {
    return undefined;
  }
  return {
    kind: "application",
    authorization: `Basic ${btoa(
      `${parsedCredentials.output.clientId}:${parsedCredentials.output.clientSecret}`,
    )}`,
  };
}

function configuredDonationPool(bindings: Bindings): GithubDonationCredentialPool | undefined {
  const database = bindings.GITHUB_DONATIONS_DB;
  const encryptionKey = bindings.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (database === undefined || encryptionKey === undefined) {
    return undefined;
  }
  return new D1GithubDonationRepository(database, encryptionKey);
}

function shouldRotateCredential(response: Response): boolean {
  return response.status === 401 || response.status === 403 || response.status === 429;
}

function withAuthorization(init: RequestInit | undefined, authorization: string): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", authorization);
  return { ...init, headers };
}

export function createGithubApiFetcher(
  bindings: Bindings,
  fetcher: typeof fetch = fetch,
  donationPool: GithubDonationCredentialPool | undefined = configuredDonationPool(bindings),
): typeof fetch {
  const baseCredentials: GithubCredential[] = [];
  const applicationCredential = configuredApplicationCredential(bindings);
  if (applicationCredential !== undefined) {
    baseCredentials.push(applicationCredential);
  }
  const staticToken = v.safeParse(nonEmptyCredentialSchema, bindings.GITHUB_TOKEN);
  if (staticToken.success) {
    baseCredentials.push({
      kind: "static",
      authorization: `Bearer ${staticToken.output}`,
    });
  }

  return (async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (baseCredentials.length === 0 && donationPool === undefined) {
      return fetcher(input, init);
    }

    let baseCredentialIndex = 0;
    let lastResponse: Response | undefined;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      let credential = baseCredentials[baseCredentialIndex];
      if (credential !== undefined) {
        baseCredentialIndex += 1;
      } else {
        const donation = await donationPool?.acquire();
        if (donation === undefined) {
          break;
        }
        credential = {
          kind: "donation",
          authorization: `Bearer ${donation.accessToken}`,
          donation,
        };
      }

      const response = await fetcher(input, withAuthorization(init, credential.authorization));
      if (credential.kind === "donation") {
        await donationPool?.recordResponse(credential.donation, response);
      }
      if (!shouldRotateCredential(response)) {
        return response;
      }
      lastResponse = response;
    }
    if (lastResponse === undefined) {
      throw new Error("No GitHub API credential is currently available");
    }
    return lastResponse;
  }) as typeof fetch;
}
