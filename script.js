
document.addEventListener('DOMContentLoaded', function() {
    initializeTypingAnimation('main');
    
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const postId = e.target.getAttribute('href').substring(1);
            showPost(postId);
        }
    });
    
    function showPost(postId) {
        alert(`Opening ${postId}... (implement your blog post navigation here)`);
    }
});

function downloadResume() {
    const link = document.createElement('a');
    link.href = 'assets/resume.pdf';
    link.download = 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
