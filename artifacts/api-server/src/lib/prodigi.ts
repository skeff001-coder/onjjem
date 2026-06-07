import { logger } from "../lib/logger";

export interface ProdigiOrderItem {
  sku: string;
  copies: number;
  photoUrl: string;
  productType: string;
  phoneModel?: string;
}

export interface ProdigiShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  townOrCity: string;
  stateOrCounty?: string;
  postalOrZipCode: string;
  countryCode: string;
}

export interface ProdigiOrderRequest {
  referenceId: string;
  customerEmail: string;
  shippingAddress: ProdigiShippingAddress;
  items: ProdigiOrderItem[];
  callbackUrl?: string;
}

export interface ProdigiOrderResult {
  orderId: string;
  referenceId: string;
  status: string;
}

/**
 * Phone case model → full Prodigi SKU.
 * All confirmed valid against live Prodigi API (PaymentFailed, not SkuNotFound).
 * Gloss (G) finish — best for photo reproduction.
 * To add more models: test SKU via API first, then add here.
 */
export const PHONE_CASE_MODEL_SKUS: Record<string, string> = {
  "iPhone 16 Pro Max": "GLOBAL-TECH-IP16PM-TCB-CS-G",
  "iPhone 16": "GLOBAL-TECH-IP16-TCB-CS-G",
  "iPhone 15 Pro Max": "GLOBAL-TECH-IP15PM-TCB-CS-G",
  "iPhone 15": "GLOBAL-TECH-IP15-TCB-CS-G",
  "iPhone 14 Pro Max": "GLOBAL-TECH-IP14PM-TCB-CS-G",
  "iPhone 14": "GLOBAL-TECH-IP14-TCB-CS-G",
  "iPhone 13 Pro Max": "GLOBAL-TECH-IP13PM-TCB-CS-G",
  "iPhone 13 Pro": "GLOBAL-TECH-IP13P-TCB-CS-G",
  "iPhone 13 Mini": "GLOBAL-TECH-IP13MN-TCB-CS-G",
  "iPhone 13": "GLOBAL-TECH-IP13-TCB-CS-G",
  "iPhone 12": "GLOBAL-TECH-IP12-TCB-CS-G",
  "iPhone 11": "GLOBAL-TECH-IP11-TCB-CS-G",
  "Google Pixel 9": "GLOBAL-TECH-GP9-TCB-CS-G",
  "Google Pixel 8 Pro": "GLOBAL-TECH-GP8P-TCB-CS-G",
  "Google Pixel 8": "GLOBAL-TECH-GP8-TCB-CS-G",
  "Google Pixel 7": "GLOBAL-TECH-GP7-TCB-CS-G",
};

/**
 * Per-product configuration: full SKU (with size), required attributes, and
 * which print areas to submit artwork to.
 *
 * SKUs confirmed against live Prodigi API — do not change without re-testing.
 * Jigsaw requires two print areas: "jigsaw" (puzzle face) and "lid" (tin lid).
 * Canvas products require a "wrap" attribute; framed prints require "color".
 * Phone cases use PHONE_CASE_MODEL_SKUS — SKU is derived from phoneModel at order time.
 */
const PRODIGI_PRODUCT_CONFIGS: Record<
  string,
  {
    sku: string;
    attributes?: Record<string, string>;
    printAreas: string[];
  }
> = {
  mug: {
    sku: "H-MUG-W",
    printAreas: ["default"],
  },
  jigsaw: {
    sku: "JIGSAW-PUZZLE-252",
    printAreas: ["jigsaw", "lid"],
  },
  framed_print: {
    sku: "GLOBAL-CFP-A4",
    attributes: { color: "white" },
    printAreas: ["default"],
  },
  canvas: {
    sku: "GLOBAL-CAN-8x10",
    attributes: { wrap: "MirrorWrap" },
    printAreas: ["default"],
  },
  eco_canvas: {
    sku: "ECO-CAN-12x12",
    attributes: { wrap: "MirrorWrap" },
    printAreas: ["default"],
  },
  // Playing cards — 52-card deck, single-sided print, white box
  playing_cards: {
    sku: "PLAY-CARD",
    printAreas: ["default"],
  },
  // 4x6" temporary tattoo — confirmed valid on this account
  tattoo: {
    sku: "GLOBAL-TATT-L",
    printAreas: ["default"],
  },
  // Phone cases — SKU is derived from phoneModel at order time via PHONE_CASE_MODEL_SKUS
  phone_case: {
    sku: "DYNAMIC",
    printAreas: ["default"],
  },
  // 4-pack of 4x4" wooden coasters — confirmed valid on this account
  coaster: {
    sku: "H-COAST-4PK",
    printAreas: ["default"],
  },
  // 16x16" single-sided canvas cushion — confirmed valid on this account
  cushion: {
    sku: "GLOBAL-CUSH-16X16-CAN",
    printAreas: ["default"],
  },
  // Personalised metal dog ID tag — pendant on split ring
  dog_tag: {
    sku: "GLOBAL-IDTAG",
    printAreas: ["default"],
  },
};

