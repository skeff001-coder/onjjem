import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

function getAI() {
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("Gemini AI integration not configured");
  }
  return new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "", baseUrl } });
}

// ─── Report caches ───────────────────────────────────────────────────────────
// Popular breeds are requested repeatedly; these AI-generated reports are slow and
// expensive to produce and return near-identical content for the same inputs.
// Cache them in memory with a TTL and bounded size (LRU eviction) so memory stays
// bounded and reports remain reasonably fresh. Each endpoint gets its own cache.
const REPORT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REPORT_CACHE_MAX_ENTRIES = 200;

type CachedReport = { value: unknown; expiresAt: number };

type ReportCache = {
  get: (key: string) => unknown | undefined;
  set: (key: string, value: unknown) => void;
};

function createReportCache(): ReportCache {
  const store = new Map<string, CachedReport>();
  return {
    get(key: string): unknown | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      // Refresh recency for LRU ordering.
      store.delete(key);
      store.set(key, entry);
      return entry.value;
    },
    set(key: string, value: unknown): void {
      store.set(key, { value, expiresAt: Date.now() + REPORT_CACHE_TTL_MS });
      while (store.size > REPORT_CACHE_MAX_ENTRIES) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
      }
    },
  };
}

function normaliseBreedKey(breed: string): string {
  return breed.trim().replace(/\s+/g, " ").toLowerCase();
}

// Builds a cache key from a breed plus an optional dog name so personalised
// reports for a named dog are not mixed up with the generic breed report.
function breedDogNameKey(breed: string, dogName?: string): string {
  const base = normaliseBreedKey(breed);
  const name = (dogName ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  return `${base}::${name}`;
}

const breedKnowledgeCache = createReportCache();
const healthGuideCache = createReportCache();
const trickTrainerCache = createReportCache();

router.post("/scan-breed", async (req: Request, res: Response) => {
  const { base64Image, mimeType = "image/jpeg" } = req.body;

  if (!base64Image) {
    res.status(400).json({ error: "base64Image is required" });
    return;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: `You are an expert canine breed identifier. Analyze this image and identify the dog breed(s).

Guidelines for best accuracy:
- Good lighting and clear framing (dog fills ~50% of frame, face visible) improve confidence.
- Side profiles or full-body shots are better than extreme close-ups or heavily obscured views.
- If the image is dark, blurry, or the dog is very small, lower confidence accordingly.
- Base your identification on concrete visual cues: coat type/colour/markings, ear shape and set, muzzle length, head shape, body size and build, tail, and any breed-defining features.

Return ONLY valid JSON with this exact structure:
{
  "breed": "Primary breed name (e.g. 'Golden Retriever' or 'Labrador Retriever Mix')",
  "confidence": "high | medium | low",
  "isMix": true or false,
  "mixBreeds": ["Breed1", "Breed2"] (only if isMix is true, otherwise omit or empty array),
  "reasoning": "1-2 sentences citing the SPECIFIC visual cues (coat, ears, muzzle, head, body, size, markings) that led to this identification",
  "runnerUp": { "breed": "Second most likely breed", "confidence": "medium | low" } (include ONLY when confidence is 'medium' or 'low'; omit entirely when confidence is 'high'),
  "mixBreakdown": [ { "breed": "Breed name", "percentage": 60 }, { "breed": "Breed name", "percentage": 40 } ] (include ONLY when isMix is true; estimated heritage percentages that sum to ~100)
}

If no dog is detected, return: {"breed": "Unknown", "confidence": "low", "isMix": false, "reasoning": "No dog could be detected in the image."}
If it's a mix, list the most likely component breeds in mixBreeds and provide mixBreakdown percentages.
Do not include any text outside the JSON.`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 2048, responseMimeType: "application/json" },
    });

    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    res.json(result);
  } catch (e: any) {
    req.log.error({ err: e }, "Breed scan failed");
    res.status(500).json({ error: "Breed identification failed", details: e?.message });
  }
});

