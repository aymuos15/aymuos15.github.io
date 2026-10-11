// Hand-drawn notes in the Excalidraw style. Opening "collaborate" points
// "Code" at GitHub and "Research" at Google Scholar; clicking the name points
// a note about life outside work at the globe. Strokes come from rough.js
// (the library behind Excalidraw), coloured with the site's pastel rainbow,
// and draw themselves in. Positions follow the page on every resize.
import rough from "https://esm.sh/roughjs@4.6.6";

const SVG_NS = "http://www.w3.org/2000/svg";
const RAINBOW = [
  "#b8a0d8",
  "#8b9bd4",
  "#7cbcd4",
  "#8cc8a0",
  "#d4cc80",
  "#d8a878",
  "#d48888",
];
const HEAD_LEN = 13;
const HEAD_ANGLE = 0.5;
const DRAW_MS = 650;
const LINE_GAP = 24;

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function gradient(id, from, to, reverse) {
  const g = document.createElementNS(SVG_NS, "linearGradient");
  g.id = id;
  g.setAttribute("gradientUnits", "userSpaceOnUse");
  g.setAttribute("x1", from[0]);
  g.setAttribute("y1", from[1]);
  g.setAttribute("x2", to[0]);
  g.setAttribute("y2", to[1]);
  const stops = reverse ? [...RAINBOW].reverse() : RAINBOW;
  stops.forEach((c, i) => {
    const s = document.createElementNS(SVG_NS, "stop");
    s.setAttribute("offset", String(i / (stops.length - 1)));
    s.setAttribute("stop-color", c);
    g.append(s);
  });
  return g;
}

// A bowed curve from `from` to `to`, with an open arrowhead at `to`.
function arrow(rc, id, from, to, bend, seed, reverse) {
  const group = document.createElementNS(SVG_NS, "g");
  const defs = document.createElementNS(SVG_NS, "defs");
  defs.append(gradient(id, from, to, reverse));
  group.append(defs);

  const mid = [
    (from[0] + to[0]) / 2 + bend[0],
    (from[1] + to[1]) / 2 + bend[1],
  ];
  const opts = {
    bowing: 1.2,
    roughness: 1.1,
    seed,
    stroke: `url(#${id})`,
    strokeWidth: 2.1,
  };
  group.append(rc.curve([from, mid, to], opts));

  // Arrowhead follows the curve's direction as it arrives at `to`.
  const angle = Math.atan2(to[1] - mid[1], to[0] - mid[0]);
  for (const side of [-1, 1]) {
    const a = angle + Math.PI - side * HEAD_ANGLE;
    const tip = [
      to[0] + Math.cos(a) * HEAD_LEN,
      to[1] + Math.sin(a) * HEAD_LEN,
    ];
    group.append(rc.line(to[0], to[1], tip[0], tip[1], opts));
  }
  return group;
}

// Text in the hand-drawn face; an array becomes stacked lines.
function label(text, x, y, anchor, tilt) {
  const t = document.createElementNS(SVG_NS, "text");
  const lines = Array.isArray(text) ? text : [text];
  lines.forEach((line, i) => {
    const span = document.createElementNS(SVG_NS, "tspan");
    span.textContent = line;
    span.setAttribute("x", String(x));
    span.setAttribute("y", String(y + i * LINE_GAP));
    t.append(span);
  });
  t.setAttribute("text-anchor", anchor);
  t.setAttribute("transform", `rotate(${tilt} ${x} ${y})`);
  t.classList.add("sketch-notes-label");
  return t;
}

function iconPoint(el) {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2 + window.scrollX, r.bottom + window.scrollY];
}

function codeAndResearch(rc, width) {
  const g = iconPoint(
    document.querySelector('.site-nav a[aria-label="GitHub"]')
  );
  const s = iconPoint(
    document.querySelector('.site-nav a[aria-label="Google Scholar"]')
  );

  // "Code" hangs down and to the left of GitHub.
  const codeAt = [g[0] - 96, g[1] + 92];
  // "Research" sits to the right of Scholar when there is room, else below.
  const roomRight = s[0] + 150 < width;
  const researchAt = roomRight
    ? [s[0] + 92, s[1] + 110]
    : [s[0] - 30, s[1] + 150];
  return [
    arrow(
      rc,
      "sketch-code",
      [codeAt[0] + 22, codeAt[1] - 24],
      [g[0] - 2, g[1] + 8],
      [-26, 16],
      7,
      false
    ),
    label("Code", codeAt[0], codeAt[1], "middle", -6),
    arrow(
      rc,
      "sketch-research",
      roomRight
        ? [researchAt[0] - 30, researchAt[1] - 26]
        : [researchAt[0] + 6, researchAt[1] - 28],
      [s[0] + 3, s[1] + 8],
      roomRight ? [28, 4] : [12, 2],
      11,
      true
    ),
    label("Research", researchAt[0], researchAt[1], "middle", 5),
  ];
}

