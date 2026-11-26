"use client";

const DB_NAME = "digital-posyandu-offline";
const STORE_NAME = "encrypted-drafts";
const SESSION_KEY = "dp-offline-session-key";

type StoredDraft = { id: string; iv: number[]; ciphertext: number[]; updatedAt: string };

function browserAvailable(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window && "crypto" in window && !!crypto.subtle;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function sessionKey(): Promise<CryptoKey> {
  let encoded = sessionStorage.getItem(SESSION_KEY);
  if (!encoded) {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    encoded = Array.from(raw).map(byte => byte.toString(16).padStart(2, "0")).join("");
    sessionStorage.setItem(SESSION_KEY, encoded);
  }
  const bytes = new Uint8Array(encoded.match(/.{2}/g)!.map(pair => parseInt(pair, 16)));
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function saveOfflineDraft(id: string, data: Record<string, unknown>): Promise<void> {
  if (!browserAvailable()) throw new Error("Penyimpanan offline terenkripsi tidak tersedia pada browser ini");
  const key = await sessionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const record: StoredDraft = {
    id, iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)),
    updatedAt: new Date().toISOString(),
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getOfflineDraft<T>(id: string): Promise<T | null> {
  if (!browserAvailable() || !sessionStorage.getItem(SESSION_KEY)) return null;
  const db = await openDb();
  const record = await new Promise<StoredDraft | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as StoredDraft | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!record) return null;
  const key = await sessionKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(record.iv) }, key,
    new Uint8Array(record.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

export async function removeOfflineDraft(id: string): Promise<void> {
  if (!browserAvailable()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