router.post("/breed-knowledge", async (req: Request, res: Response) => {
  const { breed } = req.body;

  if (!breed) {
    res.status(400).json({ error: "breed is required" });
    return;
  }

  const cacheKey = normaliseBreedKey(breed);
  const cached = breedKnowledgeCache.get(cacheKey);
  if (cached !== undefined) {
    res.json(cached);
    return;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a world-class canine encyclopaedia with deep, authoritative knowledge of all dog breeds.
Provide a COMPREHENSIVE, accurate and detailed knowledge report for the breed: "${breed}"

Write with genuine depth — every descriptive field should be specific to this breed (not generic filler), and prose fields should be rich and informative. Use UK English.

Return ONLY valid JSON with this EXACT structure (no markdown, no extra text):
{
  "breed": "${breed}",
  "habitat": {
    "countryOfOrigin": "Country name",
    "climate": "Climate description (e.g. 'Temperate oceanic')",
    "coatAdaptation": "How the coat evolved for the environment",
    "geographicNotes": "3-4 sentences about the geographic origins and how the terrain, climate and human cultures of the region shaped the breed"
  },
  "history": {
    "ancientLineage": "3-4 sentences tracing ancient ancestry and the breed's oldest known relatives",
    "wolfPopulation": "Eurasian wolf / Siberian wolf / South Asian wolf (pick closest ancestor)",
    "firstRecordedUse": "Earliest documented use (e.g. 'Medieval hunting, 14th century England')",
    "evolutionSummary": "3-4 sentences on how the breed was deliberately developed and refined over the centuries, including key milestones or breed-club recognition"
  },
  "functionalGroup": {
    "group": "Hound OR Gundog OR Terrier OR Working OR Pastoral OR Toy OR Utility OR Mixed",
    "historicalJob": "Specific historical role in one sentence",
    "modernRole": "Modern use in one sentence",
    "groupDescription": "2-3 sentences about the group's broader characteristics and how this breed exemplifies them"
  },
  "temperament": {
    "summary": "3-4 sentences describing this breed's overall character, disposition and how it typically behaves with its family",
    "traits": ["Trait 1", "Trait 2", "Trait 3", "Trait 4", "Trait 5"],
    "energyLevel": "e.g. High — needs vigorous daily activity",
    "affectionLevel": "e.g. Very affectionate and people-oriented",
    "barkingTendency": "e.g. Moderate — alerts but not excessive",
    "noteworthyBehaviours": "1-2 sentences on quirks or instincts to expect (e.g. herding nipping, prey drive, digging)"
  },
  "training": {
    "intelligence": "e.g. Highly intelligent — among the top working breeds",
    "trainability": "e.g. Very easy to train; eager to please",
    "recommendedApproach": "1-2 sentences on the most effective training methods for this breed",
    "commonChallenges": ["Challenge 1", "Challenge 2", "Challenge 3"],
    "socialisationNeeds": "1-2 sentences on early socialisation and mental-stimulation needs"
  },
  "physical": {
    "heightRange": "e.g. 55-61 cm at the shoulder (males slightly larger)",
    "weightRange": "e.g. 25-34 kg",
    "build": "1 sentence describing overall body type and proportions",
    "commonColours": ["Colour 1", "Colour 2", "Colour 3"],
    "distinctiveFeatures": "1-2 sentences on the breed's most recognisable physical features"
  },
  "nutrition": {
    "dailyCalories": "e.g. 1,300-1,700 kcal for a healthy adult (adjust for activity)",
    "dietType": "e.g. High-quality protein-rich diet suited to an active dog",
    "feedingFrequency": "e.g. Two measured meals per day",
    "foodsToAvoid": ["Food 1", "Food 2", "Food 3"],
    "supplements": "1 sentence on any supplements that commonly benefit this breed (e.g. joint support, omega oils)"
  },
  "compatibility": {
    "goodWithChildren": "e.g. Excellent — gentle and patient with kids",
    "goodWithOtherDogs": "e.g. Generally sociable with other dogs",
    "goodWithOtherPets": "e.g. Good with cats if raised together",
    "apartmentLiving": "e.g. Better suited to a home with a garden",
    "noviceOwnerFriendly": "e.g. Great choice for first-time owners",
    "aloneTolerance": "e.g. Dislikes long periods alone; prone to separation anxiety"
  },
  "grooming": {
    "coatType": "e.g. Double coat, long, wavy",
    "brushingFrequency": "e.g. Daily brushing required",
    "bathingFrequency": "e.g. Every 4-6 weeks",
    "nailCare": "e.g. Trim every 3-4 weeks",
    "earCare": "e.g. Check and clean weekly",
    "noseLearherCare": "e.g. Moisturise with dog-safe balm if dry",
    "pawPadCare": "e.g. Check for cracks, apply paw balm in winter",
    "professionalGroomingFrequency": "e.g. Every 8-12 weeks",
    "sheddingLevel": "e.g. Heavy seasonal shedding (twice a year)"
  },
  "health": {
    "lifespan": "e.g. 10-12 years",
    "commonConditions": ["Condition 1", "Condition 2", "Condition 3"],
    "geneticPredispositions": ["Genetic issue 1", "Genetic issue 2"],
    "parasiteRisks": ["Fleas", "Ticks", "Roundworm"],
    "lethargyWarnings": ["Warning sign 1", "Warning sign 2"],
    "exerciseNeeds": "e.g. 60-90 minutes per day",
    "preventiveCare": "1-2 sentences on the most important preventive-care priorities for this breed"
  },
  "funFacts": [
    "Interesting fact 1",
    "Interesting fact 2",
    "Interesting fact 3",
    "Interesting fact 4",
    "Interesting fact 5"
  ],
  "mapHighlight": "Country/region to highlight on a world map (e.g. 'United Kingdom')"
}`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 16384, responseMimeType: "application/json" },
    });

    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    breedKnowledgeCache.set(cacheKey, result);
    res.json(result);
  } catch (e: any) {
    req.log.error({ err: e }, "Breed knowledge fetch failed");
    res.status(500).json({ error: "Knowledge generation failed", details: e?.message });
  }
});

router.post("/glowup", async (req: Request, res: Response) => {
  const { breed, style, dogName } = req.body;

  if (!breed || !style) {
    res.status(400).json({ error: "breed and style are required" });
    return;
  }

  try {
    const ai = getAI();
    const name = dogName ? `a ${breed} named ${dogName}` : `a ${breed}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a world-class fine art critic and portrait painter. Imagine ${name} has been immortalised as a "${style}" artwork.

Write a vivid, evocative description of this portrait — as if you are standing in front of it in a gallery. Be specific about brushwork, colours, composition, lighting, and mood. Make it feel real and beautiful. 3–5 sentences, rich and poetic.

Also suggest 3 hex colour codes that capture the palette of this artwork.

Return ONLY valid JSON:
{
  "title": "Portrait title (e.g. 'Biscuit in Golden Hour, after Van Gogh')",
  "vision": "The vivid gallery description here...",
  "palette": ["#hexcode1", "#hexcode2", "#hexcode3"]
}`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 512, responseMimeType: "application/json" },
    });

    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    res.json(result);
  } catch (e: any) {
    req.log.error({ err: e }, "Glowup generation failed");
    res.status(500).json({ error: "Glow-Up generation failed", details: e?.message });
  }
});

// ─── Premium Scanner Endpoints ───────────────────────────────────────────────

router.post("/mixed-breed-dna", async (req: Request, res: Response) => {
  const { base64Image, mimeType = "image/jpeg" } = req.body;
  if (!base64Image) { res.status(400).json({ error: "base64Image is required" }); return; }
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: `Analyse this dog photo as a canine geneticist. Determine the most likely breed mix and provide a detailed DNA-style breakdown.\n\nReturn ONLY valid JSON:\n{\n  "primaryBreed": "Main breed",\n  "secondaryBreed": "Secondary breed or 'None'",\n  "confidence": 85,\n  "geneticMarkers": ["Visual marker 1", "Visual marker 2", "Visual marker 3"],\n  "ancestralBreeds": ["Ancestor 1", "Ancestor 2"],\n  "dnaSummary": "2-3 sentences summarising the genetic heritage"\n}` },
        ],
      }],
      config: { maxOutputTokens: 512, responseMimeType: "application/json" },
    });
    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (e: any) {
    req.log.error({ err: e }, "Mixed breed DNA failed");
    res.status(500).json({ error: "Mixed breed DNA analysis failed", details: e?.message });
  }
});

router.post("/age-estimate", async (req: Request, res: Response) => {
  const { base64Image, mimeType = "image/jpeg" } = req.body;
  if (!base64Image) { res.status(400).json({ error: "base64Image is required" }); return; }
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: `Estimate this dog's age from visual cues in the photo (coat condition, eye clarity, muscle tone, grey muzzle, teeth if visible).\n\nReturn ONLY valid JSON:\n{\n  "estimatedAge": "e.g. 3-4 years",\n  "ageRange": "e.g. 2-5 years",\n  "confidence": 78,\n  "lifeStage": "Puppy / Adolescent / Young Adult / Mature Adult / Senior",\n  "signs": ["Visual sign 1", "Visual sign 2", "Visual sign 3"],\n  "birthdayEstimate": "Born around season year"\n}` },
        ],
      }],
      config: { maxOutputTokens: 512, responseMimeType: "application/json" },
    });
    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (e: any) {
    req.log.error({ err: e }, "Age estimate failed");
    res.status(500).json({ error: "Age estimation failed", details: e?.message });
  }
});

