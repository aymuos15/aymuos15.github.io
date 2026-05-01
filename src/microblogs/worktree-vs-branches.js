/* eslint-disable no-undef, quotes */
// ── Worktree vs Branches Diagram ─────────────────────────────────────────────
microblogEntries.push({
    id: "(Git) worktrees-vs-branches",
    date: "Mar. '26",
    title: "(Git) Worktrees vs Branches",
    tags: ["git", "workflow"],
    diagram: "worktree",
    content: `<p>A <strong>branch</strong> is just a pointer to a commit. Switching branches swaps files in your single working directory. Which forces one on stashing uncommitted work. A <strong>worktree</strong> (<code>git worktree add</code>) gives each branch its own directory, all backed by the same <code>.git</code> object store. Thus, no stashing required, a personal ick only tbh.</p>
<p>The agentic advantage: worktrees let you run coding agents in parallel. Each agent gets its own isolated checkout while sharing the same repo. <a href="https://github.com/jj-vcs/jj" target="_blank">Jujutsu (jj)</a> is an open-source alternative that bakes this kind of parallel workflow into the VCS itself. Find a better deep dive into other alternatives <a href="https://blog.ezyang.com/2026/03/parallel-agents-heart-sapling/" target="_blank">here</a>.</p>`,
    links: []
});

function buildWorktreeDiagram() {
    const container = document.getElementById('microblog-diagram-worktree');
    if (!container) return;

    let mode = 'branch';

    // Shared geometry — larger viewBox so SVG text renders at readable sizes
    const W = 440, H = 220;
    const gitX = W / 2, gitY = 32, gitRx = 44, gitRy = 18;

    const branchLayout = {
        boxes: [{ x: W / 2, y: 130 }],
        labels: [
            { x: 62,  y: 130, text: 'main',   dim: true },
            { x: W / 2, y: 190, text: 'feat-A', dim: false },
            { x: 378, y: 130, text: 'fix-B',  dim: true }
        ],
        connectors: [[gitX, gitY + gitRy, W / 2, 130 - 22]],
        footnote: 'stash \u2192 checkout \u2192 switch'
    };

    const worktreeLayout = {
        boxes: [
            { x: W / 2 - 95, y: 130 },
            { x: W / 2 + 95, y: 130 }
        ],
        labels: [],
        connectors: [
            [gitX - 16, gitY + gitRy, W / 2 - 95, 130 - 22],
            [gitX + 16, gitY + gitRy, W / 2 + 95, 130 - 22]
        ],
        footnote: 'parallel \u2014 no stashing needed'
    };

    function buildSvg(layout) {
        const bw = 130, bh = 44;
        let s = `<svg viewBox="0 0 ${W} ${H}" class="wt-svg" xmlns="http://www.w3.org/2000/svg">`;

        // .git ellipse
        s += `<ellipse cx="${gitX}" cy="${gitY}" rx="${gitRx}" ry="${gitRy}"
            fill="none" stroke="var(--text-secondary)" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.55"/>`;
        s += `<text x="${gitX}" y="${gitY + 5}" text-anchor="middle"
            font-family="var(--font-mono)" font-size="13" fill="var(--text-secondary)">.git</text>`;

        // Connectors (dashed lines from .git to boxes)
        layout.connectors.forEach(([x1, y1, x2, y2]) => {
            s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                stroke="var(--text-secondary)" stroke-width="0.9" stroke-dasharray="4 3" opacity="0.45"/>`;
        });

        // Boxes
        layout.boxes.forEach((b, i) => {
            const col = layout.boxes.length > 1
                ? (i === 0 ? 'var(--link)' : 'var(--text)')
                : 'var(--text)';
            s += `<rect x="${b.x - bw/2}" y="${b.y - bh/2}" width="${bw}" height="${bh}"
                rx="4" fill="none" stroke="${col}" stroke-width="1.2"/>`;
            const inner = layout.boxes.length === 1 ? 'working dir' : (i === 0 ? 'feat-A/' : 'fix-B/');
            s += `<text x="${b.x}" y="${b.y + 5}" text-anchor="middle"
                font-family="var(--font-mono)" font-size="12" fill="${col}">${inner}</text>`;
        });

        // Branch labels (only in branch mode)
        layout.labels.forEach(l => {
            const col = l.dim ? 'var(--text-secondary)' : 'var(--link)';
            const op = l.dim ? '0.4' : '1';
            s += `<text x="${l.x}" y="${l.y + 5}" text-anchor="middle"
                font-family="var(--font-mono)" font-size="11" fill="${col}" opacity="${op}">${l.text}</text>`;
            if (!l.dim && layout.boxes.length === 1) {
                const bx = layout.boxes[0].x;
                s += `<line x1="${l.x}" y1="${l.y - 5}" x2="${bx}" y2="${layout.boxes[0].y + bh/2}"
                    stroke="var(--link)" stroke-width="0.7" stroke-dasharray="3 2" opacity="0.45"/>`;
            }
        });

        // Footnote
        s += `<text x="${W / 2}" y="${H - 6}" text-anchor="middle"
            font-family="var(--font-mono)" font-size="10" fill="var(--text-secondary)" opacity="0.5">${layout.footnote}</text>`;

        s += '</svg>';
        return s;
    }

    function render() {
        const layout = mode === 'branch' ? branchLayout : worktreeLayout;
        container.querySelector('.wt-diagram-area').innerHTML = buildSvg(layout);
    }

    // Toggle buttons (reuse dcn-toggle / dcn-btn styles)
    const toggle = document.createElement('div');
    toggle.className = 'dcn-toggle';

    const btnBr = document.createElement('button');
    btnBr.className = 'dcn-btn active';
    btnBr.textContent = 'Branches';

    const btnWt = document.createElement('button');
    btnWt.className = 'dcn-btn';
    btnWt.textContent = 'Worktrees';

    function setMode(m) {
        if (m === mode) return;
        mode = m;
        btnBr.classList.toggle('active', mode === 'branch');
        btnWt.classList.toggle('active', mode === 'worktree');
        const area = container.querySelector('.wt-diagram-area');
        area.classList.add('wt-fading');
        setTimeout(() => {
            render();
            area.classList.remove('wt-fading');
        }, 200);
    }

    btnBr.addEventListener('click', () => setMode('branch'));
    btnWt.addEventListener('click', () => setMode('worktree'));

    toggle.appendChild(btnBr);
    toggle.appendChild(btnWt);

    const area = document.createElement('div');
    area.className = 'wt-diagram-area';

    const caption = document.createElement('p');
    caption.className = 'dcn-caption';
    caption.textContent = 'Click to compare single-directory branching with parallel worktrees.';

    container.appendChild(toggle);
    container.appendChild(area);
    container.appendChild(caption);
    render();
}
