(function (root) {
  "use strict";
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }
  var I = {
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5h10"/>'),
    check: svg('<path d="m5 12 5 5L20 7"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    logout: svg('<path d="M9 6H6v12h3M10 12h10M16 8l4 4-4 4"/>'),
    link: svg('<path d="M10 13a5 5 0 0 0 7.1.1l1.4-1.5a5 5 0 0 0-7.1-7.1L10.2 5.7"/><path d="M14 11a5 5 0 0 0-7.1-.1L5.5 12.4a5 5 0 0 0 7.1 7.1l1.2-1.2"/>'),
    tag: svg('<path d="M20 13.5 13.5 20a2 2 0 0 1-2.8 0L3 12.3V4h8.3L20 12.7a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none"/>'),
    hash: svg('<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z"/>'),
    chart: svg('<path d="M4 19V5M4 19h16"/><path d="m7 14 3.5-4 3 3L20 7"/>'),
    users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.85M16 4.15a3 3 0 0 1 0 5.7"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>'),
    plug: svg('<path d="M9 7v5a3 3 0 0 0 6 0V7M8 7h8M12 15v6M8 3v4M16 3v4"/>'),
    shield: svg('<path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 8.5 4.2-1.1 7-4.3 7-8.5V6l-7-3z"/><path d="m9 12 2 2 4-4"/>'),
    message: svg('<path d="M5 17.5 3 21l3.8-1.4A9 9 0 1 0 5 17.5z"/>'),
    bot: svg('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4M9 13h.01M15 13h.01M9 17h6"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>'),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M3 3l18 18M10.6 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 4.2M6.1 6.8C3.5 8.6 2 12 2 12a17 17 0 0 0 6.2 5.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    download: svg('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
    alert: svg('<path d="M12 9v4M12 17h.01"/><path d="M10.3 4.8 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0z"/>'),
    box: svg('<path d="M3 8l9-5 9 5-9 5-9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>'),
    activity: svg('<path d="M3 12h4l2-6 4 12 2-6h6"/>'),
    seo: svg('<path d="M4 19V5M4 19h16"/><rect x="7" y="11" width="3" height="5"/><rect x="12" y="8" width="3" height="8"/><rect x="17" y="5" width="3" height="11"/>'),
    more: svg('<circle cx="6" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/>'),
    install: svg('<path d="M12 3v10M8 9l4 4 4-4M5 21h14"/>'),
    external: svg('<path d="M14 5h5v5M19 5l-9 9"/><path d="M17 13.5V19H5V7h5.5"/>'),
    chevron: svg('<path d="m9 6 6 6-6 6"/>'),
    filter: svg('<path d="M4 6h16M7 12h10M10 18h4"/>'),
  };
  root.NLIcon = function (name) {
    return I[name] || "";
  };
  root.NLMark = function () {
    return '<svg class="mark" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><rect width="20" height="20" rx="4.5"/><path d="M5.3 15.2V4.8h1.8l6.1 7.6V4.8h1.5v10.4h-1.8L7.1 7.6v7.6H5.3z"/></svg>';
  };
})(typeof window !== "undefined" ? window : globalThis);
