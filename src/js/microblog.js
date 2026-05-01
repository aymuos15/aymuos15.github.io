/* eslint-disable no-undef */
// ── Microblog ────────────────────────────────────────────────────────────────
const microblogEntries = [];

const microblogCards = document.getElementById('microblog-cards');
const microblogTagsEl = document.getElementById('microblog-tags');
const microblogList = document.getElementById('microblog-list');
const microblogDetail = document.getElementById('microblog-detail');
let microblogTagSwitching = false;

function buildMicroblogDiagram(type) {
    if (type === 'worktree') { buildWorktreeDiagram(); return; }
    if (type === 'deformable-conv') { buildMicroblogDiagramDCN(type); return; }
}

function renderMicroblogTags(activeTag) {
    const allTags = [...new Set(microblogEntries.flatMap(e => e.tags))];
    microblogTagsEl.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'microblog-tag-btn' + (activeTag === 'all' ? ' active' : '');
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => filterMicroblog('all'));
    microblogTagsEl.appendChild(allBtn);

    allTags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'microblog-tag-btn' + (activeTag === tag ? ' active' : '');
        btn.textContent = tag;
        btn.addEventListener('click', () => filterMicroblog(tag));
        microblogTagsEl.appendChild(btn);
    });
}

function renderMicroblogList(filterTag) {
    const filtered = filterTag === 'all'
        ? microblogEntries
        : microblogEntries.filter(e => e.tags.includes(filterTag));

    microblogCards.innerHTML = filtered.map((e, i) =>
        `<div class="microblog-card" data-id="${e.id}" style="animation-delay: ${i * 30}ms">
            <span class="microblog-card-title">${e.title}</span>
            <span class="microblog-card-date">${e.date}</span>
        </div>`
    ).join('');

    microblogCards.querySelectorAll('.microblog-card').forEach(card => {
        card.addEventListener('click', () => showMicroblogPost(card.dataset.id));
    });
}

function filterMicroblog(tag) {
    if (microblogTagSwitching) return;
    microblogTagSwitching = true;

    renderMicroblogTags(tag);
    microblogCards.classList.add('fading');

    setTimeout(() => {
        renderMicroblogList(tag);
        microblogCards.classList.remove('fading');
        colorizeLinks();
        microblogTagSwitching = false;
    }, 300);
}

function showMicroblogPost(id) {
    const entry = microblogEntries.find(e => e.id === id);
    if (!entry) return;

    microblogList.classList.add('hidden');
    microblogDetail.classList.add('visible');

    const refsHtml = entry.links.length
        ? `<div class="microblog-detail-refs"><span>References</span>${entry.links.map(l => `<a href="${l.url}" target="_blank">${l.label}</a>`).join('')}</div>`
        : '';

    microblogDetail.innerHTML = `
        <button class="back-btn" id="microblog-back-btn">&larr; back</button>
        <div class="microblog-detail-title">${entry.title}</div>
        <div class="microblog-detail-meta">
            <span class="microblog-detail-date">${entry.date}</span>
            ${entry.tags.map(t => `<span class="microblog-detail-tag">${t}</span>`).join('')}
        </div>
        ${entry.diagram ? `<div class="microblog-diagram" id="microblog-diagram-${entry.diagram}"></div>` : ''}
        <div class="microblog-detail-content">${entry.content}</div>
        ${refsHtml}
    `;

    document.getElementById('microblog-back-btn').addEventListener('click', hideMicroblogPost);
    if (entry.diagram) buildMicroblogDiagram(entry.diagram);
    colorizeLinks();
}

function hideMicroblogPost() {
    microblogDetail.classList.remove('visible');
    microblogList.classList.remove('hidden');
}

// ── Notation view ────────────────────────────────────────────────────────────
const microblogNotation = document.getElementById('microblog-notation');

function showNotation() {
    microblogList.classList.add('hidden');
    microblogNotation.classList.add('visible');

    microblogNotation.innerHTML = `
        <div class="notation-content">
            <button class="back-btn" id="notation-back-btn">&larr; back</button>
            <div class="microblog-detail-title">Notations</div>
            <table class="notation-table">
                <thead>
                    <tr><th>Symbol</th><th>Meaning</th></tr>
                </thead>
                <tbody>
                    <tr><td>x</td><td>Input feature map</td></tr>
                    <tr><td>y</td><td>Output feature map</td></tr>
                    <tr><td>w(p<sub>n</sub>)</td><td>Kernel weight at grid position n</td></tr>
                    <tr><td>p<sub>0</sub></td><td>Current output spatial position</td></tr>
                    <tr><td>p<sub>n</sub></td><td>Sampling offset in the kernel grid</td></tr>
                    <tr><td>&Delta;p<sub>n</sub></td><td>Learnable offset added to each sampling position</td></tr>
                    <tr><td>m<sub>n</sub></td><td>Learnable modulation scalar per sample</td></tr>
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('notation-back-btn').addEventListener('click', hideNotation);
}

function hideNotation() {
    microblogNotation.classList.remove('visible');
    microblogList.classList.remove('hidden');
}

document.getElementById('microblog-notation-link').addEventListener('click', showNotation);
