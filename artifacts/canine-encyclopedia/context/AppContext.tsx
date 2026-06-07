import React, { createContext, useContext, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import type { BreedScanResult, BreedKnowledge } from "@/lib/gemini";

export interface GalleryEntry {
  id: string;
  uri: string;
  breed: string;
  dogName?: string;
  isMix: boolean;
  mixBreeds?: string[];
  timestamp: number;
  hasDeepKnowledge: boolean;
  /** Full identification result from the scan (reasoning, runnerUp, mixBreakdown, confidence). */
  scanResult?: BreedScanResult;
  /** Full fetched breed knowledge report, persisted so the deep report survives reloads. */
  knowledge?: BreedKnowledge;
}

interface AppContextValue {
  gallery: GalleryEntry[];
  addToGallery: (entry: GalleryEntry) => Promise<void>;
  removeFromGallery: (id: string) => Promise<void>;
  updateDogName: (id: string, name: string) => Promise<void>;
  setGalleryEntryKnowledge: (id: string, knowledge: BreedKnowledge) => Promise<void>;
  /** Correct a saved dog's breed and re-persist its refreshed knowledge report. */
  correctGalleryEntryBreed: (id: string, newBreed: string, knowledge: BreedKnowledge) => Promise<void>;
  currentScan: BreedScanResult | null;
  setCurrentScan: (scan: BreedScanResult | null) => void;
  currentDogName: string;
  setCurrentDogName: (name: string) => void;
  currentKnowledge: BreedKnowledge | null;
  setCurrentKnowledge: (k: BreedKnowledge | null) => void;
  selectedGalleryEntry: GalleryEntry | null;
  setSelectedGalleryEntry: (e: GalleryEntry | null) => void;
  knowledgeCache: Record<string, BreedKnowledge>;
  cacheKnowledge: (breed: string, knowledge: BreedKnowledge) => void;
  /** Scan type to auto-start when returning to the Scanner tab (e.g. from Premium Scanners). */
  pendingScanType: string | null;
  setPendingScanType: (type: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const GALLERY_STORAGE_KEY = "@canine_gallery";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [gallery, setGallery] = useState<GalleryEntry[]>([]);
  const [currentScan, setCurrentScan] = useState<BreedScanResult | null>(null);
  const [currentDogName, setCurrentDogName] = useState("");
  const [currentKnowledge, setCurrentKnowledge] = useState<BreedKnowledge | null>(null);
  const [selectedGalleryEntry, setSelectedGalleryEntry] = useState<GalleryEntry | null>(null);
  const [knowledgeCache, setKnowledgeCache] = useState<Record<string, BreedKnowledge>>({});
  const [pendingScanType, setPendingScanType] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(GALLERY_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setGallery(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  const addToGallery = useCallback(async (entry: GalleryEntry) => {
    setGallery((prev) => {
      const next = [entry, ...prev];
      AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromGallery = useCallback(async (id: string) => {
    setGallery((prev) => {
      const next = prev.filter((e) => e.id !== id);
      AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateDogName = useCallback(async (id: string, name: string) => {
    setGallery((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, dogName: name } : e));
      AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setGalleryEntryKnowledge = useCallback(async (id: string, knowledge: BreedKnowledge) => {
    setGallery((prev) => {
      const next = prev.map((e) =>
        e.id === id ? { ...e, knowledge, hasDeepKnowledge: true } : e,
      );
      AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const correctGalleryEntryBreed = useCallback(
    async (id: string, newBreed: string, knowledge: BreedKnowledge) => {
      setGallery((prev) => {
        const next = prev.map((e) =>
          e.id === id
            ? {
                ...e,
                breed: newBreed,
                isMix: false,
                mixBreeds: undefined,
                scanResult: e.scanResult
                  ? {
                      ...e.scanResult,
                      breed: newBreed,
                      isMix: false,
                      mixBreeds: undefined,
                      runnerUp: undefined,
                      mixBreakdown: undefined,
                      reasoning: undefined,
                    }
                  : undefined,
                knowledge,
                hasDeepKnowledge: true,
              }
            : e,
        );
        AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const cacheKnowledge = useCallback((breed: string, knowledge: BreedKnowledge) => {
    setKnowledgeCache((prev) => ({ ...prev, [breed]: knowledge }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        gallery,
        addToGallery,
        removeFromGallery,
        updateDogName,
        setGalleryEntryKnowledge,
        correctGalleryEntryBreed,
        currentScan,
        setCurrentScan,
        currentDogName,
        setCurrentDogName,
        currentKnowledge,
        setCurrentKnowledge,
        selectedGalleryEntry,
        setSelectedGalleryEntry,
        knowledgeCache,
        cacheKnowledge,
        pendingScanType,
        setPendingScanType,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
