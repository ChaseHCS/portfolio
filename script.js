
document.addEventListener('DOMContentLoaded', function() {
    initializeTypingAnimation('main');
    updateTmuxClock();
    setInterval(updateTmuxClock, 1000);
    initRat();
});

function initRat() {
    const canvas = document.getElementById('rat-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 80;    // low-res buffer; CSS upscales it 2x with image-rendering: pixelated
    canvas.width = size;
    canvas.height = size;

    const FUR = [150, 155, 185];
    const FUR_DARK = [110, 115, 150];
    const PINK = [255, 121, 198];
    const EYE = [30, 32, 44];

    // voxel model: x = length (snout at +x), y = up, z = side
    const seen = new Set();
    const voxels = [];
    function add(x, y, z, c) {
        const k = x + ',' + y + ',' + z;
        if (seen.has(k)) return;    // first writer wins, so features go in before fur
        seen.add(k);
        voxels.push({ x, y, z, c });
    }
    function ellipsoid(x0, y0, z0, rx, ry, rz, c) {
        for (let x = Math.floor(x0 - rx); x <= x0 + rx; x++)
            for (let y = Math.floor(y0 - ry); y <= y0 + ry; y++)
                for (let z = Math.floor(z0 - rz); z <= z0 + rz; z++) {
                    const dx = (x - x0) / rx, dy = (y - y0) / ry, dz = (z - z0) / rz;
                    if (dx * dx + dy * dy + dz * dz <= 1) add(x, y, z, c);
                }
    }

    add(7, 5, 2, EYE);                                  // eyes
    add(7, 5, -2, EYE);
    add(12, 4, 0, PINK);                                // nose tip
    ellipsoid(4, 7.5, 2.4, 1.3, 1.3, 0.5, PINK);        // ears
    ellipsoid(4, 7.5, -2.4, 1.3, 1.3, 0.5, PINK);
    ellipsoid(5.5, 4.5, 0, 3.5, 2.6, 2.3, FUR);         // head
    ellipsoid(9, 3.8, 0, 2.5, 1.5, 1.2, FUR);           // snout
    ellipsoid(-3, 4, 0, 7, 3.6, 3.2, FUR);              // body
    for (const [lx, lz] of [[2, 2], [2, -2], [-7, 2], [-7, -2]]) {   // legs + paws
        for (let y = 0; y <= 2; y++) add(lx, y, lz, FUR_DARK);
        add(lx + 1, 0, lz, PINK);
    }
    for (let i = 1; i <= 12; i++) {                     // tail curving behind
        add(Math.round(-9 - i * 0.8), Math.round(3 - i * 0.1), Math.round(Math.sin(i * 0.5) * 2.2), PINK);
    }

    const cx = size / 2, cy = size / 2;
    const S = 2;          // screen pixels per voxel
    const yMid = 4;       // model's vertical center
    const tiltZ = 0.35;   // slight top-down camera angle

    function drawFrame(theta) {
        ctx.clearRect(0, 0, size, size);
        const cos = Math.cos(theta), sin = Math.sin(theta);
        const proj = [];
        for (const v of voxels) {
            proj.push({
                rx: v.x * cos - v.z * sin,
                rz: v.x * sin + v.z * cos,
                y: v.y,
                c: v.c
            });
        }
        proj.sort((a, b) => a.rz - b.rz);    // painter's algorithm: far voxels first
        for (const p of proj) {
            // lit from the viewer's side, with a touch of light from above
            const b = Math.min(1, 0.5 + 0.45 * ((p.rz + 20) / 40) + 0.03 * (p.y - yMid));
            ctx.fillStyle = 'rgb(' + (p.c[0] * b | 0) + ',' + (p.c[1] * b | 0) + ',' + (p.c[2] * b | 0) + ')';
            ctx.fillRect((cx + p.rx * S) | 0, (cy + (yMid - p.y) * S + p.rz * tiltZ * S) | 0, S, S);
        }
    }

    let theta = 0.7;
    let last = performance.now();

    function tick(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        theta += 1 * dt;    // one full spin roughly every 6 seconds
        drawFrame(theta);
        requestAnimationFrame(tick);
    }

    drawFrame(theta);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(tick);
    }
}

