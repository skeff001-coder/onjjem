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