const PRODIGI_API_BASE =
  process.env.PRODIGI_ENV === "live"
    ? "https://api.prodigi.com/v4.0"
    : "https://api.sandbox.prodigi.com/v4.0";

export async function placeProdigiOrder(
  request: ProdigiOrderRequest
): Promise<ProdigiOrderResult> {
  const apiKey = process.env.PRODIGI_API_KEY;

  if (!apiKey) {
    logger.warn(
      { referenceId: request.referenceId },
      "PRODIGI_API_KEY not set — Prodigi order STUBBED (not submitted). " +
        "Set PRODIGI_API_KEY in environment secrets to enable live fulfillment."
    );
    return {
      orderId: `stub_${Date.now()}`,
      referenceId: request.referenceId,
      status: "stub",
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };

  const items = request.items.map((item) => {
    const config = PRODIGI_PRODUCT_CONFIGS[item.productType];

    if (!config) {
      throw new Error(
        `Unknown product type "${item.productType}" — cannot build Prodigi order item`
      );
    }

    let resolvedSku = item.sku || config.sku;

    if (item.productType === "phone_case") {
      if (!item.phoneModel) {
        throw new Error("Phone case order requires a phoneModel to be specified");
      }
      const modelSku = PHONE_CASE_MODEL_SKUS[item.phoneModel];
      if (!modelSku) {
        throw new Error(
          `Unsupported phone model "${item.phoneModel}" — add it to PHONE_CASE_MODEL_SKUS in prodigi.ts`
        );
      }
      resolvedSku = modelSku;
    }

    const assets = config.printAreas.map((printArea) => ({
      printArea,
      url: item.photoUrl,
    }));

    const orderItem: Record<string, unknown> = {
      sku: resolvedSku,
      copies: item.copies,
      sizing: "fillPrintArea",
      assets,
    };

    if (config.attributes && Object.keys(config.attributes).length > 0) {
      orderItem.attributes = config.attributes;
    }

    return orderItem;
  });

  const body: Record<string, unknown> = {
    shippingMethod: "Budget",
    recipient: {
      address: {
        line1: request.shippingAddress.line1,
        line2: request.shippingAddress.line2 ?? "",
        postalOrZipCode: request.shippingAddress.postalOrZipCode,
        countryCode: request.shippingAddress.countryCode,
        townOrCity: request.shippingAddress.townOrCity,
        stateOrCounty: request.shippingAddress.stateOrCounty ?? "",
      },
      name: request.shippingAddress.name,
      email: request.customerEmail,
    },
    items,
  };

  if (request.callbackUrl) {
    body.callbackUrl = request.callbackUrl;
  }

  const resp = await fetch(`${PRODIGI_API_BASE}/Orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Prodigi order failed: ${resp.status} ${resp.statusText} — ${text}`
    );
  }

  const data: any = await resp.json();

  if (
    data.outcome?.toLowerCase?.() === "failed" ||
    data.outcome === "Failed" ||
    data.outcome === "ValidationFailed"
  ) {
    throw new Error(
      `Prodigi order error: ${data.outcome} — ${JSON.stringify(data)}`
    );
  }

  return {
    orderId: String(data.order?.id ?? data.id ?? "unknown"),
    referenceId: request.referenceId,
    status: String(data.outcome ?? data.order?.status ?? "unknown"),
  };
}
