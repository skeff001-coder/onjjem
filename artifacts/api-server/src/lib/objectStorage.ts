/**
 * Object storage — backed by Supabase Storage REST API.
 *
 * Uses plain fetch() — no @supabase/supabase-js package needed.
 * Uses the existing "photos" bucket in your Supabase project.
 *
 * Required environment variables (already set in Railway):
 *   SUPABASE_URL              — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (full access)
 */

import { randomUUID } from "crypto";

const BUCKET = "photos";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Railway environment variables."
    );
  }
  return { url: url.replace(/\/$/, ""), key };
}

export class ObjectStorageService {
  async uploadBufferAndGetSignedUrl(
    buffer: Buffer,
    options: { contentType: string }
  ): Promise<string> {
    const { url, key } = getSupabaseConfig();
    const objectPath = `prodigi-uploads/${randomUUID()}`;

    // Upload
    const uploadRes = await fetch(
      `${url}/storage/v1/object/${BUCKET}/${objectPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": options.contentType,
          "x-upsert": "false",
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Supabase upload failed: ${err}`);
    }

    // Create signed URL valid for 24 hours
    const signRes = await fetch(
      `${url}/storage/v1/object/sign/${BUCKET}/${objectPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 86400 }),
      }
    );

    if (!signRes.ok) {
      const err = await signRes.text();
      throw new Error(`Supabase signed URL failed: ${err}`);
    }

    const signData = await signRes.json() as { signedURL?: string };
    const signedURL = signData.signedURL;
    if (!signedURL) {
      throw new Error("Supabase did not return a signed URL");
    }

    return `${url}/storage/v1${signedURL}`;
  }
}

// ── Legacy compatibility — objectStorageClient is imported elsewhere ──────────
export const objectStorageClient = {
  bucket: (_name: string) => ({
    file: (_path: string) => ({
      save: async () => {},
      download: async () => [Buffer.from("")],
      makePublic: async () => {},
    }),
  }),
};
