(function () {
  "use strict";

  var user = NLStore.currentUser();
  if (!user) {
    location.href = "index.html";
    return;
  }
  if (user.role !== "admin") {
    NLStore.flash("That area is for administrators.");
    location.href = "app.html";
    return;
  }

  var state = {
    range: 30,
    users: { q: "", role: "all", status: "all", tab: "directory", sort: "name", dir: "asc", page: 1 },
    links: { q: "", user: "all", network: "all", sort: "createdAt", dir: "desc", page: 1 },
    tags: { sort: "id", dir: "asc", page: 1 },
    people: { sort: "earnings", dir: "desc", page: 1 },
    settings: { tab: "brand" },
  };
  NLUI.state = state;
  var brandDraft = Object.assign({}, NLStore.getBrand());
  var lastPath = "";

  var NAV = [
    { label: "Overview", items: [{ href: "/overview", label: "Overview", icon: "chart" }] },
    { label: "Directory", items: [
      { href: "/users", label: "Users", icon: "users" },
      { href: "/tags", label: "Tracking IDs", icon: "hash" },
      { href: "/links", label: "Links", icon: "link" },
    ] },
    { label: "Measure", items: [{ href: "/reports", label: "Reports", icon: "activity" }] },
    { label: "System", items: [
      { href: "/integrations", label: "Integrations", icon: "plug" },
      { href: "/settings", label: "Settings", icon: "settings" },
    ] },
  ];
  var TITLES = {
    "/overview": "Overview",
    "/users": "Users",
    "/tags": "Tracking IDs",
    "/links": "Links",
    "/reports": "Reports",
    "/integrations": "Integrations",
    "/settings": "Settings",
  };

  NLUI.shell({
    user: user,
    home: "/overview",
    searchPlaceholder: "Search users and pages",
    nav: NAV,
    mobile: [
      { href: "/overview", label: "Overview", icon: "chart" },
      { href: "/users", label: "Users", icon: "users" },
      { href: "/reports", label: "Reports", icon: "activity" },
      { href: "/settings", label: "Settings", icon: "settings" },
      { action: "more", label: "More", icon: "more" },
    ],
    menu: '<a href="app.html">' + NLUI.icon("link") + "Affiliate desk</a>",
  });
  NLStore.applyBrand();

  function path() {
    var raw = (location.hash || "#/overview").replace(/^#/, "").split("?")[0];
    if (!raw || raw === "/") return "/overview";
    return raw.charAt(0) === "/" ? raw : "/" + raw;
  }

  function people() { return NLStore.getUsers(); }

  function person(id) { return people().find(function (item) { return item.id === id; }); }

  function liveSummary(id) {
    if (!NLData.SEED_USERS.some(function (item) { return item.id === id && item.profile; })) {
      return { clicks: 0, orders: 0, earnings: 0, conv: 0, views: 0, dClicks: null, dOrders: null, dEarnings: null, dConvPp: 0, series: [], days: state.range, prev: { clicks: 0, orders: 0, earnings: 0, conv: 0 } };
    }
    return NLData.summary(id, state.range);
  }

  function pageOverview() {
    var house = NLData.house(state.range);
    NLUI.chartSpecs.house = {
      label: "House clicks and orders",
      right: true,
      labels: house.series.map(function (row) { return NLUI.day(row.date); }),
      series: [
        { name: "Clicks", values: house.series.map(function (row) { return row.clicks; }), colorVar: "--chart-1", swatch: "swatch-a", fill: true, format: NLUI.num },
        { name: "Orders", values: house.series.map(function (row) { return row.orders; }), axis: "r", colorVar: "--chart-2", swatch: "swatch-b", format: NLUI.num },
      ],
    };
    var requests = NLStore.getRequests();
    var pendingUsers = people().filter(function (item) { return item.status === "pending"; });
    var active = people().filter(function (item) { return item.role === "affiliate" && item.status === "active"; }).length;
    var label = "vs prior " + state.range + " days";
    var queue = requests.map(function (item) {
      return '<div class="id-row"><div><strong>' + NLUI.esc(item.name) + '</strong><div class="muted">' + NLUI.esc(item.email) + "</div></div>" +
        '<div class="row"><button type="button" class="btn btn-sm btn-primary" data-action="approve-request" data-id="' + NLUI.esc(item.id) + '">Approve</button>' +
        '<button type="button" class="btn btn-sm" data-action="decline-request" data-id="' + NLUI.esc(item.id) + '">Decline</button></div></div>';
    }).join("") + pendingUsers.map(function (item) {
      return '<div class="id-row"><div><strong>' + NLUI.esc(item.name) + '</strong><div class="muted">Issued, waiting for approval</div></div>' +
        '<button type="button" class="btn btn-sm btn-primary" data-action="set-status" data-id="' + item.id + '" data-status="active">Approve</button></div>';
    }).join("");
    return NLUI.pageHeader({
      title: "Overview",
      desc: "House account for the last " + state.range + " days. " + NLUI.stamp(NLData.importStamp()) + " import. End users do not connect their own affiliate accounts.",
      actions: NLUI.rangeControl(state.range),
    }) + NLUI.metrics([
      { label: "Awaiting approval", value: NLUI.num(requests.length + pendingUsers.length) },
      { label: "Active affiliates", value: NLUI.num(active) },
      { label: "Outbound clicks", value: NLUI.num(house.clicks), delta: NLUI.fmtDelta(house.dClicks), deltaLabel: label },
      { label: "Est. earnings", value: NLUI.money(house.earnings), delta: NLUI.fmtDelta(house.dEarnings), deltaLabel: label },
    ]) + '<div class="dash-grid"><section class="panel"><div class="panel-h"><span>House activity</span><div class="legend"><span><i class="swatch swatch-a"></i>Clicks</span><span><i class="swatch swatch-b"></i>Orders</span></div></div><div class="panel-b"><div id="house" class="chart" data-chart></div></div></section>' +
      '<section class="panel"><div class="panel-h"><span>Needs a decision</span></div><div class="panel-b">' +
      (queue || '<p class="help">No access requests. New people are added from Users.</p>') +
      "</div></section></div>" + topTable();
  }

  function performanceRows() {
    return people().filter(function (item) { return item.role !== "admin"; }).map(function (item) {
      var sum = liveSummary(item.id);
      return { id: item.id, name: item.name, email: item.email, role: item.role, status: item.status, clicks: sum.clicks, orders: sum.orders, earnings: sum.earnings, conv: sum.conv };
    });
  }

  function topTable() {
    return '<section class="panel"><div class="panel-h"><span>By person</span><a href="#/reports">Reports</a></div>' + NLUI.dataTable({
      name: "people",
      rows: performanceRows(),
      columns: personColumns(),
      sort: state.people.sort,
      dir: state.people.dir,
      page: state.people.page,
      perPage: 8,
    }) + "</section>";
  }

  function personColumns() {
    return [
      { key: "name", label: "Person", sort: function (row) { return row.name; }, html: function (row) {
        return '<div class="cell-title"><span>' + NLUI.esc(row.name) + '</span><span class="muted">' + NLUI.esc(row.email) + "</span></div>";
      } },
      { key: "role", label: "Role", sort: function (row) { return row.role; }, html: function (row) { return NLUI.esc(row.role); } },
      { key: "status", label: "Status", sort: function (row) { return row.status; }, html: function (row) { return NLUI.statusBadge(row.status); } },
      { key: "clicks", label: "Clicks", num: true, sort: function (row) { return row.clicks; }, html: function (row) { return NLUI.num(row.clicks); } },
      { key: "orders", label: "Orders", num: true, sort: function (row) { return row.orders; }, html: function (row) { return NLUI.num(row.orders); } },
      { key: "earnings", label: "Est. earnings", num: true, sort: function (row) { return row.earnings; }, html: function (row) { return NLUI.money(row.earnings); } },
      { key: "conv", label: "Conv.", num: true, sort: function (row) { return row.conv; }, html: function (row) { return NLUI.pct(row.conv || 0); } },
    ];
  }

  function pageUsers() {
    var requests = NLStore.getRequests();
    var rows = people().filter(function (item) {
      if (state.users.role !== "all" && item.role !== state.users.role) return false;
      if (state.users.status !== "all" && item.status !== state.users.status) return false;
      var q = state.users.q.trim().toLowerCase();
      if (!q) return true;
      return (item.name + " " + item.email).toLowerCase().indexOf(q) !== -1;
    });
    var directory = state.users.tab === "directory";
    return NLUI.pageHeader({
      title: "Users",
      desc: "Accounts are issued here. There is no open registration.",
      actions: '<button type="button" class="btn btn-primary" data-action="open-create">' + NLUI.icon("plus") + "Create user</button>",
    }) + (requests.length ? '<section class="panel"><div class="panel-h"><span>Access requests</span>' + NLUI.badge(String(requests.length), "warn") + '</div><div class="panel-b">' +
      requests.map(function (item) {
        return '<div class="id-row"><div><strong>' + NLUI.esc(item.name) + '</strong><div class="muted">' + NLUI.esc(item.email) + (item.site ? " · " + NLUI.esc(item.site) : "") + '</div><div class="help">' + NLUI.esc(item.note || "") + "</div></div>" +
          '<div class="row"><button type="button" class="btn btn-sm btn-primary" data-action="approve-request" data-id="' + NLUI.esc(item.id) + '">Approve</button><button type="button" class="btn btn-sm" data-action="decline-request" data-id="' + NLUI.esc(item.id) + '">Decline</button></div></div>';
      }).join("") + "</div></section>" : "") +
      '<div class="tabs" role="tablist"><button type="button" data-action="users-tab" data-tab="directory" aria-selected="' + (directory ? "true" : "false") + '">Directory</button><button type="button" data-action="users-tab" data-tab="roles" aria-selected="' + (!directory ? "true" : "false") + '">Roles</button></div>' +
      (directory ? '<div class="filters"><label class="field grow"><span>Search</span><input class="input" data-input="users-q" value="' + NLUI.esc(state.users.q) + '" placeholder="Name or email"></label>' +
        '<label class="field"><span>Role</span><select class="select" data-change="users-role">' + opts([["all", "All roles"], ["admin", "Admin"], ["affiliate", "Affiliate"], ["analyst", "Analyst"]], state.users.role) + '</select></label>' +
        '<label class="field"><span>Status</span><select class="select" data-change="users-status">' + opts([["all", "Any status"], ["active", "Active"], ["pending", "Pending"], ["suspended", "Suspended"]], state.users.status) + "</select></label></div>" +
        '<section class="panel" id="user-results">' + userTable(rows) + "</section>"
        : roleMatrix());
  }

  function userTable(rows) {
    return NLUI.dataTable({
      name: "users",
      rows: rows,
      columns: [
        { key: "name", label: "Person", sort: function (row) { return row.name; }, html: function (row) {
          return '<div class="product-cell"><div class="avatar">' + NLUI.esc(NLUI.initials(row.name)) + '</div><div class="cell-title"><span>' + NLUI.esc(row.name) + '</span><span class="muted">' + NLUI.esc(row.email) + "</span></div></div>";
        } },
        { key: "role", label: "Role", hide: true, sort: function (row) { return row.role; }, html: function (row) { return NLUI.esc(row.role); } },
        { key: "status", label: "Status", sort: function (row) { return row.status; }, html: function (row) { return NLUI.statusBadge(row.status); } },
        { key: "tags", label: "Tracking IDs", hide: true, sort: function (row) { return assignments(row.id).length; }, html: function (row) {
          var tags = assignments(row.id);
          return tags.length ? '<span class="mono">' + NLUI.esc(tags.map(function (tag) { return tag.id; }).join(", ")) + "</span>" : '<span class="muted">None</span>';
        } },
        { key: "seen", label: "Last seen", hide: true, sort: function (row) { return row.lastSeenMin == null ? 1e9 : row.lastSeenMin; }, html: function (row) { return NLUI.relMin(row.lastSeenMin); } },
        { key: "earnings", label: "30d est.", num: true, hide: true, sort: function (row) { return liveSummary(row.id).earnings; }, html: function (row) { return NLUI.money(liveSummary(row.id).earnings); } },
        { key: "actions", label: "", sort: function () { return ""; }, html: function (row) {
          var buttons = '<button type="button" class="btn btn-sm" data-action="open-user" data-id="' + row.id + '">View</button>';
          if (row.status === "pending") buttons += '<button type="button" class="btn btn-sm btn-primary" data-action="set-status" data-id="' + row.id + '" data-status="active">Approve</button>';
          else if (row.id !== user.id && row.status === "active") buttons += '<button type="button" class="btn btn-sm btn-danger" data-action="set-status" data-id="' + row.id + '" data-status="suspended">Suspend</button>';
          else if (row.status === "suspended") buttons += '<button type="button" class="btn btn-sm" data-action="set-status" data-id="' + row.id + '" data-status="active">Restore</button>';
          return '<div class="row nowrap">' + buttons + "</div>";
        } },
      ],
      sort: state.users.sort,
      dir: state.users.dir,
      page: state.users.page,
      perPage: 8,
      emptyTitle: "No users match",
      emptyText: "Change the filters, or create a user.",
    });
  }

  function assignments(userId) {
    var rows = NLStore.getAssignments().filter(function (row) { return row.userId === userId; });
    return rows.map(function (row) {
      return NLStore.getTags().find(function (tag) { return tag.id === row.tagId; });
    }).filter(Boolean);
  }

  function roleMatrix() {
    var caps = [
      ["Sign in", true, true, true],
      ["Generate affiliate links", true, true, false],
      ["WhatsApp share", true, true, false],
      ["View own reports", true, true, true],
      ["View every user", true, false, false],
      ["Assign tracking IDs", true, false, false],
      ["Approve accounts", true, false, false],
      ["Branding and compliance", true, false, false],
    ];
    return '<section class="panel"><div class="panel-h"><span>What each role can do</span></div><div class="table-scroll"><table class="data role-matrix"><thead><tr><th>Capability</th><th>Admin</th><th>Affiliate</th><th>Analyst</th></tr></thead><tbody>' +
      caps.map(function (row) {
        return "<tr><td>" + row[0] + "</td>" + [1, 2, 3].map(function (i) {
          return "<td>" + (row[i] ? "Yes" : "No") + "</td>";
        }).join("") + "</tr>";
      }).join("") + '</tbody></table></div><div class="panel-b"><p class="help">Roles are fixed. Change a person’s role on their record to change what they can do. Affiliates never connect a personal Associates account.</p></div></section>';
  }

  function pageLinks() {
    var rows = NLStore.getLinks().filter(function (link) {
      if (state.links.user !== "all" && link.userId !== state.links.user) return false;
      if (state.links.network !== "all" && link.network !== state.links.network) return false;
      var q = state.links.q.trim().toLowerCase();
      if (!q) return true;
      return (link.title + " " + link.url + " " + link.tag).toLowerCase().indexOf(q) !== -1;
    });
    return NLUI.pageHeader({
      title: "Links",
      desc: "Every link still points at Amazon or Walmart. Archiving hides it in this desk. It does not remove the tag at Amazon.",
    }) + '<div class="filters"><label class="field grow"><span>Search</span><input class="input" data-input="links-q" value="' + NLUI.esc(state.links.q) + '"></label>' +
      '<label class="field"><span>Person</span><select class="select" data-change="links-user"><option value="all">Everyone</option>' + people().map(function (item) {
        return '<option value="' + item.id + '"' + (state.links.user === item.id ? " selected" : "") + ">" + NLUI.esc(item.name) + "</option>";
      }).join("") + '</select></label><label class="field"><span>Network</span><select class="select" data-change="links-network">' +
      opts([["all", "All"], ["amazon", "Amazon"], ["walmart", "Walmart"]], state.links.network) + "</select></label></div>" +
      '<section class="panel" id="link-results">' + NLUI.dataTable({
        name: "links",
        rows: rows,
        columns: [
          { key: "createdAt", label: "When", sort: function (row) { return row.createdAt; }, html: function (row) { return NLUI.day(row.createdAt); } },
          { key: "title", label: "Product", sort: function (row) { return row.title; }, html: function (row) { return '<span class="truncate">' + NLUI.esc(row.title) + "</span>"; } },
          { key: "user", label: "Person", sort: function (row) { return (person(row.userId) || {}).name || ""; }, html: function (row) { return NLUI.esc((person(row.userId) || {}).name || "—"); } },
          { key: "country", label: "Market", sort: function (row) { return row.country; }, html: function (row) { return NLUI.esc(row.country); } },
          { key: "tag", label: "Tag", sort: function (row) { return row.tag; }, html: function (row) { return '<span class="mono">' + NLUI.esc(row.tag) + "</span>"; } },
          { key: "clicks", label: "Clicks", num: true, sort: function (row) { return row.clicks || 0; }, html: function (row) { return NLUI.num(row.clicks || 0); } },
          { key: "go", label: "", sort: function () { return ""; }, html: function (row) {
            return '<div class="row"><button type="button" class="btn btn-sm" data-action="copy" data-copy="' + NLUI.esc(row.url) + '">Copy</button><button type="button" class="btn btn-sm" data-action="archive-link" data-id="' + row.id + '">Archive</button></div>';
          } },
        ],
        sort: state.links.sort,
        dir: state.links.dir,
        page: state.links.page,
        perPage: 10,
        emptyTitle: "No links",
        emptyText: "Generated links will show here.",
      }) + "</section>";
  }

  function pageTags() {
    var rows = NLStore.getTags().map(function (tag) {
      var users = NLStore.getAssignments().filter(function (row) { return row.tagId === tag.id; }).length;
      var earnings = 0;
      var clicks = 0;
      NLData.SEED_USERS.forEach(function (item) {
        if (!item.profile) return;
        var stats = NLData.byTag(item.id, state.range)[tag.id];
        if (!stats) return;
        earnings += stats.earnings;
        clicks += stats.clicks;
      });
      return Object.assign({ users: users, earnings: earnings, clicks: clicks }, tag);
    });
    return NLUI.pageHeader({
      title: "Tracking IDs",
      desc: "House tracking IDs. Assign them to people from Users. OneLink is configured on the Associates ID, not by rewriting the URL.",
      actions: NLUI.rangeControl(state.range) + '<button type="button" class="btn btn-primary" data-action="open-tag">Add tracking ID</button>',
    }) + '<section class="panel">' + NLUI.dataTable({
      name: "tags",
      rows: rows,
      columns: [
        { key: "id", label: "ID", sort: function (row) { return row.id; }, html: function (row) { return '<span class="mono">' + NLUI.esc(row.id) + '</span><div class="muted">' + NLUI.esc(row.label) + "</div>"; } },
        { key: "network", label: "Network", sort: function (row) { return row.network; }, html: function (row) { return row.network === "amazon" ? "Amazon" : "Walmart"; } },
        { key: "countries", label: "Markets", sort: function (row) { return row.countries.join(","); }, html: function (row) { return NLUI.esc(row.countries.join(", ")); } },
        { key: "onelink", label: "OneLink", sort: function (row) { return row.onelink ? 1 : 0; }, html: function (row) { return row.onelink ? NLUI.badge("On", "info") : NLUI.badge("Off", "neutral"); } },
        { key: "users", label: "People", num: true, sort: function (row) { return row.users; }, html: function (row) { return NLUI.num(row.users); } },
        { key: "clicks", label: "Clicks", num: true, sort: function (row) { return row.clicks; }, html: function (row) { return NLUI.num(row.clicks); } },
        { key: "earnings", label: "Est. earnings", num: true, sort: function (row) { return row.earnings; }, html: function (row) { return NLUI.money(row.earnings); } },
        { key: "source", label: "", sort: function () { return ""; }, html: function (row) {
          return row.source === "custom" ? '<button type="button" class="btn btn-sm" data-action="remove-tag" data-id="' + NLUI.esc(row.id) + '">Remove</button>' : '<span class="muted">Imported</span>';
        } },
      ],
      sort: state.tags.sort,
      dir: state.tags.dir,
      page: state.tags.page,
      perPage: 12,
    }) + "</section>";
  }

  function pageReports() {
    var house = NLData.house(state.range);
    var countries = NLData.houseCountry(state.range);
    var rows = Object.keys(countries).map(function (code) {
      var market = NLLinks.marketplace(code);
      return { code: code, name: market ? market.name : code, clicks: countries[code].clicks, orders: countries[code].orders, earnings: countries[code].earnings };
    }).sort(function (a, b) { return b.earnings - a.earnings; });
    var max = rows.reduce(function (m, row) { return Math.max(m, row.clicks); }, 1);
    NLUI.chartSpecs.house = {
      label: "House earnings context",
      right: true,
      labels: house.series.map(function (row) { return NLUI.day(row.date); }),
      series: [
        { name: "Clicks", values: house.series.map(function (row) { return row.clicks; }), colorVar: "--chart-1", swatch: "swatch-a", fill: true, format: NLUI.num },
        { name: "Orders", values: house.series.map(function (row) { return row.orders; }), axis: "r", colorVar: "--chart-2", swatch: "swatch-b", format: NLUI.num },
      ],
    };
    return NLUI.pageHeader({
      title: "Reports",
      desc: "Per-person performance on the house account. " + NLUI.stamp(NLData.importStamp()) + ". Estimates use sample category rates.",
      actions: NLUI.rangeControl(state.range) + '<button type="button" class="btn btn-sm" data-action="export-people">Export CSV</button>',
    }) + NLUI.metrics([
      { label: "Outbound clicks", value: NLUI.num(house.clicks), delta: NLUI.fmtDelta(house.dClicks), deltaLabel: "vs prior" },
      { label: "Reported orders", value: NLUI.num(house.orders), delta: NLUI.fmtDelta(house.dOrders), deltaLabel: "vs prior" },
      { label: "Est. earnings", value: NLUI.money(house.earnings), delta: NLUI.fmtDelta(house.dEarnings), deltaLabel: "vs prior" },
      { label: "Conversion", value: NLUI.pct(house.conv), delta: NLUI.fmtPp(house.dConvPp), deltaLabel: "vs prior" },
    ]) + '<section class="panel"><div class="panel-h"><span>House</span></div><div class="panel-b"><div id="house" class="chart" data-chart></div></div></section>' +
      '<div class="grid-2"><section class="panel"><div class="panel-h"><span>Countries</span></div><div class="panel-b">' +
      rows.map(function (row) {
        return '<div class="hbar"><div class="hbar-top"><span>' + NLUI.esc(row.name) + "</span><strong>" + NLUI.money(row.earnings) + '</strong></div><div class="hbar-track"><div class="hbar-fill" data-bar="' + ((row.clicks / max) * 100).toFixed(1) + '"></div></div></div>';
      }).join("") + '</div></section><section class="panel"><div class="panel-h"><span>People</span></div>' + NLUI.dataTable({
        name: "people",
        rows: performanceRows(),
        columns: personColumns(),
        sort: state.people.sort,
        dir: state.people.dir,
        page: state.people.page,
        perPage: 8,
      }) + "</section></div>";
  }

  function pageIntegrations() {
    var rows = [
      ["Amazon Associates", "Connected", "18 marketplaces", "House account. Links keep the Amazon host and a visible tag.", "ok"],
      ["Walmart (Impact)", "Connected", "United States", "Links stay on walmart.com. Item id remains in the path.", "ok"],
      ["eBay Partner Network", "Coming soon", "—", "Not available in this desk.", "neutral"],
      ["Target Partners", "Coming soon", "—", "Not available in this desk.", "neutral"],
      ["Best Buy Affiliate", "Coming soon", "—", "Not available in this desk.", "neutral"],
      ["Etsy", "Coming soon", "—", "Not available in this desk.", "neutral"],
      ["Awin", "Coming soon", "—", "Not available in this desk.", "neutral"],
    ];
    return NLUI.pageHeader({
      title: "Integrations",
      desc: "Networks the house account can tag today, and networks that are not connected.",
    }) + '<section class="panel"><div class="table-scroll"><table class="data"><thead><tr><th>Network</th><th>Status</th><th>Markets</th><th>Detail</th></tr></thead><tbody>' +
      rows.map(function (row) {
        return "<tr><td><strong>" + row[0] + "</strong></td><td>" + NLUI.badge(row[1], row[4]) + "</td><td>" + row[2] + '</td><td class="muted">' + row[3] + "</td></tr>";
      }).join("") + "</tbody></table></div></section>";
  }

  function pageSettings() {
    var tab = state.settings.tab;
    var comp = NLStore.getCompliance();
    var work = NLStore.getWorkspace();
    var tabs = '<div class="tabs"><button type="button" data-action="settings-tab" data-tab="brand" aria-selected="' + (tab === "brand" ? "true" : "false") + '">Branding</button>' +
      '<button type="button" data-action="settings-tab" data-tab="compliance" aria-selected="' + (tab === "compliance" ? "true" : "false") + '">Compliance</button>' +
      '<button type="button" data-action="settings-tab" data-tab="workspace" aria-selected="' + (tab === "workspace" ? "true" : "false") + '">Workspace</button></div>';
    var body = "";
    if (tab === "brand") {
      body = '<div class="grid-2"><section class="panel"><div class="panel-b stack-form">' +
        '<label class="field"><span>App name</span><input class="input" data-input="brand-name" maxlength="32" value="' + NLUI.esc(brandDraft.name) + '"></label>' +
        '<div class="field"><span>Accent</span><div class="color-row">' +
        '<button type="button" class="color-dot dot-navy' + on(brandDraft.accent, "#1e4d8c") + '" data-action="swatch" data-color="#1e4d8c" aria-label="Navy"></button>' +
        '<button type="button" class="color-dot dot-forest' + on(brandDraft.accent, "#1f6b45") + '" data-action="swatch" data-color="#1f6b45" aria-label="Forest"></button>' +
        '<button type="button" class="color-dot dot-rust' + on(brandDraft.accent, "#8f3d1b") + '" data-action="swatch" data-color="#8f3d1b" aria-label="Rust"></button>' +
        '<button type="button" class="color-dot dot-ink' + on(brandDraft.accent, "#1a1a18") + '" data-action="swatch" data-color="#1a1a18" aria-label="Ink"></button>' +
        '<input class="color-input" type="color" data-input="brand-color" value="' + NLUI.esc(toHex(brandDraft.accent)) + '" aria-label="Custom accent">' +
        "</div></div>" +
        '<label class="field"><span>Custom domain</span><input class="input" data-input="brand-domain" value="' + NLUI.esc(brandDraft.domain || "") + '"></label>' +
        '<p class="help">DNS is not connected. This demo does not attach a domain. The installed app name in manifest.json is separate from this field.</p>' +
        '<div class="row"><button type="button" class="btn btn-primary" data-action="save-brand">Save branding</button><button type="button" class="btn" data-action="reset-brand">Reset</button></div>' +
        "</div></section><section class=\"panel\"><div class=\"panel-h\"><span>Preview</span></div><div class=\"panel-b\"><div class=\"brand-preview\" id=\"brand-preview\"><div class=\"brand\">" +
        NLMark() + '<span class="brand-name" id="brand-preview-name"></span></div><a class="sample" href="#/settings">Sample link</a></div></div></section></div>';
    } else if (tab === "compliance") {
      body = '<section class="panel"><div class="panel-h"><span>Operating checklist</span></div><div class="panel-b">' +
        enforced("Disclosure is attached to WhatsApp shares and Copy with disclosure.", true) +
        enforced("Amazon links use the full marketplace host and a visible tag. No shortener and no cloaked redirect.", true) +
        enforced("Walmart links stay on walmart.com. The item id stays in the path.", true) +
        enforced("Sample prices show the date they were recorded and are labeled as not live.", true) +
        enforced("Share tools block messages that incentivize the click.", true) +
        '<label class="check"><input type="checkbox" data-change="comp-reviewed"' + (comp.reviewed ? " checked" : "") + '><div><strong>Operating Agreement reviewed this quarter</strong><p class="help">An acknowledgement for the house account. It does not change the enforced items above.</p></div></label>' +
        '<label class="check"><input type="checkbox" data-change="comp-terms"' + (comp.specialTerms ? " checked" : "") + '><div><strong>Special associate terms, if any, are reflected in who may receive links</strong><p class="help">Leave off if no special terms apply.</p></div></label>' +
        '<label class="field"><span>Internal note</span><textarea class="textarea" data-change="comp-note">' + NLUI.esc(comp.note || "") + "</textarea></label>" +
        '<p class="help mt8">This checklist is an internal reminder. It is not legal advice. The Amazon Associates Program Operating Agreement and Walmart’s affiliate terms control. The Associate of record is the house account, not the person who generated a link.</p>' +
        '<div class="field mt8"><span>Required Amazon sentence</span><div class="disclosure" data-disclosure></div></div>' +
        '<div class="field"><span>Walmart sentence</span><div class="disclosure" data-walmart-disclosure></div></div>' +
        "</div></section>";
    } else {
      body = '<section class="panel"><div class="panel-b stack-form">' +
        '<label class="field"><span>Support email</span><input class="input" id="work-email" value="' + NLUI.esc(work.supportEmail) + '"></label>' +
        '<label class="field"><span>Session length</span><select class="select" id="work-hours"><option value="8"' + (String(work.sessionHours) === "8" ? " selected" : "") + '>8 hours</option><option value="12"' + (String(work.sessionHours) === "12" ? " selected" : "") + '>12 hours</option><option value="24"' + (String(work.sessionHours) === "24" ? " selected" : "") + ">24 hours</option></select></label>" +
        '<p class="help">Saved for when sign-in is connected. This demo keeps the session in this browser until you sign out.</p>' +
        '<div class="row"><button type="button" class="btn btn-primary" data-action="save-work">Save workspace</button><button type="button" class="btn btn-danger" data-action="clear-demo">Clear demo edits</button></div>' +
        "</div></section>";
    }
    return NLUI.pageHeader({
      title: "Settings",
      desc: "Name, accent, and the compliance reminders for the house account.",
    }) + tabs + body;
  }

  function enforced(text) {
    return '<label class="check"><input type="checkbox" checked disabled><div><strong>' + text + '</strong><p class="help">Enforced in this desk.</p></div></label>';
  }

  function on(current, color) {
    return String(current || "").toLowerCase() === color ? " on" : "";
  }

  function toHex(value) {
    var raw = String(value || "#1e4d8c");
    return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : "#1e4d8c";
  }

  function opts(pairs, current) {
    return pairs.map(function (pair) {
      return '<option value="' + pair[0] + '"' + (pair[0] === current ? " selected" : "") + ">" + pair[1] + "</option>";
    }).join("");
  }

  function pageMissing() {
    return NLUI.pageHeader({ title: "Not in the admin", desc: "That address is not a page." }) + '<a class="btn" href="#/overview">Back to overview</a>';
  }

  var routes = {
    "/overview": pageOverview,
    "/users": pageUsers,
    "/links": pageLinks,
    "/tags": pageTags,
    "/reports": pageReports,
    "/integrations": pageIntegrations,
    "/settings": pageSettings,
  };

  function render(reset) {
    var current = path();
    var changed = current !== lastPath;
    lastPath = current;
    Object.keys(NLUI.chartSpecs).forEach(function (key) { delete NLUI.chartSpecs[key]; });
    var y = changed || reset ? 0 : window.scrollY;
    document.getElementById("view").innerHTML = (routes[current] || pageMissing)();
    NLUI.setActive(current);
    NLUI.closeNav();
    document.title = (TITLES[current] || "Admin") + " · " + NLStore.getBrand().name;
    NLStore.applyBrand();
    paintBrand();
    NLUI.afterPaint();
    window.scrollTo(0, y);
  }

  function paintBrand() {
    var box = document.getElementById("brand-preview");
    if (!box) return;
    box.style.setProperty("--link", brandDraft.accent || "#1e4d8c");
    var name = document.getElementById("brand-preview-name");
    if (name) name.textContent = brandDraft.name || "Name";
  }

  NLUI.rerender = function () { render(false); };

  function openUser(id) {
    var item = person(id);
    if (!item) return;
    var sum = liveSummary(id);
    var admins = people().filter(function (row) { return row.role === "admin" && row.status === "active"; }).length;
    var lockRole = item.role === "admin" && admins < 2;
    NLUI.openModal(item.name, '<form class="stack-form" data-action="save-user" data-id="' + item.id + '">' +
      '<p class="help">' + NLUI.esc(item.email) + " · last seen " + NLUI.esc(NLUI.relMin(item.lastSeenMin)) + "</p>" +
      NLUI.metrics([
        { label: "Clicks", value: NLUI.num(sum.clicks) },
        { label: "Orders", value: NLUI.num(sum.orders) },
        { label: "Est. earnings", value: NLUI.money(sum.earnings) },
        { label: "Conversion", value: NLUI.pct(sum.conv || 0) },
      ]) +
      '<label class="field"><span>Role</span><select class="select" name="role"' + (lockRole ? " disabled" : "") + '>' +
      opts([["affiliate", "Affiliate"], ["analyst", "Analyst"], ["admin", "Admin"]], item.role) + "</select></label>" +
      (lockRole ? '<p class="help">The only administrator cannot be demoted here.</p>' : "") +
      '<label class="field"><span>Status</span><select class="select" name="status"' + (item.id === user.id ? " disabled" : "") + '>' +
      opts([["active", "Active"], ["pending", "Pending"], ["suspended", "Suspended"]], item.status) + "</select></label>" +
      '<div class="help">Tracking IDs: ' + (assignments(id).map(function (tag) { return tag.id; }).join(", ") || "none") + "</div>" +
      '<div class="row"><button type="button" class="btn" data-action="open-assign" data-id="' + item.id + '">Assign tracking IDs</button><button class="btn btn-primary" type="submit">Save</button></div></form>', "", true);
  }

  function openAssign(id) {
    var item = person(id);
    var current = NLStore.getAssignments().filter(function (row) { return row.userId === id; });
    var tags = NLStore.getTags();
    var preferred = (current.find(function (row) { return row.isDefault; }) || {}).tagId || (current[0] && current[0].tagId) || "";
    var body = '<form class="stack-form" data-action="save-assign" data-id="' + id + '"><p class="help">Assign house IDs to ' + NLUI.esc(item.name) + ". They still do not get their own Associates login.</p>" +
      tags.map(function (tag) {
        var checked = current.some(function (row) { return row.tagId === tag.id; });
        return '<label class="check"><input type="checkbox" name="tag" value="' + NLUI.esc(tag.id) + '"' + (checked ? " checked" : "") + '><div><strong class="mono">' + NLUI.esc(tag.id) + '</strong><p class="help">' + NLUI.esc(tag.label) + " · " + NLUI.esc(tag.countries.join(", ")) + "</p></div></label>";
      }).join("") +
      '<label class="field"><span>Preferred ID when several match</span><select class="select" name="prefer">' + tags.map(function (tag) {
        return '<option value="' + NLUI.esc(tag.id) + '"' + (tag.id === preferred ? " selected" : "") + ">" + NLUI.esc(tag.id) + "</option>";
      }).join("") + '</select></label><div class="row"><button class="btn btn-primary" type="submit">Save assignments</button></div></form>';
    NLUI.openModal("Assign tracking IDs", body, "", true);
  }

  NLUI.actions.more = function () {
    var body = NAV.map(function (group) {
      return '<div class="nav-label">' + group.label + "</div>" + group.items.map(function (item) {
        return '<a class="nav-link" href="#' + item.href + '">' + NLUI.icon(item.icon) + "<span>" + item.label + "</span></a>";
      }).join("");
    }).join("");
    NLUI.openModal("Pages", body);
  };
  NLUI.actions.range = function (el) { state.range = Number(el.dataset.days); render(false); };
  NLUI.actions["users-tab"] = function (el) { state.users.tab = el.dataset.tab; render(false); };
  NLUI.actions["settings-tab"] = function (el) { state.settings.tab = el.dataset.tab; render(false); };
  NLUI.actions["open-create"] = function () {
    NLUI.openModal("Create user", '<form class="stack-form" data-action="create-user">' +
      '<label class="field"><span>Name</span><input class="input" name="name" required></label>' +
      '<label class="field"><span>Email</span><input class="input" name="email" type="email" required></label>' +
      '<label class="field"><span>Role</span><select class="select" name="role"><option value="affiliate">Affiliate</option><option value="analyst">Analyst</option><option value="admin">Admin</option></select></label>' +
      '<p class="help">Temporary password is ' + NLStore.DEMO_PASSWORD + '. Share it privately. They can sign in after you save. Assign tracking IDs before they generate links.</p>' +
      '<div class="row"><button class="btn btn-primary" type="submit">Create</button></div></form>');
  };
  NLUI.actions["create-user"] = function (form) {
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var email = String(data.get("email") || "").trim().toLowerCase();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      NLUI.toast("Enter a name and a valid email.");
      return;
    }
    if (NLStore.findByEmail(email) || NLStore.getRequests().some(function (item) { return item.email.toLowerCase() === email; })) {
      NLUI.toast("That email is already on the desk.");
      return;
    }
    var created = NLStore.createUser({ name: name, email: email, role: data.get("role") || "affiliate", status: "active" });
    NLUI.closeModal();
    NLUI.toast("User created. Assign tracking IDs next.");
    render(false);
    openAssign(created.id);
  };
  NLUI.actions["open-user"] = function (el) { openUser(el.dataset.id); };
  NLUI.actions["save-user"] = function (form) {
    var data = new FormData(form);
    var roleEl = form.querySelector('[name="role"]');
    var statusEl = form.querySelector('[name="status"]');
    var patch = {};
    if (roleEl && !roleEl.disabled) patch.role = data.get("role");
    if (statusEl && !statusEl.disabled) patch.status = data.get("status");
    NLStore.patchUser(form.dataset.id, patch);
    NLUI.closeModal();
    NLUI.toast("User updated.");
    render(false);
  };
  NLUI.actions["set-status"] = function (el) {
    if (el.dataset.id === user.id) return;
    NLStore.patchUser(el.dataset.id, { status: el.dataset.status });
    NLUI.toast(el.dataset.status === "active" ? "User approved." : "User updated.");
    render(false);
  };
  NLUI.actions["open-assign"] = function (el) {
    NLUI.closeModal();
    openAssign(el.dataset.id);
  };
  NLUI.actions["save-assign"] = function (form) {
    var data = new FormData(form);
    var ids = data.getAll("tag");
    var prefer = data.get("prefer");
    if (ids.indexOf(prefer) === -1 && ids.length) prefer = ids[0];
    NLStore.setAssignments(form.dataset.id, ids.map(function (id) {
      return { tagId: id, isDefault: id === prefer };
    }));
    NLUI.closeModal();
    NLUI.toast("Tracking IDs updated.");
    render(false);
  };
  NLUI.actions["approve-request"] = function (el) {
    var req = NLStore.getRequests().find(function (item) { return item.id === el.dataset.id; });
    if (!req) return;
    if (NLStore.findByEmail(req.email)) {
      NLUI.toast("That email already has an account.");
      return;
    }
    var created = NLStore.createUser({ name: req.name, email: req.email, role: "affiliate", status: "active" });
    NLStore.removeRequest(req.id);
    NLUI.toast("Approved. Assign tracking IDs before they generate links.");
    render(false);
    openAssign(created.id);
  };
  NLUI.actions["decline-request"] = function (el) {
    NLStore.removeRequest(el.dataset.id);
    NLUI.toast("Request declined.");
    render(false);
  };
  NLUI.actions["archive-link"] = function (el) {
    NLUI.confirmModal({
      title: "Archive this link?",
      body: "It will disappear from the desk history. The Amazon or Walmart URL, if already shared, keeps working. This does not delete anything at Amazon.",
      confirmLabel: "Archive",
      danger: true,
      onConfirm: function () {
        NLStore.archiveLink(el.dataset.id);
        NLUI.toast("Link archived in this desk.");
        render(false);
      },
    });
  };
  NLUI.actions["open-tag"] = function () {
    var countries = NLLinks.MARKETPLACES.map(function (market) {
      return '<label class="check"><input type="checkbox" name="country" value="' + market.code + '"><div>' + market.name + "</div></label>";
    }).join("");
    NLUI.openModal("Add tracking ID", '<form class="stack-form" data-action="save-tag">' +
      '<label class="field"><span>Network</span><select class="select" name="network" data-change="tag-network"><option value="amazon">Amazon</option><option value="walmart">Walmart</option></select></label>' +
      '<label class="field"><span>Tracking ID</span><input class="input" name="id" placeholder="brand-20" required></label>' +
      '<label class="field"><span>Label</span><input class="input" name="label" placeholder="House · US"></label>' +
      '<label class="check" id="onelink-row"><input type="checkbox" name="onelink"><div><strong>OneLink on</strong><p class="help">Amazon may localize the shopper. The URL this desk builds still uses the full host.</p></div></label>' +
      '<div id="country-picks">' + countries + "</div>" +
      '<p class="help">Amazon IDs look like brand-20. Imported IDs cannot be removed. A custom ID can.</p>' +
      '<div class="row"><button class="btn btn-primary" type="submit">Add</button></div></form>', "", true);
  };
  NLUI.actions["save-tag"] = function (form) {
    var data = new FormData(form);
    var id = String(data.get("id") || "").trim();
    var network = data.get("network");
    if (network === "amazon" && !/^[A-Za-z0-9][A-Za-z0-9-]{0,18}-\d{2}$/.test(id)) {
      NLUI.toast("Use an Amazon-style ID such as brand-20.");
      return;
    }
    if (network === "walmart" && !/^[A-Za-z0-9-]{3,32}$/.test(id)) {
      NLUI.toast("Enter a short Walmart ID.");
      return;
    }
    if (NLStore.getTags().some(function (tag) { return tag.id.toLowerCase() === id.toLowerCase(); })) {
      NLUI.toast("That tracking ID already exists.");
      return;
    }
    var countries = data.getAll("country");
    if (network === "walmart") countries = ["US"];
    if (!countries.length) { NLUI.toast("Choose at least one marketplace."); return; }
    NLStore.addTag({
      id: id,
      network: network,
      label: String(data.get("label") || "Custom").trim(),
      countries: countries,
      onelink: network === "amazon" && !!(form.querySelector('[name="onelink"]') || {}).checked,
      partner: network === "walmart" ? "northline" : undefined,
      adId: network === "walmart" ? "565706" : undefined,
      source: "custom",
    });
    NLUI.closeModal();
    NLUI.toast("Tracking ID added.");
    render(false);
  };
  NLUI.actions["remove-tag"] = function (el) {
    var used = NLStore.getAssignments().some(function (row) { return row.tagId === el.dataset.id; });
    if (used) { NLUI.toast("Unassign this ID from every user first."); return; }
    NLStore.removeTag(el.dataset.id);
    NLUI.toast("Tracking ID removed.");
    render(false);
  };
  NLUI.actions.swatch = function (el) {
    brandDraft.accent = el.dataset.color;
    render(false);
  };
  NLUI.actions["save-brand"] = function () {
    if (!String(brandDraft.name || "").trim()) { NLUI.toast("Enter an app name."); return; }
    NLStore.setBrand({
      name: brandDraft.name.trim(),
      accent: brandDraft.accent,
      domain: brandDraft.domain,
    });
    brandDraft = Object.assign({}, NLStore.getBrand());
    NLUI.toast("Branding saved in this browser.");
    render(false);
  };
  NLUI.actions["reset-brand"] = function () {
    NLStore.resetBrand();
    brandDraft = Object.assign({}, NLStore.getBrand());
    NLUI.toast("Branding reset.");
    render(false);
  };
  NLUI.actions["save-work"] = function () {
    NLStore.setWorkspace({
      supportEmail: document.getElementById("work-email").value.trim(),
      sessionHours: Number(document.getElementById("work-hours").value),
    });
    NLUI.toast("Workspace saved.");
  };
  NLUI.actions["clear-demo"] = function () {
    NLUI.confirmModal({
      title: "Clear demo edits?",
      body: "This removes requests, generated links, branding edits, and user changes stored in this browser. Sample data stays.",
      confirmLabel: "Clear",
      danger: true,
      onConfirm: function () {
        NLStore.clearDemoEdits();
        brandDraft = Object.assign({}, NLStore.getBrand());
        NLUI.toast("Demo edits cleared.");
        render(false);
      },
    });
  };
  NLUI.actions["export-people"] = function () {
    var rows = [["name", "email", "role", "status", "clicks", "orders", "est_earnings_usd", "conversion"]];
    performanceRows().forEach(function (row) {
      rows.push([row.name, row.email, row.role, row.status, row.clicks, row.orders, row.earnings.toFixed(2), (row.conv * 100).toFixed(2) + "%"]);
    });
    NLUI.downloadCsv("northline-people-" + state.range + "d.csv", rows);
  };

  NLUI.inputs["users-q"] = function (el) {
    state.users.q = el.value;
    state.users.page = 1;
    var host = document.getElementById("user-results");
    if (!host) return;
    render(false);
    var again = document.querySelector('[data-input="users-q"]');
    if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
  };
  NLUI.inputs["links-q"] = function (el) {
    state.links.q = el.value;
    state.links.page = 1;
    render(false);
    var again = document.querySelector('[data-input="links-q"]');
    if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
  };
  NLUI.inputs["brand-name"] = function (el) { brandDraft.name = el.value; paintBrand(); };
  NLUI.inputs["brand-color"] = function (el) { brandDraft.accent = el.value; paintBrand(); };
  NLUI.inputs["brand-domain"] = function (el) { brandDraft.domain = el.value; };
  NLUI.inputs["global-search"] = function (el) {
    var q = el.value.trim().toLowerCase();
    var box = document.getElementById("palette");
    if (!q) { box.hidden = true; return; }
    var html = "";
    var pages = Object.keys(TITLES).filter(function (href) { return TITLES[href].toLowerCase().indexOf(q) !== -1; });
    if (pages.length) html += '<div class="p-label">Pages</div>' + pages.map(function (href) { return '<a href="#' + href + '">' + TITLES[href] + "</a>"; }).join("");
    var found = people().filter(function (item) { return (item.name + item.email).toLowerCase().indexOf(q) !== -1; }).slice(0, 6);
    if (found.length) html += '<div class="p-label">People</div>' + found.map(function (item) {
      return '<button type="button" data-action="open-user" data-id="' + item.id + '">' + NLUI.esc(item.name) + '<span class="hit-sub">' + NLUI.esc(item.role) + "</span></button>";
    }).join("");
    box.innerHTML = html || '<div class="p-label">No matches</div>';
    box.hidden = false;
  };

  NLUI.changes["users-role"] = function (el) { state.users.role = el.value; state.users.page = 1; render(false); };
  NLUI.changes["users-status"] = function (el) { state.users.status = el.value; state.users.page = 1; render(false); };
  NLUI.changes["links-user"] = function (el) { state.links.user = el.value; state.links.page = 1; render(false); };
  NLUI.changes["links-network"] = function (el) { state.links.network = el.value; state.links.page = 1; render(false); };
  NLUI.changes["comp-reviewed"] = function (el) { NLStore.setCompliance({ reviewed: el.checked }); NLUI.toast("Checklist saved."); };
  NLUI.changes["comp-terms"] = function (el) { NLStore.setCompliance({ specialTerms: el.checked }); NLUI.toast("Checklist saved."); };
  NLUI.changes["comp-note"] = function (el) { NLStore.setCompliance({ note: el.value }); };
  NLUI.changes["tag-network"] = function (el) {
    var picks = document.getElementById("country-picks");
    var one = document.getElementById("onelink-row");
    var walmart = el.value === "walmart";
    if (picks) picks.hidden = walmart;
    if (one) one.hidden = walmart;
  };

  window.addEventListener("hashchange", function () {
    var palette = document.getElementById("palette");
    if (palette) palette.hidden = true;
    NLUI.closeModal();
    render(true);
  });

  render(true);
})();
