import assert from "node:assert/strict";
import test from "node:test";
import { decryptString, encryptString, randomBase64Url, timingSafeEqual } from "./githubCrypto.ts";

const encryptionKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));

test("AES-GCMで暗号化して元の文字列へ戻す", async () => {
  const first = await encryptString("github-token", encryptionKey);
  const second = await encryptString("github-token", encryptionKey);

  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.notEqual(first.iv, second.iv);
  assert.equal(await decryptString(first, encryptionKey), "github-token");
});

test("暗号文の改ざんを拒否する", async () => {
  const encrypted = await encryptString("github-token", encryptionKey);
  const firstCharacter = encrypted.ciphertext[0];
  if (firstCharacter === undefined) {
    throw new Error("Ciphertext is empty");
  }
  const tampered = {
    ...encrypted,
    ciphertext: `${firstCharacter === "A" ? "B" : "A"}${encrypted.ciphertext.slice(1)}`,
  };

  await assert.rejects(decryptString(tampered, encryptionKey));
});

test("32バイト以外の暗号鍵を拒否する", async () => {
  await assert.rejects(encryptString("github-token", btoa("short")), /32 bytes/);
});

test("OAuth用ランダム値と定数時間比較を扱う", () => {
  assert.match(randomBase64Url(), /^[A-Za-z0-9_-]{43}$/);
  assert.equal(timingSafeEqual("same-value", "same-value"), true);
  assert.equal(timingSafeEqual("same-value", "other-value"), false);
  assert.equal(timingSafeEqual("short", "longer"), false);
});
