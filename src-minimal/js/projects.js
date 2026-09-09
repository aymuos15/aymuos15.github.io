// Project deck: the main site's fanned research cards with their live 3D
// orbs. Clicking a card unfolds its intro and papers beneath the deck.
// Theme data comes from js/research-data.js (a link to src/js/research.js).

import { instancesBg, oceanBg, particlesBg, tilesBg } from "./card-bgs.js";
import { buildInstanceDiagram } from "./instance-diagram.js";
import { createNiivueViewer } from "./niivue-viewer.js";
import { headOrb, sphereOrb, tilesOrb, transportOrb } from "./orbs.js";
import { extraThemes } from "./project-extras.js";
import { buildSinkhornDemo } from "./sinkhorn-demo.js";

async function loadThemes() {
  const res = await fetch("js/research-data.js");
  const text = await res.text();
  const start = text.indexOf("const researchThemes = [");
  const end = text.indexOf("\n];", start);
  if (start < 0 || end < 0) {
    throw new Error("researchThemes not found");
  }
  const literal = text.slice(start + "const researchThemes = ".length, end + 2);
  return new Function(`return ${literal}`)();
}

function card(theme, i, n) {
  const offset = i - (n - 1) / 2;
  const el = document.createElement("button");
  el.type = "button";
  el.className = "deck-card";
  el.dataset.id = theme.id;
  el.style.setProperty("--tint", theme.tint || "#999");
  el.style.setProperty("--rot", `${offset * 5}deg`);
  el.style.setProperty("--ty", `${Math.abs(offset) * 11}px`);
  el.style.setProperty("--z", String(10 - Math.abs(offset)));
  el.setAttribute("aria-haspopup", "dialog");
  el.setAttribute("aria-label", `${theme.title}. ${theme.blurb}`);

  const orb = document.createElement("span");
  orb.className = `deck-orb deck-orb--${theme.orb3d || "plain"}`;
  if (["head", "sphere", "transport", "tiles"].includes(theme.orb3d)) {
    const c = document.createElement("canvas");
    c.width = theme.orb3d === "head" ? 96 : 112;
    c.height = c.width;
    c.setAttribute("aria-hidden", "true");
    orb.appendChild(c);
  }
  const label = document.createElement("span");
  label.className = "deck-label";
  label.textContent = theme.title;
  const blurb = document.createElement("span");
  blurb.className = "deck-blurb";
  blurb.textContent = theme.blurb;
  el.append(orb, label, blurb);
  return el;
}

const niivue = createNiivueViewer();

function modalBody(theme) {
  const body = document.createElement("div");
  body.className = "modal-body";
  body.style.setProperty("--tint", theme.tint || "#999");
  const h = document.createElement("h2");
  h.className = "modal-title";
  h.id = "project-modal-title";
  h.textContent = theme.title;
  const p = document.createElement("p");
  p.className = "modal-intro";
  p.textContent = theme.intro;
  body.append(h, p);

  if (theme.interactive === "instance") {
    const mount = document.createElement("div");
    mount.className = "instance-diagram";
    body.appendChild(mount);
    buildInstanceDiagram(mount);
  } else if (theme.interactive === "niivue") {
    body.appendChild(niivue.element);
  } else if (theme.interactive === "sinkhorn") {
    const mount = document.createElement("div");
    mount.className = "ot-demo";
    body.appendChild(mount);
    buildSinkhornDemo(mount, theme.tint);
  }

  if (theme.papers?.length) {
    const heading = document.createElement("h3");
    heading.className = "modal-heading";
    heading.textContent = theme.papers.length > 1 ? "Papers" : "Paper";
    const list = document.createElement("ul");
    list.className = "modal-papers";
    for (const paper of theme.papers) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = paper.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = paper.title;
      li.append(a);
      if (paper.venue) {
        const v = document.createElement("span");
        v.className = "modal-venue";
        v.textContent = paper.venue;
        li.append(v);
      }
      list.append(li);
    }
    body.append(heading, list);
  }
  return body;
}

