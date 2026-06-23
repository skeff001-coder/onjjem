import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  modes: string[];
  originalLocalUri: string;
  resultLocalUri: string;
  label?: string;
}

const HISTORY_KEY = "photo_history_v1";
const MAX_ENTRIES = 50;

// Housekeeping caps — tune these to adjust the gallery footprint
const PRUNE_MAX_ENTRIES = 30;
const PRUNE_MAX_AGE_DAYS = 90;

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export async function saveToHistory(entry: HistoryEntry): Promise<void> {
  try {
    const existing = await loadHistory();
    const combined = [entry, ...existing];
    const trimmed = combined.slice(MAX_ENTRIES);
    for (const old of trimmed) {
      await FileSystem.deleteAsync(old.originalLocalUri, { idempotent: true });
      await FileSystem.deleteAsync(old.resultLocalUri, { idempotent: true });
    }
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(combined.slice(0, MAX_ENTRIES)));
  } catch {
    // fail silently — not critical to the main flow
  }
}

export async function updateHistoryLabel(id: string, label: string): Promise<void> {
  try {
    const existing = await loadHistory();
    const updated = existing.map((e) => (e.id === id ? { ...e, label: label.trim() || undefined } : e));
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // fail silently
  }
}

/**
 * Housekeeping pass — call once on app launch.
 * Removes entries older than PRUNE_MAX_AGE_DAYS days, then trims any
 * remaining entries beyond PRUNE_MAX_ENTRIES (oldest first).
 * Associated image files on disk are deleted for every pruned entry.
 */
export async function pruneHistory(): Promise<void> {
  try {
    const existing = await loadHistory();
    const cutoff = Date.now() - PRUNE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    const kept: HistoryEntry[] = [];
    const pruned: HistoryEntry[] = [];

    for (const entry of existing) {
      if (entry.timestamp < cutoff) {
        pruned.push(entry);
      } else {
        kept.push(entry);
      }
    }

    // Cap the remaining entries (kept is already newest-first)
    if (kept.length > PRUNE_MAX_ENTRIES) {
      pruned.push(...kept.splice(PRUNE_MAX_ENTRIES));
    }

    if (pruned.length === 0) return;

    for (const old of pruned) {
      await FileSystem.deleteAsync(old.originalLocalUri, { idempotent: true });
      await FileSystem.deleteAsync(old.resultLocalUri, { idempotent: true });
    }

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(kept));
  } catch {
    // Non-critical — never block app launch
  }
}

export async function deleteFromHistory(id: string): Promise<void> {
  try {
    const existing = await loadHistory();
    const entry = existing.find((e) => e.id === id);
    if (entry) {
      await FileSystem.deleteAsync(entry.originalLocalUri, { idempotent: true });
      await FileSystem.deleteAsync(entry.resultLocalUri, { idempotent: true });
    }
    const updated = existing.filter((e) => e.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // fail silently
  }
}