router.post("/personality-scan", async (req: Request, res: Response) => {
  const { base64Image, mimeType = "image/jpeg", breed } = req.body;
  if (!base64Image) { res.status(400).json({ error: "base64Image is required" }); return; }
  try {
    const ai = getAI();
    const breedHint = breed ? `The dog is identified as a ${breed}.` : "Identify the breed from the image first.";
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: `Analyse this dog's personality from its expression, posture, and appearance. ${breedHint}\n\nReturn ONLY valid JSON:\n{\n  "traits": ["Trait 1", "Trait 2", "Trait 3", "Trait 4"],\n  "dominantTrait": "Most dominant personality trait",\n  "socialStyle": "How they interact with people and dogs",\n  "energyLevel": "e.g. High — needs 90+ min exercise daily",\n  "description": "2-3 sentences describing this dog's personality"\n}` },
        ],
      }],
      config: { maxOutputTokens: 512, responseMimeType: "application/json" },
    });
    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (e: any) {
    req.log.error({ err: e }, "Personality scan failed");
    res.status(500).json({ error: "Personality scan failed", details: e?.message });
  }
});

router.post("/health-guide", async (req: Request, res: Response) => {
  const { breed, dogName } = req.body;
  if (!breed) { res.status(400).json({ error: "breed is required" }); return; }

  const cacheKey = breedDogNameKey(breed, dogName);
  const cached = healthGuideCache.get(cacheKey);
  if (cached !== undefined) {
    res.json(cached);
    return;
  }

  try {
    const ai = getAI();
    const name = dogName ? `${dogName} the ${breed}` : `a ${breed}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: `Create a personalised health and care guide for ${name}. Include product recommendations from ONJJEM (spelled exactly as O-N-J-J-E-M, never "anjem", "onjam", "onjjem" with different capitalisation, or any other variation — always "ONJJEM") — a personalised dog merchandise brand at onjjem.com.\n\nReturn ONLY valid JSON:\n{\n  "healthTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"],\n  "productRecommendations": [\n    { "name": "Product name", "description": "Why it helps this breed", "url": "https://onjjem.com" }\n  ],\n  "exercisePlan": "Daily exercise recommendation",\n  "dietNotes": "Diet and nutrition advice",\n  "vetChecklist": ["Check 1", "Check 2", "Check 3"]\n}` },
        ],
      }],
      config: { maxOutputTokens: 1024, responseMimeType: "application/json" },
    });
    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    healthGuideCache.set(cacheKey, result);
    res.json(result);
  } catch (e: any) {
    req.log.error({ err: e }, "Health guide failed");
    res.status(500).json({ error: "Health guide generation failed", details: e?.message });
  }
});

router.post("/trick-trainer", async (req: Request, res: Response) => {
  const { breed, dogName } = req.body;
  if (!breed) { res.status(400).json({ error: "breed is required" }); return; }

  const cacheKey = breedDogNameKey(breed, dogName);
  const cached = trickTrainerCache.get(cacheKey);
  if (cached !== undefined) {
    res.json(cached);
    return;
  }

  try {
    const ai = getAI();
    const name = dogName ? `${dogName} the ${breed}` : `a ${breed}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: `Create a fun, personalised trick training plan for ${name}. Tailor difficulty and tricks to the breed's intelligence and physical ability.\n\nReturn ONLY valid JSON:\n{\n  "difficulty": "Beginner / Intermediate / Advanced",\n  "tricks": [\n    { "name": "Trick name", "steps": 3, "time": "2-3 days" }\n  ],\n  "trainingSchedule": "Daily training routine",\n  "tips": ["Tip 1", "Tip 2", "Tip 3"],\n  "estimatedTime": "Total time to master all tricks"\n}` },
        ],
      }],
      config: { maxOutputTokens: 1024, responseMimeType: "application/json" },
    });
    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    trickTrainerCache.set(cacheKey, result);
    res.json(result);
  } catch (e: any) {
    req.log.error({ err: e }, "Trick trainer failed");
    res.status(500).json({ error: "Trick trainer generation failed", details: e?.message });
  }
});

export default router;
