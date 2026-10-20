// The footer CV icon opens the PDF in a dialog with a download link.
// Pages are drawn with PDF.js (fetched on first open) rather than the
// browser's PDF viewer, with the PDF's own links laid over them. Without
// JS the icon is a plain link to the PDF.
// The legacy build polyfills the newest JS features, which many phone
// browsers still lack.
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/legacy/build";

const link = document.querySelector(".cv-link");
const dialog = document.querySelector(".cv-dialog");
const pagesEl = dialog?.querySelector(".cv-pages");

async function renderPage(page) {
  const width = pagesEl.clientWidth;
  const viewport = page.getViewport({
    scale: width / page.getViewport({ scale: 1 }).width,
  });
  const ratio = window.devicePixelRatio || 1;

  const sheet = document.createElement("div");
  sheet.className = "cv-page";
  sheet.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width * ratio);
  canvas.height = Math.floor(viewport.height * ratio);
  sheet.append(canvas);
  pagesEl.append(sheet);

  await page.render({
    canvas,
    transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0],
    viewport,
  }).promise;

  // Lay the PDF's links over the drawing, positioned in percent so they
  // track the canvas as it scales.
  for (const note of await page.getAnnotations()) {
    if (note.subtype !== "Link" || !note.url) {
      continue;
    }
    const [x1, y1] = viewport.convertToViewportPoint(
      note.rect[0],
      note.rect[1]
    );
    const [x2, y2] = viewport.convertToViewportPoint(
      note.rect[2],
      note.rect[3]
    );
    const a = document.createElement("a");
    a.className = "cv-page-link";
    a.href = note.url;
    a.rel = "noopener";
    a.target = "_blank";
    a.setAttribute("aria-label", note.url);
    Object.assign(a.style, {
      height: `${(Math.abs(y2 - y1) / viewport.height) * 100}%`,
      left: `${(Math.min(x1, x2) / viewport.width) * 100}%`,
      top: `${(Math.min(y1, y2) / viewport.height) * 100}%`,
      width: `${(Math.abs(x2 - x1) / viewport.width) * 100}%`,
    });
    sheet.append(a);
  }
}

let rendering = null;

async function renderCv() {
  const pdfjs = await import(`${PDFJS}/pdf.min.mjs`);
  pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.mjs`;
  const pdf = await pdfjs.getDocument({ url: link.href }).promise;
  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1))
  );
  // Each call appends its sheet before its first await, so pages stay in order.
  await Promise.all(pages.map(renderPage));
}

if (link && dialog) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    dialog.showModal();
    // Focus the dialog itself, not its first link, so Download doesn't open
    // wearing a focus ring.
    dialog.focus();
    if (rendering) {
      return;
    }
    rendering = renderCv().catch((error) => {
      // PDF.js failed: fall back to the PDF itself. Navigate in place;
      // a new window opened this late is no longer tied to the click,
      // so phones block it as a pop-up.
      console.error("CV render failed", error);
      dialog.close();
      pagesEl.replaceChildren();
      rendering = null;
      window.location.assign(link.href);
    });
  });

  dialog.querySelector(".cv-close").addEventListener("click", () => {
    dialog.close();
  });

  // Clicks on the backdrop, or the empty space beside the sheet, close it.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target === pagesEl) {
      dialog.close();
    }
  });
}
