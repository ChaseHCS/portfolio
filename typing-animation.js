
// Centralized typing animation configuration and logic
const typingAnimations = {
    main: [
        'help',
        'cat welcome.txt',
        'python3 gradient_descent.py',
        'git clone https://github.com/ChaseHCS',
        'sudo nmap -sCV pwned_ip -oN scan_results',
    ],
    'Blog-Posts': [
        'firefox https://x.com',
        'nano to-do-list.md',
        'grep -r "cybersecurity"',
        'mkdir LLama_7B_param',
        'git add .'
    ],
    'Projects': [
        'cat project.md',
        'ls -la',
        'npm install',
        'git clone',
        'docker build'
    ],
    'AI-Writeups': [
        'cat machine-learning-basics.md',
        'nano neural-network-architectures.md',
        'grep -r "tensorflow"',
        'python3 train_model.py',
        'pip install PyTorch'
    ],
    'Hacking-Writeups': [
        'rustscan --ulimit 5000 -a box.htb -- -A -sCV -oN box.scan',
        'msfconsole',
        'find / -perm -u=s -type f 2>/dev/null',
        'john --wordlist=rockyou.txt hashes',
        'feroxbuster -u http://box.htb --auto-bail -d 0 -E -w /usr/SecLists/top-1-million.txt -o ferox.scan',
        'sqlmap -u "http://target/?id=1"'
    ]
};

let typingInterval = null;
let deleteInterval = null;
let pauseTimeout = null;

function initializeTypingAnimation(pageType = 'main') {
    const commands = typingAnimations[pageType] || typingAnimations.main;
    let currentCommandIndex = 0;
    let currentChar = 0;
    let isDeleting = false;
    const typedCommand = document.getElementById('typed-command');
    
    if (!typedCommand) return;

    // Clear any existing intervals
    clearInterval(typingInterval);
    clearInterval(deleteInterval);
    clearTimeout(pauseTimeout);

    function startTyping() {
        const currentCommand = commands[currentCommandIndex];
        
        typingInterval = setInterval(() => {
            if (currentChar <= currentCommand.length) {
                typedCommand.textContent = currentCommand.substring(0, currentChar);
                currentChar++;
            } else {
                clearInterval(typingInterval);
                // Pause before deleting
                pauseTimeout = setTimeout(startDeleting, 800);
            }
        }, 60);
    }

    function startDeleting() {
        const currentCommand = commands[currentCommandIndex];
        
        deleteInterval = setInterval(() => {
            if (currentChar >= 0) {
                typedCommand.textContent = currentCommand.substring(0, currentChar);
                currentChar--;
            } else {
                clearInterval(deleteInterval);
                currentCommandIndex = (currentCommandIndex + 1) % commands.length;
                // Pause before typing next command
                pauseTimeout = setTimeout(startTyping, 200);
            }
        }, 50);
    }

    // Start the animation after initial delay
    pauseTimeout = setTimeout(startTyping, 2000);
}

// Clean up function for when page is unloaded
window.addEventListener('beforeunload', function() {
    clearInterval(typingInterval);
    clearInterval(deleteInterval);
    clearTimeout(pauseTimeout);
});
