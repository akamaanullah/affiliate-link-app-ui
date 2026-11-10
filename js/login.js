(function () {
  "use strict";

  var existing = NLStore.currentUser();
  if (existing) {
    location.href = existing.role === "admin" ? "admin.html" : "app.html";
    return;
  }

  NLStore.applyBrand();
  document.title = "Sign in · " + NLStore.getBrand().name;

  var house = NLData.house(30);
  var active = NLStore.getUsers().filter(function (user) {
    return user.role === "affiliate" && user.status === "active";
  }).length;
  setText("login-clicks", NLUI.num(house.clicks));
  setText("login-orders", NLUI.num(house.orders));
  setText("login-earn", NLUI.money(house.earnings));
  setText("login-people", NLUI.num(active));

  var form = document.getElementById("login-form");
  var error = document.getElementById("login-error");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var button = document.getElementById("submit");
    error.hidden = true;
    document.getElementById("email").classList.remove("invalid");
    document.getElementById("password").classList.remove("invalid");
    if (!email.trim() || !password) {
      show("Enter the email and password for an issued account.");
      if (!email.trim()) document.getElementById("email").classList.add("invalid");
      if (!password) document.getElementById("password").classList.add("invalid");
      return;
    }
    button.disabled = true;
    button.textContent = "Checking…";
    setTimeout(function () {
      button.disabled = false;
      button.textContent = "Sign in";
      var user = NLStore.findByEmail(email);
      if (!user || password !== NLStore.DEMO_PASSWORD) {
        show("Email or password does not match an issued account.");
        return;
      }
      if (user.status === "pending") {
        show("This account is waiting for approval.");
        return;
      }
      if (user.status === "suspended") {
        show("This account is suspended. Contact the administrator.");
        return;
      }
      NLStore.setSession(user.id);
      location.href = user.role === "admin" ? "admin.html" : "app.html";
    }, 200);
  });

  NLUI.actions["toggle-password"] = function (el) {
    var input = document.getElementById("password");
    var show = input.type === "password";
    input.type = show ? "text" : "password";
    el.innerHTML = NLUI.icon(show ? "eyeOff" : "eye");
    el.setAttribute("aria-label", show ? "Hide password" : "Show password");
  };
  NLUI.actions["forgot"] = function () {
    NLUI.openModal("Password reset", "<p>Passwords are reset by an administrator. Email " +
      NLUI.esc(NLStore.getWorkspace().supportEmail) + " from the address on your account.</p>",
      '<button type="button" class="btn btn-primary" data-action="close-modal">Close</button>');
  };
  NLUI.actions["request-access"] = function () {
    var markets = ["US", "UK", "CA", "DE", "FR", "IN", "JP", "AU"].map(function (code) {
      var market = NLLinks.marketplace(code);
      return '<label class="check"><input type="checkbox" name="market" value="' + code + '"><div>' + market.name + "</div></label>";
    }).join("");
    NLUI.openModal("Request access", '<form class="stack-form" data-action="send-request">' +
      '<p class="help">An administrator reviews requests. Submitting this does not create a login.</p>' +
      '<label class="field"><span>Name</span><input class="input" name="name" required></label>' +
      '<label class="field"><span>Email</span><input class="input" name="email" type="email" required></label>' +
      '<label class="field"><span>Site</span><input class="input" name="site" placeholder="example.com"></label>' +
      '<label class="field"><span>What you publish</span><textarea class="textarea" name="note" required></textarea></label>' +
      markets +
      '<div class="row"><button class="btn btn-primary" type="submit">Submit request</button></div></form>', "", true);
  };
  NLUI.actions["send-request"] = function (form) {
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var email = String(data.get("email") || "").trim().toLowerCase();
    var note = String(data.get("note") || "").trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || note.length < 8) {
      NLUI.toast("Add your name, a valid email, and a short note about what you publish.");
      return;
    }
    if (NLStore.findByEmail(email) || NLStore.getRequests().some(function (item) { return item.email.toLowerCase() === email; })) {
      NLUI.toast("That email already has an account or a pending request.");
      return;
    }
    NLStore.addRequest({
      id: "r_" + Date.now().toString(36),
      name: name,
      email: email,
      site: String(data.get("site") || "").trim(),
      note: note,
      countries: data.getAll("market"),
      createdAt: new Date().toISOString(),
    });
    NLUI.closeModal();
    NLUI.toast("Request received. If an account is approved, the administrator will contact you.");
  };

  var eye = document.querySelector('[data-action="toggle-password"]');
  if (eye) eye.innerHTML = NLUI.icon("eye");

  var themeBtn = document.getElementById("theme-btn");
  if (themeBtn) {
    themeBtn.innerHTML = NLUI.icon(NLStore.getTheme() === "dark" ? "sun" : "moon");
    themeBtn.addEventListener("click", function () {
      var next = NLStore.getTheme() === "dark" ? "light" : "dark";
      NLStore.setTheme(next);
      themeBtn.innerHTML = NLUI.icon(next === "dark" ? "sun" : "moon");
    });
  }

  function show(message) {
    error.hidden = false;
    error.textContent = message;
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }
})();
