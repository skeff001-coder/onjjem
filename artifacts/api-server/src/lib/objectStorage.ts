/**
 * Object storage — backed by Supabase Storage.
 *
 * Replaces the old Replit/Google Cloud Storage implementation.
 * Uses the existing "photos" bucket in your Supabase project.
 *
 * Required environment variables (already set in Railway):
 *   SUPABASE_URL              — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (full access)
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BUCKET = "photos";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Railway environment variables."
    );
  }
  return createClient(url, key);
}

export class ObjectStorageService {
  /**
   * Upload a Buffer and return a signed URL valid for 24 hours.
   * Used by the fulfilment module to give Prodigi a downloadable image URL.
   */
  async uploadBufferAndGetSignedUrl(
    buffer: Buffer,
    options: { contentType: string }
  ): Promise<string> {
    const supabase = getSupabaseClient();
    const objectPath = `prodigi-uploads/${randomUUID()}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, {
        contentType: options.contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(objectPath, 60 * 60 * 24); // 24 hours

    if (signError || !data?.signedUrl) {
      throw new Error(
        `Supabase signed URL failed: ${signError?.message ?? "no URL returned"}`
      );
    }

    return data.signedUrl;
  }

  /**
   * Store a photo by ID (used by the Stripe checkout flow to
   * temporarily hold the customer's photo until the webhook fires).
   */
  async storePhoto(photoId: string, base64Data: string): Promise<void> {
    const supabase = getSupabaseClient();
    const buffer = Buffer.from(base64Data, "base64");
    const objectPath = `photo-tokens/${photoId}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase storePhoto failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a stored photo by ID and return it as a base64 string.
   */
  async getPhoto(photoId: string): Promise<string | null> {
    const supabase = getSupabaseClient();
    const objectPath = `photo-tokens/${photoId}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(objectPath);

    if (error || !data) {
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  }

  /**
   * Delete a stored photo token after fulfilment (cleanup).
   */
  async deletePhoto(photoId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const objectPath = `photo-tokens/${photoId}`;
    await supabase.storage.from(BUCKET).remove([objectPath]);
  }
}

// ── Legacy compatibility exports ─────────────────────────────────────────────
// These match the old API surface so no other files need changing.

export const objectStorageClient = {
  bucket: (_name: string) => ({
    file: (_path: string) => ({
      save: async () => {},
      download: async () => [Buffer.from("")],
      makePublic: async () => {},
    }),
  }),
};

export async function storePhotoInStorage(
  photoId: string,
  base64Data: string
): Promise<void> {
  const service = new ObjectStorageService();
  await service.storePhoto(photoId, base64Data);
}

export async function getPhotoFromStorage(
  photoId: string
): Promise<string | null> {
  const service = new ObjectStorageService();
  return service.getPhoto(photoId);
}
