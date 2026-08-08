export interface BreedScanResult {
  breed: string;
  confidence: string;
  mixBreeds?: string[];
  isMix: boolean;
  
}
export interface BreedKnowledge {
  breed: string;
  habitat: {
    countryOfOrigin: string;
    climate: string;
    coatAdaptation: string;
    geographicNotes: string;
  };
  history: {
    ancientLineage: string;
    wolfPopulation: string;
    firstRecordedUse: string;
    evolutionSummary: string;
  };
  functionalGroup: {
    group: "Hound" | "Gundog" | "Terrier" | "Working" | "Pastoral" | "Toy" | "Utility" | "Mixed";
    historicalJob: string;
    modernRole: string;
    groupDescription: string;
  };
  grooming: {
    coatType: string;
    brushingFrequency: string;
    bathingFrequency: string;
    nailCare: string;
    earCare: string;
    noseLearherCare: string;
    pawPadCare: string;
    professionalGroomingFrequency: string;
  };
  health: {
    lifespan: string;
    commonConditions: string[];
    geneticPredispositions: string[];
    parasiteRisks: string[];
    lethargyWarnings: string[];
    exerciseNeeds: string;
  };
  funFacts: string[];
  mapHighlight: string;
}

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  return `https://${domain}`;
}

export async function identifyBreedFromBase64(
  base64Image: string,
  mimeType: string = "image/jpeg",
): Promise<BreedScanResult> {
  const response = await fetch(`${getApiBase()}/api/scan-breed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`${(err as any)?.error ?? "Breed scan failed"}: ${(err as any)?.details ?? `status ${response.status}`}`);
  }

  return response.json();
}

export interface GlowupResult {
  title: string;
  vision: string;
  palette: string[];
}

export async function getGlowup(breed: string, style: string, dogName?: string): Promise<GlowupResult> {
  const response = await fetch(`${getApiBase()}/api/glowup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ breed, style, dogName }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`${(err as any)?.error ?? "Glow-Up failed"}: ${(err as any)?.details ?? `status ${response.status}`}`);
  }

  return response.json();
}

export async function getBreedKnowledge(breed: string): Promise<BreedKnowledge> {
  const response = await fetch(`${getApiBase()}/api/breed-knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ breed }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`${(err as any)?.error ?? "Knowledge fetch failed"}: ${(err as any)?.details ?? `status ${response.status}`}`);
  }

  return response.json();
}

// ─── Premium Scanner APIs ──────────────────────────────────────────────────

export interface AncestralBreedEntry {
  breed: string;
  estimatedPercentage: number;
  traitContribution: string;
}

export interface InheritedTrait {
  trait: string;
  likelySource: string;
}

export interface MixedBreedResult {
  primaryBreed: string;
  secondaryBreed: string;
  confidence: number;
  geneticMarkers: string[];
  ancestralBreeds: AncestralBreedEntry[];
  dnaSummary: string;
  inheritedTraits: InheritedTrait[];
  healthConsiderations: string[];
  geneticFunFact: string;
}

export async function getMixedBreedDNA(
  base64Image: string,
  mimeType: string = "image/jpeg",
): Promise<MixedBreedResult> {
  const response = await fetch(`${getApiBase()}/api/mixed-breed-dna`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`${(err as any)?.error ?? "Mixed breed DNA failed"}: ${(err as any)?.details ?? `status ${response.status}`}`);
  }
  return response.json();
}

export interface AgeEstimateResult {
  estimatedAge: string;
  ageRange: string;
  confidence: number;
  lifeStage: string;
  signs: string[];
  birthdayEstimate: string;
  humanYearsEquivalent: string;
  lifeStageDescription: string;
  whatsNextMilestone: string;
  careRecommendations: string[];
}

export async function getAgeEstimate(
  base64Image: string,
  mimeType: string = "image/jpeg",
): Promise<AgeEstimateResult> {
  const response = await fetch(`${getApiBase()}/api/age-estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`${(err as any)?.error ?? "Age estimate failed"}: ${(err as any)?.details ?? `status ${response.status}`}`);
  }
  return response.json();
}

export interface PersonalityResult {
  traits: string[];
  dominantTrait: string;
  socialStyle: string;
  energyLevel: string;
  description: string;
  idealOwnerMatch: string;
  trainingStyle: string;
  behaviouralQuirk: string;
  compatibilityNotes: string;
}

export async function getPersonalityScan(
  base64Image: string,
  mimeType: string = "image/jpeg",
  breed?: string,
): Promise<PersonalityResult> {
  const response = await fetch(`${getApiBase()}/api/personality-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType, breed }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`${(err as any)?.error ?? "Personality scan failed"}: ${(err as any)?.details ?? `status ${response.status}`}`);
  }
  return response.json();
}

export interface OnjjemProduct {
  name: string;
  description: string;
  url: string;
}

export interface HealthGuideResult {
  healthTips: string[];
  productRecommendations: OnjjemProduct[];
  exercisePlan: string;
  dietNotes: string;
  vetChecklist: string[];
}

export async function getHealthGuide(breed: string, dogName?: string): Promise<HealthGuideResult> {
  const response = await fetch(`${getApiBase()}/api/health-guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ breed, dogName }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`${(err as any)?.error ?? "Health guide failed"}: ${(err as any)?.details ?? `status ${response.status}`}`);
  }
  return response.json();
}

export interface Trick {
  name: string;
  steps: number;
  time: string;
}

export interface TrickTrainerResult {
  difficulty: string;
  tricks: Trick[];
  trainingSchedule: string;
  tips: string[];
  estimatedTime: string;
}

export async function getTrickTrainer(breed: string, dogName?: string): Promise<TrickTrainerResult> {
  const response = await fetch(`${getApiBase()}/api/trick-trainer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ breed, dogName }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`${(err as any)?.error ?? "Trick trainer failed"}: ${(err as any)?.details ?? `status ${response.status}`}`);
  }
  return response.json();
}

export interface DogCartoonResult {
  imageBase64: string;
  mimeType: string;
}

export type CartoonStyle = "default" | "oil-painting" | "anime" | "pop-art";

export async function getDogCartoon(
  base64Image: string,
  mimeType: string,
  style: CartoonStyle = "default",
): Promise<DogCartoonResult> {
  const response = await fetch(`${getApiBase()}/api/dog-cartoon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType, style }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`${(err as any)?.error ?? "Cartoon generation failed"}: ${(err as any)?.details ?? `status ${response.status}`}`);
  }
  return response.json();
}
