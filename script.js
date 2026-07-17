
document.addEventListener('DOMContentLoaded', function() {
    initializeTypingAnimation('main');
    updateTmuxClock();
    setInterval(updateTmuxClock, 1000);
});

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

async function showMarkdown(filename) {
    try {
        const response = await fetch(`./${filename}`);
        const markdownContent = await response.text();

        const htmlContent = markdownToHtml(markdownContent);

        const terminalContent = document.querySelector('.terminal-content');
        terminalContent.innerHTML = `
            <div class="command-line">
                <span class="prompt">chase@portfolio<span class="colon">:</span><span class="tilde">~</span><span class="dollar">$</span> </span>
                <span class="command">cat ${filename}</span>
            </div>
            <div class="output">
                ${htmlContent}
                <p style="margin-top: 20px;"><a href="#" onclick="location.reload()" style="color: #ff79c6; text-decoration: none;">← Back to directory listing</a></p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading markdown file:', error);
    }
}

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
