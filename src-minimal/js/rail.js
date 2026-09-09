// Scroll rail: a fixed stack of horizontal lines on the right, one per
// section. Lines grow/brighten by how close their section is to the
// viewport centre; clicking a line scrolls to its section.

const rail = document.querySelector(".rail");
const sections = [
  ["intro", "Intro"],
  ["projects", "Projects"],
  ["news", "News"],
  ["photos", "Photos"],
]
  .map(([id, label]) => ({ el: document.getElementById(id), label }))
  .filter((s) => s.el);

if (rail && sections.length) {
  const items = sections.map((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "rail-item";
    b.setAttribute("aria-label", s.label);
    b.title = s.label;
    b.addEventListener("click", () => {
      s.el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    rail.appendChild(b);
    return b;
  });

  let ticking = false;
  function update() {
    ticking = false;
    const vh = window.innerHeight;
    const centre = window.scrollY + vh / 2;
    sections.forEach((s, i) => {
      const r = s.el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      let d;
      if (centre >= top && centre <= top + r.height) {
        d = 0;
      } else {
        d = Math.min(
          Math.abs(centre - top),
          Math.abs(centre - (top + r.height))
        );
      }
      const w = Math.max(0, 1 - d / (vh * 0.6));
      items[i].style.setProperty("--w", w.toFixed(3));
      items[i].setAttribute("aria-current", w > 0.5 ? "true" : "false");
    });
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}