// Push the live canvases (front orb, then card background) for one card.
function attachCanvases(orbs, el, t) {
  const canvas = el.querySelector("canvas");
  if (canvas && t.orb3d === "head") {
    orbs.push(headOrb(canvas));
  }
  if (canvas && t.orb3d === "sphere") {
    orbs.push(sphereOrb(canvas));
  }
  if (canvas && t.orb3d === "transport") {
    orbs.push(transportOrb(canvas, t.tint));
  }
  if (canvas && t.orb3d === "tiles") {
    orbs.push(tilesOrb(canvas, t.tint));
  }
  try {
    if (t.id === "segmentation") {
      orbs.push(oceanBg(el));
    }
    if (t.id === "instance-metrics") {
      orbs.push(instancesBg(el));
    }
    if (t.orb3d === "transport") {
      orbs.push(particlesBg(el));
    }
    if (t.orb3d === "tiles") {
      orbs.push(tilesBg(el, t.tint));
    }
  } catch (err) {
    console.warn("card background:", err);
  }
}

function setup(themes) {
  const section = document.querySelector(".projects");
  const deck = document.createElement("div");
  deck.className = "deck";
  section.replaceChildren(deck);

  const modal = document.querySelector(".project-modal");
  const panel = modal.querySelector(".project-modal-panel");
  const slot = modal.querySelector(".project-modal-slot");

  const orbs = [];
  const cards = themes.map((t, i) => {
    const el = card(t, i, themes.length);
    deck.appendChild(el);
    attachCanvases(orbs, el, t);
    // Warm the scan volumes as soon as the visitor reaches for the card.
    if (t.interactive === "niivue") {
      el.addEventListener("pointerenter", niivue.prefetch, { once: true });
    }
    return el;
  });

  // Scale the fan down on narrow screens instead of reflowing it, so the
  // tilt and overlap survive on phones. The deck's own height follows the
  // scale because transforms don't affect layout.
  let natural = null;
  function fitDeck() {
    deck.style.transform = "";
    deck.style.marginBottom = "";
    const rects = [...deck.children].map((c) => c.getBoundingClientRect());
    if (!rects.length) {
      return;
    }
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    natural = { h: deck.getBoundingClientRect().height, w: right - left + 8 };
    const avail = section.getBoundingClientRect().width;
    const s = Math.min(1, avail / natural.w);
    if (s < 1) {
      deck.style.transform = `scale(${s.toFixed(3)})`;
      deck.style.marginBottom = `${Math.round(natural.h * (s - 1))}px`;
    }
  }
  requestAnimationFrame(fitDeck);
  new ResizeObserver(fitDeck).observe(section);

  let lastFocused = null;
  function open(theme) {
    lastFocused = document.activeElement;
    slot.replaceChildren(modalBody(theme));
    panel.style.setProperty("--tint", theme.tint || "#999");
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.body.classList.add("modal-open");
    modal.querySelector(".project-modal-close").focus();
    if (theme.interactive === "niivue") {
      niivue.activate();
    }
  }
  function close() {
    if (modal.hidden) {
      return;
    }
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    const finish = () => {
      modal.removeEventListener("transitionend", finish);
      if (modal.classList.contains("is-open")) {
        return; // reopened meanwhile
      }
      modal.hidden = true;
      slot.replaceChildren();
    };
    modal.addEventListener("transitionend", finish);
    setTimeout(finish, 400);
    lastFocused?.focus?.();
  }
  for (const c of cards) {
    c.addEventListener("click", () =>
      open(themes.find((t) => t.id === c.dataset.id))
    );
  }
  for (const el of modal.querySelectorAll("[data-close]")) {
    el.addEventListener("click", close);
  }
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) {
      return;
    }
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "Tab") {
      const focusable = [
        ...modal.querySelectorAll(
          'button, a[href], select, [tabindex]:not([tabindex="-1"])'
        ),
      ];
      if (!focusable.length) {
        return;
      }
      const [first] = focusable;
      const last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  new MutationObserver(() => {
    for (const o of orbs) {
      o.retheme?.();
    }
  }).observe(document.documentElement, {
    attributeFilter: ["data-theme"],
    attributes: true,
  });
  // Run the card canvases only while the deck is on screen and the tab is visible.
  let onScreen = true;
  const sync = () => {
    for (const o of orbs) {
      if (document.hidden || !onScreen) {
        o.stop();
      } else {
        o.start();
      }
    }
  };
  document.addEventListener("visibilitychange", sync);
  new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      sync();
    },
    { threshold: 0.05 }
  ).observe(deck);
}

loadThemes()
  .then((themes) => setup([...themes, ...extraThemes]))
  .catch((err) => console.error("projects:", err));
