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
}

interface AppContextValue {
  gallery: GalleryEntry[];
  addToGallery: (entry: GalleryEntry) => Promise<void>;
  removeFromGallery: (id: string) => Promise<void>;
  updateDogName: (id: string, name: string) => Promise<void>;
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
