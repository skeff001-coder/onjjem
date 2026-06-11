import { randomUUID } from "crypto";
import type { ObjectAclPolicy, ObjectPermission } from "./objectAcl";

/**
 * Supabase Storage implementation.
 *
 * Replaces the previous Replit Object Storage (GCS sidecar) implementation.
 * Uses the Supabase Storage REST API directly via fetch — no extra
 * dependencies required.
 *
 * Required environment variables:
 *   SUPABASE_URL                e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY   secret key from Supabase API settings
 * Optional:
 *   SUPABASE_STORAGE_BUCKET     defaults to "photos"
 *
 * Object paths keep the same external format as before: "/objects/<key>"
 * where <key> is the object's key inside the bucket (e.g. "uploads/<uuid>").
 */

function getSupabaseConfig(): { url: string; serviceKey: string; bucket: string } {
  const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "photos";
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase storage is not configured. Set SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }
  return { url, serviceKey, bucket };
}

function authHeaders(serviceKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  };
}

/** Minimal handle to an object in the bucket. */
export interface StorageObject {
  key: string;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/** Returns true if an object exists in the bucket. */
async function objectExists(key: string): Promise<boolean> {
  const { url, serviceKey, bucket } = getSupabaseConfig();
  const objectUrl = `${url}/storage/v1/object/${bucket}/${encodeKey(key)}`;
  // HEAD is supported by Supabase storage-api and returns metadata headers.
  const resp = await fetch(objectUrl, {
    method: "HEAD",
    headers: authHeaders(serviceKey),
    signal: AbortSignal.timeout(15_000),
  });
  if (resp.ok) return true;
  if (resp.status === 404 || resp.status === 400) return false;
  // Some proxies disallow HEAD — fall back to a 1-byte ranged GET.
  if (resp.status === 405) {
    const probe = await fetch(objectUrl, {
      method: "GET",
      headers: { ...authHeaders(serviceKey), Range: "bytes=0-0" },
      signal: AbortSignal.timeout(15_000),
    });
    return probe.ok;
  }
  return false;
}

/** Encode each path segment but keep the slashes. */
function encodeKey(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export class ObjectStorageService {
  constructor() {}

  /**
   * Public assets live under the "public/" prefix inside the bucket.
   * PUBLIC_OBJECT_SEARCH_PATHS is no longer required; if set, its values
   * are used as additional prefixes to search.
   */
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const extra = pathsStr
      .split(",")
      .map((p) => p.trim().replace(/^\/+|\/+$/g, ""))
      .filter((p) => p.length > 0);
    return Array.from(new Set(["public", ...extra]));
  }

  /** Kept for interface compatibility; uploads go under "uploads/". */
  getPrivateObjectDir(): string {
    return process.env.PRIVATE_OBJECT_DIR || "uploads";
  }

  async searchPublicObject(filePath: string): Promise<StorageObject | null> {
    const cleaned = filePath.replace(/^\/+/, "");
    for (const prefix of this.getPublicObjectSearchPaths()) {
      const key = `${prefix}/${cleaned}`;
      if (await objectExists(key)) {
        return { key };
      }
    }
    return null;
  }

  /**
   * Streams an object back as a web Response, same as before.
   * Routes pipe response.body to the client.
   */
  async downloadObject(
    file: StorageObject,
    cacheTtlSec: number = 3600
  ): Promise<Response> {
    const { url, serviceKey, bucket } = getSupabaseConfig();
    const objectUrl = `${url}/storage/v1/object/${bucket}/${encodeKey(file.key)}`;

    const upstream = await fetch(objectUrl, {
      method: "GET",
      headers: authHeaders(serviceKey),
      signal: AbortSignal.timeout(60_000),
    });

    if (upstream.status === 404 || upstream.status === 400) {
      throw new ObjectNotFoundError();
    }
    if (!upstream.ok || !upstream.body) {
      throw new Error(`Failed to download object (${upstream.status})`);
    }

    const isPublic = file.key.startsWith("public/");
    const headers: Record<string, string> = {
      "Content-Type":
        upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
    };
    const len = upstream.headers.get("content-length");
    if (len) headers["Content-Length"] = len;

    return new Response(upstream.body, { headers });
  }

  /**
   * Returns a presigned upload URL. The client PUTs the file bytes to it.
   * Supabase signed upload URLs accept PUT with the token in the URL.
   */
  async getObjectEntityUploadURL(): Promise<string> {
    const { url, serviceKey, bucket } = getSupabaseConfig();
    const objectId = randomUUID();
    const key = `uploads/${objectId}`;

    const resp = await fetch(
      `${url}/storage/v1/object/upload/sign/${bucket}/${encodeKey(key)}`,
      {
        method: "POST",
        headers: {
          ...authHeaders(serviceKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Failed to create signed upload URL: ${resp.status} ${body}`);
    }

    const data = (await resp.json()) as { url?: string };
    if (!data.url) {
      throw new Error("Signed upload URL missing from Supabase response");
    }
    // Supabase returns a path relative to /storage/v1
    return `${url}/storage/v1${data.url.startsWith("/") ? "" : "/"}${data.url}`;
  }

  /** Resolves "/objects/<key>" to a storage object, verifying it exists. */
  async getObjectEntityFile(objectPath: string): Promise<StorageObject> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const key = objectPath.slice("/objects/".length);
    if (!key) {
      throw new ObjectNotFoundError();
    }
    if (!(await objectExists(key))) {
      throw new ObjectNotFoundError();
    }
    return { key };
  }

  /**
   * Converts a Supabase storage URL (signed upload URL or object URL)
   * back into the canonical "/objects/<key>" path. Non-Supabase paths are
   * returned unchanged (same behaviour as before for non-GCS paths).
   */
  normalizeObjectEntityPath(rawPath: string): string {
    const { url, bucket } = getSupabaseConfig();
    if (!rawPath.startsWith(`${url}/storage/v1/`)) {
      return rawPath;
    }

    let pathname: string;
    try {
      pathname = new URL(rawPath).pathname;
    } catch {
      return rawPath;
    }

    const markers = [
      `/storage/v1/object/upload/sign/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/${bucket}/`,
    ];

    for (const marker of markers) {
      const idx = pathname.indexOf(marker);
      if (idx !== -1) {
        const key = decodeURIComponent(pathname.slice(idx + marker.length));
return `/objects/${key}`;
      }
    }
    return rawPath;
  }

  /** Server-side upload of raw bytes; returns the "/objects/<key>" path. */
  async uploadBuffer(buffer: Buffer, contentType: string): Promise<string> {
    const { url, serviceKey, bucket } = getSupabaseConfig();
    const objectId = randomUUID();
    const key = `uploads/${objectId}`;

    const resp = await fetch(
      `${url}/storage/v1/object/${bucket}/${encodeKey(key)}`,
      {
        method: "POST",
        headers: {
          ...authHeaders(serviceKey),
          "Content-Type": contentType || "application/octet-stream",
          "x-upsert": "false",
        },
        body: new Uint8Array(buffer),
        signal: AbortSignal.timeout(120_000),
      }
    );

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Failed to upload object: ${resp.status} ${body}`);
    }

    return `/objects/${key}`;
  }

  /**
   * ACLs are no longer stored on object metadata. The bucket is private and
   * everything is served through this API, so this is a safe no-op that
   * preserves the previous return contract.
   */
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    _aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    return normalizedPath;
  }

  /** Access control is handled at the route level; default allow. */
  async canAccessObjectEntity(_args: {
    userId?: string;
    objectFile: StorageObject;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return true;
  }
}
