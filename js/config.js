/* Default brand. Change the name, accent, and disclosure here.
   Also set --link in css/app.css so the first paint matches.
   manifest.json holds the installed-app name separately. */
(function (root) {
  "use strict";
  root.NL_DEFAULT_BRAND = {
    name: "Northline",
    tagline: "Affiliate desk",
    disclosure: "As an Amazon Associate I earn from qualifying purchases.",
    walmartDisclosure: "As a Walmart affiliate, commissions may be earned on qualifying purchases.",
    domain: "desk.northline.test",
    supportEmail: "ops@northline.test",
    accent: "#1e4d8c",
  };
})(typeof window !== "undefined" ? window : globalThis);
