(function () {
  "use strict";

  // Auto-detect API base from script src, fallback to production
  var scripts = document.querySelectorAll("script[src]");
  var API_BASE = "https://reps-contact.option-zero.workers.dev";
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src.indexOf("embed.js") !== -1) {
      API_BASE = scripts[i].src.replace(/\/embed\.js.*$/, "");
      break;
    }
  }
  var containers = document.querySelectorAll("[data-reps-contact]");

  containers.forEach(function (container) {
    var zip = container.getAttribute("data-zip") || "";
    var theme = container.getAttribute("data-theme") || "light";

    // Create shadow DOM for style isolation
    var shadow = container.attachShadow({ mode: "open" });

    var style = document.createElement("style");
    style.textContent = getStyles(theme);
    shadow.appendChild(style);

    var wrapper = document.createElement("div");
    wrapper.className = "rc-widget";
    shadow.appendChild(wrapper);

    if (zip) {
      lookup(wrapper, zip);
    } else {
      renderForm(wrapper);
    }
  });

  function renderForm(wrapper) {
    wrapper.innerHTML =
      '<div class="rc-form">' +
      '<h3 class="rc-title">Find Your Representatives</h3>' +
      '<form class="rc-search">' +
      '<input type="text" class="rc-input" placeholder="Enter zip code" maxlength="5" pattern="\\d{5}" inputmode="numeric" required />' +
      '<button type="submit" class="rc-btn">Look Up</button>' +
      "</form>" +
      '<div class="rc-results"></div>' +
      "</div>";

    var form = wrapper.querySelector("form");
    var input = wrapper.querySelector("input");
    var results = wrapper.querySelector(".rc-results");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var zip = input.value.trim();
      if (/^\d{5}$/.test(zip)) {
        results.innerHTML = '<p class="rc-loading">Loading...</p>';
        lookup(results, zip);
      }
    });
  }

  function lookup(container, zip) {
    container.innerHTML = '<p class="rc-loading">Loading...</p>';
    fetch(API_BASE + "/api/reps?zip=" + encodeURIComponent(zip))
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (!data.representatives || !data.representatives.length) {
          container.innerHTML =
            '<p class="rc-empty">No representatives found for this zip code.</p>';
          return;
        }
        renderReps(container, data.representatives);
      })
      .catch(function () {
        container.innerHTML =
          '<p class="rc-error">Failed to load representatives.</p>';
      });
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderReps(container, reps) {
    reps.sort(function (a, b) {
      if (a.type !== b.type) return a.type === "sen" ? -1 : 1;
      return a.last_name.localeCompare(b.last_name);
    });

    container.innerHTML = reps
      .map(function (rep) {
        var chamber = rep.type === "sen" ? "Senator" : "Rep.";
        var photo =
          rep.photo_url ||
          "https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/225x275/" +
            rep.bioguide_id +
            ".jpg";
        var district =
          rep.type === "rep" && rep.district != null
            ? rep.state + "-" + String(rep.district).padStart(2, "0")
            : rep.state;

        return (
          '<div class="rc-card">' +
          '<img src="' + esc(photo) + '" alt="' + esc(rep.first_name) + " " + esc(rep.last_name) + '" class="rc-photo" />' +
          '<div class="rc-info">' +
          '<div class="rc-name">' + esc(rep.first_name) + " " + esc(rep.last_name) + "</div>" +
          '<div class="rc-role">' + esc(chamber) + " &middot; " + esc(district) + " &middot; " + esc(rep.party) + "</div>" +
          (rep.phone
            ? '<a href="tel:' + esc(rep.phone) + '" class="rc-phone">' + esc(rep.phone) + "</a>"
            : "") +
          (rep.url
            ? '<a href="' + esc(rep.url) + '" target="_blank" rel="noopener" class="rc-link">Website</a>'
            : "") +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function getStyles(theme) {
    var bg = theme === "dark" ? "#1a1a2e" : "#ffffff";
    var text = theme === "dark" ? "#e0e0e0" : "#333333";
    var border = theme === "dark" ? "#333355" : "#e5e7eb";
    var accent = "#2563eb";

    return (
      ".rc-widget { font-family: system-ui, -apple-system, sans-serif; color: " + text + "; }" +
      ".rc-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; }" +
      ".rc-search { display: flex; gap: 0.5rem; margin-bottom: 1rem; }" +
      ".rc-input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid " + border + "; border-radius: 0.375rem; font-size: 0.875rem; }" +
      ".rc-btn { padding: 0.5rem 1rem; background: " + accent + "; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; }" +
      ".rc-btn:hover { opacity: 0.9; }" +
      ".rc-card { display: flex; gap: 0.75rem; padding: 0.75rem; border: 1px solid " + border + "; border-radius: 0.5rem; margin-bottom: 0.5rem; background: " + bg + "; }" +
      ".rc-photo { width: 3.5rem; height: 4.25rem; border-radius: 0.25rem; object-fit: cover; }" +
      ".rc-info { flex: 1; min-width: 0; }" +
      ".rc-name { font-weight: 600; font-size: 0.9375rem; }" +
      ".rc-role { font-size: 0.75rem; color: #6b7280; margin-top: 0.125rem; }" +
      ".rc-phone, .rc-link { display: inline-block; font-size: 0.75rem; margin-top: 0.25rem; margin-right: 0.5rem; color: " + accent + "; text-decoration: none; }" +
      ".rc-phone:hover, .rc-link:hover { text-decoration: underline; }" +
      ".rc-loading, .rc-empty, .rc-error { font-size: 0.875rem; color: #6b7280; padding: 1rem; text-align: center; }" +
      ".rc-error { color: #dc2626; }"
    );
  }
})();
