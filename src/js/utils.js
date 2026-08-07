// Pastel rainbow link colors
const pastelColors = [
  "#e8a0bf",
  "#f0b8a8",
  "#f2cc8f",
  "#b5d99c",
  "#a8d8ea",
  "#b8b8f0",
  "#d4a5e5",
  "#f5a8a8",
  "#a8e0c8",
  "#c4b8e8",
  "#e8c8a0",
  "#a0c8e8",
];

// Shared with typer.js (separate script scope) for per-glyph pastel colors.
window.pastelColors = pastelColors;

const LETTER = /[A-Za-z]/;

function colorizeLinks() {
  for (const link of document.querySelectorAll("main a")) {
    const color = pastelColors[Math.floor(Math.random() * pastelColors.length)];
    link.style.color = color;
  }
}

function colorizeRandomLetters(el, accentRatio = 0.28) {
  const text = el.dataset.original || el.textContent;
  const letterPositions = [];

  el.dataset.original = text;
  for (const [index, ch] of [...text].entries()) {
    if (LETTER.test(ch)) {
      letterPositions.push(index);
    }
  }

  if (!letterPositions.length) {
    return;
  }

  const accentCount = Math.max(
    1,
    Math.floor(letterPositions.length * accentRatio)
  );
  const accentPositions = new Set();

  while (accentPositions.size < Math.min(accentCount, letterPositions.length)) {
    const randomIndex = Math.floor(Math.random() * letterPositions.length);
    accentPositions.add(letterPositions[randomIndex]);
  }

  const fragment = document.createDocumentFragment();
  for (const [index, ch] of [...text].entries()) {
    if (!LETTER.test(ch)) {
      fragment.appendChild(document.createTextNode(ch));
      return;
    }

    const span = document.createElement("span");
    span.textContent = ch;

    if (accentPositions.has(index)) {
      span.style.color =
        pastelColors[Math.floor(Math.random() * pastelColors.length)];
    }

    fragment.appendChild(span);
  }

  el.replaceChildren(fragment);
}

// Social icon highlights per section
const socialHighlights = {
  about: { linkedin: "#0A66C2", x: null },
  microblog: { scholar: "#4285F4" },
  news: { github: null, pytorch: "#EE4C2C" },
  research: { scholar: "#4285F4" },
};

// GitHub & X brand is black/white — just use site text color
Object.defineProperty(socialHighlights.news, "github", {
  get() {
    return window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--text")
      .trim();
  },
});
Object.defineProperty(socialHighlights.about, "x", {
  get() {
    return window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--text")
      .trim();
  },
});

function highlightSocials(sectionId) {
  const map = socialHighlights[sectionId];
  for (const a of document.querySelectorAll(".social-links a[data-social]")) {
    a.style.color = map?.[a.dataset.social] || "";
  }
}

// Rainbow footer text
const footerCity = document.getElementById("footer-city");
const footerEmail = document.getElementById("footer-email");

function rainbowText(el) {
  const text = el.dataset.original || el.textContent;
  el.dataset.original = text;
  el.innerHTML = [...text]
    .map((ch, i) =>
      ch === " "
        ? " "
        : `<span class="rainbow-ch" style="color:${pastelColors[i % pastelColors.length]};animation-delay:${i * 30}ms">${ch}</span>`
    )
    .join("");
}

function resetText(el) {
  if (el.dataset.original) {
    el.innerHTML = [...el.dataset.original]
      .map((ch) => (ch === " " ? " " : `<span>${ch}</span>`))
      .join("");
  }
}

function updateFooterRainbow(sectionId) {
  if (sectionId === "gallery") {
    rainbowText(footerCity);
  } else {
    resetText(footerCity);
  }
  if (sectionId === "research") {
    rainbowText(footerEmail);
  } else {
    resetText(footerEmail);
  }
}
