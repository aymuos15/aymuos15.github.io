// Instance-imbalance interactive diagram, ported from the main site.
// Shows how the Dice score is owned by the largest lesion while an
// instance-aware score weights every lesion equally.
export function buildInstanceDiagram(container) {
  if (!container) {
    return;
  }

  const blobs = [
    { r: 34, x: 14, y: 40 },
    { r: 24, x: 38, y: 28 },
    { r: 18, x: 62, y: 58 },
    { r: 13, x: 28, y: 72 },
    { r: 9, x: 76, y: 32 },
    { r: 6, x: 50, y: 16 },
    { r: 5, x: 82, y: 68 },
    { r: 4, x: 90, y: 18 },
  ];
  const totalArea = blobs.reduce((s, b) => s + b.r * b.r, 0);
  for (const b of blobs) {
    b.diceW = (b.r * b.r) / totalArea;
    b.instW = 1 / blobs.length;
  }
  const vibgyor = [
    "#b8a0d8",
    "#8b9bd4",
    "#7cbcd4",
    "#8cc8a0",
    "#d4cc80",
    "#d8a878",
    "#d48888",
    "#d4a0b8",
  ];
  let mode = "dice";

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) {
      e.className = cls;
    }
    if (text !== undefined) {
      e.textContent = text;
    }
    return e;
  };
  const btn = (cls, text, fn) => {
    const b = el("button", cls, text);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  };

  const labels = el("div", "diagram-labels");
  const lblSem = btn("label-tab active", "Semantic Labels", () =>
    setMode("dice")
  );
  const lblInst = btn("label-tab", "Instance Labels", () =>
    setMode("instance")
  );
  labels.append(lblSem, lblInst);

  const scatter = el("div", "diagram-scatter");
  blobs.forEach((b, i) => {
    const blob = el("div", "diagram-blob");
    blob.style.left = `${b.x}%`;
    blob.style.top = `${b.y}%`;
    blob.style.width = `${b.r * 2}px`;
    blob.style.height = `${b.r * 2}px`;
    const ring = el("div", "blob-ring");
    blob.appendChild(ring);
    b.el = blob;
    b.ring = ring;
    scatter.appendChild(blob);
    blob.addEventListener("mouseenter", () => hi(i));
    blob.addEventListener("mouseleave", lo);
  });

  const controls = el("div", "diagram-controls");
  const toggle = el("div", "diagram-toggle");
  const btnD = btn("diagram-btn active", "Dice Metric", () => setMode("dice"));
  const btnI = btn("diagram-btn", "Instance-Aware Dice Metric", () =>
    setMode("instance")
  );
  toggle.append(btnD, btnI);
  const scores = el("div", "diagram-scores");
  const scoreCard = (label) => {
    const card = el("div", "score-card");
    const val = el("span", "score-value");
    card.append(el("span", "score-label", label), val);
    return { card, val };
  };
  const dsc = scoreCard("DSC");
  const pq = scoreCard("PQ");
  scores.append(dsc.card, pq.card);
  controls.append(toggle, scores);

  const targets = {
    dice: { dsc: 0.95, pq: 0.38 },
    instance: { dsc: 0.88, pq: 0.76 },
  };
  let curDsc = 0;
  let curPq = 0;

  const bars = el("div", "diagram-bars");
  blobs.forEach((b, i) => {
    const col = el("div", "diagram-bar-col");
    const pct = el("span", "bar-pct");
    const track = el("div", "bar-track-v");
    const fill = el("div", "bar-fill-v");
    track.appendChild(fill);
    const dot = el("div", "bar-dot");
    const size = Math.max(4, Math.round(b.r * 0.45));
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    col.append(pct, track, dot);
    b.fill = fill;
    b.pct = pct;
    b.col = col;
    bars.appendChild(col);
    col.addEventListener("mouseenter", () => hi(i));
    col.addEventListener("mouseleave", lo);
  });

  const caption = el("p", "diagram-caption");
  const top = el("div", "diagram-top");
  top.append(scatter, bars);
  container.append(labels, top, controls, caption);

  function setMode(m) {
    if (m === mode) {
      return;
    }
    mode = m;
    btnD.classList.toggle("active", mode === "dice");
    btnI.classList.toggle("active", mode === "instance");
    btnI.classList.toggle("rainbow", mode === "instance");
    lblSem.classList.toggle("active", mode === "dice");
    lblInst.classList.toggle("active", mode === "instance");
    lblInst.classList.toggle("rainbow", mode === "instance");
    update();
  }

  function animateScore(node, from, to, flagLow) {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 500);
      const ease = 1 - (1 - p) ** 3;
      node.textContent = (from + (to - from) * ease).toFixed(2);
      if (p < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
    node.classList.toggle("low", flagLow && to < 0.5);
    node.classList.toggle("high", flagLow && to >= 0.5);
  }

  function update() {
    const maxW = Math.max(
      ...blobs.map((b) => (mode === "dice" ? b.diceW : b.instW))
    );
    blobs.forEach((b, i) => {
      const w = mode === "dice" ? b.diceW : b.instW;
      const n = w / maxW;
      b.el.style.opacity = 0.12 + 0.88 * n;
      b.ring.style.transform = `scale(${1 + 0.5 * n})`;
      b.ring.style.opacity = 0.08 + 0.72 * n;
      b.fill.style.height = `${n * 100}%`;
      b.pct.textContent = `${(w * 100).toFixed(1)}%`;
      if (mode === "instance") {
        b.el.style.setProperty("--blob-color", vibgyor[i]);
        b.col.style.setProperty("--blob-color", vibgyor[i]);
      } else {
        b.el.style.removeProperty("--blob-color");
        b.col.style.removeProperty("--blob-color");
      }
    });
    const t = targets[mode];
    animateScore(dsc.val, curDsc, t.dsc, false);
    animateScore(pq.val, curPq, t.pq, true);
    curDsc = t.dsc;
    curPq = t.pq;
    caption.textContent =
      mode === "dice"
        ? "With the standard Dice Score, the largest instance owns 48.5% of the metric. The 3 smallest share just 3.2%. Missing them barely changes the score."
        : "Instance-aware: every instance contributes 12.5% to the score, regardless of size. Small lesions are weighted equally.";
  }

  function hi(idx) {
    container.classList.add("has-highlight");
    blobs.forEach((b, i) => {
      b.el.classList.toggle("highlighted", i === idx);
      b.col.classList.toggle("highlighted", i === idx);
    });
  }
  function lo() {
    container.classList.remove("has-highlight");
    for (const b of blobs) {
      b.el.classList.remove("highlighted");
      b.col.classList.remove("highlighted");
    }
  }

  update();
}
