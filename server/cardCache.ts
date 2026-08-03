import type { PackageInfo } from "../lib/catalog";

export async function packageInfoEtag(packageInfo: PackageInfo): Promise<string> {
  const serializedPackageInfo = JSON.stringify(packageInfo);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(serializedPackageInfo),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `"${hash}"`;
}
