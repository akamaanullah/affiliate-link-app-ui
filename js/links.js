/* Amazon and Walmart URL builders.
   Affiliate links stay on the merchant host. Shorteners are rejected. */
(function (root) {
  "use strict";

  var MARKETPLACES = [
    { code: "US", name: "United States", host: "www.amazon.com", currency: "USD" },
    { code: "UK", name: "United Kingdom", host: "www.amazon.co.uk", currency: "GBP" },
    { code: "CA", name: "Canada", host: "www.amazon.ca", currency: "CAD" },
    { code: "DE", name: "Germany", host: "www.amazon.de", currency: "EUR" },
    { code: "FR", name: "France", host: "www.amazon.fr", currency: "EUR" },
    { code: "ES", name: "Spain", host: "www.amazon.es", currency: "EUR" },
    { code: "IT", name: "Italy", host: "www.amazon.it", currency: "EUR" },
    { code: "JP", name: "Japan", host: "www.amazon.co.jp", currency: "JPY" },
    { code: "AU", name: "Australia", host: "www.amazon.com.au", currency: "AUD" },
    { code: "IN", name: "India", host: "www.amazon.in", currency: "INR" },
    { code: "MX", name: "Mexico", host: "www.amazon.com.mx", currency: "MXN" },
    { code: "BR", name: "Brazil", host: "www.amazon.com.br", currency: "BRL" },
    { code: "NL", name: "Netherlands", host: "www.amazon.nl", currency: "EUR" },
    { code: "SE", name: "Sweden", host: "www.amazon.se", currency: "SEK" },
    { code: "PL", name: "Poland", host: "www.amazon.pl", currency: "PLN" },
    { code: "SG", name: "Singapore", host: "www.amazon.sg", currency: "SGD" },
    { code: "AE", name: "United Arab Emirates", host: "www.amazon.ae", currency: "AED" },
    { code: "SA", name: "Saudi Arabia", host: "www.amazon.sa", currency: "SAR" },
  ];

  var SHORTENERS = {
    "amzn.to": "amazon",
    "a.co": "amazon",
    "amzn.eu": "amazon",
    "amzn.asia": "amazon",
    "bit.ly": "generic",
    "tinyurl.com": "generic",
    "t.co": "generic",
    "goo.gl": "generic",
    "buff.ly": "generic",
    "ow.ly": "generic",
    "is.gd": "generic",
    "cutt.ly": "generic",
    "rebrand.ly": "generic",
    "tiny.cc": "generic",
    "shorturl.at": "generic",
  };

  var INCENTIVE = [
    /support me/i,
    /click to help/i,
    /if you click/i,
    /free if/i,
    /giveaway/i,
    /enter to win/i,
    /cash\s*back/i,
    /i earn when/i,
    /commission if/i,
    /reward if you/i,
  ];

  function marketplace(code) {
    return MARKETPLACES.find(function (m) { return m.code === code; }) || null;
  }

  function bareHost(host) {
    return String(host || "").toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  }

  function marketplaceFromHost(host) {
    var bare = bareHost(String(host || "").replace(/^smile\./, "www."));
    return MARKETPLACES.find(function (m) { return bareHost(m.host) === bare; }) || null;
  }

  function looksLikeAsin(value) {
    return /^[A-Z0-9]{10}$/.test(value);
  }

  function extractAsin(input) {
    var raw = String(input || "").trim();
    if (looksLikeAsin(raw.toUpperCase()) && !raw.includes("/") && !raw.includes(".")) {
      return raw.toUpperCase();
    }
    var patterns = [
      /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/gp\/offer-listing\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    ];
    for (var i = 0; i < patterns.length; i++) {
      var match = raw.match(patterns[i]);
      if (match) return match[1].toUpperCase();
    }
    try {
      var url = new URL(raw);
      var q = url.searchParams.get("asin") || url.searchParams.get("ASIN");
      if (q && looksLikeAsin(q.toUpperCase())) return q.toUpperCase();
    } catch (err) {
      /* not a URL */
    }
    return null;
  }

  function extractWalmartId(pathname) {
    var match = String(pathname || "").match(/\/ip\/(?:[^/]+\/)?(\d{5,12})/);
    return match ? match[1] : null;
  }

  function fail(error, extra) {
    var out = { ok: false, error: error, notes: [] };
    if (extra) {
      Object.keys(extra).forEach(function (key) { out[key] = extra[key]; });
    }
    return out;
  }

  function buildAmazon(opts) {
    var input = String(opts.input || "").trim();
    var country = opts.country || "US";
    var tag = opts.tag || "";
    if (!input) return fail("Paste a product URL or a 10-character ASIN.");

    var suggestCountry = null;
    var pastedTag = null;
    var notes = [];

    if (/^https?:\/\//i.test(input)) {
      var url;
      try { url = new URL(input); } catch (err) { return fail("That does not look like a full URL."); }
      var host = bareHost(url.hostname);
      if (SHORTENERS[host] === "amazon") {
        return fail("Amazon short links (amzn.to, a.co) hide the destination. Paste the full product URL or the ASIN. This desk does not create or unwrap short links.");
      }
      if (SHORTENERS[host]) {
        return fail("Short links are not accepted. Paste the full Amazon product URL so the destination stays visible.");
      }
      var detected = marketplaceFromHost(url.hostname);
      if (!detected) return fail("That host is not an Amazon marketplace this desk supports.");
      suggestCountry = detected.code;
      pastedTag = url.searchParams.get("tag");
      var asinFromUrl = extractAsin(url.pathname + url.search) || extractAsin(input);
      if (!asinFromUrl) {
        return fail("No ASIN found in that URL. Open the product page and copy the address again, or paste the 10-character ASIN.", { suggestCountry: suggestCountry });
      }
      input = asinFromUrl;
    }

    var asin = extractAsin(input);
    if (!asin) return fail("Enter a 10-character ASIN, such as B0C8N4K2QW, or a full amazon product URL.");

    var market = marketplace(country);
    if (!market) return fail("Choose a marketplace.");
    if (suggestCountry && suggestCountry !== country) {
      notes.push("Marketplace set from the pasted URL.");
    }
    var plain = "https://" + market.host + "/dp/" + asin;
    if (!tag) {
      return fail("No tracking ID is assigned to you for " + market.name + ". Ask an administrator.", {
        asin: asin,
        country: country,
        host: market.host,
        plain: plain,
        suggestCountry: suggestCountry,
        notes: notes,
      });
    }
    if (pastedTag && pastedTag !== tag) {
      notes.push("Replaced tag “" + pastedTag + "” with the assigned tracking ID " + tag + ".");
    }
    var built = new URL(plain);
    built.searchParams.set("tag", tag);
    return {
      ok: true,
      url: built.toString(),
      asin: asin,
      country: country,
      host: market.host,
      tag: tag,
      pastedTag: pastedTag,
      suggestCountry: suggestCountry,
      notes: notes,
      plain: plain,
    };
  }

  function buildWalmart(opts) {
    var input = String(opts.input || "").trim();
    var sharedId = opts.sharedId || "desk";
    var partner = opts.partner || "northline";
    var adId = opts.adId || "565706";
    if (!input) return fail("Paste a walmart.com product URL or a numeric item id.");
    if (/^\d{5,12}$/.test(input)) {
      return finishWalmart(input, sharedId, partner, adId, []);
    }
    if (!/^https?:\/\//i.test(input)) {
      return fail("Paste a walmart.com product URL or a numeric item id.");
    }
    var url;
    try { url = new URL(input); } catch (err) { return fail("That does not look like a full URL."); }
    var host = bareHost(url.hostname);
    if (SHORTENERS[host]) {
      return fail("Short links are not accepted. Paste the full walmart.com product URL.");
    }
    if (host === "goto.walmart.com") {
      var embedded = url.searchParams.get("u");
      if (!embedded) return fail("That Walmart redirect has no product URL. Paste the walmart.com product page instead.");
      try { embedded = decodeURIComponent(embedded); } catch (err2) { /* keep raw */ }
      var inner = buildWalmart({ input: embedded, sharedId: sharedId, partner: partner, adId: adId });
      if (inner.ok) inner.notes = ["Used the product URL inside a Walmart redirect. The link below stays on walmart.com."].concat(inner.notes || []);
      return inner;
    }
    if (host !== "walmart.com") return fail("Paste a walmart.com product URL. Other hosts are not used.");
    var itemId = extractWalmartId(url.pathname);
    if (!itemId) return fail("No Walmart item id found. Use a URL that contains /ip/ and the numeric id.");
    return finishWalmart(itemId, sharedId, partner, adId, []);
  }

  function finishWalmart(itemId, sharedId, partner, adId, notes) {
    var built = new URL("https://www.walmart.com/ip/" + itemId);
    built.searchParams.set("wmlspartner", partner);
    built.searchParams.set("selectedSellerId", "0");
    built.searchParams.set("veh", "aff");
    built.searchParams.set("affiliates_ad_id", adId);
    built.searchParams.set("sharedid", sharedId);
    return {
      ok: true,
      url: built.toString(),
      itemId: itemId,
      host: "www.walmart.com",
      country: "US",
      partner: partner,
      adId: adId,
      sharedId: sharedId,
      notes: notes,
    };
  }

  function hasIncentive(text) {
    return INCENTIVE.some(function (re) { return re.test(text || ""); });
  }

  function composeShare(opts) {
    var parts = [];
    if (opts.title) parts.push(String(opts.title).trim());
    if (opts.url) parts.push(String(opts.url).trim());
    if (opts.note && String(opts.note).trim()) parts.push(String(opts.note).trim());
    var body = parts.join("\n");
    var tail = [];
    var network = opts.network;
    var disclosures = opts.disclosures || {};
    if ((network === "amazon" || network === "both") && disclosures.amazon && body.indexOf(disclosures.amazon) === -1) {
      tail.push(disclosures.amazon);
    }
    if ((network === "walmart" || network === "both") && disclosures.walmart && body.indexOf(disclosures.walmart) === -1) {
      tail.push(disclosures.walmart);
    }
    if (tail.length) body = (body ? body + "\n\n" : "") + tail.join("\n");
    return body;
  }

  function waLink(text, phone) {
    var digits = String(phone || "").replace(/\D/g, "");
    var base = digits ? "https://wa.me/" + digits : "https://wa.me/";
    var query = new URLSearchParams();
    query.set("text", text);
    return base + "?" + query.toString();
  }

  root.NLLinks = {
    MARKETPLACES: MARKETPLACES,
    marketplace: marketplace,
    marketplaceFromHost: marketplaceFromHost,
    extractAsin: extractAsin,
    buildAmazon: buildAmazon,
    buildWalmart: buildWalmart,
    hasIncentive: hasIncentive,
    composeShare: composeShare,
    waLink: waLink,
  };
})(typeof window !== "undefined" ? window : globalThis);