function updateTmuxClock() {
    const clock = document.getElementById('tmux-clock');
    const date = document.getElementById('tmux-date');
    if (!clock || !date) return;

    const now = new Date();
    clock.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    date.textContent = now.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
}

function downloadResume() {
    const link = document.createElement('a');
    link.href = 'assets/resume.pdf';
    link.download = 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

let directoryListingHTML = null;

async function showMarkdown(filename) {
    try {
        const response = await fetch(`./${filename}`);
        const markdownContent = await response.text();

        const htmlContent = markdownToHtml(markdownContent);

        const terminalContent = document.querySelector('.terminal-content');
        directoryListingHTML = terminalContent.innerHTML;
        terminalContent.innerHTML = `
            <div class="command-line">
                <span class="prompt">chase@portfolio<span class="colon">:</span><span class="tilde">~</span><span class="dollar">$</span> </span>
                <span class="command">less ${filename}</span>
            </div>
            <div class="output">
                ${htmlContent}
            </div>
        `;

        const pager = document.createElement('div');
        pager.className = 'pager-status';
        pager.innerHTML = `<a href="#" onclick="closeMarkdown(); return false;"><span class="pager-end">${filename} (END)</span><span class="pager-hint"> — press q to return</span></a>`;
        const terminal = document.querySelector('.terminal');
        terminal.querySelector('.pager-status')?.remove();
        terminal.insertBefore(pager, document.querySelector('.tmux-status-bar'));

        document.querySelector('.terminal-body').scrollTop = 0;
    } catch (error) {
        console.error('Error loading markdown file:', error);
    }
}

function closeMarkdown() {
    if (!directoryListingHTML) return;
    const terminalContent = document.querySelector('.terminal-content');
    terminalContent.innerHTML = directoryListingHTML;
    directoryListingHTML = null;
    document.querySelector('.pager-status')?.remove();
    document.querySelector('.terminal-body').scrollTop = 0;
    document.getElementById('typed-command').textContent = '';
    initializeTypingAnimation('main', 200);
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'q' && !e.ctrlKey && !e.metaKey && !e.altKey && directoryListingHTML) {
        closeMarkdown();
    }
});

function markdownToHtml(markdown) {
    return markdown
        // Images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 4px;">')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" style="color: #8be9fd; text-decoration: underline;" target="_blank">$1</a>')
        // Headers
        .replace(/^# (.*$)/gim, '<h1 style="color: #ff79c6; font-size: 24px; margin-bottom: 10px;">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 style="color: #ff79c6; font-size: 20px; margin: 15px 0 8px 0;">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 style="color: #ff79c6; font-size: 18px; margin: 12px 0 6px 0;">$1</h3>')
        // Code blocks
        .replace(/```([\s\S]*?)```/gim, '<pre style="background: #191a21; color: #f8f8f2; padding: 15px; border-radius: 4px; margin: 15px 0; overflow-x: auto; border: 1px solid #44475a;"><code>$1</code></pre>')
        // Inline code
        .replace(/`(.*?)`/gim, '<code style="background: #44475a; color: #50fa7b; padding: 2px 6px; border-radius: 3px; font-family: monospace;">$1</code>')
        // Bold text
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #bd93f9; font-weight: bold;">$1</strong>')
        // Italic text (make sure this comes after bold)
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/gim, '<em style="color: #f8f8f2; font-style: italic;">$1</em>')
        // Lists
        .replace(/^\* (.*$)/gim, '<li style="color: #f8f8f2; margin: 3px 0;">$1</li>')
        .replace(/^\- (.*$)/gim, '<li style="color: #f8f8f2; margin: 3px 0;">$1</li>')
        // Convert line breaks to paragraphs
        .split('\n\n')
        .map(paragraph => {
            if (paragraph.trim() === '') return '';
            if (paragraph.includes('<h1>') || paragraph.includes('<h2>') || paragraph.includes('<h3>') ||
                paragraph.includes('<pre>') || paragraph.includes('<li>')) {
                return paragraph;
            }
            return `<p style="color: #f8f8f2; margin: 10px 0; line-height: 1.6;">${paragraph}</p>`;
        })
        .join('')
        // Wrap list items in ul tags
        .replace(/(<li[^>]*>.*?<\/li>)/gs, '<ul style="margin-left: 20px; margin: 10px 0;">$1</ul>');
}
