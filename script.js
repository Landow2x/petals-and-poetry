(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var views = { home: $("#view-home"), order: $("#view-order") };
  var curtain = $("#curtain");
  var current = "home", busy = false;

  /* thumbnails on the order page reuse the product photos from the home page */
  $$("[data-from]").forEach(function (img) {
    var src = document.getElementById(img.getAttribute("data-from"));
    if (src) img.src = src.src;
  });

  /* scroll reveal: only items below the fold start dimmed; they never stay hidden */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 }) : null;
  function prime() {
    if (!io || reduce) return;
    $$(".reveal", views[current]).forEach(function (el) {
      if (el.__seen) return;
      el.__seen = true;
      if (el.getBoundingClientRect().top > window.innerHeight * 0.92) el.classList.add("pre");
      io.observe(el);
    });
  }

  function setHash(v) { try { if (location.hash !== "#" + v) location.hash = v; } catch (e) {} }
  function swap(v) {
    Object.keys(views).forEach(function (k) { views[k].hidden = (k !== v); });
    current = v;
    window.scrollTo({ top: 0, behavior: "instant" });
    prime();
  }
  function go(v, after) {
    if (!views[v]) return;
    if (v === current) { if (after) after(); return; }
    if (busy) return;
    busy = true;
    if (reduce) { swap(v); setHash(v); busy = false; if (after) after(); return; }
    curtain.className = "curtain in";
    setTimeout(function () {
      swap(v); setHash(v);
      curtain.className = "curtain out";
      setTimeout(function () {
        curtain.style.transition = "none";
        curtain.className = "curtain";
        void curtain.offsetHeight;
        curtain.style.transition = "";
        busy = false;
        if (after) after();
      }, 640);
    }, 640);
  }

  /* order form */
  var ids = ["yourName", "forWhom", "occasion", "colors", "story"];
  var el = {};
  ids.forEach(function (i) { el[i] = document.getElementById(i); });
  var msg = $("#msg"), status = $("#status");
  function chosen() { var r = $("input[name=product]:checked"); return r ? r.value : ""; }
  function build() {
    var v = function (k) { return el[k].value.trim(); };
    var lines = ["Hello Petals & Poetry!"];
    lines.push("I would like to order: " + chosen() + (v("forWhom") ? " for " + v("forWhom") : "") + ".");
    lines.push("Occasion: " + v("occasion") + ".");
    if (v("colors")) lines.push("Colors or design: " + v("colors") + ".");
    if (v("story")) lines.push("Message for the card and poem: " + v("story"));
    lines.push("Thank you," + (v("yourName") ? "\n" + v("yourName") : ""));
    msg.textContent = lines.join("\n\n");
    status.textContent = "";
  }
  ids.forEach(function (i) { el[i].addEventListener("input", build); el[i].addEventListener("change", build); });
  $$("input[name=product]").forEach(function (r) { r.addEventListener("change", build); });
  build();
  $("#orderForm").addEventListener("submit", function (e) { e.preventDefault(); });

  function burst(btn) {
    if (reduce || !btn.animate) return;
    var r = btn.getBoundingClientRect();
    var cols = ["#b3202a", "#fbe8d3", "#96964f", "#55551f"];
    for (var i = 0; i < 18; i++) {
      var p = document.createElement("span");
      p.className = "petal";
      p.style.left = (r.left + r.width / 2) + "px";
      p.style.top = (r.top + r.height / 2) + "px";
      p.style.background = cols[i % 4];
      document.body.appendChild(p);
      var a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 100;
      var dx = Math.cos(a) * d, dy = Math.sin(a) * d - 50;
      var anim = p.animate([
        { transform: "translate(-50%,-50%) rotate(0deg) scale(1)", opacity: 1 },
        { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + (dy + 90) + "px)) rotate(" + (Math.random() * 540) + "deg) scale(.6)", opacity: 0 }
      ], { duration: 900 + Math.random() * 600, easing: "cubic-bezier(.2,.7,.3,1)" });
      anim.onfinish = (function (n) { return function () { n.remove(); }; })(p);
    }
  }
  $("#copyBtn").addEventListener("click", function () {
    var text = msg.textContent, btn = this;
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(msg);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      status.textContent = "Message selected. Copy it with your keyboard.";
    }
    try {
      navigator.clipboard.writeText(text).then(function () {
        status.textContent = "Copied. Send it to us and we will start crafting.";
        burst(btn);
      }, fallback);
    } catch (e) { fallback(); }
  });

  /* navigation */
  $$("[data-go]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var pick = a.getAttribute("data-pick");
      if (pick) {
        var r = $("input[name=product][value=\"" + pick + "\"]");
        if (r) { r.checked = true; build(); }
      }
      go(a.getAttribute("data-go"));
    });
  });
  $$("[data-scroll]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var t = document.getElementById(a.getAttribute("data-scroll"));
      function sc() { if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
      if (current !== "home") go("home", function () { setTimeout(sc, 60); }); else sc();
    });
  });
  window.addEventListener("hashchange", function () {
    var h = location.hash.replace("#", "");
    if (views[h]) go(h);
  });
  var start = location.hash.replace("#", "");
  if (views[start] && start !== "home") swap(start); else prime();
})();
