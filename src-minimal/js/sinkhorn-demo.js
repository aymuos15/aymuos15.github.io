// Interactive entropic optimal transport: two histograms, a regularisation
// slider, and the coupling matrix computed by Sinkhorn iterations. The
// "sparse" toggle keeps only the largest entries per row and reports how
// much of the plan survives; it illustrates sparsity rather than
// reproducing the SinkSLOT algorithm.
const N = 24;
const HEX_RGB = /#(..)(..)(..)/;

function shape(kind) {
  const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
  let a;
  if (kind === "gauss") {
    a = xs.map((x) => Math.exp(-((x - 0.5) ** 2) / 0.02));
  } else if (kind === "left") {
    a = xs.map((x) => Math.exp(-((x - 0.25) ** 2) / 0.015));
  } else if (kind === "right") {
    a = xs.map((x) => Math.exp(-((x - 0.75) ** 2) / 0.015));
  } else if (kind === "two") {
    a = xs.map(
      (x) =>
        Math.exp(-((x - 0.25) ** 2) / 0.006) +
        Math.exp(-((x - 0.7) ** 2) / 0.006)
    );
  } else {
    a = xs.map(() => 1);
  }
  const s = a.reduce((p, q) => p + q, 0);
  return a.map((q) => q / s);
}

function sinkhorn(a, b, eps, iters = 200) {
  const K = a.map((_, i) =>
    b.map((__, j) => Math.exp(-(((i - j) / N) ** 2) / eps))
  );
  let u = new Array(N).fill(1);
  let v = new Array(N).fill(1);
  for (let it = 0; it < iters; it += 1) {
    u = a.map(
      (ai, i) =>
        ai /
        Math.max(
          1e-12,
          K[i].reduce((s, k, j) => s + k * v[j], 0)
        )
    );
    v = b.map(
      (bj, j) =>
        bj /
        Math.max(
          1e-12,
          K.reduce((s, row, i) => s + row[j] * u[i], 0)
        )
    );
  }
  return a.map((_, i) => b.map((__, j) => u[i] * K[i][j] * v[j]));
}

export function buildSinkhornDemo(container, tint = "#7cbcd4") {
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
  const shapes = [
    ["gauss", "bell"],
    ["left", "left"],
    ["right", "right"],
    ["two", "two peaks"],
    ["flat", "flat"],
  ];
  const picker = (label, initial, onChange) => {
    const wrap = el("label", "ot-pick");
    wrap.append(el("span", null, label));
    const sel = el("select");
    for (const [v, t] of shapes) {
      const o = el("option", null, t);
      o.value = v;
      if (v === initial) {
        o.selected = true;
      }
      sel.appendChild(o);
    }
    sel.addEventListener("change", onChange);
    wrap.append(sel);
    return { sel, wrap };
  };

  const controls = el("div", "ot-controls");
  const srcPick = picker("Source", "left", () => render());
  const dstPick = picker("Target", "two", () => render());
  const epsWrap = el("label", "ot-pick");
  epsWrap.append(el("span", null, "ε"));
  const eps = el("input");
  eps.type = "range";
  eps.min = "-3";
  eps.max = "-0.7";
  eps.step = "0.05";
  eps.value = "-2";
  eps.addEventListener("input", () => render());
  epsWrap.append(eps);
  const sparse = el("button", "ot-toggle", "sparse");
  sparse.type = "button";
  sparse.setAttribute("aria-pressed", "false");
  sparse.addEventListener("click", () => {
    sparse.setAttribute(
      "aria-pressed",
      String(sparse.getAttribute("aria-pressed") !== "true")
    );
    render();
  });
  controls.append(srcPick.wrap, dstPick.wrap, epsWrap, sparse);

  const canvas = el("canvas", "ot-canvas");
  canvas.width = 520;
  canvas.height = 300;
  const caption = el("p", "ot-caption");
  container.append(controls, canvas, caption);
  const ctx = canvas.getContext("2d");
  const rgb = tint
    .match(HEX_RGB)
    .slice(1)
    .map((h) => Number.parseInt(h, 16));

  function render() {
    const a = shape(srcPick.sel.value);
    const b = shape(dstPick.sel.value);
    const e = 10 ** Number(eps.value);
    let P = sinkhorn(a, b, e);
    let kept = N * N;
    if (sparse.getAttribute("aria-pressed") === "true") {
      // Keep the three largest entries per row.
      kept = 0;
      P = P.map((row) => {
        const thr = [...row].sort((x, y) => y - x)[2] || 0;
        return row.map((p) => {
          const keep = p >= thr && p > 1e-9;
          if (keep) {
            kept += 1;
          }
          return keep ? p : 0;
        });
      });
    }
    const ink =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ink")
        .trim() || "#111";
    const muted =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--muted")
        .trim() || "#777";
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const m = 64; // histogram band
    const size = Math.min(W - m - 10, H - m - 10);
    const ox = m;
    const oy = m;
    const cell = size / N;
    const maxP = Math.max(...P.flat(), 1e-12);
    for (let i = 0; i < N; i += 1) {
      for (let j = 0; j < N; j += 1) {
        const t = (P[i][j] / maxP) ** 0.5;
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.04 + 0.96 * t})`;
        ctx.fillRect(ox + j * cell, oy + i * cell, cell - 0.5, cell - 0.5);
      }
    }
    // Target histogram along the top, source down the left.
    const maxA = Math.max(...a);
    const maxB = Math.max(...b);
    ctx.fillStyle = muted;
    for (let j = 0; j < N; j += 1) {
      const hgt = (b[j] / maxB) * (m - 14);
      ctx.fillRect(ox + j * cell, oy - 8 - hgt, cell - 1, hgt);
    }
    for (let i = 0; i < N; i += 1) {
      const wdt = (a[i] / maxA) * (m - 14);
      ctx.fillRect(ox - 8 - wdt, oy + i * cell, wdt, cell - 1);
    }
    ctx.fillStyle = ink;
    ctx.font = "12px Newsreader, Georgia, serif";
    ctx.fillText("target", ox + size - 40, 12);
    ctx.save();
    ctx.translate(12, oy + size);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("source", 0, 0);
    ctx.restore();
    const pct = ((kept / (N * N)) * 100).toFixed(0);
    caption.textContent =
      sparse.getAttribute("aria-pressed") === "true"
        ? `Sparse plan: ${pct}% of entries kept, three per source point. Smaller ε makes the dense plan sparser on its own.`
        : `Dense Sinkhorn plan at ε = ${e.toExponential(1)}. Lower ε concentrates mass; higher ε spreads it out.`;
  }
  render();
  return { render };
}
