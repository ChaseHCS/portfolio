
document.addEventListener('DOMContentLoaded', function() {
    initializeTypingAnimation('main');
    updateTmuxClock();
    setInterval(updateTmuxClock, 1000);
    initBlackHole();
});

function initBlackHole() {
    const canvas = document.getElementById('blackhole-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 140;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2;
    const horizon = 15;      // event horizon radius
    const squash = 0.32;     // disk inclination: 1 = face-on, 0 = edge-on
    const colors = ['#ffb86c', '#ff79c6', '#bd93f9', '#ff5555', '#f1fa8c'];

    // accretion disk: particles on Keplerian orbits (inner ones move faster)
    const particles = [];
    for (let i = 0; i < 260; i++) {
        const r = horizon + 5 + Math.pow(Math.random(), 1.6) * 45;
        particles.push({
            r,
            a: Math.random() * Math.PI * 2,
            w: 55 / Math.pow(r, 1.5),
            s: 0.6 + Math.random() * 1.2,
            c: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    function drawParticles(list, dim) {
        for (const p of list) {
            const x = cx + Math.cos(p.a) * p.r;
            const y = cy - Math.sin(p.a) * p.r * squash;
            // brighter toward the horizon, plus doppler beaming on the approaching side
            const heat = 1 - (p.r - horizon) / 50;
            ctx.globalAlpha = Math.min(1, dim * (0.25 + 0.75 * heat) * (1 + 0.4 * Math.cos(p.a)));
            ctx.fillStyle = p.c;
            ctx.fillRect(x, y, p.s, p.s);
        }
        ctx.globalAlpha = 1;
    }

    function drawHole() {
        const glow = ctx.createRadialGradient(cx, cy, horizon, cx, cy, horizon * 2.4);
        glow.addColorStop(0, 'rgba(189, 147, 249, 0.35)');
        glow.addColorStop(1, 'rgba(189, 147, 249, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, horizon * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f8f8f2';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, horizon + 1, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx, cy, horizon, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawFrame() {
        ctx.clearRect(0, 0, size, size);
        const back = [], front = [];
        for (const p of particles) (Math.sin(p.a) < 0 ? back : front).push(p);
        drawParticles(back, 0.5);   // far side of the disk, occluded by the hole
        drawHole();
        drawParticles(front, 1);
    }

    let last = performance.now();

    function tick(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        for (const p of particles) p.a += p.w * dt;
        drawFrame();
        requestAnimationFrame(tick);
    }

    drawFrame();
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
