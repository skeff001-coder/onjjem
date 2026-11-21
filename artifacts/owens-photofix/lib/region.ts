// Works out if the person is in the USA, so the app opens the right website
// (onjjem.com for the UK, onjjem.com/us for America) and shows the right wording.
function detectUS(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("America/") || tz.startsWith("US/") || tz === "Pacific/Honolulu") return true;
  } catch {}
  try {
    const loc = Intl.NumberFormat().resolvedOptions().locale || "";
    if (/[-_]US\b/i.test(loc)) return true;
  } catch {}
  return false;
}

export const IS_US = detectUS();
export const SITE = IS_US ? "https://onjjem.com/us/" : "https://onjjem.com/";

export const SHOP_TILES = IS_US
  ? [
      { name: "Holiday Gifts", icon: "gift-outline", url: "https://onjjem.com/us/shop-christmas" },
      { name: "Mugs", icon: "cafe-outline", url: "https://onjjem.com/us/shop-mugs" },
      { name: "Wall Art & Prints", icon: "image-outline", url: "https://onjjem.com/us/shop-prints" },
      { name: "Blankets & Tapestries", icon: "bed-outline", url: "https://onjjem.com/us/shop-tapestries" },
      { name: "Home", icon: "home-outline", url: "https://onjjem.com/us/shop-home" },
      { name: "Clothing", icon: "shirt-outline", url: "https://onjjem.com/us/shop-clothing" },
    ]
  : [
      { name: "Christmas", icon: "gift-outline", url: "https://onjjem.com/shop-christmas" },
      { name: "Wall Art", icon: "image-outline", url: "https://onjjem.com/shop-wall-art" },
      { name: "Home & Kitchen", icon: "cafe-outline", url: "https://onjjem.com/shop-home" },
      { name: "Clothing & Kids", icon: "shirt-outline", url: "https://onjjem.com/shop-clothing" },
      { name: "Pets", icon: "paw-outline", url: "https://onjjem.com/shop-pets" },
      { name: "Deals", icon: "pricetag-outline", url: "https://onjjem.com/shop-deals" },
    ];

export const MUG_URL = IS_US ? "https://onjjem.com/us/mug" : "https://onjjem.com/mug";
export const DEALS_URL = IS_US ? "https://onjjem.com/us/shop-christmas" : "https://onjjem.com/shop-deals";
export const DELIVERY_URL = IS_US ? "https://onjjem.com/us/shipping" : "https://onjjem.com/delivery.html";
