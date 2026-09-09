// NiiVue neuro-oncology viewer, ported from the main site. Builds its own
// controls and canvas, prefetches the BraTS volumes, and is reparented into
// the project modal when Segmentation opens. Expects the NiiVue UMD build
// to be loaded as the global `niivue`.
const BASE = "assests/BraTS-MET-00001-000/";
const SEG = `${BASE}BraTS-MET-00001-000-seg.nii.gz`;
const MODS = {
  t1c: `${BASE}BraTS-MET-00001-000-t1c.nii.gz`,
  t1n: `${BASE}BraTS-MET-00001-000-t1n.nii.gz`,
  t2f: `${BASE}BraTS-MET-00001-000-t2f.nii.gz`,
  t2w: `${BASE}BraTS-MET-00001-000-t2w.nii.gz`,
};

function select(labelText, options) {
  const label = document.createElement("label");
  label.className = "niivue-select";
  const span = document.createElement("span");
  span.textContent = labelText;
  const sel = document.createElement("select");
  options.forEach(([value, text], i) => {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = text;
    if (i === 0) {
      o.selected = true;
    }
    sel.appendChild(o);
  });
  label.append(span, sel);
  return { label, sel };
}

export function createNiivueViewer() {
  const viewer = document.createElement("div");
  viewer.className = "niivue-viewer";
  const controls = document.createElement("div");
  controls.className = "niivue-controls";
  const mod = select("Modality", [
    ["t1c", "T1c"],
    ["t1n", "T1n"],
    ["t2f", "T2f"],
    ["t2w", "T2w"],
  ]);
  const view = select("View", [
    ["axial", "Axial"],
    ["coronal", "Coronal"],
    ["sagittal", "Sagittal"],
    ["multi", "Multi"],
  ]);
  controls.append(mod.label, view.label);
  const cell = document.createElement("div");
  cell.className = "niivue-cell";
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  cell.appendChild(canvas);
  viewer.append(controls, cell);

  let nv = null;
  const blobUrls = {};
  let segBlobUrl = null;
  let prefetchPromise = null;
  let initPromise = null;

  const reportError = (msg) => {
    let box = viewer.querySelector(".niivue-error");
    if (!box) {
      box = document.createElement("div");
      box.className = "niivue-error";
      viewer.appendChild(box);
    }
    box.textContent = msg;
    console.error("[niivue]", msg);
  };
  const fetchBlob = async (url) => {
    const r = await fetch(url);
    if (!r.ok) {
      throw new Error(`HTTP ${r.status} for ${url}`);
    }
    return URL.createObjectURL(await r.blob());
  };
  const prefetchAll = () => {
    if (!prefetchPromise) {
      prefetchPromise = Promise.all([
        fetchBlob(SEG).then((u) => {
          segBlobUrl = u;
        }),
        ...Object.keys(MODS).map((k) =>
          fetchBlob(MODS[k]).then((u) => {
            blobUrls[k] = u;
          })
        ),
      ]).catch((e) => {
        reportError(`Volume prefetch failed: ${e.message}`);
        throw e;
      });
    }
    return prefetchPromise;
  };
  const waitForSize = async () => {
    for (
      let i = 0;
      i < 40 && !(canvas.clientWidth > 0 && canvas.clientHeight > 0);
      i += 1
    ) {
      // biome-ignore lint/performance/noAwaitInLoops: deliberately waits one frame at a time until the canvas has a size
      await new Promise((r) => requestAnimationFrame(r));
    }
  };
  const loadMod = async (m) => {
    if (!nv) {
      return;
    }
    const base = {
      colormap: "gray",
      name: `${m}.nii.gz`,
      url: blobUrls[m] || MODS[m],
    };
    const seg = {
      colormap: "redyell",
      name: "seg.nii.gz",
      opacity: 0.6,
      url: segBlobUrl || SEG,
    };
    try {
      await nv.loadVolumes([base, seg]);
    } catch (err) {
      console.error("NiiVue load failed (with seg)", err);
      try {
        await nv.loadVolumes([base]);
      } catch (e2) {
        reportError(`Volume load failed: ${e2.message || e2}`);
      }
    }
  };
  const applyView = (v) => {
    if (!nv) {
      return;
    }
    const map = {
      axial: nv.sliceTypeAxial,
      coronal: nv.sliceTypeCoronal,
      multi: nv.sliceTypeMultiplanar,
      sagittal: nv.sliceTypeSagittal,
    };
    nv.setSliceType(map[v]);
  };
  const init = () => {
    if (!initPromise) {
      initPromise = (async () => {
        if (typeof niivue === "undefined" || !niivue.Niivue) {
          reportError("NiiVue library not loaded (check network / CDN).");
          return;
        }
        await waitForSize();
        await prefetchAll();
        nv = new niivue.Niivue({
          backColor: [0, 0, 0, 1],
          crosshairColor: [1, 1, 1, 0.6],
          isColorbar: false,
          loadingText: "loading…",
          show3Dcrosshair: true,
        });
        await nv.attachToCanvas(canvas);
        await loadMod(mod.sel.value);
        applyView(view.sel.value);
        nv.resizeListener?.();
        nv.drawScene?.();
        window.addEventListener("resize", () => nv?.resizeListener?.());
      })().catch((e) => reportError(`NiiVue init failed: ${e.message || e}`));
    }
    return initPromise;
  };
  mod.sel.addEventListener("change", () => loadMod(mod.sel.value));
  view.sel.addEventListener("change", () => applyView(view.sel.value));

  return {
    activate() {
      init().then(() => nv?.resizeListener?.());
      // Nudge NiiVue to size itself to the now-visible modal.
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      setTimeout(() => window.dispatchEvent(new Event("resize")), 350);
    },
    element: viewer,
    prefetch: () =>
      prefetchAll().catch(() => {
        /* ignore: prefetch failure is already reported and retried on open */
      }),
  };
}
