document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('usernameInput');
    const saveUsernameBtn = document.getElementById('saveUsernameBtn');
    const usernameFeedback = document.getElementById('usernameFeedback');
    const playerName = document.getElementById('playerName');

    function loadUsername() {
        const savedUsername = localStorage.getItem('spacedogle_username');
        if (savedUsername) {
            usernameInput.value = savedUsername;
            playerName.textContent = savedUsername;
        }
    }

    function saveUsername() {
        const username = usernameInput.value.trim();
        
        if (username === '') {
            showFeedback('Please enter a username', 'error');
            return;
        }
        
        if (username.length < 2) {
            showFeedback('Username must be at least 2 characters', 'error');
            return;
        }
        
        if (username.length > 15) {
            showFeedback('Username must be max 15 characters', 'error');
            return;
        }
        
        localStorage.setItem('spacedogle_username', username);
        playerName.textContent = username;
        showFeedback('Username saved successfully!', 'success');
    }

    function showFeedback(message, type) {
        usernameFeedback.textContent = message;
        usernameFeedback.className = 'usernameFeedback';
        
        if (type === 'success') {
            usernameFeedback.classList.add('feedback-success');
            saveUsernameBtn.classList.add('save-success');
            setTimeout(() => {
                saveUsernameBtn.classList.remove('save-success');
            }, 3000);
        } else {
            usernameFeedback.classList.add('feedback-error');
            saveUsernameBtn.classList.add('save-error');
            setTimeout(() => {
                saveUsernameBtn.classList.remove('save-error');
            }, 3000);
        }
        
        setTimeout(() => {
            usernameFeedback.style.opacity = '0';
        }, 3000);
    }

    saveUsernameBtn.addEventListener('click', saveUsername);

    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveUsername();
        }
    });

    loadUsername();
});