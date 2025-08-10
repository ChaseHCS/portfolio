
document.addEventListener('DOMContentLoaded', function() {
    // Initialize typing animation for main page
    initializeTypingAnimation('main');
    
    // Add click handlers for post links
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const postId = e.target.getAttribute('href').substring(1);
            showPost(postId);
        }
    });
    
    function showPost(postId) {
        // This is where you would implement navigation to individual posts
        // For now, just show an alert
        alert(`Opening ${postId}... (implement your blog post navigation here)`);
    }
});

function downloadResume() {
    // Replace 'resume.pdf' with the actual path to your resume file
    const link = document.createElement('a');
    link.href = 'assets/resume.pdf'; // Update this path to your actual resume file
    link.download = 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
