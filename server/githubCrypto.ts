import * as v from "valibot";

const base64UrlSchema = v.pipe(v.string(), v.minLength(1), v.regex(/^[A-Za-z0-9_-]+={0,2}$/));

const encryptionKeySchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.transform(decodeBase64),
  v.check((value) => value.byteLength === 32, "Encryption key must be 32 bytes"),
);

export interface EncryptedValue {
  ciphertext: string;
  iv: string;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeBase64Url(bytes: Uint8Array): string {
  return encodeBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodeBase64Url(value: string): Uint8Array {
  return decodeBase64(v.parse(base64UrlSchema, value));
}

export function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export function randomBase64Url(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

export async function importEncryptionKey(encodedKey: string): Promise<CryptoKey> {
  const keyBytes = v.parse(encryptionKeySchema, encodedKey);
  return crypto.subtle.importKey("raw", bytesToArrayBuffer(keyBytes), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptString(value: string, encodedKey: string): Promise<EncryptedValue> {
  const key = await importEncryptionKey(encodedKey);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(value);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: bytesToArrayBuffer(iv) },
    key,
    bytesToArrayBuffer(plaintext),
  );
  return {
    ciphertext: encodeBase64Url(new Uint8Array(ciphertext)),
    iv: encodeBase64Url(iv),
  };
}

export async function decryptString(
  encryptedValue: EncryptedValue,
  encodedKey: string,
): Promise<string> {
  const key = await importEncryptionKey(encodedKey);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: bytesToArrayBuffer(decodeBase64Url(encryptedValue.iv)),
    },
    key,
    bytesToArrayBuffer(decodeBase64Url(encryptedValue.ciphertext)),
  );
  return new TextDecoder().decode(plaintext);
}

export function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  if (leftBytes.length !== rightBytes.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    const leftByte = leftBytes[index];
    const rightByte = rightBytes[index];
    if (leftByte === undefined || rightByte === undefined) {
      throw new Error("Comparison byte is unexpectedly undefined");
    }
    difference |= leftByte ^ rightByte;
  }
  return difference === 0;
}
