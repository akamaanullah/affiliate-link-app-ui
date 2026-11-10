/* Runs before CSS. Applies the saved theme and accent so the first paint is correct. */
(function () {
  "use strict";
  try {
    var theme = localStorage.getItem("northline.theme");
    if (theme !== "light" && theme !== "dark") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", theme);
    var raw = localStorage.getItem("northline.brand");
    if (raw) {
      var brand = JSON.parse(raw);
      if (brand && brand.accent) {
        document.documentElement.style.setProperty("--link", brand.accent);
        document.documentElement.style.setProperty("--chart-1", brand.accent);
      }
    }
  } catch (err) {
    /* ignore broken local storage */
  }
})();
