(function () {
  "use strict";
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferred = event;
  });
  window.NLInstall = function () {
    if (!deferred) {
      if (window.NLUI) {
        NLUI.toast("Use the browser menu and choose Install app. Chrome needs a secure context and a moment on the page before it offers install.");
      }
      return;
    }
    deferred.prompt();
    deferred.userChoice.then(function () { deferred = null; });
  };
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function () { /* install still works once the worker is available */ });
    });
  }
})();
