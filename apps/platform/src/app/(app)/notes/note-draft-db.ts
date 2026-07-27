/**
 * Minimal IndexedDB-backed persistence for a note save that's optimistic on
 * the client but hasn't been confirmed by the server yet — e.g. a completion
 * click whose sync() never landed because the network dropped mid-request.
 * Surviving a reload before that confirmation is the whole point (see
 * autosave.ts); nothing here is the source of truth once the server confirms.
 *
 * No-ops (never throws) anywhere `indexedDB` isn't available — SSR, node
 * tests, or a browser with it disabled — so callers never need an extra
 * guard around every call.
 */

const DB_NAME = "qa-mastery-notes";
const DB_VERSION = 1;
const STORE = "pending-saves";

function hasIndexedDB(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function putPendingSave(key: string, value: unknown): Promise<void> {
  if (!hasIndexedDB()) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    });
  } finally {
    db.close();
  }
}

export async function getPendingSave<T>(key: string): Promise<T | null> {
  if (!hasIndexedDB()) return null;
  const db = await openDb();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
    });
  } finally {
    db.close();
  }
}

export async function deletePendingSave(key: string): Promise<void> {
  if (!hasIndexedDB()) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
    });
  } finally {
    db.close();
  }
}
