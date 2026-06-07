export interface MixBreakdownEntry {
  breed: string;
  percentage?: number;
}

export interface BreedRunnerUp {
  breed: string;
  confidence?: string;
}

export interface BreedScanResult {
  breed: string;
  confidence: string;
  mixBreeds?: string[];
  isMix: boolean;
  /** Short explanation of the visual cues used to identify the breed. */
  reasoning?: string;
  /** Alternative/runner-up breed guess, present when confidence is medium/low. */
  runnerUp?: BreedRunnerUp;
  /** Estimated heritage breakdown for mixes (percentages sum to ~100). */
  mixBreakdown?: MixBreakdownEntry[];
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
    group:
      | "Hound"
      | "Gundog"
      | "Terrier"
      | "Working"
      | "Pastoral"
      | "Toy"
      | "Utility"
      | "Mixed";
    historicalJob: string;
    modernRole: string;
    groupDescription: string;
  };
  temperament?: {
    summary?: string;
    traits?: string[];
    energyLevel?: string;
    affectionLevel?: string;
    barkingTendency?: string;
    noteworthyBehaviours?: string;
  };
  training?: {
    intelligence?: string;
    trainability?: string;
    recommendedApproach?: string;
    commonChallenges?: string[];
    socialisationNeeds?: string;
  };
  physical?: {
    heightRange?: string;
    weightRange?: string;
    build?: string;
    commonColours?: string[];
    distinctiveFeatures?: string;
  };
  nutrition?: {
    dailyCalories?: string;
    dietType?: string;
    feedingFrequency?: string;
    foodsToAvoid?: string[];
    supplements?: string;
  };
  compatibility?: {
    goodWithChildren?: string;
    goodWithOtherDogs?: string;
    goodWithOtherPets?: string;
    apartmentLiving?: string;
    noviceOwnerFriendly?: string;
    aloneTolerance?: string;
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
    sheddingLevel?: string;
  };
  health: {
    lifespan: string;
    commonConditions: string[];
    geneticPredispositions: string[];
    parasiteRisks: string[];
    lethargyWarnings: string[];
    exerciseNeeds: string;
    preventiveCare?: string;
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
    throw new Error(
      (err as any)?.error ?? `Breed scan failed: ${response.status}`,
    );
  }

  return response.json();
}

export interface GlowupResult {
  title: string;
  vision: string;
  palette: string[];
}

export async function getGlowup(
  breed: string,
  style: string,
  dogName?: string,
): Promise<GlowupResult> {
  const response = await fetch(`${getApiBase()}/api/glowup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ breed, style, dogName }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error ?? `Glow-Up failed: ${response.status}`,
    );
  }

  return response.json();
}

export async function getBreedKnowledge(
  breed: string,
): Promise<BreedKnowledge> {
  const response = await fetch(`${getApiBase()}/api/breed-knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ breed }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error ?? `Knowledge fetch failed: ${response.status}`,
    );
  }

  return response.json();
}

// ─── Premium Scanner APIs ──────────────────────────────────────────────────

export interface MixedBreedResult {
  primaryBreed: string;
  secondaryBreed: string;
  confidence: number;
  geneticMarkers: string[];
  ancestralBreeds: string[];
  dnaSummary: string;
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
    throw new Error(
      (err as any)?.error ?? `Mixed breed DNA failed: ${response.status}`,
    );
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
    throw new Error(
      (err as any)?.error ?? `Age estimate failed: ${response.status}`,
    );
  }
  return response.json();
}

export interface PersonalityResult {
  traits: string[];
  dominantTrait: string;
  socialStyle: string;
  energyLevel: string;
  description: string;
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
    throw new Error(
      (err as any)?.error ?? `Personality scan failed: ${response.status}`,
    );
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

export async function getHealthGuide(
  breed: string,
  dogName?: string,
): Promise<HealthGuideResult> {
  const response = await fetch(`${getApiBase()}/api/health-guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ breed, dogName }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error ?? `Health guide failed: ${response.status}`,
    );
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

export async function getTrickTrainer(
  breed: string,
  dogName?: string,
): Promise<TrickTrainerResult> {
  const response = await fetch(
    `https://xnaggiadvfhrirkdkzwa.supabase.co'/api/trick-trainer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ breed, dogName }),
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error ?? `Trick trainer failed: ${response.status}`,
    );
  }
  return response.json();
}