function globeNote(rc) {
  const r = document.querySelector(".theme-toggle").getBoundingClientRect();
  const x = r.right + window.scrollX;
  const y = r.bottom + window.scrollY;
  const lines = [
    "I love travelling to",
    "experience new cuisines,",
    "and I watch a lot",
    "of anime.",
  ];
  // The name rises 1.3em when opened; keep the note's last line clear of it.
  const h1 = document.querySelector(".name");
  const nameTop =
    h1.getBoundingClientRect().top +
    window.scrollY -
    1.3 * Number.parseFloat(getComputedStyle(h1).fontSize);
  const lastLine = nameTop - 18;
  const top = Math.min(y + 70, lastLine - (lines.length - 1) * LINE_GAP);
  const textAt = [x + 78, Math.max(y + 34, top)];
  return [
    arrow(
      rc,
      "sketch-globe",
      [textAt[0] - 12, textAt[1] - 10],
      [x - 2, y + 4],
      [-24, 14],
      5,
      false
    ),
    label(lines, textAt[0], textAt[1], "start", -3),
  ];
}

function animateIn(svg) {
  if (reduceMotion) {
    return;
  }
  const paths = [...svg.querySelectorAll("path")];
  for (const p of paths) {
    const len = p.getTotalLength();
    p.style.strokeDasharray = String(len);
    p.style.strokeDashoffset = String(len);
  }
  // Force layout so the transition starts from the hidden state.
  svg.getBoundingClientRect();
  for (const p of paths) {
    p.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.3, 0, 0.2, 1)`;
    p.style.strokeDashoffset = "0";
  }
}

// Overlays in the order their toggles were opened; only the newest open one
// shows, so notes never draw over each other.
const stack = [];
const all = [];

const SETTLE_MS = 500;
const intro = document.querySelector(".intro");

// The first note to open slides the intro down; draw once it has settled so
// notes that measure the page (the globe note) see the final layout.
function show(top) {
  const wasSketching = document.body.classList.contains("is-sketching");
  document.body.classList.toggle("is-sketching", Boolean(top));
  for (const o of all) {
    o.svg.classList.toggle("is-open", o === top);
  }
  if (!top) {
    return;
  }
  const reveal = () => {
    if (stack.at(-1) === top) {
      top.draw();
      animateIn(top.svg);
    }
  };
  if (wasSketching || reduceMotion) {
    reveal();
    return;
  }
  top.svg.replaceChildren();
  let done = false;
  const once = () => {
    if (!done) {
      done = true;
      intro.removeEventListener("transitionend", onEnd);
      reveal();
    }
  };
  const onEnd = (e) => {
    if (e.target === intro && e.propertyName === "padding-top") {
      once();
    }
  };
  intro.addEventListener("transitionend", onEnd);
  setTimeout(once, SETTLE_MS);
}

// One overlay per toggle: drawn while the toggle is expanded.
function sketch(toggle, build) {
  if (!toggle) {
    return;
  }
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.classList.add("sketch-notes");
  svg.setAttribute("aria-hidden", "true");
  document.body.append(svg);
  const rc = rough.svg(svg);

  const self = {
    draw() {
      const width = document.documentElement.clientWidth;
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", "420");
      svg.replaceChildren(...build(rc, width));
    },
    isOpen: () => toggle.getAttribute("aria-expanded") === "true",
    svg,
  };
  all.push(self);

  new MutationObserver(() => {
    const at = stack.indexOf(self);
    if (at >= 0) {
      stack.splice(at, 1);
    }
    if (self.isOpen()) {
      stack.push(self);
    }
    show(stack.at(-1));
  }).observe(toggle, { attributeFilter: ["aria-expanded"] });
  window.addEventListener("resize", () => {
    if (stack.at(-1) === self) {
      self.draw();
    }
  });
}

sketch(document.querySelector(".support-toggle"), codeAndResearch);
sketch(document.querySelector(".name-toggle"), globeNote);
