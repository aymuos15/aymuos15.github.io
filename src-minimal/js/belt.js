// Photo conveyor belt: a full-bleed strip that drifts sideways forever.
// Each photo is nudged and tilted a little so the belt feels slightly
// off-kilter, while the strip itself stays a clean rectangle.
const photos = [
  { alt: "Bhavith", src: "gallery/bhavith.jpeg" },
  { alt: "CAI4CAI workshop", src: "gallery/cai4cai.jpg" },
  { alt: "ISBI 2024", src: "gallery/isbi.jpeg" },
  { alt: "Pooja", src: "gallery/pooja.jpeg" },
  { alt: "Parents", src: "gallery/parents.jpeg" },
  { alt: "Pupil study", src: "gallery/pupil.jpeg" },
  { alt: "", src: "gallery/wa1.jpeg" },
  { alt: "", src: "gallery/wa2.jpeg" },
  { alt: "", src: "gallery/wa3.jpeg" },
  { alt: "", src: "gallery/wa4.jpeg" },
  { alt: "", src: "gallery/wa5.jpeg" },
  { alt: "", src: "gallery/wa6.jpeg" },
  { alt: "", src: "gallery/wa7.jpeg" },
  { alt: "", src: "gallery/wa8.jpeg" },
  { alt: "", src: "gallery/wa9.jpeg" },
  { alt: "", src: "gallery/wa10.jpeg" },
  { alt: "", src: "gallery/wa11.jpeg" },
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
