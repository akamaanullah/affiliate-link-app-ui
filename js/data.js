/* Sample catalog, people, and report figures. Generated once per page load from a fixed seed. */
(function (root) {
  "use strict";

  var CATEGORY_RATES = {
    Electronics: 0.03,
    Computers: 0.025,
    Home: 0.045,
    Kitchen: 0.045,
    Apparel: 0.04,
    Outdoors: 0.03,
    Toys: 0.03,
  };

  function product(row) {
    return row;
  }

  var PRODUCTS = [
    product({ asin: "B0C8N4K2QW", title: "Anker 737 Power Bank, 24,000mAh, 140W", brand: "Anker", seller: "Anker Direct", category: "Electronics", rating: 4.6, reviews: 18420, usd: 129.99, prices: { USD: 129.99, GBP: 119.99, EUR: 139.99, CAD: 179.99, JPY: 19800, AUD: 199, INR: 12999 }, recordedAt: "2026-11-08T16:40:00Z", keywords: ["power bank", "charger", "anker", "737"] }),
    product({ asin: "B0ANKCBL6F", title: "Anker USB-C to USB-C Cable, 6 ft, 240W", brand: "Anker", seller: "Anker Direct", category: "Electronics", rating: 4.7, reviews: 42110, usd: 15.99, prices: { USD: 15.99, GBP: 14.99, EUR: 16.99, CAD: 21.99, JPY: 1890, AUD: 24.95, INR: 1299 }, recordedAt: "2026-11-08T16:40:00Z", keywords: ["usb-c", "cable", "anker"] }),
    product({ asin: "B0AIRPODP2", title: "Apple AirPods Pro (2nd generation)", brand: "Apple", seller: "Apple", category: "Electronics", rating: 4.7, reviews: 96210, usd: 189.99, prices: { USD: 189.99, GBP: 229, EUR: 249, CAD: 249.99, JPY: 32800, AUD: 349, INR: 24900 }, recordedAt: "2026-11-07T11:05:00Z", keywords: ["airpods", "earbuds", "apple"] }),
    product({ asin: "B0APPLCBL1", title: "Apple USB-C Charge Cable, 1 m", brand: "Apple", seller: "Apple", category: "Electronics", rating: 4.6, reviews: 15004, usd: 19, prices: { USD: 19, GBP: 19, EUR: 25, CAD: 25, JPY: 2400, AUD: 29, INR: 1900 }, recordedAt: "2026-11-07T11:05:00Z", keywords: ["usb-c", "cable", "apple"] }),
    product({ asin: "B0SNYWHXM5", title: "Sony WH-1000XM5 Wireless Headphones", brand: "Sony", seller: "Sony", category: "Electronics", rating: 4.5, reviews: 23880, usd: 328, prices: { USD: 328, GBP: 299, EUR: 349, CAD: 429, JPY: 42800, AUD: 498, INR: 29990 }, recordedAt: "2026-11-08T09:12:00Z", keywords: ["headphones", "sony", "noise cancelling"] }),
    product({ asin: "B0SS990EV2", title: "Samsung 990 EVO 2TB NVMe SSD", brand: "Samsung", seller: "Samsung Electronics", category: "Computers", rating: 4.8, reviews: 6120, usd: 149.99, prices: { USD: 149.99, GBP: 139.99, EUR: 159.99, CAD: 199.99, JPY: 21800, AUD: 249, INR: 14999 }, recordedAt: "2026-11-09T06:15:00Z", keywords: ["ssd", "nvme", "samsung"] }),
    product({ asin: "B0LC55QTFL", title: "Le Creuset Signature Dutch Oven, 5.5 qt", brand: "Le Creuset", seller: "Le Creuset Official", category: "Kitchen", rating: 4.8, reviews: 9804, usd: 379.95, prices: { USD: 379.95, GBP: 289, EUR: 329, CAD: 499, AUD: 620 }, recordedAt: "2026-11-06T18:22:00Z", keywords: ["dutch oven", "le creuset", "cast iron"] }),
    product({ asin: "B0BRKLNQNS", title: "Brooklinen Luxe Core Sheet Set, Queen", brand: "Brooklinen", seller: "Brooklinen", category: "Home", rating: 4.4, reviews: 7340, usd: 149, prices: { USD: 149, GBP: 139, EUR: 159, CAD: 189 }, recordedAt: "2026-11-05T15:00:00Z", keywords: ["sheets", "brooklinen", "queen"] }),
    product({ asin: "B0KEYQ1PRO", title: "Keychron Q1 Pro Mechanical Keyboard", brand: "Keychron", seller: "Keychron", category: "Computers", rating: 4.6, reviews: 4122, usd: 199, prices: { USD: 199, GBP: 189, EUR: 219, CAD: 269, JPY: 29800, AUD: 319 }, recordedAt: "2026-11-08T16:40:00Z", keywords: ["keyboard", "mechanical", "keychron"] }),
    product({ asin: "B0YETI26OZ", title: "YETI Rambler 26 oz Bottle with Chug Cap", brand: "YETI", seller: "YETI", category: "Outdoors", rating: 4.8, reviews: 22014, usd: 40, prices: { USD: 40, GBP: 35, CAD: 50, AUD: 55 }, recordedAt: "2026-11-04T12:30:00Z", keywords: ["water bottle", "yeti", "rambler"] }),
    product({ asin: "B0DYSONV15", title: "Dyson V15 Detect Cordless Vacuum", brand: "Dyson", seller: "Dyson", category: "Home", rating: 4.5, reviews: 11230, usd: 649.99, prices: { USD: 649.99, GBP: 549, EUR: 599, CAD: 799, AUD: 999, INR: 62900 }, recordedAt: "2026-11-07T11:05:00Z", keywords: ["vacuum", "dyson", "cordless"] }),
    product({ asin: "B0NIKEPEG4", title: "Nike Pegasus 41, Men's, size 10", brand: "Nike", seller: "Nike", category: "Apparel", rating: 4.4, reviews: 3011, usd: 140, prices: { USD: 140, GBP: 125, EUR: 140, CAD: 170, AUD: 200, INR: 11995 }, recordedAt: "2026-11-08T09:12:00Z", keywords: ["running shoes", "nike", "pegasus"] }),
    product({ asin: "B0BARISTA1", title: "Breville Barista Express Espresso Machine", brand: "Breville", seller: "Breville", category: "Kitchen", rating: 4.6, reviews: 15440, usd: 699.95, prices: { USD: 699.95, GBP: 579, EUR: 649, CAD: 899, AUD: 999 }, recordedAt: "2026-11-03T08:45:00Z", keywords: ["espresso", "breville", "coffee"] }),
    product({ asin: "B0KINDLEPW", title: "Kindle Paperwhite, 16 GB", brand: "Amazon", seller: "Amazon.com", category: "Electronics", rating: 4.6, reviews: 88012, usd: 149.99, prices: { USD: 149.99, GBP: 149.99, EUR: 169.99, CAD: 189.99, JPY: 19980, AUD: 249, INR: 14999 }, recordedAt: "2026-11-09T06:15:00Z", keywords: ["kindle", "ereader", "paperwhite"] }),
    product({ asin: "B0LODGESKL", title: "Lodge Cast Iron Skillet, 12 inch", brand: "Lodge", seller: "Amazon.com", category: "Kitchen", rating: 4.7, reviews: 54002, usd: 29.9, prices: { USD: 29.9, GBP: 27, EUR: 32, CAD: 39.99 }, recordedAt: "2026-11-02T19:10:00Z", keywords: ["skillet", "cast iron", "lodge"] }),
    product({ asin: "B0PTAGSWTR", title: "Patagonia Better Sweater, Men's M", brand: "Patagonia", seller: "Patagonia", category: "Apparel", rating: 4.6, reviews: 2104, usd: 139, prices: { USD: 139, GBP: 130, EUR: 149, CAD: 179 }, recordedAt: "2026-11-06T18:22:00Z", keywords: ["fleece", "patagonia", "sweater"] }),
    product({ asin: "B0BOSEULTR", title: "Bose QuietComfort Ultra Earbuds", brand: "Bose", seller: "Bose", category: "Electronics", rating: 4.3, reviews: 8901, usd: 249, prices: { USD: 249, GBP: 249, EUR: 279, CAD: 329, JPY: 36300, AUD: 399, INR: 24900 }, recordedAt: "2026-11-08T16:40:00Z", keywords: ["earbuds", "bose", "noise cancelling"] }),
    product({ asin: "B0OXOSPINR", title: "OXO Good Grips Salad Spinner", brand: "OXO", seller: "Amazon.com", category: "Kitchen", rating: 4.7, reviews: 19002, usd: 34.95, prices: { USD: 34.95, GBP: 32, EUR: 36, CAD: 44.95 }, recordedAt: "2026-11-01T14:00:00Z", keywords: ["salad", "oxo", "spinner"] }),
    product({ asin: "B0LEGOP911", title: "LEGO Technic Porsche 911", brand: "LEGO", seller: "LEGO", category: "Toys", rating: 4.8, reviews: 6400, usd: 149.99, prices: { USD: 149.99, GBP: 134.99, EUR: 149.99, CAD: 199.99, JPY: 19800, AUD: 249 }, recordedAt: "2026-11-05T15:00:00Z", keywords: ["lego", "porsche", "technic"] }),
    product({ asin: "B0STAN40OZ", title: "Stanley Quencher H2.0, 40 oz", brand: "Stanley", seller: "Stanley 1913", category: "Outdoors", rating: 4.6, reviews: 33012, usd: 45, prices: { USD: 45, GBP: 45, CAD: 55, AUD: 65 }, recordedAt: "2026-11-08T09:12:00Z", keywords: ["tumbler", "stanley", "quencher"] }),
    product({ asin: "B0FELLOWOD", title: "Fellow Ode Brew Grinder (Gen 2)", brand: "Fellow", seller: "Fellow", category: "Kitchen", rating: 4.5, reviews: 2804, usd: 345, prices: { USD: 345, GBP: 315, EUR: 349, CAD: 450 }, recordedAt: "2026-11-07T11:05:00Z", keywords: ["grinder", "coffee", "fellow"] }),
    product({ asin: "B0INSTPOT6", title: "Instant Pot Duo 6-quart", brand: "Instant Pot", seller: "Instant Brands", category: "Kitchen", rating: 4.6, reviews: 71020, usd: 89.99, prices: { USD: 89.99, GBP: 79.99, EUR: 99, CAD: 119.99, AUD: 149 }, recordedAt: "2026-11-04T12:30:00Z", keywords: ["instant pot", "pressure cooker"] }),
    product({ asin: "B0ULTRABO5", title: "adidas Ultraboost 5, size 9", brand: "adidas", seller: "adidas", category: "Apparel", rating: 4.4, reviews: 1888, usd: 190, prices: { USD: 190, GBP: 160, EUR: 180, CAD: 230, AUD: 280, INR: 16999 }, recordedAt: "2026-11-08T16:40:00Z", keywords: ["running shoes", "adidas", "ultraboost"] }),
    product({ asin: "B0CANONR50", title: "Canon EOS R50 Body", brand: "Canon", seller: "Canon", category: "Electronics", rating: 4.6, reviews: 990, usd: 679, prices: { USD: 679, GBP: 649, EUR: 729, CAD: 899, JPY: 99800, AUD: 1099 }, recordedAt: "2026-11-09T06:15:00Z", keywords: ["camera", "canon", "mirrorless"] }),
    product({ asin: "B0MUJIBOXL", title: "MUJI Polypropylene Storage, Large", brand: "MUJI", seller: "MUJI", category: "Home", rating: 4.5, reviews: 760, usd: 19.9, prices: { USD: 19.9, GBP: 14, EUR: 16, JPY: 1290 }, recordedAt: "2026-11-02T19:10:00Z", keywords: ["storage", "muji", "box"] }),
  ];

  var WALMART = [
    { itemId: "552918334", title: "Mainstays 8-Cube Organizer Shelf", brand: "Mainstays", seller: "Walmart.com", category: "Home", rating: 4.3, reviews: 4201, usd: 79, keywords: ["shelf", "organizer", "cube"] },
    { itemId: "441209887", title: "Hyper Tough 20V Drill Driver Kit", brand: "Hyper Tough", seller: "Walmart.com", category: "Outdoors", rating: 4.2, reviews: 2104, usd: 59, keywords: ["drill", "tool", "hyper tough"] },
    { itemId: "238811094", title: "Ozark Trail 4-Person Dome Tent", brand: "Ozark Trail", seller: "Walmart.com", category: "Outdoors", rating: 4.1, reviews: 5600, usd: 78, keywords: ["tent", "camping", "ozark"] },
    { itemId: "907552441", title: "onn. 50-Inch 4K Smart TV", brand: "onn.", seller: "Walmart.com", category: "Electronics", rating: 4.4, reviews: 9800, usd: 228, keywords: ["tv", "4k", "onn"] },
    { itemId: "615330278", title: "Better Homes & Gardens Quilt Set, Queen", brand: "Better Homes & Gardens", seller: "Walmart.com", category: "Home", rating: 4.5, reviews: 1330, usd: 49.96, keywords: ["quilt", "bedding"] },
    { itemId: "773201554", title: "Mainstays Banker's Desk Lamp, Brass", brand: "Mainstays", seller: "Walmart.com", category: "Home", rating: 4.4, reviews: 870, usd: 24.96, keywords: ["desk lamp", "lamp"] },
  ];

  var SEED_TAGS = [
    { id: "northline-20", network: "amazon", label: "House · US", countries: ["US", "CA", "MX", "BR"], onelink: true, source: "import" },
    { id: "northline-21", network: "amazon", label: "House · EU/UK/IN", countries: ["UK", "DE", "FR", "IT", "ES", "NL", "SE", "PL", "IN", "AE", "SA"], onelink: false, source: "import" },
    { id: "northline-22", network: "amazon", label: "House · APAC", countries: ["JP", "AU", "SG"], onelink: false, source: "import" },
    { id: "nlsocial-20", network: "amazon", label: "Social · US", countries: ["US"], onelink: true, source: "import" },
    { id: "nlvideo-20", network: "amazon", label: "Video · US", countries: ["US"], onelink: false, source: "import" },
    { id: "walmart-house", network: "walmart", label: "Walmart Impact", countries: ["US"], onelink: false, partner: "northline", adId: "565706", source: "import" },
  ];

  var SEED_USERS = [
    { id: "u_jonah", name: "Jonah Adeyemi", email: "admin@northline.test", role: "admin", status: "active", lastSeenMin: 26, slug: "jonah", title: "Owner" },
    { id: "u_mara", name: "Mara Chen", email: "mara.chen@northline.test", role: "affiliate", status: "active", lastSeenMin: 8, slug: "mara", title: "Affiliate", weights: { US: 0.58, UK: 0.18, DE: 0.1, CA: 0.09, AU: 0.05 }, profile: { clicks: 260, conv: 0.034, viewMult: 4.4 }, sites: [
      { host: "fieldnotes.example", share: 0.68 },
      { host: "quiettools.example", share: 0.32 },
    ] },
    { id: "u_owen", name: "Owen Park", email: "owen.park@northline.test", role: "affiliate", status: "active", lastSeenMin: 54, slug: "owen", title: "Affiliate", weights: { US: 0.34, DE: 0.41, JP: 0.25 }, profile: { clicks: 140, conv: 0.028, viewMult: 3.8 }, sites: [{ host: "kitcheck.example", share: 1 }] },
    { id: "u_priya", name: "Priya Nair", email: "priya.nair@northline.test", role: "affiliate", status: "active", lastSeenMin: 15, slug: "priya", title: "Affiliate", weights: { IN: 0.72, US: 0.28 }, profile: { clicks: 420, conv: 0.021, viewMult: 5.1 }, sites: [{ host: "desklist.example", share: 1 }] },
    { id: "u_elise", name: "Elise Moreau", email: "elise.moreau@northline.test", role: "affiliate", status: "active", lastSeenMin: 180, slug: "elise", title: "Affiliate", weights: { FR: 0.4, DE: 0.25, ES: 0.2, IT: 0.15 }, profile: { clicks: 90, conv: 0.038, viewMult: 4.1 }, sites: [{ host: "atelierlist.example", share: 1 }] },
    { id: "u_kenji", name: "Kenji Sato", email: "kenji.sato@northline.test", role: "affiliate", status: "active", lastSeenMin: 400, slug: "kenji", title: "Affiliate", weights: { JP: 1 }, profile: { clicks: 60, conv: 0.041, viewMult: 3.4 }, sites: [{ host: "kitenote.example", share: 1 }] },
    { id: "u_amelia", name: "Amelia Brooks", email: "amelia.brooks@northline.test", role: "analyst", status: "active", lastSeenMin: 95, slug: "amelia", title: "Analyst", weights: { US: 1 }, profile: { clicks: 36, conv: 0.03, viewMult: 3.2 }, sites: [{ host: "marginnotes.example", share: 1 }] },
    { id: "u_samir", name: "Samir Haddad", email: "samir.haddad@northline.test", role: "affiliate", status: "active", lastSeenMin: 2400, slug: "samir", title: "Affiliate", weights: { AE: 0.55, US: 0.45 }, profile: { clicks: 70, conv: 0.031, viewMult: 3.6 }, sites: [{ host: "gulfdesk.example", share: 1 }] },
    { id: "u_hannah", name: "Hannah Vogel", email: "hannah.vogel@northline.test", role: "affiliate", status: "suspended", lastSeenMin: 18600, slug: "hannah", title: "Affiliate", weights: { US: 0.7, UK: 0.3 }, profile: { clicks: 80, conv: 0.033, viewMult: 4 }, sites: [{ host: "hannalists.example", share: 1 }] },
    { id: "u_luis", name: "Luis Ortega", email: "luis.ortega@northline.test", role: "affiliate", status: "pending", lastSeenMin: null, slug: "luis", title: "Affiliate" },
  ];

  var SEED_ASSIGNMENTS = [
    { userId: "u_jonah", tagId: "northline-20", isDefault: true },
    { userId: "u_jonah", tagId: "northline-21", isDefault: true },
    { userId: "u_jonah", tagId: "northline-22", isDefault: true },
    { userId: "u_jonah", tagId: "nlsocial-20", isDefault: false },
    { userId: "u_jonah", tagId: "nlvideo-20", isDefault: false },
    { userId: "u_jonah", tagId: "walmart-house", isDefault: true },
    { userId: "u_mara", tagId: "northline-20", isDefault: true },
    { userId: "u_mara", tagId: "northline-21", isDefault: true },
    { userId: "u_mara", tagId: "northline-22", isDefault: true },
    { userId: "u_mara", tagId: "nlsocial-20", isDefault: false },
    { userId: "u_mara", tagId: "walmart-house", isDefault: true },
    { userId: "u_owen", tagId: "northline-20", isDefault: true },
    { userId: "u_owen", tagId: "northline-21", isDefault: true },
    { userId: "u_owen", tagId: "northline-22", isDefault: true },
    { userId: "u_owen", tagId: "walmart-house", isDefault: true },
    { userId: "u_priya", tagId: "northline-21", isDefault: true },
    { userId: "u_priya", tagId: "northline-20", isDefault: true },
    { userId: "u_priya", tagId: "walmart-house", isDefault: true },
    { userId: "u_elise", tagId: "northline-21", isDefault: true },
    { userId: "u_kenji", tagId: "northline-22", isDefault: true },
    { userId: "u_amelia", tagId: "northline-20", isDefault: true },
    { userId: "u_samir", tagId: "northline-20", isDefault: true },
    { userId: "u_samir", tagId: "northline-21", isDefault: true },
    { userId: "u_hannah", tagId: "northline-20", isDefault: true },
    { userId: "u_hannah", tagId: "northline-21", isDefault: true },
  ];

  var SEO_COPY = {
    "fieldnotes.example": {
      keywords: [["best 140w power bank", 0.22], ["anker 737 review", 0.16], ["le creuset 5.5 quart", 0.12], ["quiet mechanical keyboard", 0.1], ["kindle paperwhite review", 0.09], ["yeti rambler leak", 0.07]],
      pages: [["/reviews/anker-737", 0.28], ["/reviews/le-creuset-55", 0.18], ["/desk/keyboard", 0.16], ["/kitchen/grinder", 0.14], ["/", 0.24]],
    },
    "quiettools.example": {
      keywords: [["desk lamp for small rooms", 0.24], ["bose quietcomfort ultra review", 0.18], ["keychron q1 pro vs q1", 0.14], ["sony wh-1000xm5 case", 0.12], ["usb-c cable 240w", 0.1]],
      pages: [["/lamp", 0.3], ["/audio/bose-ultra", 0.22], ["/keys/q1-pro", 0.2], ["/", 0.28]],
    },
    "kitcheck.example": {
      keywords: [["dyson v15 detect review", 0.2], ["sony headphones comparison", 0.16], ["breville barista express", 0.14], ["samsung 990 evo 2tb", 0.12], ["instant pot duo size", 0.1]],
      pages: [["/vacuum/v15", 0.26], ["/audio/xm5", 0.2], ["/coffee/barista", 0.18], ["/", 0.36]],
    },
    "desklist.example": {
      keywords: [["best power bank india", 0.2], ["kindle paperwhite price", 0.16], ["nike pegasus 41 review", 0.12], ["ssd for laptop", 0.1], ["airpods pro 2 review", 0.1]],
      pages: [["/power", 0.24], ["/reads/kindle", 0.2], ["/run/pegasus", 0.16], ["/", 0.4]],
    },
    "atelierlist.example": {
      keywords: [["le creuset cocotte 5.5", 0.18], ["fellow ode gen 2", 0.14], ["dutch oven induction", 0.12], ["lodge skillet seasoning", 0.1], ["brooklinen sheets", 0.1]],
      pages: [["/cuisine/cocotte", 0.26], ["/cafe/ode", 0.18], ["/linge", 0.16], ["/", 0.4]],
    },
    "kitenote.example": {
      keywords: [["wh-1000xm5 レビュー", 0.2], ["kindle paperwhite", 0.16], ["keychron 日本語配列", 0.12], ["anker 737", 0.1]],
      pages: [["/audio/xm5", 0.3], ["/read/kindle", 0.22], ["/", 0.48]],
    },
    "marginnotes.example": {
      keywords: [["anker 737 teardown", 0.2], ["affiliate link disclosure example", 0.14], ["paperwhite notes", 0.12]],
      pages: [["/notes/737", 0.34], ["/notes/disclosure", 0.22], ["/", 0.44]],
    },
    "gulfdesk.example": {
      keywords: [["yeti rambler uae", 0.16], ["dyson v15 dubai", 0.14], ["stanley quencher 40", 0.12], ["airpods pro 2", 0.12]],
      pages: [["/bottle", 0.28], ["/vacuum", 0.22], ["/", 0.5]],
    },
    "hannalists.example": {
      keywords: [["patagonia better sweater", 0.18], ["nike pegasus review", 0.14], ["brooklinen luxe core", 0.12]],
      pages: [["/wear/sweater", 0.3], ["/run", 0.22], ["/", 0.48]],
    },
  };

  function hashString(value) {
    var h = 2166136261;
    var str = String(value);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function isoDaysAgo(n) {
    var now = new Date();
    var d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function ageDays(iso) {
    var now = new Date();
    var today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    var parts = iso.split("-").map(Number);
    var then = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    return Math.round((today - then) / 86400000);
  }

  function allocate(total, weights) {
    var keys = Object.keys(weights);
    var sum = keys.reduce(function (acc, key) { return acc + weights[key]; }, 0) || 1;
    var out = {};
    var used = 0;
    keys.forEach(function (key, index) {
      if (index === keys.length - 1) out[key] = Math.max(0, total - used);
      else {
        var n = Math.floor((total * weights[key]) / sum);
        out[key] = n;
        used += n;
      }
    });
    return out;
  }

  function tagFor(userId, country) {
    var rows = SEED_ASSIGNMENTS.filter(function (row) { return row.userId === userId; });
    var tags = rows.map(function (row) {
      var tag = SEED_TAGS.find(function (item) { return item.id === row.tagId; });
      return tag && tag.network === "amazon" && tag.countries.indexOf(country) !== -1
        ? { id: tag.id, isDefault: row.isDefault }
        : null;
    }).filter(Boolean);
    if (!tags.length) return null;
    var preferred = tags.find(function (tag) { return tag.isDefault; }) || tags[0];
    var alt = tags.find(function (tag) { return tag.id !== preferred.id; });
    return { preferred: preferred.id, alt: alt ? alt.id : null };
  }

  var cache = {};

  function buildUser(user) {
    if (cache[user.id]) return cache[user.id];
    if (!user.profile || !user.weights) {
      cache[user.id] = { days: [], orders: [] };
      return cache[user.id];
    }
    var days = [];
    var orders = [];
    for (var ago = 179; ago >= 0; ago--) {
      var date = isoDaysAgo(ago);
      var rng = mulberry32(hashString(user.id + "|" + date));
      var dow = new Date(date + "T00:00:00Z").getUTCDay();
      var weekend = dow === 0 || dow === 6;
      var clicks = Math.round(user.profile.clicks * (weekend ? 0.64 : 1) * (0.86 + rng() * 0.28));
      if (ago === 0) clicks = Math.round(clicks * 0.5);
      var views = Math.round(clicks * user.profile.viewMult * (0.92 + rng() * 0.16));
      var nOrders = Math.max(0, Math.round(clicks * user.profile.conv * (0.82 + rng() * 0.36)));
      if (clicks === 0) nOrders = 0;
      var byCountryClicks = allocate(clicks, user.weights);
      var countries = {};
      var tags = {};
      Object.keys(byCountryClicks).forEach(function (code) {
        countries[code] = { clicks: byCountryClicks[code], orders: 0, earnings: 0 };
        var mapping = tagFor(user.id, code);
        if (!mapping) return;
        var altClicks = mapping.alt && code === "US" ? Math.round(byCountryClicks[code] * 0.12) : 0;
        var mainClicks = byCountryClicks[code] - altClicks;
        tags[mapping.preferred] = tags[mapping.preferred] || { clicks: 0, orders: 0, earnings: 0 };
        tags[mapping.preferred].clicks += mainClicks;
        if (altClicks) {
          tags[mapping.alt] = tags[mapping.alt] || { clicks: 0, orders: 0, earnings: 0 };
          tags[mapping.alt].clicks += altClicks;
        }
      });
      var earnings = 0;
      for (var i = 0; i < nOrders; i++) {
        var roll = rng();
        var cursor = 0;
        var country = Object.keys(user.weights)[0];
        Object.keys(user.weights).forEach(function (code) {
          cursor += user.weights[code];
          if (roll <= cursor && !country) country = code;
        });
        /* weighted pick */
        var pick = rng();
        var acc = 0;
        country = Object.keys(user.weights)[0];
        Object.keys(user.weights).some(function (code) {
          acc += user.weights[code];
          if (pick <= acc) { country = code; return true; }
          return false;
        });
        var item = PRODUCTS[Math.floor(rng() * PRODUCTS.length)];
        var rate = CATEGORY_RATES[item.category] || 0.04;
        var qty = rng() < 0.08 ? 2 : 1;
        var returned = rng() < 0.06;
        var age = ageDays(date);
        var status = returned ? "returned" : age > 60 ? "cleared" : "pending";
        var commission = status === "returned" ? 0 : +(item.usd * rate * qty).toFixed(2);
        var mapping = tagFor(user.id, country);
        var tagId = mapping ? mapping.preferred : "northline-20";
        if (mapping && mapping.alt && country === "US" && i % 8 === 0) tagId = mapping.alt;
        var hour = String(8 + Math.floor(rng() * 12)).padStart(2, "0");
        var minute = String(Math.floor(rng() * 60)).padStart(2, "0");
        orders.push({
          id: "o_" + user.id + "_" + date + "_" + i,
          userId: user.id,
          date: date,
          at: date + "T" + hour + ":" + minute + ":00Z",
          title: item.title,
          asin: item.asin,
          category: item.category,
          country: country,
          tag: tagId,
          qty: qty,
          price: item.usd,
          rate: rate,
          commission: commission,
          status: status,
          network: "amazon",
        });
        earnings += commission;
        if (!countries[country]) countries[country] = { clicks: 0, orders: 0, earnings: 0 };
        countries[country].orders += 1;
        countries[country].earnings += commission;
        if (!tags[tagId]) tags[tagId] = { clicks: 0, orders: 0, earnings: 0 };
        tags[tagId].orders += 1;
        tags[tagId].earnings += commission;
      }
      days.push({
        date: date,
        clicks: clicks,
        views: views,
        orders: nOrders,
        earnings: +earnings.toFixed(2),
        countries: countries,
        tags: tags,
      });
    }
    cache[user.id] = { days: days, orders: orders };
    return cache[user.id];
  }

  function seedUser(id) {
    return SEED_USERS.find(function (user) { return user.id === id; }) || null;
  }

  function windowOf(id, days) {
    var built = buildUser(seedUser(id) || { id: id });
    var cur = built.days.slice(-days);
    var prev = built.days.slice(-2 * days, -days);
    return { cur: cur, prev: prev, orders: built.orders };
  }

  function sumDays(rows) {
    return rows.reduce(function (acc, row) {
      acc.clicks += row.clicks;
      acc.views += row.views;
      acc.orders += row.orders;
      acc.earnings += row.earnings;
      return acc;
    }, { clicks: 0, views: 0, orders: 0, earnings: 0 });
  }

  function withConv(row) {
    row.earnings = +row.earnings.toFixed(2);
    row.conv = row.clicks ? row.orders / row.clicks : 0;
    return row;
  }

  function delta(cur, prev) {
    if (!prev) return null;
    return (cur - prev) / prev;
  }

  function summary(userId, days) {
    var pack = windowOf(userId, days);
    var cur = withConv(sumDays(pack.cur));
    var prev = withConv(sumDays(pack.prev));
    return {
      days: days,
      clicks: cur.clicks,
      views: cur.views,
      orders: cur.orders,
      earnings: cur.earnings,
      conv: cur.conv,
      prev: prev,
      dClicks: delta(cur.clicks, prev.clicks),
      dViews: delta(cur.views, prev.views),
      dOrders: delta(cur.orders, prev.orders),
      dEarnings: delta(cur.earnings, prev.earnings),
      dConvPp: (cur.conv - prev.conv) * 100,
      series: pack.cur.map(function (row) {
        return { date: row.date, clicks: row.clicks, views: row.views, orders: row.orders, earnings: row.earnings };
      }),
    };
  }

  function foldMap(rows, key) {
    var out = {};
    rows.forEach(function (row) {
      var bucket = row[key] || {};
      Object.keys(bucket).forEach(function (name) {
        out[name] = out[name] || { clicks: 0, orders: 0, earnings: 0 };
        out[name].clicks += bucket[name].clicks || 0;
        out[name].orders += bucket[name].orders || 0;
        out[name].earnings += bucket[name].earnings || 0;
      });
    });
    Object.keys(out).forEach(function (name) {
      out[name].earnings = +out[name].earnings.toFixed(2);
      out[name].conv = out[name].clicks ? out[name].orders / out[name].clicks : 0;
    });
    return out;
  }

  function byCountry(userId, days) {
    return foldMap(windowOf(userId, days).cur, "countries");
  }

function byTag(userId, days) {
  return foldMap(windowOf(userId, days).cur, "tags");
}

function tagSpark(userId, tagId, days) {
  return windowOf(userId, days).cur.map(function (row) {
    return row.tags[tagId] ? row.tags[tagId].clicks : 0;
  });
}

  function ordersFor(userId, days) {
    var start = isoDaysAgo(days - 1);
    return windowOf(userId, days).orders.filter(function (order) {
      return order.date >= start;
    }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  }

  function house(days) {
    var ids = SEED_USERS.filter(function (user) { return user.profile; }).map(function (user) { return user.id; });
    var blank = { clicks: 0, views: 0, orders: 0, earnings: 0, conv: 0, dClicks: 0, dOrders: 0, dEarnings: 0, dConvPp: 0, series: [] };
    var seriesMap = {};
    ids.forEach(function (id) {
      var row = summary(id, days);
      blank.clicks += row.clicks;
      blank.views += row.views;
      blank.orders += row.orders;
      blank.earnings += row.earnings;
      blank.prevClicks = (blank.prevClicks || 0) + row.prev.clicks;
      blank.prevOrders = (blank.prevOrders || 0) + row.prev.orders;
      blank.prevEarnings = (blank.prevEarnings || 0) + row.prev.earnings;
      blank.prevConvClicks = (blank.prevConvClicks || 0) + row.prev.clicks;
      blank.prevConvOrders = (blank.prevConvOrders || 0) + row.prev.orders;
      row.series.forEach(function (point) {
        seriesMap[point.date] = seriesMap[point.date] || { date: point.date, clicks: 0, views: 0, orders: 0, earnings: 0 };
        seriesMap[point.date].clicks += point.clicks;
        seriesMap[point.date].views += point.views;
        seriesMap[point.date].orders += point.orders;
        seriesMap[point.date].earnings += point.earnings;
      });
    });
    blank.earnings = +blank.earnings.toFixed(2);
    blank.conv = blank.clicks ? blank.orders / blank.clicks : 0;
    blank.dClicks = delta(blank.clicks, blank.prevClicks || 0);
    blank.dOrders = delta(blank.orders, blank.prevOrders || 0);
    blank.dEarnings = delta(blank.earnings, blank.prevEarnings || 0);
    var prevConv = blank.prevClicks ? blank.prevOrders / blank.prevClicks : 0;
    blank.dConvPp = (blank.conv - prevConv) * 100;
    blank.days = days;
    blank.series = Object.keys(seriesMap).sort().map(function (date) { return seriesMap[date]; });
    blank.activeAffiliates = SEED_USERS.filter(function (user) { return user.role !== "admin" && user.status === "active"; }).length;
    return blank;
  }

  function houseCountry(days) {
    var out = {};
    SEED_USERS.forEach(function (user) {
      if (!user.profile) return;
      var part = byCountry(user.id, days);
      Object.keys(part).forEach(function (code) {
        out[code] = out[code] || { clicks: 0, orders: 0, earnings: 0 };
        out[code].clicks += part[code].clicks;
        out[code].orders += part[code].orders;
        out[code].earnings += part[code].earnings;
      });
    });
    return out;
  }

  function userRows(days) {
    return SEED_USERS.filter(function (user) { return user.role !== "admin"; }).map(function (user) {
      var row = user.profile ? summary(user.id, days) : { clicks: 0, views: 0, orders: 0, earnings: 0, conv: 0 };
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        clicks: row.clicks,
        orders: row.orders,
        earnings: row.earnings,
        conv: row.conv,
      };
    });
  }

  function importStamp() {
    var iso = isoDaysAgo(0) + "T06:10:00Z";
    return iso;
  }

  function productByAsin(asin) {
    return PRODUCTS.find(function (item) { return item.asin === asin; }) || null;
  }

  function productByWalmart(id) {
    return WALMART.find(function (item) { return item.itemId === id; }) || null;
  }

  function searchProducts(query, network) {
    var q = String(query || "").trim().toLowerCase();
    var rows = [];
    function score(item, fields) {
      if (!q) return 1;
      var best = 0;
      fields.forEach(function (field) {
        var value = String(field || "").toLowerCase();
        if (!value) return;
        if (value === q) best = Math.max(best, 100);
        else if (value.indexOf(q) === 0) best = Math.max(best, 80);
        else if (value.indexOf(q) !== -1) best = Math.max(best, 50);
      });
      (item.keywords || []).forEach(function (word) {
        if (word.indexOf(q) !== -1) best = Math.max(best, 60);
      });
      return best;
    }
    if (network !== "walmart") {
      PRODUCTS.forEach(function (item) {
        var s = score(item, [item.title, item.brand, item.asin, item.category, item.seller]);
        if (s) rows.push(Object.assign({ network: "amazon", score: s }, item));
      });
    }
    if (network !== "amazon") {
      WALMART.forEach(function (item) {
        var s = score(item, [item.title, item.brand, item.itemId, item.category, item.seller]);
        if (s) rows.push(Object.assign({ network: "walmart", score: s }, item));
      });
    }
    return rows;
  }

  function searchSellers(query) {
    var q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter(function (item) {
      return item.seller.toLowerCase().indexOf(q) !== -1;
    }).map(function (item) { return Object.assign({ network: "amazon", score: 1 }, item); });
  }

  function seo(userId, days) {
    var user = seedUser(userId);
    var sum = summary(userId, days);
    var sites = (user && user.sites) || [];
    return {
      views: sum.views,
      engines: [
        { name: "Google", share: 0.78 },
        { name: "Bing", share: 0.13 },
        { name: "DuckDuckGo", share: 0.06 },
        { name: "Yahoo", share: 0.03 },
      ],
      sites: sites.map(function (site) {
        var copy = SEO_COPY[site.host] || { keywords: [], pages: [] };
        var siteViews = Math.round(sum.views * site.share);
        var searchViews = Math.round(siteViews * 0.64);
        var provided = Math.round(searchViews * 0.62);
        return {
          host: site.host,
          views: siteViews,
          searchViews: searchViews,
          direct: Math.round(siteViews * 0.22),
          email: Math.round(siteViews * 0.09),
          other: siteViews - searchViews - Math.round(siteViews * 0.22) - Math.round(siteViews * 0.09),
          keywords: copy.keywords.map(function (pair) {
            return { term: pair[0], visits: Math.round(provided * pair[1]) };
          }).concat([{ term: "(not provided)", visits: searchViews - provided }]),
          pages: copy.pages.map(function (pair) {
            return { path: pair[1] && pair[0], visits: Math.round(siteViews * pair[1]) };
          }),
        };
      }),
    };
  }

  function activity(userId) {
    var recentOrders = ordersFor(userId, 14).slice(0, 12);
    var links = seedLinks().filter(function (link) { return link.userId === userId; }).slice(0, 6);
    var events = [];
    recentOrders.forEach(function (order) {
      events.push({
        at: order.at,
        type: "order",
        title: order.status === "returned" ? "Returned order" : "Reported order",
        detail: order.title,
        meta: order.country + " · " + order.tag,
      });
    });
    links.forEach(function (link) {
      events.push({
        at: link.createdAt,
        type: "link",
        title: "Link created",
        detail: link.title,
        meta: link.country + " · " + link.tag,
      });
    });
    var user = seedUser(userId);
    var hosts = (user && user.sites || [{ host: "direct" }]).map(function (site) { return site.host; });
    for (var i = 0; i < 10; i++) {
      var date = isoDaysAgo(i < 5 ? 0 : 1);
      var rng = mulberry32(hashString("act|" + userId + "|" + i));
      var hour = String(Math.floor(rng() * 22)).padStart(2, "0");
      var minute = String(Math.floor(rng() * 60)).padStart(2, "0");
      var item = PRODUCTS[Math.floor(rng() * PRODUCTS.length)];
      events.push({
        at: date + "T" + hour + ":" + minute + ":00Z",
        type: i % 3 === 0 ? "view" : "click",
        title: i % 3 === 0 ? "Page view" : "Outbound click",
        detail: i % 3 === 0 ? hosts[0] + "/reviews" : item.title,
        meta: i % 3 === 0 ? "Search" : "amazon.com",
      });
    }
    return events.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  }

  function seedLinks() {
    var specs = [
      ["u_mara", "B0C8N4K2QW", "US", "northline-20", 2, 1284, 41],
      ["u_mara", "B0LC55QTFL", "US", "northline-20", 4, 862, 22],
      ["u_mara", "B0KEYQ1PRO", "US", "nlsocial-20", 6, 640, 11],
      ["u_mara", "B0SNYWHXM5", "UK", "northline-21", 9, 417, 9],
      ["u_mara", "B0BARISTA1", "DE", "northline-21", 12, 388, 7],
      ["u_mara", "B0YETI26OZ", "US", "northline-20", 15, 251, 4],
      ["u_mara", "B0KINDLEPW", "CA", "northline-20", 18, 196, 3],
      ["u_mara", "552918334", "US", "walmart-house", 3, 142, 2, "walmart"],
      ["u_mara", "B0BOSEULTR", "AU", "northline-22", 21, 88, 1],
      ["u_mara", "B0FELLOWOD", "US", "northline-20", 25, 47, 0],
      ["u_owen", "B0DYSONV15", "DE", "northline-21", 5, 510, 14],
      ["u_owen", "B0SS990EV2", "US", "northline-20", 8, 266, 6],
      ["u_priya", "B0KINDLEPW", "IN", "northline-21", 1, 980, 19],
      ["u_priya", "B0NIKEPEG4", "IN", "northline-21", 7, 430, 8],
      ["u_elise", "B0LC55QTFL", "FR", "northline-21", 11, 188, 5],
      ["u_kenji", "B0SNYWHXM5", "JP", "northline-22", 6, 144, 4],
      ["u_samir", "B0DYSONV15", "AE", "northline-21", 14, 96, 2],
      ["u_amelia", "B0C8N4K2QW", "US", "northline-20", 20, 54, 1],
      ["u_hannah", "B0PTAGSWTR", "US", "northline-20", 40, 210, 6],
    ];
    return specs.map(function (spec, index) {
      var network = spec[7] || "amazon";
      var created = new Date(isoDaysAgo(spec[4]) + "T15:04:00Z");
      created.setUTCHours(10 + (index % 8));
      var title = network === "walmart"
        ? (productByWalmart(spec[1]) || {}).title
        : (productByAsin(spec[1]) || {}).title;
      var market = root.NLLinks.marketplace(spec[2]);
      var url = network === "walmart"
        ? root.NLLinks.buildWalmart({ input: spec[1], sharedId: "mara", partner: "northline", adId: "565706" }).url
        : "https://" + market.host + "/dp/" + spec[1] + "?tag=" + spec[3];
      return {
        id: "seed_" + (index + 1),
        userId: spec[0],
        createdAt: created.toISOString(),
        network: network,
        country: spec[2],
        tag: spec[3],
        title: title || spec[1],
        key: spec[1],
        url: url,
        clicks: spec[5],
        orders: spec[6],
      };
    });
  }

  function sellers() {
    var map = {};
    PRODUCTS.forEach(function (item) { map[item.seller] = (map[item.seller] || 0) + 1; });
    return Object.keys(map).sort().map(function (name) { return { name: name, count: map[name] }; });
  }

  root.NLData = {
    SEED_USERS: SEED_USERS,
    SEED_TAGS: SEED_TAGS,
    SEED_ASSIGNMENTS: SEED_ASSIGNMENTS,
    PRODUCTS: PRODUCTS,
    WALMART: WALMART,
    CATEGORY_RATES: CATEGORY_RATES,
    summary: summary,
    byCountry: byCountry,
    byTag: byTag,
    tagSpark: tagSpark,
    ordersFor: ordersFor,
    house: house,
    houseCountry: houseCountry,
    userRows: userRows,
    importStamp: importStamp,
    productByAsin: productByAsin,
    productByWalmart: productByWalmart,
    searchProducts: searchProducts,
    searchSellers: searchSellers,
    seo: seo,
    activity: activity,
    seedLinks: seedLinks,
    sellers: sellers,
    isoDaysAgo: isoDaysAgo,
  };
})(typeof window !== "undefined" ? window : globalThis);
