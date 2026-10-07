// News: a journal under the projects. Entries are grouped by month with the
// month hanging once in the margin. Collapsed it shows the latest three;
// open, a box six entries tall scrolls the rest, with category filters.
// Reads the same list the main site uses (js/updates-data.js links to
// src/js/updates.js), so both stay in sync.
import {
  contribMonthSpan,
  drawContrib,
  prefetchContrib,
  setContribWave,
} from "./contrib.js";

const SHORT_COUNT = 3;
const GRAPH_FOR = new Set(["pr"]); // categories that show the contribution graph
const VISIBLE_ROWS = 6; // height of the open box; the rest scrolls
const CONTRIB_CELL = 7; // bar size when the graph stands beside the list
const narrow = window.matchMedia("(max-width: 640px)"); // graph lies above the list
const STAGGER_ROWS = 10; // only the first few new rows animate in
const LABELS = {
  awards: "awards",
  grants: "grants",
  misc: "misc",
  pr: "open source",
  publishing: "publishing",
  reviewing: "reviewing",
  teaching: "teaching",
};
const FILTER_ORDER = [
  "all",
  "publishing",
  "teaching",
  "pr",
  "grants",
  "awards",
  "misc",
  "reviewing",
];
const YEAR_RE = /'(\d\d)/; // "Aug. '26" -> "26"
const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

async function loadUpdates() {
  const res = await fetch("js/updates-data.js");
  const text = await res.text();
  const start = text.indexOf("const updates = [");
  const end = text.indexOf("\n];", start);
  if (start < 0 || end < 0) {
    throw new Error("updates array not found");
  }
  const literal = text.slice(start + "const updates = ".length, end + 2);
  return new Function(`return ${literal}`)();
}

// "Aug. '26" -> 2026 * 12 + 7, for ordering.
function keyOf(date) {
  const y = date.match(YEAR_RE);
  const month = MONTHS.indexOf(date.slice(0, 3).toLowerCase());
  return (y ? 2000 + Number(y[1]) : 0) * 12 + (month < 0 ? -1 : month);
}

function row(u) {
  const li = document.createElement("li");
  li.className = "news-row";
  li.dataset.key = u.description;
  li.innerHTML = u.description;
  return li;
}

// Build month groups: each is a label plus its entries.
function groups(list) {
  const out = [];
  let cur = null;
  for (const u of list) {
    if (!cur || cur.date !== u.date) {
      cur = { date: u.date, el: document.createElement("li"), rows: [] };
      cur.el.className = "news-group";
      const label = document.createElement("span");
      label.className = "news-month";
      label.textContent = u.date;
      cur.list = document.createElement("ol");
      cur.el.append(label, cur.list);
      out.push(cur);
    }
    const r = row(u);
    cur.rows.push(r);
    cur.list.appendChild(r);
  }
  return out;
}

