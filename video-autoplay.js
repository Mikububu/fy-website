// Video Autoplay ON/OFF - Intersection Observer Implementation
// Works on ALL devices - mobile and desktop
// Handles JW Player iframes with proper API communication

(function() {
    console.log('Video autoplay script initialized');

    // Intersection Observer options
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.3 // 30% of video must be visible to trigger (more sensitive)
    };

    // Track video play states
    const videoStates = new Map();

    // Callback function when intersection changes
    const handleIntersection = (entries) => {
        entries.forEach(entry => {
            const container = entry.target;
            const iframe = container.querySelector('iframe');

            if (!iframe) return;

            const videoId = container.className;

            if (entry.isIntersecting) {
                // Video entered viewport - AUTOPLAY ON
                if (!videoStates.get(videoId)) {
                    console.log('Video entering viewport - AUTOPLAY ON:', videoId);
                    playVideo(iframe);
                    videoStates.set(videoId, true);
                }
            } else {
                // Video left viewport - AUTOPLAY OFF (pause)
                if (videoStates.get(videoId)) {
                    console.log('Video leaving viewport - AUTOPLAY OFF:', videoId);
                    pauseVideo(iframe);
                    videoStates.set(videoId, false);
                }
            }
        });
    };

    // Create Intersection Observer
    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Function to play video
    function playVideo(iframe) {
        try {
            // Method 1: JW Player API postMessage
            iframe.contentWindow.postMessage(JSON.stringify({
                method: 'play'
            }), '*');

            // Method 2: Try direct play command
            setTimeout(() => {
                iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            }, 100);

            console.log('Play command sent');
        } catch (error) {
            console.log('Play error (expected for cross-origin):', error.message);
        }

        // Also try to interact with iframe src
        try {
            const src = iframe.src;
            if (src.includes('autostart')) return;

            // Add autostart parameter if not present
            const separator = src.includes('?') ? '&' : '?';
            if (!src.includes('autostart')) {
                iframe.src = src + separator + 'autostart=true';
            }
        } catch (error) {
            console.log('Src modification error:', error.message);
        }
    }

    // Function to pause video
    function pauseVideo(iframe) {
        try {
            // Method 1: JW Player API postMessage
            iframe.contentWindow.postMessage(JSON.stringify({
                method: 'pause'
            }), '*');

            // Method 2: Try direct pause command
            setTimeout(() => {
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            }, 100);

            console.log('Pause command sent');
        } catch (error) {
            console.log('Pause error (expected for cross-origin):', error.message);
        }
    }

    // Wait for DOM to be fully loaded
    function initVideoObserver() {
        // Wait a bit for iframes to load
        setTimeout(() => {
            // Select both video container divs (not the iframes directly)
            const videoContainers = document.querySelectorAll('.video-preview-container, .new-video-container');

            console.log('Found ' + videoContainers.length + ' video containers');

            // Observe each video container
            videoContainers.forEach((container, index) => {
                const iframe = container.querySelector('iframe');

                if (iframe) {
                    // Add attributes to iframe
                    iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');
                    iframe.setAttribute('allowfullscreen', 'true');

                    console.log('Observing video container ' + (index + 1) + ':', container.className);

                    // Observe the container, not the iframe
                    observer.observe(container);

                    // Initialize state
                    videoStates.set(container.className, false);
                }
            });
        }, 500);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoObserver);
    } else {
        initVideoObserver();
    }

    // Also listen for window messages from JW Player
    window.addEventListener('message', function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('JW Player message:', data);
        } catch (e) {
            // Not JSON, ignore
        }
    });
})();
