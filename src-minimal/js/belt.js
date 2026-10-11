// Photo conveyor belt: a full-bleed strip that drifts sideways forever.
// Photos are belt-sized copies (480px tall) of src/gallery, so phones can
// animate them smoothly.
// Each photo is nudged and tilted a little so the belt feels slightly
// off-kilter, while the strip itself stays a clean rectangle.
const photos = [
  { alt: "Bhavith", src: "photos/bhavith.jpg" },
  { alt: "CAI4CAI workshop", src: "photos/cai4cai.jpg" },
  { alt: "ISBI 2024", src: "photos/isbi.jpg" },
  { alt: "Pooja", src: "photos/pooja.jpg" },
  { alt: "Parents", src: "photos/parents.jpg" },
  { alt: "Pupil study", src: "photos/pupil.jpg" },
  { alt: "", src: "photos/wa1.jpg" },
  { alt: "", src: "photos/wa2.jpg" },
  { alt: "", src: "photos/wa3.jpg" },
  { alt: "", src: "photos/wa4.jpg" },
  { alt: "", src: "photos/wa5.jpg" },
  { alt: "", src: "photos/wa6.jpg" },
  { alt: "", src: "photos/wa7.jpg" },
  { alt: "", src: "photos/wa8.jpg" },
  { alt: "", src: "photos/wa9.jpg" },
  { alt: "", src: "photos/wa10.jpg" },
  { alt: "", src: "photos/wa11.jpg" },
];

// Deterministic jitter so the layout is the same on every visit.
function jitter(i, salt) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43_758.5453;
  return x - Math.floor(x); // 0..1
}

const track = document.querySelector(".belt-track");

// How many times the photo set repeats inside one half of the belt.
const REPEATS = 2;

function buildSet(copy) {
  const frag = document.createDocumentFragment();
  for (let r = 0; r < REPEATS; r += 1) {
    photos.forEach((p, k) => {
      const i = r * photos.length + k;
      const fig = document.createElement("figure");
      fig.className = "belt-item";
      const rot = (jitter(i, 1) - 0.5) * 16; // -8..8deg
      const dy = 8 + jitter(i, 2) * 40; // 8..48px, so bottoms crop at the edge
      const scale = 0.75 + jitter(i, 3) * 0.4; // 0.75..1.15
      const overlap = 30 + jitter(i, 4) * 50; // 30..80px pulled into neighbour
      fig.style.setProperty("--rot", `${rot.toFixed(2)}deg`);
      fig.style.setProperty("--dy", `${dy.toFixed(1)}px`);
      fig.style.setProperty("--scale", scale.toFixed(3));
      fig.style.marginLeft = `${(-overlap).toFixed(0)}px`;
      fig.style.zIndex = String(1 + Math.floor(jitter(i, 5) * 6));
      const img = document.createElement("img");
      img.src = p.src;
      img.alt = copy || r > 0 ? "" : p.alt;
      img.decoding = "async";
      img.draggable = false;
      if (copy || r > 0) {
        fig.setAttribute("aria-hidden", "true");
      }
      fig.appendChild(img);
      frag.appendChild(fig);
    });
  }
  return frag;
}

if (track) {
  track.appendChild(buildSet(false));
  track.appendChild(buildSet(true)); // second copy makes the loop seamless
}

// Footer email: each letter turns black or white depending on what is
// directly behind it (a photo pixel, or the page background), so the
// address stays legible as photos drift underneath it.
const email = document.querySelector(".footer-bar a");
const belt = document.querySelector(".belt");

// Downscaled copy of each photo for cheap pixel reads.
const SAMPLE_SIZE = 64;
const samplers = new WeakMap();

function samplerFor(img) {
  let s = samplers.get(img);
  if (s) {
    return s;
  }
  if (!(img.complete && img.naturalWidth)) {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  s = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  samplers.set(img, s);
  return s;
}

// Relative luminance (0..1) of the photo under viewport point (x, y),
// or null when no photo is there.
function photoLuminance(x, y) {
  const img = document
    .elementsFromPoint(x, y)
    .find((el) => el.tagName === "IMG" && belt.contains(el));
  if (!img) {
    return null;
  }
  const data = samplerFor(img);
  if (!data) {
    return null;
  }
  // Undo the figure's tilt to get the point in the image's own frame.
  const rect = img.getBoundingClientRect();
  const rot =
    (Number.parseFloat(img.parentElement.style.getPropertyValue("--rot")) *
      Math.PI) /
    180;
  const dx = x - (rect.left + rect.width / 2);
  const dy = y - (rect.top + rect.height / 2);
  const u = dx * Math.cos(-rot) - dy * Math.sin(-rot);
  const v = dx * Math.sin(-rot) + dy * Math.cos(-rot);
  const px = Math.floor((u / img.offsetWidth + 0.5) * SAMPLE_SIZE);
  const py = Math.floor((v / img.offsetHeight + 0.5) * SAMPLE_SIZE);
  if (px < 0 || py < 0 || px >= SAMPLE_SIZE || py >= SAMPLE_SIZE) {
    return null;
  }
  const i = (py * SAMPLE_SIZE + px) * 4;
  return (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
}

// Mean luminance over a small grid inside a letter's box, so one stray
// pixel can't flip it. Null when most of the letter is off-photo.
const GRID = [0.2, 0.5, 0.8];

function letterLuminance(r) {
  let sum = 0;
  let hits = 0;
  for (const fx of GRID) {
    for (const fy of GRID) {
      const lum = photoLuminance(r.left + r.width * fx, r.top + r.height * fy);
      if (lum !== null) {
        sum += lum;
        hits += 1;
      }
    }
  }
  return hits * 2 > GRID.length ** 2 ? sum / hits : null;
}

const LIGHT_PHOTO = 0.6;
const FRAME_MS = 100;

if (email && belt) {
  email.setAttribute("aria-label", email.textContent.trim());
  const letters = [...email.textContent.trim()].map((ch) => {
    const span = document.createElement("span");
    span.className = "ink-letter";
    span.setAttribute("aria-hidden", "true");
    span.textContent = ch;
    return span;
  });
  email.replaceChildren(...letters);

  let last = 0;
  const tick = (now) => {
    requestAnimationFrame(tick);
    if (now - last < FRAME_MS) {
      return;
    }
    last = now;
    const beltRect = belt.getBoundingClientRect();
    if (beltRect.bottom < 0 || beltRect.top > innerHeight) {
      return;
    }
    for (const span of letters) {
      const r = span.getBoundingClientRect();
      const lum = letterLuminance(r);
      // Off-photo letters fall back to the theme ink via CSS.
      let ink = "";
      if (lum !== null) {
        ink = lum > LIGHT_PHOTO ? "dark" : "light";
      }
      span.dataset.ink = ink;
    }
  };
  requestAnimationFrame(tick);
}
