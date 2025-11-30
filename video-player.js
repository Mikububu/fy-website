// HLS Video Player for Hero Section
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('hero-video');
    const videoSrc = 'https://cdn.jwplayer.com/manifests/GcW2Vpgz.m3u8';

    if (video) {
        const videoContainer = document.querySelector('.hero-video-container');

        // Create sound toggle button
        const soundToggle = document.createElement('button');
        soundToggle.className = 'video-sound-toggle';
        soundToggle.innerHTML = `
            <svg class="sound-icon sound-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
            <svg class="sound-icon sound-on" style="display: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
        `;

        // Create play/pause toggle button
        const playPauseToggle = document.createElement('button');
        playPauseToggle.className = 'video-play-pause-toggle';
        playPauseToggle.innerHTML = `
            <svg class="play-icon" style="display: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;

        // Add buttons to video container
        videoContainer.appendChild(soundToggle);
        videoContainer.appendChild(playPauseToggle);

        // Toggle sound on button click
        soundToggle.addEventListener('click', function() {
            video.muted = !video.muted;
            const soundOff = soundToggle.querySelector('.sound-off');
            const soundOn = soundToggle.querySelector('.sound-on');

            if (video.muted) {
                soundOff.style.display = 'block';
                soundOn.style.display = 'none';
            } else {
                soundOff.style.display = 'none';
                soundOn.style.display = 'block';
            }
        });

        // Toggle play/pause on button click
        playPauseToggle.addEventListener('click', function() {
            const playIcon = playPauseToggle.querySelector('.play-icon');
            const pauseIcon = playPauseToggle.querySelector('.pause-icon');

            if (video.paused) {
                video.play();
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                video.pause();
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        });

        // Add loaded class when video can play
        video.addEventListener('canplay', function() {
            video.classList.add('loaded');
        });

        // Check if HLS is supported natively (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSrc;
        }
        // Check if HLS.js is supported (Chrome, Firefox, etc.)
        else if (Hls.isSupported()) {
            const hls = new Hls({
                autoStartLoad: true,
                startPosition: -1,
                debug: false,
                enableWorker: true,
                lowLatencyMode: false,
            });

            hls.loadSource(videoSrc);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                // Auto-play when manifest is parsed
                video.play().catch(function(error) {
                    console.log('Autoplay prevented:', error);
                });
            });

            hls.on(Hls.Events.ERROR, function(event, data) {
                console.error('HLS Error:', data);
            });
        }
        else {
            console.error('HLS is not supported in this browser');
        }

        // Ensure the video loops
        video.addEventListener('ended', function() {
            video.currentTime = 0;
            video.play();
        });
    }
});
