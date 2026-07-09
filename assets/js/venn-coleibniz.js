// Interactive Venn-diagram widget for the co-Leibniz post.
// Two draggable circles A, B; the main buttons pick which operator to display:
//   dA      : boundary of A            (ring of A)
//   deltaA  : decidability of A        (wash everywhere except the ring of A)
//   dAB     : d(A & B)  = (dA & B) v (A & dB)       -- two arcs
//   deltaAB : delta(A v B) = (deltaA v B) & (A v deltaB) -- wash with arcs cut out
// The composite modes get two sub-buttons that toggle each term of the
// identity on and off, so the reader can match arcs to terms.
(function () {
  var svg = document.getElementById("vw-svg");
  if (!svg) return;

  var TAU = 2 * Math.PI;
  var W = 460;
  var H = 320;
  var A = { x: 185, y: 160, r: 80 };
  var B = { x: 292, y: 160, r: 66 };
  var mode = "dA";
  var termOn = { 1: true, 2: true };

  function $(id) {
    return document.getElementById(id);
  }
  var el = {
    hairA: $("vw-hairA"),
    hairB: $("vw-hairB"),
    wash: $("vw-wash"),
    lens: $("vw-lens"),
    arc1: $("vw-arc1"),
    arc2: $("vw-arc2"),
    cut1: $("vw-cut1"),
    cut2: $("vw-cut2"),
    labA: $("vw-labA"),
    labB: $("vw-labB"),
    gripA: $("vw-gripA"),
    gripB: $("vw-gripB"),
    note: $("vw-note"),
  };

  function f(n) {
    return Math.round(n * 100) / 100;
  }
  function mod(a) {
    a %= TAU;
    return a < 0 ? a + TAU : a;
  }
  function fullCircle(c) {
    return (
      "M " + f(c.x - c.r) + " " + f(c.y) +
      " A " + c.r + " " + c.r + " 0 1 0 " + f(c.x + c.r) + " " + f(c.y) +
      " A " + c.r + " " + c.r + " 0 1 0 " + f(c.x - c.r) + " " + f(c.y)
    );
  }
  // Arc of the circle c from P1 to P2, on whichever side passes through Q.
  // In SVG's y-down coordinates sweep=1 means increasing atan2 angle.
  function arcFlags(c, P1, P2, Q) {
    var t1 = Math.atan2(P1.y - c.y, P1.x - c.x);
    var t2 = Math.atan2(P2.y - c.y, P2.x - c.x);
    var tq = Math.atan2(Q.y - c.y, Q.x - c.x);
    var dSweep = mod(t2 - t1);
    var onSweep = mod(tq - t1) <= dSweep;
    var ext = onSweep ? dSweep : TAU - dSweep;
    return { large: ext > Math.PI ? 1 : 0, sweep: onSweep ? 1 : 0 };
  }
  function arcSeg(c, P2, fl) {
    return " A " + c.r + " " + c.r + " 0 " + fl.large + " " + fl.sweep + " " + f(P2.x) + " " + f(P2.y);
  }
  function arcPath(c, P1, P2, Q) {
    return "M " + f(P1.x) + " " + f(P1.y) + arcSeg(c, P2, arcFlags(c, P1, P2, Q));
  }

  // Classify the configuration and find the intersection points.
  function geo() {
    var dx = B.x - A.x;
    var dy = B.y - A.y;
    var d = Math.hypot(dx, dy) || 1e-6;
    var u = { x: dx / d, y: dy / d };
    if (d >= A.r + B.r) return { kind: "disjoint", u: u };
    if (d + A.r <= B.r) return { kind: "AinB", u: u };
    if (d + B.r <= A.r) return { kind: "BinA", u: u };
    var a = (d * d + A.r * A.r - B.r * B.r) / (2 * d);
    var h = Math.sqrt(Math.max(0, A.r * A.r - a * a));
    var mx = A.x + a * u.x;
    var my = A.y + a * u.y;
    return {
      kind: "overlap",
      u: u,
      P1: { x: mx - h * u.y, y: my + h * u.x },
      P2: { x: mx + h * u.y, y: my - h * u.x },
    };
  }

  function upd() {
    var g = geo();
    var u = g.u;
    // Points of A/B nearest to and farthest from the other circle: they pick
    // the "inner" (inside the other set) and "outer" halves of each boundary.
    var QAin = { x: A.x + u.x * A.r, y: A.y + u.y * A.r };
    var QAout = { x: A.x - u.x * A.r, y: A.y - u.y * A.r };
    var QBin = { x: B.x - u.x * B.r, y: B.y - u.y * B.r };
    var QBout = { x: B.x + u.x * B.r, y: B.y + u.y * B.r };

    el.hairA.setAttribute("cx", f(A.x));
    el.hairA.setAttribute("cy", f(A.y));
    el.hairB.setAttribute("cx", f(B.x));
    el.hairB.setAttribute("cy", f(B.y));
    el.gripA.setAttribute("cx", f(A.x));
    el.gripA.setAttribute("cy", f(A.y));
    el.gripB.setAttribute("cx", f(B.x));
    el.gripB.setAttribute("cy", f(B.y));
    el.labA.setAttribute("x", f(A.x - u.x * A.r * 0.5));
    el.labA.setAttribute("y", f(A.y - u.y * A.r * 0.5 + 5));
    el.labB.setAttribute("x", f(B.x + u.x * B.r * 0.5));
    el.labB.setAttribute("y", f(B.y + u.y * B.r * 0.5 + 5));

    // The four boundary pieces the identities are built from, plus the lens:
    // innerX = the part of X's boundary inside the other set,
    // cutX   = the part of X's boundary outside the other set.
    var innerA = "";
    var innerB = "";
    var cutA = "";
    var cutB = "";
    var lens = "";
    if (g.kind === "overlap") {
      innerA = arcPath(A, g.P1, g.P2, QAin);
      innerB = arcPath(B, g.P1, g.P2, QBin);
      cutA = arcPath(A, g.P1, g.P2, QAout);
      cutB = arcPath(B, g.P1, g.P2, QBout);
      lens = innerA + arcSeg(B, g.P1, arcFlags(B, g.P2, g.P1, QBin)) + " Z";
    } else if (g.kind === "AinB") {
      innerA = fullCircle(A);
      cutB = fullCircle(B);
      lens = fullCircle(A) + " Z";
    } else if (g.kind === "BinA") {
      innerB = fullCircle(B);
      cutA = fullCircle(A);
      lens = fullCircle(B) + " Z";
    } else {
      cutA = fullCircle(A);
      cutB = fullCircle(B);
    }

    el.wash.style.display = "none";
    el.lens.setAttribute("d", "");
    el.arc1.setAttribute("d", "");
    el.arc2.setAttribute("d", "");
    el.cut1.setAttribute("d", "");
    el.cut2.setAttribute("d", "");
    var note = "";

    if (mode === "dA") {
      el.arc1.setAttribute("d", fullCircle(A));
    } else if (mode === "deltaA") {
      el.wash.style.display = "";
      el.cut1.setAttribute("d", fullCircle(A));
    } else if (mode === "dAB") {
      el.lens.setAttribute("d", lens);
      if (termOn[1]) el.arc1.setAttribute("d", innerA);
      if (termOn[2]) el.arc2.setAttribute("d", innerB);
      if (g.kind === "AinB") note = "A ≤ B, so ∂(A ∧ B) = ∂A.";
      else if (g.kind === "BinA") note = "B ≤ A, so ∂(A ∧ B) = ∂B.";
      else if (g.kind === "disjoint") note = "A ∧ B = ∅ — there is nothing to bound.";
    } else if (mode === "deltaAB") {
      el.wash.style.display = "";
      if (termOn[1]) el.cut1.setAttribute("d", cutA);
      if (termOn[2]) el.cut2.setAttribute("d", cutB);
      if (g.kind === "AinB") note = "A ≤ B, so δ(A ∨ B) = δB.";
      else if (g.kind === "BinA") note = "B ≤ A, so δ(A ∨ B) = δA.";
      else if (g.kind === "disjoint") note = "A and B are disjoint — both boundaries are removed in full.";
    }
    el.note.textContent = note;
  }

  function syncTermUI() {
    document.querySelectorAll(".venn-widget .vw-sub button").forEach(function (b) {
      var on = termOn[+b.getAttribute("data-term")];
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.querySelectorAll(".venn-widget .vw-cap .vw-t1").forEach(function (s) {
      s.classList.toggle("on", termOn[1]);
    });
    document.querySelectorAll(".venn-widget .vw-cap .vw-t2").forEach(function (s) {
      s.classList.toggle("on", termOn[2]);
    });
  }

  function setMode(m) {
    mode = m;
    termOn[1] = true;
    termOn[2] = true;
    document.querySelectorAll(".venn-widget .vw-main").forEach(function (b) {
      var on = b.getAttribute("data-mode") === m;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.querySelectorAll(".venn-widget .vw-sub").forEach(function (s) {
      s.style.display = s.getAttribute("data-sub") === m ? "" : "none";
    });
    document.querySelectorAll(".venn-widget .vw-cap").forEach(function (c) {
      c.style.display = c.getAttribute("data-cap") === m ? "" : "none";
    });
    syncTermUI();
    upd();
  }

  document.querySelectorAll(".venn-widget .vw-main").forEach(function (b) {
    b.addEventListener("click", function () {
      setMode(b.getAttribute("data-mode"));
    });
  });
  document.querySelectorAll(".venn-widget .vw-sub button").forEach(function (b) {
    b.addEventListener("click", function () {
      var n = +b.getAttribute("data-term");
      termOn[n] = !termOn[n];
      syncTermUI();
      upd();
    });
  });

  function toView(e) {
    var m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  }
  function makeDraggable(grip, c) {
    grip.addEventListener("pointerdown", function (e) {
      grip.setPointerCapture(e.pointerId);
      var p = toView(e);
      var ox = c.x - p.x;
      var oy = c.y - p.y;
      grip.classList.add("dragging");
      function move(ev) {
        var q = toView(ev);
        c.x = Math.min(W - c.r - 4, Math.max(c.r + 4, q.x + ox));
        c.y = Math.min(H - c.r - 4, Math.max(c.r + 4, q.y + oy));
        upd();
      }
      function up() {
        grip.removeEventListener("pointermove", move);
        grip.removeEventListener("pointerup", up);
        grip.removeEventListener("pointercancel", up);
        grip.classList.remove("dragging");
      }
      grip.addEventListener("pointermove", move);
      grip.addEventListener("pointerup", up);
      grip.addEventListener("pointercancel", up);
      e.preventDefault();
    });
  }
  makeDraggable(el.gripA, A);
  makeDraggable(el.gripB, B);

  // Exposed for testing.
  window.__vennWidget = { A: A, B: B, setMode: setMode, upd: upd };

  upd();
})();
