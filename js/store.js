/* Browser storage for session, branding, and demo edits. Seed data stays in js/data.js. */
(function (root) {
  "use strict";

  var KEY = {
    theme: "northline.theme",
    brand: "northline.brand",
    session: "northline.session",
    flash: "northline.flash",
    extraUsers: "northline.users.extra",
    userPatch: "northline.users.patch",
    assignPatch: "northline.assign.patch",
    extraTags: "northline.tags.extra",
    requests: "northline.requests",
    links: "northline.links",
    archived: "northline.links.archived",
    compliance: "northline.compliance",
    workspace: "northline.workspace",
    bot: "northline.bot",
    draft: "northline.draft",
  };

  function read(storage, key, fallback) {
    try {
      var raw = storage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function write(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function load(key, fallback) {
    return read(localStorage, key, fallback);
  }

  function save(key, value) {
    write(localStorage, key, value);
  }

  var ROLES = {
    admin: ["generate", "share", "reports", "admin", "brand", "users", "assign"],
    affiliate: ["generate", "share", "reports"],
    analyst: ["reports"],
  };

  function getBrand() {
    return Object.assign({}, root.NL_DEFAULT_BRAND, load(KEY.brand, {}));
  }

  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16);
    if (!isFinite(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function applyBrand() {
    var brand = getBrand();
    document.querySelectorAll("[data-brand]").forEach(function (el) {
      el.textContent = brand.name;
    });
    document.querySelectorAll("[data-disclosure]").forEach(function (el) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = brand.disclosure;
      else el.textContent = brand.disclosure;
    });
    document.querySelectorAll("[data-walmart-disclosure]").forEach(function (el) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = brand.walmartDisclosure;
      else el.textContent = brand.walmartDisclosure;
    });
    var accent = brand.accent || "#1e4d8c";
    var styled = document.documentElement;
    styled.style.setProperty("--link", accent);
    styled.style.setProperty("--chart-1", accent);
    var rgb = hexToRgb(accent);
    if (rgb) {
      styled.style.setProperty("--focus-ring", "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0.22)");
      styled.style.setProperty("--info-bg", "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0.10)");
    }
    var chart2 = accent.toLowerCase() === "#8f3d1b" ? "#1e4d8c" : "#8f3d1b";
    styled.style.setProperty("--chart-2", chart2);
    return brand;
  }

  function setBrand(patch) {
    var next = Object.assign({}, load(KEY.brand, {}), patch);
    save(KEY.brand, next);
    return applyBrand();
  }

  function resetBrand() {
    localStorage.removeItem(KEY.brand);
    return applyBrand();
  }

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY.theme, theme);
  }

  function getUsers() {
    var patch = load(KEY.userPatch, {});
    var extra = load(KEY.extraUsers, []);
    var seeded = root.NLData.SEED_USERS.map(function (user) {
      return Object.assign({}, user, patch[user.id] || {});
    });
    return seeded.concat(extra);
  }

  function patchUser(id, patch) {
    var extra = load(KEY.extraUsers, []);
    var index = extra.findIndex(function (user) { return user.id === id; });
    if (index >= 0) {
      extra[index] = Object.assign({}, extra[index], patch);
      save(KEY.extraUsers, extra);
      return extra[index];
    }
    var all = load(KEY.userPatch, {});
    all[id] = Object.assign({}, all[id] || {}, patch);
    save(KEY.userPatch, all);
    return getUsers().find(function (user) { return user.id === id; });
  }

  function createUser(fields) {
    var extra = load(KEY.extraUsers, []);
    var slug = String(fields.email || "").split("@")[0].replace(/[^a-z0-9]+/gi, "").slice(0, 14).toLowerCase() || "user";
    var user = {
      id: "u_" + Math.random().toString(36).slice(2, 8),
      name: fields.name,
      email: fields.email,
      role: fields.role || "affiliate",
      status: fields.status || "active",
      lastSeenMin: null,
      slug: slug,
      title: fields.role === "admin" ? "Administrator" : "Affiliate",
    };
    extra.push(user);
    save(KEY.extraUsers, extra);
    if (fields.assignments) setAssignments(user.id, fields.assignments);
    return user;
  }

  function getTags() {
    return root.NLData.SEED_TAGS.concat(load(KEY.extraTags, []));
  }

  function addTag(tag) {
    var extra = load(KEY.extraTags, []);
    extra.push(tag);
    save(KEY.extraTags, extra);
  }

  function removeTag(id) {
    var extra = load(KEY.extraTags, []).filter(function (tag) { return tag.id !== id; });
    save(KEY.extraTags, extra);
  }

  function getAssignments() {
    var patch = load(KEY.assignPatch, {});
    var seeded = root.NLData.SEED_ASSIGNMENTS.filter(function (row) {
      return !Object.prototype.hasOwnProperty.call(patch, row.userId);
    });
    var extra = [];
    Object.keys(patch).forEach(function (userId) {
      (patch[userId] || []).forEach(function (row) {
        extra.push({ userId: userId, tagId: row.tagId, isDefault: !!row.isDefault });
      });
    });
    return seeded.concat(extra);
  }

  function setAssignments(userId, list) {
    var patch = load(KEY.assignPatch, {});
    patch[userId] = list.map(function (row) {
      return { tagId: row.tagId, isDefault: !!row.isDefault };
    });
    save(KEY.assignPatch, patch);
  }

  function getRequests() {
    return load(KEY.requests, []);
  }

  function addRequest(request) {
    var all = getRequests();
    all.unshift(request);
    save(KEY.requests, all);
  }

  function removeRequest(id) {
    save(KEY.requests, getRequests().filter(function (item) { return item.id !== id; }));
  }

  function getLinks() {
    var archived = load(KEY.archived, []);
    return root.NLData.seedLinks().concat(load(KEY.links, [])).filter(function (link) {
      return archived.indexOf(link.id) === -1;
    }).sort(function (a, b) {
      return a.createdAt < b.createdAt ? 1 : -1;
    });
  }

  function addLink(link) {
    var all = load(KEY.links, []);
    all.unshift(link);
    save(KEY.links, all);
    return link;
  }

  function archiveLink(id) {
    var all = load(KEY.archived, []);
    if (all.indexOf(id) === -1) all.push(id);
    save(KEY.archived, all);
  }

  function getCompliance() {
    return Object.assign({ reviewed: false, specialTerms: false, note: "" }, load(KEY.compliance, {}));
  }

  function setCompliance(patch) {
    save(KEY.compliance, Object.assign(getCompliance(), patch));
  }

  function getWorkspace() {
    var brand = getBrand();
    return Object.assign({
      supportEmail: brand.supportEmail,
      sessionHours: 12,
      domain: brand.domain,
    }, load(KEY.workspace, {}));
  }

  function setWorkspace(patch) {
    save(KEY.workspace, Object.assign(getWorkspace(), patch));
  }

  function getBot() {
    return Object.assign({
      name: "Northline desk",
      phone: "+1 415 555 0148",
      greeting: "Paste an Amazon or Walmart product URL. I will return a house affiliate link with the required disclosure.",
    }, load(KEY.bot, {}));
  }

  function setBot(patch) {
    save(KEY.bot, Object.assign(getBot(), patch));
  }

  function setSession(userId) {
    write(sessionStorage, KEY.session, { userId: userId, signedInAt: Date.now() });
  }

  function clearSession() {
    sessionStorage.removeItem(KEY.session);
  }

  function currentUser() {
    var session = read(sessionStorage, KEY.session, null);
    if (!session) return null;
    var user = getUsers().find(function (item) { return item.id === session.userId; });
    if (!user || user.status !== "active") {
      clearSession();
      return null;
    }
    return user;
  }

  function can(user, cap) {
    if (!user) return false;
    var list = ROLES[user.role] || [];
    return list.indexOf(cap) !== -1;
  }

  function findByEmail(email) {
    var needle = String(email || "").trim().toLowerCase();
    return getUsers().find(function (user) { return user.email.toLowerCase() === needle; }) || null;
  }

  function flash(message) {
    sessionStorage.setItem(KEY.flash, message);
  }

  function consumeFlash() {
    var message = sessionStorage.getItem(KEY.flash);
    sessionStorage.removeItem(KEY.flash);
    return message;
  }

  function setDraft(draft) {
    write(sessionStorage, KEY.draft, draft);
  }

  function consumeDraft() {
    var draft = read(sessionStorage, KEY.draft, null);
    sessionStorage.removeItem(KEY.draft);
    return draft;
  }

  function clearDemoEdits() {
    [KEY.brand, KEY.extraUsers, KEY.userPatch, KEY.assignPatch, KEY.extraTags, KEY.requests, KEY.links, KEY.archived, KEY.compliance, KEY.workspace, KEY.bot].forEach(function (key) {
      localStorage.removeItem(key);
    });
    applyBrand();
  }

  root.NLStore = {
    ROLES: ROLES,
    DEMO_PASSWORD: "desk-2041",
    getBrand: getBrand,
    applyBrand: applyBrand,
    setBrand: setBrand,
    resetBrand: resetBrand,
    getTheme: getTheme,
    setTheme: setTheme,
    getUsers: getUsers,
    patchUser: patchUser,
    createUser: createUser,
    getTags: getTags,
    addTag: addTag,
    removeTag: removeTag,
    getAssignments: getAssignments,
    setAssignments: setAssignments,
    getRequests: getRequests,
    addRequest: addRequest,
    removeRequest: removeRequest,
    getLinks: getLinks,
    addLink: addLink,
    archiveLink: archiveLink,
    getCompliance: getCompliance,
    setCompliance: setCompliance,
    getWorkspace: getWorkspace,
    setWorkspace: setWorkspace,
    getBot: getBot,
    setBot: setBot,
    setSession: setSession,
    clearSession: clearSession,
    currentUser: currentUser,
    can: can,
    findByEmail: findByEmail,
    flash: flash,
    consumeFlash: consumeFlash,
    setDraft: setDraft,
    consumeDraft: consumeDraft,
    clearDemoEdits: clearDemoEdits,
  };
})(typeof window !== "undefined" ? window : globalThis);
