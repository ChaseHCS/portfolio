
const typingAnimations = {
    main: [
        'help',
        'cat welcome.txt',
        'python3 gradient_descent.py',
        'git clone https://github.com/ChaseHCS',
        'sudo nmap -sCV pwned_ip -oN scan_results',
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
                pauseTimeout = setTimeout(startTyping, 200);
            }
        }, 50);
    }

    pauseTimeout = setTimeout(startTyping, 2000);
}

window.addEventListener('beforeunload', function() {
    clearInterval(typingInterval);
    clearInterval(deleteInterval);
    clearTimeout(pauseTimeout);
});
