
document.addEventListener('DOMContentLoaded', function() {
    initializeTypingAnimation('main');
    updateTmuxClock();
    setInterval(updateTmuxClock, 1000);
    initGalaxy();
});

function initGalaxy() {
    const canvas = document.getElementById('galaxy-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 140;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2;
    const tilt = 0.55;    // viewing inclination of the galactic plane
    const coreColors = ['#f8f8f2', '#f1fa8c', '#ffb86c'];
    const armColors = ['#f8f8f2', '#8be9fd', '#bd93f9', '#eaf6ff'];

    // two logarithmic spiral arms with scatter, denser toward the core
    const stars = [];
    for (let i = 0; i < 650; i++) {
        const arm = i % 2;
        const r = 5 + Math.pow(Math.random(), 0.7) * 60;
        const spread = 0.25 + (r / 65) * 0.6;
        const phi = arm * Math.PI + Math.log(r / 5) / 0.3 + (Math.random() - 0.5) * spread;
        const palette = r < 18 ? coreColors : armColors;
        stars.push({
            r,
            phi,
            s: 0.4 + Math.random() * 0.8,
            alpha: 0.35 + Math.random() * 0.65,
            c: palette[Math.floor(Math.random() * palette.length)]
        });
    }
    // faint halo field stars
    for (let i = 0; i < 130; i++) {
        stars.push({
            r: Math.random() * 66,
            phi: Math.random() * Math.PI * 2,
            s: 0.3 + Math.random() * 0.5,
            alpha: 0.1 + Math.random() * 0.25,
            c: '#f8f8f2'
        });
    }

    function drawFrame(theta) {
        ctx.clearRect(0, 0, size, size);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, tilt);

        // diffuse disc glow
        let g = ctx.createRadialGradient(0, 0, 0, 0, 0, 64);
        g.addColorStop(0, 'rgba(241, 250, 140, 0.14)');
        g.addColorStop(0.5, 'rgba(189, 147, 249, 0.08)');
        g.addColorStop(1, 'rgba(189, 147, 249, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 64, 0, Math.PI * 2);
        ctx.fill();

        // central bar, rotating with the stars
        ctx.rotate(theta);
        ctx.scale(1, 0.4);
        g = ctx.createRadialGradient(0, 0, 0, 0, 0, 24);
        g.addColorStop(0, 'rgba(255, 184, 108, 0.35)');
        g.addColorStop(1, 'rgba(255, 184, 108, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // bright galactic bulge
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, tilt);
        g = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
        g.addColorStop(0, 'rgba(248, 248, 242, 0.9)');
        g.addColorStop(0.4, 'rgba(255, 184, 108, 0.4)');
        g.addColorStop(1, 'rgba(255, 184, 108, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        for (const st of stars) {
            const a = st.phi + theta;
            const x = cx + Math.cos(a) * st.r;
            const y = cy + Math.sin(a) * st.r * tilt;
            ctx.globalAlpha = st.alpha;
            ctx.fillStyle = st.c;
            ctx.beginPath();
            ctx.arc(x, y, st.s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    let theta = 0;
    let last = performance.now();

    function tick(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        theta += 0.06 * dt;    // one full revolution roughly every 105 seconds
        drawFrame(theta);
        requestAnimationFrame(tick);
    }

    drawFrame(0);
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
