(function (root) {
  "use strict";

  var actions = {};
  var inputs = {};
  var changes = {};
  var chartSpecs = {};

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function icon(name) {
    return '<span class="ico">' + (root.NLIcon(name) || "") + "</span>";
  }

  function num(value) {
    return new Intl.NumberFormat("en-US").format(Math.round(value || 0));
  }

  function money(value, currency) {
    var code = currency || "USD";
    var digits = code === "JPY" ? 0 : 2;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value || 0);
  }

  function pct(value) {
    return (value * 100).toFixed(2) + "%";
  }

  function compact(value) {
    var n = Number(value) || 0;
    if (n >= 10000) return Math.round(n / 1000) + "k";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(Math.round(n));
  }

  function day(iso) {
    var parts = String(iso).slice(0, 10).split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(dt);
  }

  function dayYear(iso) {
    var parts = String(iso).slice(0, 10).split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(dt);
  }

  function stamp(iso) {
    var dt = new Date(iso);
    var date = new Intl.DateTimeFormat("en-GB", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    }).format(dt);
    var time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC",
    }).format(dt);
    return date + ", " + time + " UTC";
  }

  function relMin(min) {
    if (min == null) return "Never";
    if (min < 1) return "Just now";
    if (min < 60) return min + " min ago";
    var hours = Math.round(min / 60);
    if (hours < 24) return hours === 1 ? "1 hour ago" : hours + " hours ago";
    var days = Math.round(min / 1440);
    if (days === 1) return "Yesterday";
    if (days < 14) return days + " days ago";
    return Math.round(days / 7) + " wk ago";
  }

  function fmtDelta(value) {
    if (value == null || !isFinite(value)) return "—";
    var arrow = value > 0.0005 ? "up" : value < -0.0005 ? "down" : "flat";
    var sign = value > 0.0005 ? "+" : value < -0.0005 ? "−" : "";
    return { text: sign + Math.abs(value * 100).toFixed(1) + "%", tone: arrow };
  }

  function fmtPp(value) {
    if (value == null || !isFinite(value)) return { text: "—", tone: "flat" };
    var tone = value > 0.005 ? "up" : value < -0.005 ? "down" : "flat";
    var sign = value > 0.005 ? "+" : value < -0.005 ? "−" : "";
    return { text: sign + Math.abs(value).toFixed(1) + " pp", tone: tone };
  }

  function badge(text, tone) {
    return '<span class="badge badge-' + (tone || "neutral") + '">' + esc(text) + "</span>";
  }

  function statusBadge(status) {
    var tone = status === "active" || status === "cleared" || status === "Connected" ? "ok"
      : status === "pending" ? "warn"
      : status === "suspended" || status === "returned" ? "bad"
      : "neutral";
    var label = status.charAt(0).toUpperCase() + status.slice(1);
    return badge(label, tone);
  }

  function initials(name) {
    return String(name || "?").split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join("").toUpperCase();
  }

  function tileClass(name) {
    var n = 0;
    var str = String(name || "");
    for (var i = 0; i < str.length; i++) n = (n + str.charCodeAt(i)) % 5;
    return "tile tile-" + n;
  }

  function pageHeader(opts) {
    return '<div class="page-h"><div><h1>' + esc(opts.title) + "</h1>" +
      (opts.desc ? '<p class="page-desc">' + opts.desc + "</p>" : "") +
      '</div><div class="page-actions">' + (opts.actions || "") + "</div></div>";
  }

  function notice(html) {
    return '<div class="notice">' + html + "</div>";
  }

  function empty(title, text) {
    return '<div class="empty"><h3>' + esc(title) + "</h3><p>" + esc(text) + "</p></div>";
  }

  function metrics(items) {
    return '<section class="metrics">' + items.map(function (item) {
      var delta = item.delta;
      var deltaHtml = "";
      if (delta) {
        deltaHtml = '<div class="metric-delta ' + delta.tone + '">' + esc(delta.text) +
          (item.deltaLabel ? "<span>" + esc(item.deltaLabel) + "</span>" : "") + "</div>";
      }
      return '<div class="metric"><div class="metric-label">' + esc(item.label) + '</div><div class="metric-value">' +
        item.value + "</div>" + deltaHtml + "</div>";
    }).join("") + "</section>";
  }

  function sortRows(rows, key, dir, columns) {
    var col = columns.find(function (item) { return item.key === key; });
    var val = function (row) { return col && col.sort ? col.sort(row) : row[key]; };
    var m = dir === "asc" ? 1 : -1;
    return rows.slice().sort(function (a, b) {
      var va = val(a);
      var vb = val(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * m;
      return String(va == null ? "" : va).localeCompare(String(vb == null ? "" : vb)) * m;
    });
  }

  function dataTable(opts) {
    var pageSize = opts.perPage || 10;
    var sorted = sortRows(opts.rows, opts.sort, opts.dir || "desc", opts.columns);
    var pages = Math.max(1, Math.ceil(sorted.length / pageSize));
    var page = Math.min(Math.max(1, opts.page || 1), pages);
    if (root.NLUI && root.NLUI.state && root.NLUI.state[opts.name]) {
      root.NLUI.state[opts.name].page = page;
    }
    var slice = sorted.slice((page - 1) * pageSize, page * pageSize);
    var head = "<thead><tr>" + opts.columns.map(function (col) {
      var active = opts.sort === col.key;
      var arrow = active ? (opts.dir === "asc" ? "↑" : "↓") : "";
      var colClass = [col.num ? "num" : "", col.hide ? "hide-sm" : ""].filter(Boolean).join(" ");
      if (!col.label) return '<th class="' + colClass + '"></th>';
      return '<th class="' + colClass + '"><button type="button" class="th-btn' + (active ? " on" : "") +
        '" data-action="sort" data-table="' + esc(opts.name) + '" data-key="' + esc(col.key) + '">' +
        esc(col.label) + (arrow ? '<span class="arrow">' + arrow + "</span>" : "") + "</button></th>";
    }).join("") + "</tr></thead>";
    var body;
    if (!slice.length) {
      body = '<tr><td colspan="' + opts.columns.length + '">' + empty(opts.emptyTitle || "Nothing here", opts.emptyText || "Try a different filter.") + "</td></tr>";
    } else {
      body = slice.map(function (row) {
        return "<tr>" + opts.columns.map(function (col) {
          return '<td class="' + [col.num ? "num" : "", col.hide ? "hide-sm" : ""].filter(Boolean).join(" ") + '">' + col.html(row) + "</td>";
        }).join("") + "</tr>";
      }).join("");
    }
    var from = sorted.length ? (page - 1) * pageSize + 1 : 0;
    var to = Math.min(page * pageSize, sorted.length);
    var pager = '<div class="pager"><span>' + (sorted.length ? from + "–" + to + " of " + num(sorted.length) : "0") +
      '</span><div class="row"><button type="button" class="btn btn-sm" data-action="page" data-table="' + esc(opts.name) +
      '" data-dir="-1"' + (page <= 1 ? " disabled" : "") + '>Previous</button><button type="button" class="btn btn-sm" data-action="page" data-table="' +
      esc(opts.name) + '" data-dir="1"' + (page >= pages ? " disabled" : "") + ">Next</button></div></div>";
    return '<div class="table-scroll"><table class="data">' + head + "<tbody>" + body + "</tbody></table></div>" + pager;
  }

  function spark(values) {
    if (!values || values.length < 2) return "";
    var w = 84;
    var h = 22;
    var max = Math.max.apply(null, values);
    var min = Math.min.apply(null, values);
    var pts = values.map(function (v, i) {
      var x = (i / (values.length - 1)) * (w - 2) + 1;
      var y = (h - 3) - ((v - min) / ((max - min) || 1)) * (h - 6);
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    return '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><polyline fill="none" stroke="var(--chart-1)" stroke-width="1.5" points="' + pts + '"/></svg>';
  }

  function mountLineChart(el, spec) {
    var w = 720;
    var h = 232;
    var pad = { l: 46, r: spec.right ? 46 : 12, t: 14, b: 28 };
    var iw = w - pad.l - pad.r;
    var ih = h - pad.t - pad.b;
    var leftSeries = spec.series.filter(function (s) { return s.axis !== "r"; });
    var rightSeries = spec.series.filter(function (s) { return s.axis === "r"; });
    var leftMax = Math.max(1, 0);
    leftSeries.forEach(function (s) { s.values.forEach(function (v) { if (v > leftMax) leftMax = v; }); });
    var rightMax = Math.max(1, 0);
    rightSeries.forEach(function (s) { s.values.forEach(function (v) { if (v > rightMax) rightMax = v; }); });
    leftMax *= 1.12;
    rightMax *= 1.12;
    var labels = spec.labels;
    function x(i) {
      if (labels.length <= 1) return pad.l + iw / 2;
      return pad.l + (i / (labels.length - 1)) * iw;
    }
    function y(v, max) {
      return pad.t + ih - (v / max) * ih;
    }
    var grid = "";
    for (var g = 0; g < 4; g++) {
      var t = g / 3;
      var yy = y(leftMax * t, leftMax);
      grid += '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="var(--chart-grid)" stroke-width="1"></line>';
      grid += '<text x="' + (pad.l - 8) + '" y="' + (yy + 3).toFixed(1) + '" text-anchor="end" fill="var(--chart-label)" font-size="11">' + compact(leftMax * t) + "</text>";
      if (spec.right) {
        grid += '<text x="' + (w - pad.r + 8) + '" y="' + (yy + 3).toFixed(1) + '" text-anchor="start" fill="var(--chart-label)" font-size="11">' + compact(rightMax * t) + "</text>";
      }
    }
    var paths = spec.series.map(function (s) {
      var max = s.axis === "r" ? rightMax : leftMax;
      var line = s.values.map(function (v, i) {
        return (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v, max).toFixed(1);
      }).join("");
      var area = "";
      if (s.fill && s.values.length) {
        area = "M" + x(0).toFixed(1) + "," + (pad.t + ih).toFixed(1) + s.values.map(function (v, i) {
          return "L" + x(i).toFixed(1) + "," + y(v, max).toFixed(1);
        }).join("") + "L" + x(s.values.length - 1).toFixed(1) + "," + (pad.t + ih).toFixed(1) + "Z";
        area = '<path d="' + area + '" fill="var(' + s.colorVar + ')" opacity="0.08"></path>';
      }
      return area + '<path d="' + line + '" fill="none" stroke="var(' + s.colorVar + ')" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round"></path>';
    }).join("");
    var step = Math.max(1, Math.ceil(labels.length / 6));
    var xlab = labels.map(function (lb, i) {
      if (i % step !== 0 && i !== labels.length - 1) return "";
      return '<text x="' + x(i).toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" fill="var(--chart-label)" font-size="11">' + esc(lb) + "</text>";
    }).join("");
    el.innerHTML = '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" height="232" role="img" aria-label="' + esc(spec.label || "Chart") + '">' + grid + paths + xlab + '</svg><div class="chart-tip" hidden></div>';
    var svg = el.querySelector("svg");
    var tip = el.querySelector(".chart-tip");
    svg.addEventListener("mousemove", function (event) {
      var rect = svg.getBoundingClientRect();
      var px = ((event.clientX - rect.left) / rect.width) * w;
      var best = 0;
      var bestD = 1e9;
      for (var i = 0; i < labels.length; i++) {
        var d = Math.abs(x(i) - px);
        if (d < bestD) { bestD = d; best = i; }
      }
      tip.hidden = false;
      tip.innerHTML = "<strong>" + esc(labels[best]) + "</strong>" + spec.series.map(function (s) {
        return '<div><i class="swatch ' + s.swatch + '"></i><span>' + esc(s.name) + '</span><b>' + esc(s.format ? s.format(s.values[best]) : num(s.values[best])) + "</b></div>";
      }).join("");
      var leftPct = (x(best) / w) * 100;
      tip.style.left = Math.min(76, Math.max(24, leftPct)) + "%";
    });
    svg.addEventListener("mouseleave", function () { tip.hidden = true; });
  }

  function afterPaint() {
    document.querySelectorAll("[data-bar]").forEach(function (el) {
      var value = Math.max(0, Math.min(100, Number(el.dataset.bar) || 0));
      el.style.width = value + "%";
    });
    document.querySelectorAll("[data-chart]").forEach(function (el) {
      if (chartSpecs[el.id]) mountLineChart(el, chartSpecs[el.id]);
    });
  }

  function toast(message, opts) {
    opts = opts || {};
    var host = document.getElementById("toaster");
    if (!host) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    var span = document.createElement("span");
    span.textContent = message;
    el.appendChild(span);
    if (opts.action) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = opts.action.label;
      button.addEventListener("click", function () {
        opts.action.fn();
        el.remove();
      });
      el.appendChild(button);
    }
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, opts.ms || 3400);
  }

  function closeModal() {
    var host = document.getElementById("modal-root");
    if (host) host.innerHTML = "";
    document.body.classList.remove("lock");
  }

  function openModal(title, body, footer, wide) {
    var host = document.getElementById("modal-root");
    host.innerHTML = '<div class="modal-back" data-action="close-modal"><div class="modal' + (wide ? " wide" : "") +
      '" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-h"><h2 id="modal-title">' +
      esc(title) + '</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Close">' +
      icon("x") + '</button></div><div class="modal-b">' + body + "</div>" +
      (footer ? '<div class="modal-f">' + footer + "</div>" : "") + "</div></div>";
    document.body.classList.add("lock");
    var field = host.querySelector("input, select, textarea, button");
    if (field) field.focus();
  }

  function confirmModal(opts) {
    openModal(opts.title, "<p>" + esc(opts.body) + "</p>",
      '<button type="button" class="btn" data-action="close-modal">Cancel</button><button type="button" class="btn ' +
      (opts.danger ? "btn-danger" : "btn-primary") + '" data-action="confirm-do">' + esc(opts.confirmLabel || "Confirm") + "</button>");
    actions["confirm-do"] = function () {
      closeModal();
      opts.onConfirm();
    };
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () {
        return fallbackCopy(text);
      });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    area.remove();
    return ok;
  }

  function closeMenus() {
    document.querySelectorAll(".menu").forEach(function (menu) { menu.hidden = true; });
  }

  function closeNav() {
    var sidebar = document.getElementById("sidebar");
    var backdrop = document.getElementById("backdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.hidden = true;
  }

  function shell(opts) {
    var nav = opts.nav.map(function (group) {
      return '<div class="nav-sec"><div class="nav-label">' + esc(group.label) + "</div>" +
        group.items.map(function (item) {
          return '<a class="nav-link" href="#' + item.href + '" data-nav="' + item.href + '">' + icon(item.icon) + "<span>" + esc(item.label) + "</span></a>";
        }).join("") + "</div>";
    }).join("");
    var mobile = opts.mobile.map(function (item) {
      if (item.action) {
        return '<button type="button" data-action="' + item.action + '">' + icon(item.icon) + "<span>" + esc(item.label) + "</span></button>";
      }
      return '<a href="#' + item.href + '" data-nav="' + item.href + '">' + icon(item.icon) + "<span>" + esc(item.label) + "</span></a>";
    }).join("");
    document.getElementById("app").innerHTML =
      '<div class="app"><aside class="sidebar" id="sidebar"><a class="brand" href="#' + opts.home + '">' + root.NLMark() +
      '<span class="brand-name" data-brand>' + esc(root.NL_DEFAULT_BRAND.name) + "</span></a><nav>" + nav +
      '</nav><div class="sidebar-foot"><div class="me"><div class="avatar">' + esc(initials(opts.user.name)) +
      '</div><div class="min"><strong>' + esc(opts.user.name) + "</strong><span>" + esc(opts.user.title || opts.user.role) +
      '</span></div></div><p class="side-note">Associate disclosure is added to every share.</p></div></aside>' +
      '<div class="backdrop" id="backdrop" data-action="close-nav" hidden></div><div class="main-col"><header class="topbar">' +
      '<button type="button" class="icon-btn nav-toggle" data-action="toggle-nav" aria-label="Open menu">' + icon("menu") +
      '</button><div class="search"><span class="ico">' + root.NLIcon("search") + '</span><input id="global-search" data-input="global-search" type="search" placeholder="' +
      esc(opts.searchPlaceholder || "Search") + '" autocomplete="off" aria-label="Search"><kbd>/</kbd><div class="palette" id="palette" hidden></div></div>' +
      '<div class="top-actions"><button type="button" class="icon-btn" data-action="toggle-theme" aria-label="Toggle color theme" id="theme-btn"></button>' +
      '<div class="menu-wrap"><button type="button" class="user-btn" data-action="toggle-user-menu" aria-haspopup="menu">' +
      '<span class="avatar sm">' + esc(initials(opts.user.name)) + '</span><span class="user-name">' + esc(opts.user.name) +
      '</span></button><div class="menu" id="user-menu" hidden role="menu"><div class="who"><strong>' + esc(opts.user.name) +
      "</strong><span>" + esc(opts.user.email) + "</span></div><div class=\"sep\"></div>" + opts.menu +
      '<button type="button" data-action="install-app">' + icon("install") + "Install app</button>" +
      '<button type="button" data-action="sign-out">' + icon("logout") + "Sign out</button></div></div></div></header>" +
      '<main id="view" class="content" tabindex="-1"></main></div></div><nav class="tabbar">' + mobile + "</nav>";
    paintThemeButton();
  }

  function paintThemeButton() {
    var button = document.getElementById("theme-btn");
    if (!button) return;
    var dark = root.NLStore.getTheme() === "dark";
    button.innerHTML = icon(dark ? "sun" : "moon");
    button.setAttribute("aria-label", dark ? "Switch to light" : "Switch to dark");
  }

  function setActive(path) {
    document.querySelectorAll("[data-nav]").forEach(function (el) {
      var on = el.dataset.nav === path;
      el.classList.toggle("active", on);
      if (on) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
  }

  function downloadCsv(filename, rows) {
    var csv = rows.map(function (row) {
      return row.map(function (cell) {
        return '"' + String(cell == null ? "" : cell).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function rangeControl(current) {
    return '<div class="seg" role="group" aria-label="Date range">' + [7, 30, 90].map(function (days) {
      return '<button type="button" data-action="range" data-days="' + days + '" aria-pressed="' + (current === days ? "true" : "false") + '">' + days + "d</button>";
    }).join("") + "</div>";
  }

  document.addEventListener("click", function (event) {
    var el = event.target.closest("[data-action]");
    if (!el || el.disabled) return;
    var fn = actions[el.dataset.action];
    if (!fn) return;
    if (el.tagName !== "A") event.preventDefault();
    fn(el, event);
  });

  document.addEventListener("input", function (event) {
    var el = event.target.closest("[data-input]");
    if (!el) return;
    var fn = inputs[el.dataset.input];
    if (fn) fn(el, event);
  });

  document.addEventListener("change", function (event) {
    var el = event.target.closest("[data-change]");
    if (!el) return;
    var fn = changes[el.dataset.change];
    if (fn) fn(el, event);
  });

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form.dataset || !form.dataset.action) return;
    event.preventDefault();
    var fn = actions[form.dataset.action];
    if (fn) fn(form, event);
  });

  document.addEventListener("mousedown", function (event) {
    if (!event.target.closest(".menu-wrap")) closeMenus();
    if (!event.target.closest(".search")) {
      var palette = document.getElementById("palette");
      if (palette) palette.hidden = true;
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
      closeMenus();
      closeNav();
      var palette = document.getElementById("palette");
      if (palette) palette.hidden = true;
    }
    var typing = event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if (event.key === "/" && !typing) {
      var search = document.getElementById("global-search");
      if (search) {
        event.preventDefault();
        search.focus();
      }
    }
  });

  window.addEventListener("resize", function () {
    clearTimeout(root.NLUI._rs);
    root.NLUI._rs = setTimeout(afterPaint, 120);
  });

  actions["toggle-nav"] = function () {
    var sidebar = document.getElementById("sidebar");
    var backdrop = document.getElementById("backdrop");
    var open = sidebar.classList.toggle("open");
    backdrop.hidden = !open;
  };
  actions["close-nav"] = closeNav;
  actions["toggle-theme"] = function () {
    var next = root.NLStore.getTheme() === "dark" ? "light" : "dark";
    root.NLStore.setTheme(next);
    paintThemeButton();
    afterPaint();
  };
  actions["toggle-user-menu"] = function () {
    var menu = document.getElementById("user-menu");
    menu.hidden = !menu.hidden;
  };
  actions["sign-out"] = function () {
    root.NLStore.clearSession();
    location.href = "index.html";
  };
  actions["close-modal"] = function (el, event) {
    if (el.classList.contains("modal-back") && event.target !== el) return;
    closeModal();
  };
  actions.copy = function (el) {
    var text = el.dataset.copy;
    if (!text && el.dataset.copyTarget) {
      var node = document.getElementById(el.dataset.copyTarget);
      text = node ? node.textContent : "";
    }
    copyText(text || "").then(function (ok) {
      toast(ok ? "Copied" : "Copy failed. Select the text and copy it manually.");
      if (ok && el.dataset.copyLabel !== "0") {
        var original = el.dataset.label || el.textContent;
        if (!el.dataset.label) el.dataset.label = original.trim();
        if (el.querySelector(".ico")) return;
        el.textContent = "Copied";
        setTimeout(function () { el.textContent = el.dataset.label; }, 1400);
      }
    });
  };
  actions.sort = function (el) {
    var state = root.NLUI.state && root.NLUI.state[el.dataset.table];
    if (!state) return;
    var key = el.dataset.key;
    if (state.sort === key) state.dir = state.dir === "asc" ? "desc" : "asc";
    else {
      state.sort = key;
      state.dir = "desc";
    }
    state.page = 1;
    root.NLUI.rerender();
  };
  actions.page = function (el) {
    var state = root.NLUI.state && root.NLUI.state[el.dataset.table];
    if (!state) return;
    state.page = (state.page || 1) + Number(el.dataset.dir || 1);
    root.NLUI.rerender();
  };
  actions["install-app"] = function () {
    if (root.NLInstall) root.NLInstall();
    else toast("To install, use the browser menu and choose Install app. A secure context is required.");
  };

  root.NLUI = {
    esc: esc,
    icon: icon,
    num: num,
    money: money,
    pct: pct,
    compact: compact,
    day: day,
    dayYear: dayYear,
    stamp: stamp,
    relMin: relMin,
    fmtDelta: fmtDelta,
    fmtPp: fmtPp,
    badge: badge,
    statusBadge: statusBadge,
    initials: initials,
    tileClass: tileClass,
    pageHeader: pageHeader,
    notice: notice,
    empty: empty,
    metrics: metrics,
    dataTable: dataTable,
    spark: spark,
    toast: toast,
    openModal: openModal,
    closeModal: closeModal,
    confirmModal: confirmModal,
    copyText: copyText,
    shell: shell,
    setActive: setActive,
    closeNav: closeNav,
    downloadCsv: downloadCsv,
    rangeControl: rangeControl,
    afterPaint: afterPaint,
    actions: actions,
    inputs: inputs,
    changes: changes,
    chartSpecs: chartSpecs,
    state: null,
    rerender: function () {},
  };
})(typeof window !== "undefined" ? window : globalThis);
