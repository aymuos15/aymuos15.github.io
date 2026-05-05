/* eslint-disable no-undef */
// ── NiiVue Neuro-Oncology Viewer ────────────────────────────────────────────
(function () {
    const link = document.querySelector('.seg-link');
    const diagram = document.getElementById('instance-diagram');
    const viewer = document.getElementById('niivue-viewer');
    const canvas = document.getElementById('nv-canvas');
    const modSel = document.getElementById('nv-modality');
    const viewSel = document.getElementById('nv-view');
    if (!link || !diagram || !viewer || !canvas) return;

    const base = 'assests/BraTS-MET-00001-000/';
    const segUrl = base + 'BraTS-MET-00001-000-seg.nii.gz';
    const mods = {
        t1c: base + 'BraTS-MET-00001-000-t1c.nii.gz',
        t1n: base + 'BraTS-MET-00001-000-t1n.nii.gz',
        t2f: base + 'BraTS-MET-00001-000-t2f.nii.gz',
        t2w: base + 'BraTS-MET-00001-000-t2w.nii.gz',
    };

    let nv = null;
    const blobUrls = {};
    let segBlobUrl = null;
    let prefetchPromise = null;
    let initPromise = null;

    async function waitForSize() {
        for (let i = 0; i < 40; i++) {
            if (canvas.clientWidth > 0 && canvas.clientHeight > 0) return;
            await new Promise(r => requestAnimationFrame(r));
        }
    }

    function reportError(msg) {
        let box = document.getElementById('nv-error');
        if (!box) {
            box = document.createElement('div');
            box.id = 'nv-error';
            box.className = 'niivue-error';
            viewer.appendChild(box);
        }
        box.textContent = msg;
        console.error('[niivue]', msg);
    }

    async function fetchBlob(url) {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
        return URL.createObjectURL(await r.blob());
    }

    function prefetchAll() {
        if (prefetchPromise) return prefetchPromise;
        const tasks = [
            fetchBlob(segUrl).then((u) => { segBlobUrl = u; }),
            ...Object.keys(mods).map((k) =>
                fetchBlob(mods[k]).then((u) => { blobUrls[k] = u; })
            ),
        ];
        prefetchPromise = Promise.all(tasks).catch((e) => {
            reportError('Volume prefetch failed:\n' + e.message +
                (location.protocol === 'file:' ? '\nServe over http (e.g. `python -m http.server`).' : ''));
            throw e;
        });
        return prefetchPromise;
    }

    function init() {
        if (initPromise) return initPromise;
        initPromise = (async () => {
            if (typeof niivue === 'undefined' || !niivue.Niivue) {
                reportError('NiiVue library not loaded (check network / CDN).');
                return;
            }

            // Off-screen sizing so attachToCanvas / texture uploads run before the user clicks.
            const wasActive = viewer.classList.contains('active');
            if (!wasActive) viewer.classList.add('preheating');
            await waitForSize();

            try {
                await prefetchAll();
                nv = new niivue.Niivue({
                    show3Dcrosshair: true,
                    isColorbar: false,
                    backColor: [0, 0, 0, 1],
                    crosshairColor: [1, 1, 1, 0.6],
                    loadingText: 'loading…',
                });
                await nv.attachToCanvas(canvas);
                await loadMod(modSel.value);
                applyView(viewSel.value);
                if (nv.resizeListener) nv.resizeListener();
                if (nv.drawScene) nv.drawScene();
                window.addEventListener('resize', () => {
                    if (nv && nv.resizeListener) nv.resizeListener();
                });
            } catch (e) {
                if (e && e.message) reportError('NiiVue init failed: ' + e.message);
            } finally {
                if (!wasActive) viewer.classList.remove('preheating');
            }
        })();
        return initPromise;
    }

    async function loadMod(mod) {
        if (!nv) return;
        const baseVol = { url: blobUrls[mod] || mods[mod], name: mod + '.nii.gz', colormap: 'gray' };
        const seg = { url: segBlobUrl || segUrl, name: 'seg.nii.gz', colormap: 'redyell', opacity: 0.6 };
        try {
            await nv.loadVolumes([baseVol, seg]);
        } catch (err) {
            console.error('NiiVue load failed (with seg)', err);
            try {
                await nv.loadVolumes([baseVol]);
            } catch (e2) {
                reportError('Volume load failed: ' + (e2 && e2.message ? e2.message : e2));
            }
        }
    }

    function applyView(v) {
        if (!nv) return;
        const map = {
            axial: nv.sliceTypeAxial,
            coronal: nv.sliceTypeCoronal,
            sagittal: nv.sliceTypeSagittal,
            multi: nv.sliceTypeMultiplanar,
        };
        nv.setSliceType(map[v]);
    }

    modSel.addEventListener('change', () => loadMod(modSel.value));
    viewSel.addEventListener('change', () => applyView(viewSel.value));

    function show() {
        viewer.classList.remove('preheating');
        diagram.style.maxHeight = diagram.scrollHeight + 'px';
        requestAnimationFrame(() => {
            diagram.classList.add('collapsing');
            viewer.classList.add('active');
        });
        init().then(() => {
            if (nv && nv.resizeListener) nv.resizeListener();
        }).catch((e) => console.debug('[niivue] init rejected', e));
    }

    function hide() {
        viewer.classList.remove('active');
        diagram.classList.remove('collapsing');
        // Clear inline max-height after the transition so layout is natural again
        setTimeout(() => { diagram.style.maxHeight = ''; }, 500);
    }

    link.addEventListener('click', () => {
        if (viewer.classList.contains('active')) hide();
        else show();
    });

    const warm = () => { init().catch(() => {}); };
    document.querySelectorAll('a[href="#research"], .research-link').forEach((el) => {
        el.addEventListener('click', warm, { once: true });
    });
    const researchSection = document.getElementById('research');
    if (researchSection && researchSection.classList.contains('active')) warm();
})();
