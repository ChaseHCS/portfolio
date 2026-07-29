
const typingAnimations = {
    main: [
        'help',
        'bloodyAD -H $ip -d $domain -u $usr -p $pwd add groupMember “Domain Admins” “john.doe”',
        'python3 gradient_descent.py',
        'nxc ldap $dcip -u $usr -p $pwd --users-export users.txt',
        'sudo nmap -sCV $ip -oN scan_results',
        'ffuf -w ~/Seclists/Discovery/Web-Content/raft-large-directories.txt-u https://target/FUZZ -fc 404 -o ffufdirectories',
    ]
};

let typingInterval = null;
let deleteInterval = null;
let pauseTimeout = null;

function initializeTypingAnimation(pageType = 'main', initialDelay = 2000) {
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

    pauseTimeout = setTimeout(startTyping, initialDelay);
}

window.addEventListener('beforeunload', function() {
    clearInterval(typingInterval);
    clearInterval(deleteInterval);
    clearTimeout(pauseTimeout);
});