function setup(raw) {
  const updates = raw
    .map((u, i) => ({ i, k: keyOf(u.date), u }))
    .sort((a, b) => b.k - a.k || a.i - b.i)
    .map((x) => x.u);

  const section = document.querySelector(".news");
  const table = section.querySelector(".news-table");
  const filters = section.querySelector(".news-filters");
  const scroller = section.querySelector(".news-scroll");
  const contrib = section.querySelector(".news-contrib");
  prefetchContrib();
  const more = section.querySelector(".news-more");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Deep links to #news start with the list open.
  const state = { category: "all", open: location.hash === "#news" };

  const filtered = () =>
    updates.filter(
      (u) => state.category === "all" || u.category === state.category
    );

  for (const c of FILTER_ORDER) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.category = c;
    b.textContent = c === "all" ? "all" : LABELS[c];
    b.addEventListener("click", () => {
      if (state.category === c) {
        return;
      }
      state.category = c;
      render();
    });
    filters.appendChild(b);
  }

  // Rows settle in one after another.
  function form(rows, delayBase = 0) {
    if (reduce.matches) {
      for (const r of rows) {
        r.classList.add("is-in");
      }
      return;
    }
    for (const [i, r] of rows.entries()) {
      r.style.setProperty(
        "--d",
        `${delayBase + Math.min(i, STAGGER_ROWS) * 55}ms`
      );
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        for (const r of rows) {
          r.classList.add("is-in");
        }
      })
    );
  }

  // Size the open box to VISIBLE_ROWS entries of the current list.
  function fitBox() {
    const rows = table.querySelectorAll(".news-row");
    if (!(state.open && rows.length)) {
      scroller.style.maxHeight = "";
      return;
    }
    const cs = getComputedStyle(scroller);
    const pad =
      Number.parseFloat(cs.paddingTop) + Number.parseFloat(cs.paddingBottom);
    // Beside the graph, the box is as tall as the block of weeks.
    if (!(contrib.hidden || narrow.matches) && graphSize) {
      scroller.style.maxHeight = `${Math.ceil(graphSize.height)}px`;
      return;
    }
    const n = Math.min(VISIBLE_ROWS, rows.length);
    const { top } = table.getBoundingClientRect();
    const { bottom } = rows[n - 1].getBoundingClientRect();
    scroller.style.maxHeight = `${Math.ceil(bottom - top + pad)}px`;
  }
  new ResizeObserver(() => fitBox()).observe(table);
  window.addEventListener("resize", () => {
    if (!contrib.hidden) {
      syncGraph(false);
    }
    fitBox();
  });

  const wait = (ms) =>
    new Promise((r) => setTimeout(r, reduce.matches ? 0 : ms));

  // Slide the filter row open or shut by animating its height.
  function reveal(el) {
    if (!el.hidden) {
      return;
    }
    el.hidden = false;
    if (reduce.matches) {
      return;
    }
    el.classList.add("is-sliding");
    el.style.height = "0px";
    el.style.marginBottom = "0px";
    el.getBoundingClientRect(); // flush layout so the height change transitions
    el.style.height = `${el.scrollHeight}px`;
    el.style.marginBottom = "";
    wait(380).then(() => {
      el.style.height = "";
      el.classList.remove("is-sliding");
    });
  }
  function conceal(el) {
    if (el.hidden) {
      return Promise.resolve();
    }
    if (reduce.matches) {
      el.hidden = true;
      return Promise.resolve();
    }
    el.classList.add("is-sliding");
    el.style.height = `${el.getBoundingClientRect().height}px`;
    el.getBoundingClientRect(); // flush layout so the height change transitions
    el.style.height = "0px";
    el.style.marginBottom = "0px";
    return wait(380).then(() => {
      el.hidden = true;
      el.style.height = "";
      el.style.marginBottom = "";
      el.classList.remove("is-sliding");
    });
  }

  function syncChrome() {
    if (state.open) {
      reveal(filters);
    } else {
      filters.hidden = true;
    }
    for (const b of filters.querySelectorAll("button")) {
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.category === state.category)
      );
    }
    more.textContent = state.open
      ? "fewer"
      : `and ${updates.length - SHORT_COUNT} more`;
    more.setAttribute("aria-expanded", String(state.open));
    more.hidden = false;
    section.classList.toggle("is-open", state.open);
    scroller.scrollTop = 0;
    syncGraph();
    fitBox();
  }

  // The graph beside (or, on phones, above) the list for GRAPH_FOR filters.
  let graphShownFor = null;
  let graphSize = null;
  function syncGraph(animate = true) {
    const show = state.open && GRAPH_FOR.has(state.category);
    contrib.hidden = !show;
    if (!show) {
      graphShownFor = null;
      graphSize = null;
      return;
    }
    const first = graphShownFor !== state.category;
    graphShownFor = state.category;
    const inRow = narrow.matches;
    // Across the section on phones: 52 weeks share the width.
    const cell = inRow
      ? Math.max(
          3,
          Math.min(
            CONTRIB_CELL,
            Math.floor(section.getBoundingClientRect().width / 52) - 1
          )
        )
      : CONTRIB_CELL;
    drawContrib(contrib, {
      animate: animate && first,
      cell,
      orientation: inRow ? "row" : "column",
    })
      .then((size) => {
        graphSize = size;
        fitBox();
        steerWave();
      })
      .catch(() => {
        contrib.hidden = true;
      });
  }

  // Steer the wave to the month of the entry at the top of the box, easing
  // through the month as its entries pass.
  async function steerWave() {
    if (contrib.hidden) {
      return;
    }
    const rows = [...table.querySelectorAll(".news-row")];
    if (!rows.length) {
      return;
    }
    const edge =
      scroller.getBoundingClientRect().top +
      Number.parseFloat(getComputedStyle(scroller).paddingTop) +
      4;
    let i = rows.findIndex((r) => r.getBoundingClientRect().bottom > edge);
    if (i < 0) {
      i = rows.length - 1;
    }
    const group = rows[i].closest(".news-group");
    const sibs = [...group.querySelectorAll(".news-row")];
    const frac = (sibs.indexOf(rows[i]) + 0.5) / sibs.length;
    const k = keyOf(group.querySelector(".news-month").textContent);
    const span = await contribMonthSpan(Math.floor(k / 12), k % 12);
    if (contrib.hidden) {
      return;
    }
    if (!span) {
      // Older than the block: the wave rolls off its far end.
      setContribWave(contrib, 60);
      return;
    }
    setContribWave(contrib, span.first + frac * (span.last - span.first));
  }
  let steering = false;
  scroller.addEventListener(
    "scroll",
    () => {
      if (steering) {
        return;
      }
      steering = true;
      requestAnimationFrame(() => {
        steering = false;
        steerWave();
      });
    },
    { passive: true }
  );

  new MutationObserver(() => {
    if (!contrib.hidden) {
      syncGraph(false);
    }
  }).observe(document.documentElement, {
    attributeFilter: ["data-theme"],
    attributes: true,
  });

  // Lay out the list for the current state. Entries already on the page
  // (by key) stay put; new ones settle in after a delay.
  function lay(delayBase = 0) {
    const list = filtered();
    const slice = state.open ? list : list.slice(0, SHORT_COUNT);
    const had = new Set(
      [...table.querySelectorAll(".news-row.is-in")].map((r) => r.dataset.key)
    );
    const gs = groups(slice);
    table.replaceChildren(...gs.map((g) => g.el));
    const rows = gs.flatMap((g) => g.rows);
    const kept = rows.filter((r) => had.has(r.dataset.key));
    const fresh = rows.filter((r) => !had.has(r.dataset.key));
    for (const r of kept) {
      r.classList.add("is-in");
    }
    form(fresh, delayBase);
    syncChrome();
  }

  function render() {
    lay(0);
  }

  // Opening: the box grows from three entries to six, the rest settle in,
  // and the filter row slides open.
  function open() {
    state.open = true;
    state.category = "all";
    scroller.style.maxHeight = `${Math.ceil(scroller.getBoundingClientRect().height)}px`;
    lay(150);
  }

  // Closing: entries beyond the latest three fade out bottom-up, the
  // filter row slides shut, and the box eases down.
  let closing = false;
  function close() {
    if (closing) {
      return;
    }
    closing = true;
    state.open = false;
    state.category = "all";
    const rows = [...table.querySelectorAll(".news-row")];
    const keepKeys = new Set(
      updates.slice(0, SHORT_COUNT).map((u) => u.description)
    );
    const sameStart =
      scroller.scrollTop < 2 &&
      rows.slice(0, SHORT_COUNT).every((r) => keepKeys.has(r.dataset.key));
    const leaving = sameStart ? rows.slice(SHORT_COUNT) : rows;

    more.textContent = `and ${updates.length - SHORT_COUNT} more`;
    more.setAttribute("aria-expanded", "false");
    section.classList.add("is-closing");
    scroller.style.height = `${Math.ceil(scroller.getBoundingClientRect().height)}px`;

    const box = scroller.getBoundingClientRect();
    const visible = leaving.filter((r) => {
      const b = r.getBoundingClientRect();
      return b.bottom > box.top && b.top < box.bottom;
    });
    for (const r of leaving) {
      r.style.setProperty("--d", "0ms");
    }
    for (const [i, r] of visible.entries()) {
      r.style.setProperty("--d", `${(visible.length - 1 - i) * 45}ms`);
    }
    for (const r of leaving) {
      r.classList.remove("is-in");
    }
    const fadeMs = 250 + Math.max(0, visible.length - 1) * 45;

    conceal(filters);

    wait(fadeMs)
      .then(() => {
        contrib.hidden = true;
        graphShownFor = null;
        graphSize = null;
        section.classList.remove("is-closing", "is-open");
        lay(0);
        scroller.style.maxHeight = "";
        scroller.getBoundingClientRect(); // flush layout so the height change transitions
        scroller.style.height = `${Math.ceil(table.getBoundingClientRect().height)}px`;
        return wait(480);
      })
      .then(() => {
        scroller.style.height = "";
        closing = false;
      });
  }

  more.addEventListener("click", () => (state.open ? close() : open()));

  render();
}

loadUpdates()
  .then(setup)
  .catch((err) => console.error("news:", err));
