// Isometric GitHub contribution graph beside the open-source news. One
// block of the last 52 weeks, newest first so it runs the same way as the
// list. Weeks run down the page (column) or across it (row, for phones).
// A wave of raised, brightened bars can be moved along the weeks; news.js
// steers it to the month being read as the list scrolls.
const API = "https://github-contributions-api.jogruber.de/v4/aymuos15?y=last";

let weeksPromise = null;

// Weeks, newest first. Each is [sun..sat] of {date, count, level} | null.
function loadWeeks() {
  if (!weeksPromise) {
    weeksPromise = fetch(API)
      .then((r) => r.json())
      .then((json) => {
        const days = json.contributions || [];
        const weeks = [];
        let week = new Array(7).fill(null);
        for (const day of days) {
          const dow = new Date(`${day.date}T12:00:00`).getDay();
          if (dow === 0 && week.some(Boolean)) {
            weeks.push(week);
            week = new Array(7).fill(null);
          }
          week[dow] = day;
        }
        if (week.some(Boolean)) {
          weeks.push(week);
        }
        return weeks.reverse();
      });
  }
  return weeksPromise;
}

function palette() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark
    ? ["#1c1c1c", "#3b382f", "#6a6350", "#a39d8e", "#f5efe0"]
    : ["#e9e2d0", "#c9bd9f", "#9b8f70", "#665c45", "#111111"];
}

// Mix two hex colours; t = 0 gives a, 1 gives b.
function mix(a, b, t) {
  const ch = (at) =>
    Math.round(
      Number.parseInt(a.slice(at, at + 2), 16) * (1 - t) +
        Number.parseInt(b.slice(at, at + 2), 16) * t
    );
  return `rgb(${ch(1)},${ch(3)},${ch(5)})`;
}

function shade(rgb, f) {
  const m = rgb.match(/\d+/g).map(Number);
  const ch = (v) => Math.min(255, Math.trunc(v * f));
  return `rgb(${ch(m[0])},${ch(m[1])},${ch(m[2])})`;
}

// Index range [first, last] (newest-first) of weeks whose days fall in the
// given month, or null if the month is outside the last year.
export async function contribMonthSpan(year, month) {
  const weeks = await loadWeeks();
  let first = -1;
  let last = -1;
  weeks.forEach((week, i) => {
    const hit = week.some((d) => {
      if (!d) {
        return false;
      }
      const [y, m] = d.date.split("-").map(Number);
      return y === year && m - 1 === month;
    });
    if (hit) {
      if (first < 0) {
        first = i;
      }
      last = i;
    }
  });
  return first < 0 ? null : { count: weeks.length, first, last };
}

const WAVE_R = 4; // half-width of the wave, in weeks
const WAVE_H = 4; // extra bar height at the wave's crest

// Draw into `canvas`. Options: orientation "column" (weeks down) or "row"
// (weeks across); cell size in CSS px; animate the bars rising. Returns the
// canvas's CSS size. The graph's state stays on the canvas so the wave can
// be moved later with setContribWave.
export async function drawContrib(
  canvas,
  { orientation = "column", cell = 7, animate = true } = {}
) {
  const weeks = await loadWeeks();
  if (!weeks.length) {
    return null;
  }
  const pal = palette();
  const n = weeks.length;
  const nC = 7;
  const GAP = 1;
  const DX = 2;
  const DY = 2;
  const MAX_H = cell;
  const MIN_H = 1;
  const CW = cell;
  const P = CW + GAP;
  const OX = 4;
  const OY = MAX_H + WAVE_H + DY + 4;
  const down = orientation === "column";
  const W = OX + (down ? nC : n) * P + DX + 4;
  const H = OY + (down ? n : nC) * P + 4;
  const maxN = Math.max(
    1,
    ...weeks
      .flat()
      .filter(Boolean)
      .map((d) => d.count)
  );

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.ceil(W * dpr);
  canvas.height = Math.ceil(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext("2d");

  const st = canvas._contrib || {
    raf: 0,
    target: -WAVE_R - 1,
    wave: -WAVE_R - 1,
  };
  canvas._contrib = st;

  st.frame = function frame(progress) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    weeks.forEach((week, w) => {
      const dist = Math.abs(w - st.wave);
      const crest =
        dist < WAVE_R ? Math.cos((dist / WAVE_R) * (Math.PI / 2)) : 0;
      for (let col = 0; col < nC; col += 1) {
        const day = week[col];
        const count = day?.count ?? 0;
        const level = day?.level ?? 0;
        const target =
          count > 0 ? MIN_H + (count / maxN) * (MAX_H - MIN_H) : MIN_H;
        const delay = (w / n) * 0.5;
        const local = Math.max(0, Math.min(1, (progress - delay) / 0.5));
        const ease = 1 - (1 - local) ** 3;
        const h = MIN_H + (target - MIN_H) * ease + crest * WAVE_H;
        const sx = OX + (down ? col : w) * P;
        const by = OY + (down ? w : col) * P + CW;
        const ty = by - h;
        // The crest leans toward the ink so it reads on either theme.
        const c = mix(pal[level], pal[4], 0.3 * crest);
        ctx.fillStyle = c;
        ctx.fillRect(sx, ty, CW, h);
        ctx.beginPath();
        ctx.moveTo(sx, ty);
        ctx.lineTo(sx + CW, ty);
        ctx.lineTo(sx + CW + DX, ty - DY);
        ctx.lineTo(sx + DX, ty - DY);
        ctx.closePath();
        ctx.fillStyle = shade(c, 1.18);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + CW, ty);
        ctx.lineTo(sx + CW + DX, ty - DY);
        ctx.lineTo(sx + CW + DX, by - DY);
        ctx.lineTo(sx + CW, by);
        ctx.closePath();
        ctx.fillStyle = shade(c, 0.65);
        ctx.fill();
      }
    });
  };

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!animate || reduce) {
    st.frame(1);
  } else {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 800);
      st.frame(p);
      if (p < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }
  return { height: H, width: W };
}

// Move the wave's crest to a week index (fractional allowed; outside the
// range slides it off the block). It eases there over a few frames.
export function setContribWave(canvas, week) {
  const st = canvas._contrib;
  if (!st?.frame) {
    return;
  }
  st.target = week;
  if (st.raf) {
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const step = () => {
    const d = st.target - st.wave;
    st.wave = reduce || Math.abs(d) < 0.02 ? st.target : st.wave + d * 0.18;
    st.frame(1);
    st.raf = st.wave === st.target ? 0 : requestAnimationFrame(step);
  };
  st.raf = requestAnimationFrame(step);
}

export function prefetchContrib() {
  loadWeeks().catch(() => {
    /* ignore: contrib data is optional, the graph just stays empty */
  });
}
