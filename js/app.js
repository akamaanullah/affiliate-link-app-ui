(function () {
  "use strict";

  var user = NLStore.currentUser();
  if (!user) {
    location.href = "index.html";
    return;
  }

  var state = {
    range: 30,
    gen: { network: "amazon", input: "", country: "US", tag: "" },
    search: { q: "", country: "US", network: "all", sort: "title", dir: "asc", page: 1 },
    seller: { q: "Anker Direct", country: "US", sort: "title", dir: "asc", page: 1 },
    history: { q: "", network: "all", country: "all", sort: "createdAt", dir: "desc", page: 1 },
    orders: { sort: "at", dir: "desc", page: 1 },
    days: { sort: "date", dir: "desc", page: 1 },
    cats: { sort: "commission", dir: "desc", page: 1 },
    countries: { sort: "earnings", dir: "desc", page: 1 },
    tags: { sort: "earnings", dir: "desc", page: 1 },
    activity: { type: "all" },
    seo: { site: "all" },
    wa: { ready: false, linkId: "", label: "", note: "", url: "", network: "amazon" },
  };
  NLUI.state = state;

  var botThread = null;
  var genSig = "";
  var lastPath = "";

  var NAV = [
    { label: "Overview", items: [{ href: "/dashboard", label: "Overview", icon: "chart" }] },
    { label: "Links", items: [
      { href: "/generate", label: "Generate", icon: "link" },
      { href: "/search", label: "Keywords", icon: "search" },
      { href: "/sellers", label: "Sellers", icon: "box" },
      { href: "/history", label: "History", icon: "clock" },
    ] },
    { label: "Share", items: [
      { href: "/whatsapp", label: "WhatsApp", icon: "message" },
      { href: "/bot", label: "Bot preview", icon: "bot" },
    ] },
    { label: "Measure", items: [
      { href: "/activity", label: "Activity", icon: "activity" },
      { href: "/reports", label: "Orders", icon: "tag" },
      { href: "/countries", label: "Countries", icon: "globe" },
      { href: "/tags", label: "Tracking IDs", icon: "hash" },
      { href: "/seo", label: "SEO", icon: "seo" },
    ] },
  ];

  var TITLES = {
    "/dashboard": "Overview",
    "/generate": "Generate a link",
    "/search": "Keyword search",
    "/sellers": "Seller search",
    "/history": "Link history",
    "/whatsapp": "WhatsApp share",
    "/bot": "Bot preview",
    "/activity": "Activity",
    "/reports": "Orders and earnings",
    "/countries": "Countries",
    "/tags": "Tracking IDs",
    "/seo": "SEO traffic",
  };

  NLUI.shell({
    user: user,
    home: "/dashboard",
    searchPlaceholder: "Search links, products, pages",
    nav: NAV,
    mobile: [
      { href: "/dashboard", label: "Overview", icon: "chart" },
      { href: "/generate", label: "Generate", icon: "link" },
      { href: "/history", label: "History", icon: "clock" },
      { href: "/reports", label: "Orders", icon: "tag" },
      { action: "more", label: "More", icon: "more" },
    ],
    menu: user.role === "admin" ? '<a href="admin.html">' + NLUI.icon("settings") + "Admin</a>" : "",
  });
  NLStore.applyBrand();

  function path() {
    var raw = (location.hash || "#/dashboard").replace(/^#/, "").split("?")[0];
    if (!raw || raw === "/") return "/dashboard";
    return raw.charAt(0) === "/" ? raw : "/" + raw;
  }

  function can(cap) { return NLStore.can(user, cap); }

  function tagsFor(country, network) {
    var assigns = NLStore.getAssignments().filter(function (row) { return row.userId === user.id; });
    return assigns.map(function (row) {
      var tag = NLStore.getTags().find(function (item) { return item.id === row.tagId; });
      if (!tag || tag.network !== network || tag.countries.indexOf(country) === -1) return null;
      return Object.assign({}, tag, { isDefault: !!row.isDefault });
    }).filter(Boolean);
  }

  function pickTag(country, network) {
    var tags = tagsFor(country, network);
    return tags.find(function (tag) { return tag.isDefault; }) || tags[0] || null;
  }

  function assignedTags() {
    var seen = {};
    return NLStore.getAssignments().filter(function (row) { return row.userId === user.id; }).map(function (row) {
      return NLStore.getTags().find(function (tag) { return tag.id === row.tagId; });
    }).filter(function (tag) {
      if (!tag || seen[tag.id]) return false;
      seen[tag.id] = true;
      return true;
    });
  }

  function myLinks() {
    return NLStore.getLinks().filter(function (link) { return link.userId === user.id; });
  }

  function titleFor(network, key) {
    if (network === "walmart") {
      var item = NLData.productByWalmart(key);
      return item ? item.title : "Walmart item " + key;
    }
    var product = NLData.productByAsin(key);
    return product ? product.title : "Amazon product " + key;
  }

  function saveLink(fields) {
    return NLStore.addLink(Object.assign({
      id: "l_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      userId: user.id,
      createdAt: new Date().toISOString(),
      clicks: 0,
      orders: 0,
    }, fields));
  }

  function priceHtml(item, country) {
    if (item.network === "walmart" || item.itemId) {
      if (country !== "US") return '<span class="muted">No US price</span>';
      return NLUI.money(item.usd, "USD") + ' <span class="muted">· ' + NLUI.day(NLData.importStamp()) + "</span>";
    }
    var market = NLLinks.marketplace(country);
    var price = item.prices && market && item.prices[market.currency];
    if (price == null) return '<span class="muted">No sample</span>';
    return NLUI.money(price, market.currency) + ' <span class="muted">· ' + NLUI.day(item.recordedAt) + "</span>";
  }

  function importNote() {
    return "Figures are from the last Associates import · " + NLUI.stamp(NLData.importStamp()) + ". Category rates are samples, not an Amazon fee schedule. Earnings are estimates in USD.";
  }

  function metricBlock(sum, mode) {
    var label = "vs prior " + sum.days + " days";
    if (mode === "activity") {
      return NLUI.metrics([
        { label: "Page views", value: NLUI.num(sum.views), delta: NLUI.fmtDelta(sum.dViews), deltaLabel: label },
        { label: "Outbound clicks", value: NLUI.num(sum.clicks), delta: NLUI.fmtDelta(sum.dClicks), deltaLabel: label },
        { label: "Reported orders", value: NLUI.num(sum.orders), delta: NLUI.fmtDelta(sum.dOrders), deltaLabel: label },
        { label: "Conversion", value: NLUI.pct(sum.conv), delta: NLUI.fmtPp(sum.dConvPp), deltaLabel: label },
      ]);
    }
    return NLUI.metrics([
      { label: "Outbound clicks", value: NLUI.num(sum.clicks), delta: NLUI.fmtDelta(sum.dClicks), deltaLabel: label },
      { label: "Reported orders", value: NLUI.num(sum.orders), delta: NLUI.fmtDelta(sum.dOrders), deltaLabel: label },
      { label: "Est. earnings", value: NLUI.money(sum.earnings), delta: NLUI.fmtDelta(sum.dEarnings), deltaLabel: label },
      { label: "Conversion", value: NLUI.pct(sum.conv), delta: NLUI.fmtPp(sum.dConvPp), deltaLabel: label },
    ]);
  }

  function chartSpec(sum) {
    return {
      label: "Clicks and orders",
      right: true,
      labels: sum.series.map(function (row) { return NLUI.day(row.date); }),
      series: [
        { name: "Clicks", values: sum.series.map(function (row) { return row.clicks; }), colorVar: "--chart-1", swatch: "swatch-a", fill: true, format: NLUI.num },
        { name: "Orders", values: sum.series.map(function (row) { return row.orders; }), axis: "r", colorVar: "--chart-2", swatch: "swatch-b", format: NLUI.num },
      ],
    };
  }

  function legend() {
    return '<div class="legend"><span><i class="swatch swatch-a"></i>Clicks</span><span><i class="swatch swatch-b"></i>Orders, right axis</span></div>';
  }

  function pageDashboard() {
    var sum = NLData.summary(user.id, state.range);
    NLUI.chartSpecs.dash = chartSpec(sum);
    var tags = assignedTags();
    var stats = NLData.byTag(user.id, state.range);
    var tagHtml = tags.length ? tags.map(function (tag) {
      var row = stats[tag.id] || { clicks: 0, orders: 0, earnings: 0 };
      return '<div class="id-row"><div><strong class="mono">' + NLUI.esc(tag.id) + "</strong><div class=\"muted\">" +
        NLUI.esc(tag.label) + " · " + NLUI.esc(tag.countries.join(", ")) +
        (tag.onelink ? " · OneLink on" : "") + "</div></div><div class=\"num\"><strong>" +
        NLUI.money(row.earnings) + '</strong><div class="muted">' + NLUI.num(row.clicks) + " clicks</div></div></div>";
    }).join("") : '<p class="help">No tracking IDs are assigned to this login yet.</p>';
    var recent = myLinks().slice(0, 6);
    var recentTable = recent.length ? '<div class="table-scroll"><table class="data"><thead><tr><th>When</th><th>Product</th><th>Market</th><th>Tag</th><th class="num">Clicks</th></tr></thead><tbody>' +
      recent.map(function (link) {
        return "<tr><td>" + NLUI.day(link.createdAt) + "</td><td><div class=\"cell-title\"><span class=\"truncate\">" + NLUI.esc(link.title) +
          '</span><span class="muted mono">' + NLUI.esc(link.key) + "</span></div></td><td>" + NLUI.esc(link.country) +
          "</td><td class=\"mono\">" + NLUI.esc(link.tag) + "</td><td class=\"num\">" + NLUI.num(link.clicks) + "</td></tr>";
      }).join("") + "</tbody></table></div>" : NLUI.empty("No links yet", "Generate a link and it will show up here.");
    var quiet = !user.profile && sum.clicks === 0
      ? NLUI.notice("This login has no imported affiliate activity. House totals are on the admin overview.")
      : "";
    return NLUI.pageHeader({
      title: "Overview",
      desc: NLUI.esc(user.name.split(" ")[0]) + " · " + NLUI.esc(user.title) + ". Links use the house account, not a personal Associates login.",
      actions: NLUI.rangeControl(state.range),
    }) + quiet + '<p class="help">' + NLUI.esc(importNote()) + "</p>" + metricBlock(sum) + '<div class="dash-grid"><section class="panel"><div class="panel-h"><span>Clicks and orders</span>' + legend() +
      '</div><div class="panel-b"><div id="dash" class="chart" data-chart></div></div></section><section class="panel"><div class="panel-h"><span>Assigned tracking IDs</span></div><div class="panel-b">' +
      tagHtml + "</div></section></div>" +
      '<section class="panel"><div class="panel-h"><span>Recent links</span><a href="#/history">History</a></div>' + recentTable + "</section>";
  }

  function countryOptions(selected, network) {
    var list = network === "walmart"
      ? [{ code: "US", name: "United States", host: "www.walmart.com" }]
      : NLLinks.MARKETPLACES;
    return list.map(function (market) {
      var assigned = tagsFor(market.code, network === "walmart" ? "walmart" : "amazon").length > 0;
      return '<option value="' + market.code + '"' + (market.code === selected ? " selected" : "") + ">" +
        NLUI.esc(market.name) + " · " + NLUI.esc(market.host.replace("www.", "")) + (assigned ? "" : " · no ID") + "</option>";
    }).join("");
  }

  function pageGenerate() {
    var locked = !can("generate");
    return NLUI.pageHeader({
      title: "Generate a link",
      desc: "The tag is added on the marketplace host. Nothing is shortened or redirected through this desk.",
    }) + (locked ? NLUI.notice("Your role is analyst. You can read reports. Generating links is turned off.") : NLUI.notice("Links are tagged with the house account an administrator assigned to you. You are not connecting a personal Amazon or Walmart affiliate account.")) +
      '<div class="split-gen"><section class="panel"><div class="panel-b stack-form">' +
      '<div class="tabs" role="tablist"><button type="button" data-action="gen-tab" data-network="amazon" aria-selected="' + (state.gen.network === "amazon" ? "true" : "false") + '">Amazon</button><button type="button" data-action="gen-tab" data-network="walmart" aria-selected="' + (state.gen.network === "walmart" ? "true" : "false") + '">Walmart</button></div>' +
      '<label class="field"><span>Product URL or ID</span><input class="input" id="gen-input" data-input="gen-input" value="' + NLUI.esc(state.gen.input) + '" placeholder="' + (state.gen.network === "amazon" ? "https://www.amazon.com/dp/B0C8N4K2QW or ASIN" : "https://www.walmart.com/ip/552918334 or item id") + '"' + (locked ? " disabled" : "") + "></label>" +
      '<label class="field"><span>Marketplace</span><select class="select" id="gen-country" data-change="gen-country"' + (locked || state.gen.network === "walmart" ? " disabled" : "") + ">" + countryOptions(state.gen.country, state.gen.network) + "</select></label>" +
      '<label class="field"><span>Tracking ID</span><select class="select" id="gen-tag" data-change="gen-tag"' + (locked ? " disabled" : "") + "></select><span class=\"help\" id=\"gen-tag-help\"></span></label>" +
      '<div class="row"><button type="button" class="btn btn-primary" data-action="create-link"' + (locked ? " disabled" : "") + ">Save to history</button>" +
      '<button type="button" class="btn" data-action="copy-gen"' + (locked ? " disabled" : "") + ">Copy link</button>" +
      '<button type="button" class="btn" data-action="copy-gen-disc"' + (locked ? " disabled" : "") + ">Copy with disclosure</button>" +
      '<button type="button" class="btn" data-action="share-gen"' + (locked || !can("share") ? " disabled" : "") + ">WhatsApp</button></div>" +
      '<div><div class="help mb8">Examples</div><div class="suggest">' +
      (state.gen.network === "amazon"
        ? '<button type="button" class="chip" data-action="use-example" data-value="B0C8N4K2QW">Anker 737</button><button type="button" class="chip" data-action="use-example" data-value="https://www.amazon.co.uk/dp/B0SNYWHXM5">Sony · UK URL</button><button type="button" class="chip" data-action="use-example" data-value="B0LC55QTFL">Dutch oven</button>'
        : '<button type="button" class="chip" data-action="use-example" data-value="552918334">Organizer shelf</button><button type="button" class="chip" data-action="use-example" data-value="https://www.walmart.com/ip/onn-50-inch/907552441">onn. TV URL</button>') +
      "</div></div></div></section><section class=\"panel\"><div class=\"panel-h\"><span>Preview</span><span id=\"gen-onelink\"></span></div><div class=\"panel-b\" id=\"gen-preview\"></div></section></div>";
  }

  function computeGen() {
    var network = state.gen.network;
    var country = network === "walmart" ? "US" : state.gen.country;
    var tags = tagsFor(country, network);
    var tag = tags.find(function (item) { return item.id === state.gen.tag; }) || tags.find(function (item) { return item.isDefault; }) || tags[0] || null;
    if (!String(state.gen.input || "").trim()) {
      return { empty: true, tags: tags, tag: tag, country: country, network: network };
    }
    if (network === "amazon") {
      var built = NLLinks.buildAmazon({ input: state.gen.input, country: country, tag: tag && tag.id });
      if (built.suggestCountry && built.suggestCountry !== country) {
        country = built.suggestCountry;
        state.gen.country = country;
        tags = tagsFor(country, "amazon");
        tag = tags.find(function (item) { return item.isDefault; }) || tags[0] || null;
        state.gen.tag = tag ? tag.id : "";
        built = NLLinks.buildAmazon({ input: state.gen.input, country: country, tag: tag && tag.id });
        var market = NLLinks.marketplace(country);
        built.notes = ["Marketplace set to " + (market ? market.name : country) + " from the pasted URL."].concat(built.notes || []);
      }
      return { built: built, tags: tags, tag: tag, country: country, network: network };
    }
    if (!tag) {
      return { built: { ok: false, error: "No Walmart tracking ID is assigned to you. Ask an administrator." }, tags: [], tag: null, country: "US", network: "walmart" };
    }
    var walmart = NLLinks.buildWalmart({ input: state.gen.input, sharedId: user.slug, partner: tag.partner || "northline", adId: tag.adId || "565706" });
    return { built: walmart, tags: tags, tag: tag, country: "US", network: "walmart" };
  }

  function fillGenControls(model) {
    var country = document.getElementById("gen-country");
    var select = document.getElementById("gen-tag");
    var help = document.getElementById("gen-tag-help");
    if (country && state.gen.network === "amazon") country.value = model.country;
    if (!select) return;
    if (!model.tags.length) {
      select.innerHTML = '<option value="">None assigned</option>';
      help.textContent = "Ask an administrator to assign an ID for this marketplace.";
    } else {
      select.innerHTML = model.tags.map(function (tag) {
        return '<option value="' + NLUI.esc(tag.id) + '">' + NLUI.esc(tag.id) + " · " + NLUI.esc(tag.label) + "</option>";
      }).join("");
      if (model.tag) select.value = model.tag.id;
      state.gen.tag = select.value;
      help.textContent = "This ID belongs to the house account.";
    }
    var badge = document.getElementById("gen-onelink");
    if (badge) {
      badge.innerHTML = model.tag && model.tag.onelink ? NLUI.badge("OneLink on", "info") : model.network === "amazon" ? NLUI.badge("OneLink off", "neutral") : "";
    }
  }

  function previewHtml(model) {
    if (model.empty) {
      return NLUI.empty("Paste a product URL or an ID", state.gen.network === "amazon"
        ? "The desk builds a full Amazon URL on the marketplace you pick and adds your assigned tag."
        : "The desk builds a walmart.com URL. The item id stays visible in the path.");
    }
    var built = model.built;
    if (!built.ok) {
      return NLUI.empty("Can't build a link yet", built.error) + (built.plain ? '<p class="help">Parsed product URL, without a tag:</p><div class="url-box">' + NLUI.esc(built.plain) + "</div>" : "");
    }
    var parts = "";
    if (model.network === "amazon") {
      parts = part("Host", built.host) + part("ASIN", built.asin) + part("tag", built.tag) + part("OneLink", model.tag && model.tag.onelink ? "On for this ID" : "Off");
    } else {
      parts = part("Host", "www.walmart.com") + part("Item", built.itemId) + part("wmlspartner", built.partner) + part("sharedid", built.sharedId);
    }
    var notes = (built.notes || []).map(function (note) { return "<p class=\"help\">" + NLUI.esc(note) + "</p>"; }).join("");
    var onelink = model.network === "amazon" && model.tag && model.tag.onelink
      ? '<p class="help">OneLink is on for this tracking ID. Amazon may send a shopper to their local marketplace. This URL itself still opens the Amazon host above.</p>'
      : "";
    var disclosure = model.network === "amazon" ? NLStore.getBrand().disclosure : NLStore.getBrand().walmartDisclosure;
    var title = titleFor(model.network, built.asin || built.itemId);
    return '<div class="cell-title mb8"><strong>' + NLUI.esc(title) + '</strong><span class="muted">Full merchant URL. Not shortened.</span></div>' +
      '<div class="url-box" id="gen-url">' + NLUI.esc(built.url) + "</div>" +
      '<div class="url-parts">' + parts + "</div>" + notes + onelink +
      '<div class="disclosure" id="gen-disclosure">' + NLUI.esc(disclosure) + "</div>" +
      '<p class="help mt8">The disclosure is required on shares. It is not optional.</p>';
  }

  function part(label, value) {
    return "<div><span>" + NLUI.esc(label) + "</span><strong>" + NLUI.esc(value || "—") + "</strong></div>";
  }

  function updateGen() {
    var model = computeGen();
    var sig = state.gen.network + "|" + model.country + "|" + ((model.tag && model.tag.id) || "");
    if (sig !== genSig) {
      genSig = sig;
      fillGenControls(model);
    }
    var host = document.getElementById("gen-preview");
    if (host) host.innerHTML = previewHtml(model);
    return model;
  }

  function currentBuilt() {
    var model = computeGen();
    if (!model.built || !model.built.ok) {
      NLUI.toast(model.built && model.built.error ? model.built.error : "Paste a product URL or ID first.");
      return null;
    }
    return model;
  }

  function pageSearch() {
    return NLUI.pageHeader({
      title: "Keyword search",
      desc: "Search the sample catalog, then create a link on the marketplace you select. Prices are recorded samples, not live prices.",
    }) + '<div class="filters"><label class="field grow"><span>Keyword</span><input class="input" data-input="search-q" value="' + NLUI.esc(state.search.q) + '" placeholder="Power bank, dutch oven, ASIN"></label>' +
      '<label class="field"><span>Network</span><select class="select" data-change="search-network"><option value="all"' + sel(state.search.network, "all") + '>All</option><option value="amazon"' + sel(state.search.network, "amazon") + '>Amazon</option><option value="walmart"' + sel(state.search.network, "walmart") + ">Walmart</option></select></label>" +
      '<label class="field"><span>Marketplace</span><select class="select" id="search-country" data-change="search-country">' + countryOptions(state.search.country, "amazon") + "</select></label></div>" +
      '<p class="help">Prices show the date they were recorded. They can change. This is not a live price.</p>' +
      '<section class="panel" id="search-results">' + searchTable() + "</section>";
  }

  function searchTable() {
    var rows = NLData.searchProducts(state.search.q, state.search.network);
    return NLUI.dataTable({
      name: "search",
      rows: rows,
      columns: searchColumns(),
      sort: state.search.sort,
      dir: state.search.dir,
      page: state.search.page,
      perPage: 8,
      emptyTitle: "No products match",
      emptyText: "Try a brand, a product type, or an ASIN.",
    });
  }

  function searchColumns() {
    return [
      { key: "title", label: "Product", sort: function (row) { return row.title; }, html: function (row) {
        return '<div class="product-cell"><div class="' + NLUI.tileClass(row.brand) + '">' + NLUI.esc(NLUI.initials(row.brand)) + '</div><div class="cell-title"><span class="truncate">' + NLUI.esc(row.title) + '</span><span class="muted">' + NLUI.esc(row.brand) + "</span></div></div>";
      } },
      { key: "network", label: "Network", sort: function (row) { return row.network; }, html: function (row) { return row.network === "amazon" ? "Amazon" : "Walmart"; } },
      { key: "id", label: "ID", sort: function (row) { return row.asin || row.itemId; }, html: function (row) { return '<span class="mono">' + NLUI.esc(row.asin || row.itemId) + "</span>"; } },
      { key: "price", label: "Sample price", num: true, sort: function (row) { return row.usd || 0; }, html: function (row) { return priceHtml(row, state.search.country); } },
      { key: "rating", label: "Rating", num: true, sort: function (row) { return row.rating; }, html: function (row) { return row.rating.toFixed(1) + ' <span class="muted">(' + NLUI.num(row.reviews) + ")</span>"; } },
      { key: "score", label: "", sort: function (row) { return row.score; }, html: function (row) {
        return '<button type="button" class="btn btn-sm" data-action="quick-link" data-network="' + row.network + '" data-id="' + NLUI.esc(row.asin || row.itemId) + '" data-country-field="search-country">Create link</button>';
      } },
    ];
  }

  function pageSellers() {
    var names = NLData.sellers();
    return NLUI.pageHeader({
      title: "Seller search",
      desc: "Find products by the seller name on the listing, such as Anker Direct or Apple, then create a link.",
    }) + '<div class="filters"><label class="field grow"><span>Sold by</span><input class="input" data-input="seller-q" value="' + NLUI.esc(state.seller.q) + '" placeholder="Seller name"></label>' +
      '<label class="field"><span>Marketplace</span><select class="select" id="seller-country" data-change="seller-country">' + countryOptions(state.seller.country, "amazon") + "</select></label></div>" +
      '<div class="suggest">' + names.slice(0, 8).map(function (seller) {
        return '<button type="button" class="chip" data-action="pick-seller" data-seller="' + NLUI.esc(seller.name) + '">' + NLUI.esc(seller.name) + "</button>";
      }).join("") + "</div>" +
      '<p class="help">Prices are samples recorded with a date. They are not live Amazon prices.</p>' +
      '<section class="panel" id="seller-results">' + sellerTable() + "</section>";
  }

  function sellerTable() {
    var rows = NLData.searchSellers(state.seller.q);
    return NLUI.dataTable({
      name: "seller",
      rows: rows,
      columns: [
        { key: "title", label: "Product", sort: function (row) { return row.title; }, html: function (row) {
          return '<div class="cell-title"><span class="truncate">' + NLUI.esc(row.title) + '</span><span class="muted mono">' + NLUI.esc(row.asin) + "</span></div>";
        } },
        { key: "seller", label: "Sold by", sort: function (row) { return row.seller; }, html: function (row) { return NLUI.esc(row.seller); } },
        { key: "price", label: "Sample price", num: true, sort: function (row) { return row.usd; }, html: function (row) { return priceHtml(row, state.seller.country); } },
        { key: "go", label: "", sort: function () { return 0; }, html: function (row) {
          return '<button type="button" class="btn btn-sm" data-action="quick-link" data-network="amazon" data-id="' + row.asin + '" data-country-field="seller-country">Create link</button>';
        } },
      ],
      sort: state.seller.sort,
      dir: state.seller.dir,
      page: state.seller.page,
      perPage: 8,
      emptyTitle: "No seller matches",
      emptyText: "Use the name printed as the seller, not the brand, unless they are the same.",
    });
  }

  function pageHistory() {
    return NLUI.pageHeader({
      title: "Link history",
      desc: "Links you created in this desk. Clicks on a row are for that URL and are a subset of outbound clicks.",
    }) + '<div class="filters"><label class="field grow"><span>Search</span><input class="input" data-input="history-q" value="' + NLUI.esc(state.history.q) + '" placeholder="Title, ASIN, tag"></label>' +
      '<label class="field"><span>Network</span><select class="select" data-change="history-network"><option value="all"' + sel(state.history.network, "all") + '>All</option><option value="amazon"' + sel(state.history.network, "amazon") + '>Amazon</option><option value="walmart"' + sel(state.history.network, "walmart") + ">Walmart</option></select></label>" +
      '<label class="field"><span>Market</span><select class="select" data-change="history-country"><option value="all">All</option>' + NLLinks.MARKETPLACES.map(function (market) {
        return '<option value="' + market.code + '"' + sel(state.history.country, market.code) + ">" + market.code + "</option>";
      }).join("") + "</select></label></div><section class=\"panel\" id=\"history-results\">" + historyTable() + "</section>";
  }

  function historyRows() {
    return myLinks().filter(function (link) {
      if (state.history.network !== "all" && link.network !== state.history.network) return false;
      if (state.history.country !== "all" && link.country !== state.history.country) return false;
      var q = state.history.q.trim().toLowerCase();
      if (!q) return true;
      return (link.title + " " + link.key + " " + link.tag + " " + link.url).toLowerCase().indexOf(q) !== -1;
    });
  }

  function historyTable() {
    return NLUI.dataTable({
      name: "history",
      rows: historyRows(),
      columns: [
        { key: "createdAt", label: "When", sort: function (row) { return row.createdAt; }, html: function (row) { return NLUI.dayYear(row.createdAt); } },
        { key: "title", label: "Product", sort: function (row) { return row.title; }, html: function (row) {
          return '<div class="cell-title"><span class="truncate">' + NLUI.esc(row.title) + '</span><span class="muted">' + (row.network === "amazon" ? "Amazon" : "Walmart") + "</span></div>";
        } },
        { key: "country", label: "Market", sort: function (row) { return row.country; }, html: function (row) { return NLUI.esc(row.country); } },
        { key: "tag", label: "Tag", sort: function (row) { return row.tag; }, html: function (row) { return '<span class="mono">' + NLUI.esc(row.tag) + "</span>"; } },
        { key: "clicks", label: "Clicks", num: true, sort: function (row) { return row.clicks; }, html: function (row) { return NLUI.num(row.clicks); } },
        { key: "orders", label: "Orders", num: true, sort: function (row) { return row.orders; }, html: function (row) { return NLUI.num(row.orders); } },
        { key: "url", label: "", sort: function () { return ""; }, html: function (row) {
          return '<button type="button" class="btn btn-sm" data-action="copy" data-copy="' + NLUI.esc(row.url) + '">Copy</button>';
        } },
      ],
      sort: state.history.sort,
      dir: state.history.dir,
      page: state.history.page,
      emptyTitle: "No links in this filter",
      emptyText: "Generate a link, or clear the filters.",
    });
  }

  function ensureWa() {
    if (state.wa.ready) return;
    state.wa.ready = true;
    var draft = NLStore.consumeDraft();
    if (draft) {
      state.wa.url = draft.url;
      state.wa.network = draft.network;
      state.wa.label = draft.title || "";
      state.wa.linkId = draft.id || "";
      return;
    }
    var first = myLinks()[0];
    if (first) applyLink(first);
  }

  function applyLink(link) {
    state.wa.linkId = link.id;
    state.wa.url = link.url;
    state.wa.network = link.network;
    state.wa.label = link.title;
  }

  function waMessage() {
    return NLLinks.composeShare({
      title: state.wa.label,
      url: state.wa.url,
      note: state.wa.note,
      network: state.wa.network,
      disclosures: { amazon: NLStore.getBrand().disclosure, walmart: NLStore.getBrand().walmartDisclosure },
    });
  }

  function pageWhatsapp() {
    ensureWa();
    var locked = !can("share");
    var links = myLinks();
    return NLUI.pageHeader({
      title: "WhatsApp share",
      desc: "The message is a wa.me link. The product URL inside it is the full merchant URL, and the disclosure is always attached.",
    }) + (locked ? NLUI.notice("Your role cannot create share links.") : "") +
      '<div class="grid-2"><section class="panel"><div class="panel-b stack-form">' +
      '<label class="field"><span>Start from history</span><select class="select" data-change="wa-link"' + (locked ? " disabled" : "") + '><option value="">Choose a link</option>' +
      links.slice(0, 30).map(function (link) {
        return '<option value="' + NLUI.esc(link.id) + '"' + (link.id === state.wa.linkId ? " selected" : "") + ">" + NLUI.esc(link.title) + "</option>";
      }).join("") + "</select></label>" +
      '<label class="field"><span>Or paste a product URL</span><input class="input" id="wa-paste" placeholder="Amazon or Walmart product URL"' + (locked ? " disabled" : "") + "></label>" +
      '<div class="row"><button type="button" class="btn btn-sm" data-action="wa-parse"' + (locked ? " disabled" : "") + ">Use pasted URL</button></div>" +
      '<label class="field"><span>Label</span><input class="input" data-input="wa-label" value="' + NLUI.esc(state.wa.label) + '"' + (locked ? " disabled" : "") + "></label>" +
      '<label class="field"><span>Note</span><textarea class="textarea" data-input="wa-note" placeholder="Optional. Do not offer a reward for clicking."' + (locked ? " disabled" : "") + ">" + NLUI.esc(state.wa.note) + "</textarea></label>" +
      '<div><div class="help">Disclosure, locked</div><div class="disclosure" data-disclosure>' + NLUI.esc(NLStore.getBrand().disclosure) + "</div></div>" +
      '<div class="row"><button type="button" class="btn btn-primary" data-action="copy-wa"' + (locked ? " disabled" : "") + ">Copy wa.me link</button>" +
      '<button type="button" class="btn" data-action="open-wa"' + (locked ? " disabled" : "") + ">Open WhatsApp</button>" +
      '<button type="button" class="btn" data-action="copy" data-copy-target="wa-preview">Copy message</button></div>' +
      "</div></section><section class=\"panel\"><div class=\"panel-h\"><span>Message</span></div><div class=\"panel-b\"><pre class=\"code\" id=\"wa-preview\">" +
      NLUI.esc(waMessage()) + '</pre><p class="help mt8">Phone on the bot page is used when it is set. Otherwise wa.me opens the share sheet.</p></div></section></div>';
  }

  function refreshWa() {
    var preview = document.getElementById("wa-preview");
    if (preview) preview.textContent = waMessage();
  }

  function blockIncentive() {
    if (NLLinks.hasIncentive(state.wa.note + " " + state.wa.label)) {
      NLUI.toast("This message looks like an incentive to click. Remove it before sharing. Incentivized clicks are not allowed.");
      return true;
    }
    return false;
  }

  function ensureBot() {
    if (botThread) return;
    var sample = "https://www.amazon.com/dp/B0C8N4K2QW";
    botThread = [
      { from: "bot", text: NLStore.getBot().greeting },
      { from: "me", text: sample },
      { from: "bot", text: botReply(sample) },
    ];
  }

  function botReply(text) {
    var trimmed = String(text || "").trim();
    if (/walmart\.com|^\d{5,12}$/i.test(trimmed)) {
      var wtag = pickTag("US", "walmart");
      if (!wtag) return "No Walmart tracking ID is assigned to this login.";
      var builtW = NLLinks.buildWalmart({ input: trimmed, sharedId: user.slug, partner: wtag.partner, adId: wtag.adId });
      if (!builtW.ok) return builtW.error;
      return titleFor("walmart", builtW.itemId) + "\n" + builtW.url + "\n\n" + NLStore.getBrand().walmartDisclosure;
    }
    var country = "US";
    try {
      var detected = NLLinks.marketplaceFromHost(new URL(trimmed).hostname);
      if (detected) country = detected.code;
    } catch (err) { /* not a url */ }
    var tag = pickTag(country, "amazon");
    var built = NLLinks.buildAmazon({ input: trimmed, country: country, tag: tag && tag.id });
    if (built.suggestCountry && built.suggestCountry !== country) {
      country = built.suggestCountry;
      tag = pickTag(country, "amazon");
      built = NLLinks.buildAmazon({ input: trimmed, country: country, tag: tag && tag.id });
    }
    if (!built.ok) {
      if (!/^https?:\/\//i.test(trimmed) && !/^[A-Z0-9]{10}$/i.test(trimmed)) return NLStore.getBot().greeting;
      return built.error;
    }
    var market = NLLinks.marketplace(country);
    var one = tag && tag.onelink ? "\nOneLink is on for this tracking ID." : "";
    return titleFor("amazon", built.asin) + "\n" + (market ? market.name : country) + " · " + built.tag + one + "\n" + built.url + "\n\n" + NLStore.getBrand().disclosure;
  }

  function pageBot() {
    ensureBot();
    var bot = NLStore.getBot();
    return NLUI.pageHeader({
      title: "Bot preview",
      desc: "A local preview of a WhatsApp helper. It is not connected to WhatsApp. Nothing is delivered.",
    }) + '<div class="grid-2"><section class="panel"><div class="panel-h"><span>Setup</span>' + NLUI.badge("Not connected", "warn") + '</div><div class="panel-b stack-form">' +
      '<label class="field"><span>Display name</span><input class="input" data-input="bot-name" value="' + NLUI.esc(bot.name) + '"></label>' +
      '<label class="field"><span>Business number</span><input class="input" data-input="bot-phone" value="' + NLUI.esc(bot.phone) + '"></label>' +
      '<label class="field"><span>Greeting</span><textarea class="textarea" data-input="bot-greeting">' + NLUI.esc(bot.greeting) + "</textarea></label>" +
      '<div><div class="help">Disclosure, locked on</div><div class="disclosure" data-disclosure>' + NLUI.esc(NLStore.getBrand().disclosure) + "</div></div>" +
      '<div class="check"><div><strong>Allowed product hosts</strong><p class="help">amazon marketplaces in this desk, and walmart.com. Short links are rejected.</p></div></div>' +
      '<div class="check"><div><strong>Webhook</strong><p class="help">Not configured. A backend is required before this can answer a real number.</p></div></div>' +
      '<button type="button" class="btn" data-action="bot-reset">Reset preview</button></div></section>' +
      '<div class="phone-wrap"><div class="phone"><div class="phone-top"><div><strong>' + NLUI.esc(bot.name) + '</strong><span>Preview · not sent</span></div></div><div class="thread" id="bot-thread">' +
      botThread.map(function (msg) {
        return '<div class="bubble ' + msg.from + '">' + NLUI.esc(msg.text).replace(/([/?&=])/g, "$1&#8203;") + "</div>";
      }).join("") +
      '</div><form class="phone-compose" data-action="bot-send"><input class="input" id="bot-input" placeholder="Paste a product URL" autocomplete="off"><button class="btn btn-primary btn-sm" type="submit">Send</button></form></div></div></div>';
  }

  function pageActivity() {
    var sum = NLData.summary(user.id, state.range);
    var max = Math.max(sum.views, 1);
    var events = NLData.activity(user.id).filter(function (event) {
      return state.activity.type === "all" || event.type === state.activity.type;
    });
    return NLUI.pageHeader({
      title: "Activity",
      desc: "Views are page views on your sites. Outbound clicks are follows of a full Amazon or Walmart URL. Conversion is reported orders divided by outbound clicks. The list is a recent sample, not every hit.",
      actions: NLUI.rangeControl(state.range),
    }) + metricBlock(sum, "activity") +
      '<div class="grid-2"><section class="panel"><div class="panel-h"><span>Path</span></div><div class="panel-b funnel">' +
      barRow("Page views", sum.views, max) + barRow("Outbound clicks", sum.clicks, max) + barRow("Reported orders", sum.orders, max) +
      '</div></section><section class="panel"><div class="panel-h"><span>Recent sample</span><select class="select auto" data-change="activity-type"><option value="all"' + sel(state.activity.type, "all") + '>All</option><option value="click"' + sel(state.activity.type, "click") + '>Clicks</option><option value="view"' + sel(state.activity.type, "view") + '>Views</option><option value="order"' + sel(state.activity.type, "order") + '>Orders</option><option value="link"' + sel(state.activity.type, "link") + ">Links</option></select></div>" +
      '<div class="table-scroll"><table class="data fit"><thead><tr><th>When</th><th>Event</th><th>Detail</th></tr></thead><tbody>' +
      (events.length ? events.map(function (event) {
        return "<tr><td>" + NLUI.stamp(event.at) + "</td><td>" + NLUI.esc(event.title) + '</td><td><div class="cell-title"><span class="truncate">' + NLUI.esc(event.detail) + '</span><span class="muted">' + NLUI.esc(event.meta) + "</span></div></td></tr>";
      }).join("") : "<tr><td colspan=\"3\">" + NLUI.empty("No events", "Nothing in this filter.") + "</td></tr>") +
      "</tbody></table></div></section></div>";
  }

  function barRow(label, value, max) {
    return '<div class="hbar"><div class="hbar-top"><span>' + NLUI.esc(label) + "</span><strong>" + NLUI.num(value) + '</strong></div><div class="hbar-track"><div class="hbar-fill" data-bar="' + ((value / max) * 100).toFixed(1) + '"></div></div></div>';
  }

  function pageReports() {
    var sum = NLData.summary(user.id, state.range);
    var orders = NLData.ordersFor(user.id, state.range);
    NLUI.chartSpecs.report = chartSpec(sum);
    var cats = categoryRows(orders);
    return NLUI.pageHeader({
      title: "Orders and earnings",
      desc: importNote(),
      actions: NLUI.rangeControl(state.range) + '<button type="button" class="btn btn-sm" data-action="export-days">Days CSV</button><button type="button" class="btn btn-sm" data-action="export-orders">Orders CSV</button>',
    }) + metricBlock(sum) +
      '<section class="panel"><div class="panel-h"><span>Daily</span>' + legend() + '</div><div class="panel-b"><div id="report" class="chart" data-chart></div></div>' +
      dayTable(sum) + "</section>" +
      '<div class="grid-2"><section class="panel"><div class="panel-h"><span>By category</span></div>' + NLUI.dataTable({
        name: "cats",
        rows: cats,
        columns: [
          { key: "category", label: "Category", sort: function (row) { return row.category; }, html: function (row) { return NLUI.esc(row.category); } },
          { key: "orders", label: "Orders", num: true, sort: function (row) { return row.orders; }, html: function (row) { return NLUI.num(row.orders); } },
          { key: "commission", label: "Est. commission", num: true, sort: function (row) { return row.commission; }, html: function (row) { return NLUI.money(row.commission); } },
        ],
        sort: state.cats.sort,
        dir: state.cats.dir,
        page: state.cats.page,
        perPage: 8,
      }) + '</section><section class="panel"><div class="panel-h"><span>Orders</span></div>' + orderTable(orders) + "</section></div>";
  }

  function categoryRows(orders) {
    var map = {};
    orders.forEach(function (order) {
      var row = map[order.category] || { category: order.category, orders: 0, commission: 0 };
      row.orders += 1;
      row.commission += order.commission;
      map[order.category] = row;
    });
    return Object.keys(map).map(function (key) {
      map[key].commission = +map[key].commission.toFixed(2);
      return map[key];
    });
  }

  function dayTable(sum) {
    return NLUI.dataTable({
      name: "days",
      rows: sum.series,
      columns: [
        { key: "date", label: "Date", sort: function (row) { return row.date; }, html: function (row) { return NLUI.dayYear(row.date); } },
        { key: "views", label: "Views", num: true, sort: function (row) { return row.views; }, html: function (row) { return NLUI.num(row.views); } },
        { key: "clicks", label: "Clicks", num: true, sort: function (row) { return row.clicks; }, html: function (row) { return NLUI.num(row.clicks); } },
        { key: "orders", label: "Orders", num: true, sort: function (row) { return row.orders; }, html: function (row) { return NLUI.num(row.orders); } },
        { key: "earnings", label: "Est. earnings", num: true, sort: function (row) { return row.earnings; }, html: function (row) { return NLUI.money(row.earnings); } },
      ],
      sort: state.days.sort,
      dir: state.days.dir,
      page: state.days.page,
      perPage: 8,
    });
  }

  function orderTable(orders) {
    return NLUI.dataTable({
      name: "orders",
      rows: orders,
      columns: [
        { key: "at", label: "Date", sort: function (row) { return row.at; }, html: function (row) { return NLUI.day(row.date); } },
        { key: "title", label: "Product", sort: function (row) { return row.title; }, html: function (row) {
          return '<div class="cell-title"><span class="truncate">' + NLUI.esc(row.title) + '</span><span class="muted mono">' + NLUI.esc(row.asin) + "</span></div>";
        } },
        { key: "country", label: "Market", sort: function (row) { return row.country; }, html: function (row) { return NLUI.esc(row.country); } },
        { key: "tag", label: "Tag", sort: function (row) { return row.tag; }, html: function (row) { return '<span class="mono">' + NLUI.esc(row.tag) + "</span>"; } },
        { key: "price", label: "Price", num: true, sort: function (row) { return row.price; }, html: function (row) { return NLUI.money(row.price); } },
        { key: "rate", label: "Rate", num: true, sort: function (row) { return row.rate; }, html: function (row) { return (row.rate * 100).toFixed(1) + "%"; } },
        { key: "commission", label: "Est.", num: true, sort: function (row) { return row.commission; }, html: function (row) { return NLUI.money(row.commission); } },
        { key: "status", label: "Status", sort: function (row) { return row.status; }, html: function (row) { return NLUI.statusBadge(row.status); } },
      ],
      sort: state.orders.sort,
      dir: state.orders.dir,
      page: state.orders.page,
      perPage: 8,
      emptyTitle: "No orders in this range",
      emptyText: "Try a longer range.",
    });
  }

  function pageCountries() {
    var map = NLData.byCountry(user.id, state.range);
    var rows = Object.keys(map).map(function (code) {
      var market = NLLinks.marketplace(code);
      var tag = pickTag(code, "amazon");
      return Object.assign({ code: code, name: market ? market.name : code, tag: tag ? tag.id : "—" }, map[code]);
    });
    var max = rows.reduce(function (m, row) { return Math.max(m, row.clicks); }, 1);
    return NLUI.pageHeader({
      title: "Countries",
      desc: "Split of your outbound clicks and estimated earnings by marketplace. " + importNote(),
      actions: NLUI.rangeControl(state.range),
    }) + '<div class="grid-2"><section class="panel"><div class="panel-h"><span>Clicks</span></div><div class="panel-b">' +
      (rows.length ? rows.sort(function (a, b) { return b.clicks - a.clicks; }).map(function (row) { return barRow(row.name, row.clicks, max); }).join("") : NLUI.empty("No country data", "Nothing in this range.")) +
      '</div></section><section class="panel"><div class="panel-h"><span>Table</span></div>' + NLUI.dataTable({
        name: "countries",
        rows: rows,
        columns: [
          { key: "name", label: "Marketplace", sort: function (row) { return row.name; }, html: function (row) { return NLUI.esc(row.name) + ' <span class="muted">' + row.code + "</span>"; } },
          { key: "tag", label: "Tag", sort: function (row) { return row.tag; }, html: function (row) { return '<span class="mono">' + NLUI.esc(row.tag) + "</span>"; } },
          { key: "clicks", label: "Clicks", num: true, sort: function (row) { return row.clicks; }, html: function (row) { return NLUI.num(row.clicks); } },
          { key: "orders", label: "Orders", num: true, sort: function (row) { return row.orders; }, html: function (row) { return NLUI.num(row.orders); } },
          { key: "conv", label: "Conv.", num: true, sort: function (row) { return row.conv; }, html: function (row) { return NLUI.pct(row.conv || 0); } },
          { key: "earnings", label: "Est. earnings", num: true, sort: function (row) { return row.earnings; }, html: function (row) { return NLUI.money(row.earnings); } },
        ],
        sort: state.countries.sort,
        dir: state.countries.dir,
        page: state.countries.page,
        perPage: 12,
      }) + "</section></div>";
  }

  function pageTags() {
    var stats = NLData.byTag(user.id, state.range);
    var rows = assignedTags().map(function (tag) {
      var row = stats[tag.id] || { clicks: 0, orders: 0, earnings: 0, conv: 0 };
      return Object.assign({ spark: NLData.tagSpark(user.id, tag.id, state.range) }, tag, row);
    });
    return NLUI.pageHeader({
      title: "Tracking IDs",
      desc: "These IDs belong to the house Associates account. OneLink is a setting on the ID, not a different URL.",
      actions: NLUI.rangeControl(state.range),
    }) + '<section class="panel">' + NLUI.dataTable({
      name: "tags",
      rows: rows,
      columns: [
        { key: "id", label: "Tracking ID", sort: function (row) { return row.id; }, html: function (row) { return '<span class="mono">' + NLUI.esc(row.id) + '</span><div class="muted">' + NLUI.esc(row.label) + "</div>"; } },
        { key: "countries", label: "Markets", sort: function (row) { return row.countries.join(","); }, html: function (row) { return NLUI.esc(row.countries.join(", ")); } },
        { key: "onelink", label: "OneLink", sort: function (row) { return row.onelink ? 1 : 0; }, html: function (row) { return row.network === "walmart" ? NLUI.badge("n/a", "neutral") : row.onelink ? NLUI.badge("On", "info") : NLUI.badge("Off", "neutral"); } },
        { key: "spark", label: "Clicks", sort: function (row) { return row.clicks; }, html: function (row) { return NLUI.spark(row.spark); } },
        { key: "clicks", label: "Clicks", num: true, sort: function (row) { return row.clicks; }, html: function (row) { return NLUI.num(row.clicks); } },
        { key: "orders", label: "Orders", num: true, sort: function (row) { return row.orders; }, html: function (row) { return NLUI.num(row.orders); } },
        { key: "earnings", label: "Est. earnings", num: true, sort: function (row) { return row.earnings; }, html: function (row) { return NLUI.money(row.earnings); } },
      ],
      sort: state.tags.sort,
      dir: state.tags.dir,
      page: state.tags.page,
      perPage: 12,
      emptyTitle: "No tracking IDs",
      emptyText: "An administrator has not assigned one yet.",
    }) + "</section>";
  }

  function pageSeo() {
    var pack = NLData.seo(user.id, state.range);
    var sites = pack.sites || [];
    var chosen = state.seo.site === "all" ? sites : sites.filter(function (site) { return site.host === state.seo.site; });
    var keywordMap = {};
    var pages = [];
    var referrers = {};
    chosen.forEach(function (site) {
      site.keywords.forEach(function (row) {
        var bucket = keywordMap[row.term] || { term: row.term, visits: 0, hosts: {} };
        bucket.visits += row.visits;
        bucket.hosts[site.host] = true;
        keywordMap[row.term] = bucket;
      });
      site.pages.forEach(function (row) { pages.push({ path: row.path, visits: row.visits, host: site.host }); });
      addRef(referrers, "google.com", Math.round(site.searchViews * 0.78));
      addRef(referrers, "bing.com", Math.round(site.searchViews * 0.13));
      addRef(referrers, "duckduckgo.com", Math.round(site.searchViews * 0.06));
      addRef(referrers, "yahoo.com", Math.round(site.searchViews * 0.03));
      addRef(referrers, "Direct", site.direct);
      addRef(referrers, "Email", site.email);
    });
    var keywords = Object.keys(keywordMap).map(function (term) {
      var row = keywordMap[term];
      var hosts = Object.keys(row.hosts);
      return { term: row.term, visits: row.visits, host: hosts.length > 1 ? hosts.length + " sites" : hosts[0] };
    });
    keywords.sort(function (a, b) { return b.visits - a.visits; });
    pages.sort(function (a, b) { return b.visits - a.visits; });
    var refRows = Object.keys(referrers).map(function (name) { return { name: name, visits: referrers[name] }; }).sort(function (a, b) { return b.visits - a.visits; });
    var max = refRows.reduce(function (m, row) { return Math.max(m, row.visits); }, 1);
    return NLUI.pageHeader({
      title: "SEO traffic",
      desc: "Search analytics for sites you added. Northline does not sit between the shopper and Amazon.",
      actions: NLUI.rangeControl(state.range),
    }) + '<div class="filters"><label class="field"><span>Site</span><select class="select" data-change="seo-site"><option value="all"' + sel(state.seo.site, "all") + ">All sites</option>" +
      sites.map(function (site) { return '<option value="' + NLUI.esc(site.host) + '"' + sel(state.seo.site, site.host) + ">" + NLUI.esc(site.host) + "</option>"; }).join("") +
      "</select></label></div>" +
      NLUI.metrics([
        { label: "Page views", value: NLUI.num(chosen.reduce(function (s, site) { return s + site.views; }, 0)) },
        { label: "From search", value: NLUI.num(chosen.reduce(function (s, site) { return s + site.searchViews; }, 0)) },
        { label: "Direct", value: NLUI.num(chosen.reduce(function (s, site) { return s + site.direct; }, 0)) },
        { label: "Sites", value: String(chosen.length) },
      ]) +
      '<div class="grid-2"><section class="panel"><div class="panel-h"><span>How people arrived</span></div><div class="panel-b">' +
      (refRows.length ? refRows.map(function (row) { return barRow(row.name, row.visits, max); }).join("") : NLUI.empty("No site on this login", "An administrator can attach a site later.")) +
      '</div></section><section class="panel"><div class="panel-h"><span>How a search visit becomes a click</span></div><div class="panel-b stack-form">' +
      '<p class="help">Someone finds your page. The page loads in their browser, which is the view. If they follow the product link, the browser goes straight to Amazon or Walmart. That is the outbound click. The href is the full product URL with your tag. There is no cloaked redirect.</p>' +
      '<pre class="code" id="snippet"></pre><button type="button" class="btn btn-sm" data-action="copy" data-copy-target="snippet">Copy snippet</button></div></section></div>' +
      '<div class="grid-2"><section class="panel"><div class="panel-h"><span>Keywords</span></div><div class="table-scroll"><table class="data fit"><thead><tr><th>Query</th><th>Site</th><th class="num">Visits</th></tr></thead><tbody>' +
      (keywords.length ? keywords.slice(0, 8).map(function (row) { return "<tr><td>" + NLUI.esc(row.term) + "</td><td class=\"mono\">" + NLUI.esc(row.host) + "</td><td class=\"num\">" + NLUI.num(row.visits) + "</td></tr>"; }).join("") : "<tr><td colspan=\"3\">" + NLUI.empty("No keywords", "No site is attached.") + "</td></tr>") +
      '</tbody></table></div></section><section class="panel"><div class="panel-h"><span>Landing pages</span></div><div class="table-scroll"><table class="data fit"><thead><tr><th>Path</th><th class="num">Visits</th></tr></thead><tbody>' +
      (pages.length ? pages.slice(0, 8).map(function (row) { return "<tr><td class=\"mono\">" + NLUI.esc(row.host) + NLUI.esc(row.path) + "</td><td class=\"num\">" + NLUI.num(row.visits) + "</td></tr>"; }).join("") : "<tr><td colspan=\"2\">" + NLUI.empty("No pages", "No site is attached.") + "</td></tr>") +
      "</tbody></table></div></section></div>";
  }

  function snippetText() {
    var tag = pickTag("US", "amazon") || pickTag("UK", "amazon") || assignedTags().filter(function (tag) { return tag.network === "amazon"; })[0];
    var market = tag ? (NLLinks.MARKETPLACES.find(function (item) { return tag.countries.indexOf(item.code) !== -1; }) || NLLinks.marketplace("US")) : NLLinks.marketplace("US");
    var id = tag ? tag.id : "your-tag";
    var url = "https://" + market.host + "/dp/B0C8N4K2QW?tag=" + id;
    return '<a href="' + url + '" rel="sponsored">Anker 737 Power Bank, 24,000mAh</a>\n<p>' + NLStore.getBrand().disclosure + "</p>";
  }

  function addRef(map, name, value) {
    map[name] = (map[name] || 0) + (value || 0);
  }

  function pageMissing() {
    return NLUI.pageHeader({ title: "Not in the desk", desc: "That address is not a page." }) +
      '<a class="btn" href="#/dashboard">Back to overview</a>';
  }

  function sel(current, value) { return current === value ? " selected" : ""; }

  var routes = {
    "/dashboard": pageDashboard,
    "/generate": pageGenerate,
    "/search": pageSearch,
    "/sellers": pageSellers,
    "/history": pageHistory,
    "/whatsapp": pageWhatsapp,
    "/bot": pageBot,
    "/activity": pageActivity,
    "/reports": pageReports,
    "/countries": pageCountries,
    "/tags": pageTags,
    "/seo": pageSeo,
  };

  function render(reset) {
    user = NLStore.currentUser() || user;
    var current = path();
    var changed = current !== lastPath;
    lastPath = current;
    Object.keys(NLUI.chartSpecs).forEach(function (key) { delete NLUI.chartSpecs[key]; });
    var view = document.getElementById("view");
    var y = changed || reset ? 0 : window.scrollY;
    view.innerHTML = (routes[current] || pageMissing)();
    NLUI.setActive(current);
    NLUI.closeNav();
    document.title = (TITLES[current] || "Page") + " · " + NLStore.getBrand().name;
    NLStore.applyBrand();
    NLUI.afterPaint();
    if (document.getElementById("gen-preview")) updateGen();
    var snippet = document.getElementById("snippet");
    if (snippet) snippet.textContent = snippetText();
    var thread = document.getElementById("bot-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
    window.scrollTo(0, y);
  }

  NLUI.rerender = function () { render(false); };

  NLUI.actions.more = function () {
    var body = NAV.map(function (group) {
      return '<div class="nav-label">' + NLUI.esc(group.label) + "</div>" + group.items.map(function (item) {
        return '<a class="nav-link" href="#' + item.href + '">' + NLUI.icon(item.icon) + "<span>" + NLUI.esc(item.label) + "</span></a>";
      }).join("");
    }).join("");
    NLUI.openModal("Pages", body);
  };
  NLUI.actions.range = function (el) {
    state.range = Number(el.dataset.days);
    render(false);
  };
  NLUI.actions["gen-tab"] = function (el) {
    state.gen.network = el.dataset.network;
    if (state.gen.network === "walmart") state.gen.country = "US";
    state.gen.tag = "";
    genSig = "";
    render(false);
  };
  NLUI.actions["use-example"] = function (el) {
    state.gen.input = el.dataset.value;
    var input = document.getElementById("gen-input");
    if (input) input.value = state.gen.input;
    genSig = "";
    updateGen();
  };
  NLUI.actions["create-link"] = function () {
    if (!can("generate")) return;
    var model = currentBuilt();
    if (!model) return;
    var built = model.built;
    saveLink({
      network: model.network,
      country: model.country,
      tag: model.tag ? model.tag.id : "",
      title: titleFor(model.network, built.asin || built.itemId),
      key: built.asin || built.itemId,
      url: built.url,
    });
    NLUI.toast("Saved to history.");
  };
  NLUI.actions["copy-gen"] = function () {
    var model = currentBuilt();
    if (!model) return;
    NLUI.copyText(model.built.url).then(function (ok) { NLUI.toast(ok ? "Link copied." : "Copy failed."); });
  };
  NLUI.actions["copy-gen-disc"] = function () {
    var model = currentBuilt();
    if (!model) return;
    var text = NLLinks.composeShare({
      title: titleFor(model.network, model.built.asin || model.built.itemId),
      url: model.built.url,
      network: model.network,
      disclosures: { amazon: NLStore.getBrand().disclosure, walmart: NLStore.getBrand().walmartDisclosure },
    });
    NLUI.copyText(text).then(function (ok) { NLUI.toast(ok ? "Copied with disclosure." : "Copy failed."); });
  };
  NLUI.actions["share-gen"] = function () {
    var model = currentBuilt();
    if (!model || !can("share")) return;
    var built = model.built;
    NLStore.setDraft({
      url: built.url,
      network: model.network,
      title: titleFor(model.network, built.asin || built.itemId),
    });
    location.hash = "#/whatsapp";
  };
  NLUI.actions["quick-link"] = function (el) {
    if (!can("generate")) { NLUI.toast("Your role cannot generate links."); return; }
    var field = document.getElementById(el.dataset.countryField);
    var country = field ? field.value : "US";
    var network = el.dataset.network;
    var tag = pickTag(network === "walmart" ? "US" : country, network);
    if (!tag) { NLUI.toast("No tracking ID is assigned for that marketplace."); return; }
    var built = network === "walmart"
      ? NLLinks.buildWalmart({ input: el.dataset.id, sharedId: user.slug, partner: tag.partner, adId: tag.adId })
      : NLLinks.buildAmazon({ input: el.dataset.id, country: country, tag: tag.id });
    if (!built.ok) { NLUI.toast(built.error); return; }
    var link = saveLink({
      network: network,
      country: network === "walmart" ? "US" : country,
      tag: tag.id,
      title: titleFor(network, el.dataset.id),
      key: el.dataset.id,
      url: built.url,
    });
    NLUI.toast("Link created.", { action: { label: "Copy", fn: function () { NLUI.copyText(link.url); } } });
  };
  NLUI.actions["pick-seller"] = function (el) {
    state.seller.q = el.dataset.seller;
    state.seller.page = 1;
    render(false);
  };
  NLUI.actions["wa-parse"] = function () {
    var raw = (document.getElementById("wa-paste") || {}).value || "";
    if (!raw.trim()) { NLUI.toast("Paste a product URL first."); return; }
    var walmart = /walmart\.com/i.test(raw);
    if (walmart) {
      var wtag = pickTag("US", "walmart");
      if (!wtag) { NLUI.toast("No Walmart tracking ID is assigned to you."); return; }
      var builtW = NLLinks.buildWalmart({ input: raw, sharedId: user.slug, partner: wtag.partner, adId: wtag.adId });
      if (!builtW.ok) { NLUI.toast(builtW.error); return; }
      state.wa.url = builtW.url;
      state.wa.network = "walmart";
      state.wa.label = titleFor("walmart", builtW.itemId);
      state.wa.linkId = "";
    } else {
      var country = "US";
      try {
        var detected = NLLinks.marketplaceFromHost(new URL(raw).hostname);
        if (detected) country = detected.code;
      } catch (err) { /* asin */ }
      var tag = pickTag(country, "amazon");
      var built = NLLinks.buildAmazon({ input: raw, country: country, tag: tag && tag.id });
      if (built.suggestCountry) {
        country = built.suggestCountry;
        tag = pickTag(country, "amazon");
        built = NLLinks.buildAmazon({ input: raw, country: country, tag: tag && tag.id });
      }
      if (!built.ok) { NLUI.toast(built.error); return; }
      state.wa.url = built.url;
      state.wa.network = "amazon";
      state.wa.label = titleFor("amazon", built.asin);
      state.wa.linkId = "";
    }
    refreshWa();
    NLUI.toast("Link prepared with your assigned ID.");
  };
  NLUI.actions["copy-wa"] = function () {
    if (!can("share") || blockIncentive()) return;
    if (!state.wa.url) { NLUI.toast("Add a product link first."); return; }
    var link = NLLinks.waLink(waMessage(), NLStore.getBot().phone);
    NLUI.copyText(link).then(function (ok) { NLUI.toast(ok ? "wa.me link copied." : "Copy failed."); });
  };
  NLUI.actions["open-wa"] = function () {
    if (!can("share") || blockIncentive()) return;
    if (!state.wa.url) { NLUI.toast("Add a product link first."); return; }
    window.open(NLLinks.waLink(waMessage(), NLStore.getBot().phone), "_blank", "noopener");
  };
  NLUI.actions["bot-send"] = function () {
    var input = document.getElementById("bot-input");
    var text = input.value.trim();
    if (!text) return;
    ensureBot();
    botThread.push({ from: "me", text: text });
    botThread.push({ from: "bot", text: botReply(text) });
    render(false);
  };
  NLUI.actions["bot-reset"] = function () {
    botThread = null;
    ensureBot();
    render(false);
  };
  NLUI.actions["export-days"] = function () {
    var sum = NLData.summary(user.id, state.range);
    NLUI.downloadCsv("northline-days-" + state.range + "d.csv", [["date", "views", "clicks", "orders", "est_earnings_usd"]].concat(sum.series.map(function (row) {
      return [row.date, row.views, row.clicks, row.orders, row.earnings.toFixed(2)];
    })));
  };
  NLUI.actions["export-orders"] = function () {
    var orders = NLData.ordersFor(user.id, state.range);
    NLUI.downloadCsv("northline-orders-" + state.range + "d.csv", [["date", "asin", "title", "market", "tag", "price_usd", "rate", "est_commission_usd", "status"]].concat(orders.map(function (row) {
      return [row.date, row.asin, row.title, row.country, row.tag, row.price, row.rate, row.commission, row.status];
    })));
  };

  NLUI.inputs["gen-input"] = function (el) { state.gen.input = el.value; updateGen(); };
  NLUI.inputs["search-q"] = function (el) {
    state.search.q = el.value;
    state.search.page = 1;
    var host = document.getElementById("search-results");
    if (host) host.innerHTML = searchTable();
  };
  NLUI.inputs["seller-q"] = function (el) {
    state.seller.q = el.value;
    state.seller.page = 1;
    var host = document.getElementById("seller-results");
    if (host) host.innerHTML = sellerTable();
  };
  NLUI.inputs["history-q"] = function (el) {
    state.history.q = el.value;
    state.history.page = 1;
    var host = document.getElementById("history-results");
    if (host) host.innerHTML = historyTable();
  };
  NLUI.inputs["wa-label"] = function (el) { state.wa.label = el.value; refreshWa(); };
  NLUI.inputs["wa-note"] = function (el) { state.wa.note = el.value; refreshWa(); };
  NLUI.inputs["bot-name"] = function (el) {
    NLStore.setBot({ name: el.value });
    var node = document.querySelector(".phone-top strong");
    if (node) node.textContent = el.value || "Desk";
  };
  NLUI.inputs["bot-phone"] = function (el) { NLStore.setBot({ phone: el.value }); };
  NLUI.inputs["bot-greeting"] = function (el) { NLStore.setBot({ greeting: el.value }); };
  NLUI.inputs["global-search"] = function (el) {
    var q = el.value.trim().toLowerCase();
    var box = document.getElementById("palette");
    if (!q) { box.hidden = true; return; }
    var html = "";
    var pages = Object.keys(TITLES).filter(function (href) { return TITLES[href].toLowerCase().indexOf(q) !== -1; });
    if (pages.length) {
      html += '<div class="p-label">Pages</div>' + pages.map(function (href) {
        return '<a href="#' + href + '">' + NLUI.esc(TITLES[href]) + "</a>";
      }).join("");
    }
    var links = myLinks().filter(function (link) {
      return (link.title + link.key + link.tag).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 5);
    if (links.length) {
      html += '<div class="p-label">Your links</div>' + links.map(function (link) {
        return '<button type="button" data-action="copy" data-copy="' + NLUI.esc(link.url) + '"><span class="truncate">' + NLUI.esc(link.title) + '</span><span class="hit-sub">Copy</span></button>';
      }).join("");
    }
    var products = NLData.searchProducts(q, "all").slice(0, 5);
    if (products.length) {
      html += '<div class="p-label">Catalog</div>' + products.map(function (item) {
        return '<a href="#/search">' + NLUI.esc(item.title) + "</a>";
      }).join("");
    }
    box.innerHTML = html || '<div class="p-label">No matches</div>';
    box.hidden = false;
  };

  NLUI.changes["gen-country"] = function (el) {
    state.gen.country = el.value;
    state.gen.tag = "";
    genSig = "";
    updateGen();
  };
  NLUI.changes["gen-tag"] = function (el) {
    state.gen.tag = el.value;
    genSig = "";
    updateGen();
  };
  NLUI.changes["search-network"] = function (el) { state.search.network = el.value; state.search.page = 1; render(false); };
  NLUI.changes["search-country"] = function (el) {
    state.search.country = el.value;
    var host = document.getElementById("search-results");
    if (host) host.innerHTML = searchTable();
  };
  NLUI.changes["seller-country"] = function (el) {
    state.seller.country = el.value;
    var host = document.getElementById("seller-results");
    if (host) host.innerHTML = sellerTable();
  };
  NLUI.changes["history-network"] = function (el) { state.history.network = el.value; state.history.page = 1; render(false); };
  NLUI.changes["history-country"] = function (el) { state.history.country = el.value; state.history.page = 1; render(false); };
  NLUI.changes["wa-link"] = function (el) {
    var link = myLinks().find(function (item) { return item.id === el.value; });
    if (!link) return;
    applyLink(link);
    refreshWa();
    var label = document.querySelector('[data-input="wa-label"]');
    if (label) label.value = state.wa.label;
  };
  NLUI.changes["activity-type"] = function (el) { state.activity.type = el.value; render(false); };
  NLUI.changes["seo-site"] = function (el) { state.seo.site = el.value; render(false); };

  window.addEventListener("hashchange", function () {
    var palette = document.getElementById("palette");
    if (palette) palette.hidden = true;
    var search = document.getElementById("global-search");
    if (search) search.value = "";
    NLUI.closeModal();
    render(true);
  });

  var flash = NLStore.consumeFlash();
  render(true);
  if (flash) NLUI.toast(flash);
})();
