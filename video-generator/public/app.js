document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const repoPathInput = document.getElementById('repoPath');
    const appUrlInput = document.getElementById('appUrl');
    const skipVoiceInput = document.getElementById('skipVoice');
    const statusDiv = document.getElementById('status');
    const videoContainer = document.getElementById('video-container');
    const demoVideo = document.getElementById('demoVideo');
    const downloadLink = document.getElementById('downloadLink');
    const scriptContainer = document.getElementById('script-container');
    const scriptText = document.getElementById('scriptText');

    // Load initial values if available
    // For now, static values are fine.

    // Polling interval
    let pollInterval = null;

    generateBtn.addEventListener('click', async () => {
        const repoPath = repoPathInput.value;
        const appUrl = appUrlInput.value;
        const skipVoice = skipVoiceInput.checked;

        if (!repoPath || !appUrl) {
            alert('Please fill in all fields.');
            return;
        }

        generateBtn.disabled = true;
        statusDiv.textContent = 'Status: Starting...';
        videoContainer.style.display = 'none';
        scriptContainer.style.display = 'none';

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoPath, appUrl, skipVoice })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to start job');
            }

            // Start polling
            pollInterval = setInterval(checkStatus, 2000);
        } catch (error) {
            statusDiv.textContent = `Error: ${error.message}`;
            generateBtn.disabled = false;
        }
    });

    async function checkStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();

            statusDiv.textContent = `Status: ${data.message || data.status}`;

            if (data.status === 'done') {
                clearInterval(pollInterval);
                generateBtn.disabled = false;
                showVideo();
                showScript(data.script);
            } else if (data.status === 'error') {
                clearInterval(pollInterval);
                generateBtn.disabled = false;
                statusDiv.textContent = `Error: ${data.error}`;
            } else {
                // Still running
                // Maybe update progress bar
            }
        } catch (e) {
            console.error('Polling error:', e);
        }
    }

    function showVideo() {
        videoContainer.style.display = 'block';
        demoVideo.src = `/video?t=${Date.now()}`;
        downloadLink.href = `/video?t=${Date.now()}`;
    }

    function showScript(script) {
        if (!script) return;
        scriptContainer.style.display = 'block';
        scriptText.value = JSON.stringify(script, null, 2);
    }
});
