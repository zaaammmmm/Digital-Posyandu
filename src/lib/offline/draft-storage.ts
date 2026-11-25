"use client";

const DRAFT_KEY_PREFIX = "posyandu_offline_draft_";

export function saveOfflineDraft(id: string, data: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${DRAFT_KEY_PREFIX}${id}`, JSON.stringify(data));
}

export function getOfflineDraft<T>(id: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${id}`);
  return raw ? JSON.parse(raw) : null;
}

export function removeOfflineDraft(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${DRAFT_KEY_PREFIX}${id}`);
}
