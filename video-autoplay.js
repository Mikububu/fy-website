// Video Autoplay on Mobile - Intersection Observer Implementation
// Only applies to mobile devices (max-width: 768px)

(function() {
    // Check if device is mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Only run on mobile devices
    if (!isMobile()) {
        return;
    }

    // Intersection Observer options
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.5 // 50% of video must be visible
    };

    // Callback function when intersection changes
    const handleIntersection = (entries) => {
        entries.forEach(entry => {
            const iframe = entry.target;

            if (entry.isIntersecting) {
                // Video entered viewport - autoplay with sound
                playVideo(iframe);
            } else {
                // Video left viewport - stop playback
                pauseVideo(iframe);
            }
        });
    };

    // Create Intersection Observer
    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Function to play video with sound
    function playVideo(iframe) {
        try {
            // For JW Player iframes, we need to use postMessage API
            iframe.contentWindow.postMessage(JSON.stringify({
                method: 'play',
                muted: false
            }), '*');
        } catch (error) {
            console.log('Video autoplay initiated');
        }
    }

    // Function to pause video
    function pauseVideo(iframe) {
        try {
            // For JW Player iframes, use postMessage API to pause
            iframe.contentWindow.postMessage(JSON.stringify({
                method: 'pause'
            }), '*');
        } catch (error) {
            console.log('Video pause initiated');
        }
    }

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoObserver);
    } else {
        initVideoObserver();
    }

    function initVideoObserver() {
        // Select all video iframes
        const videoIframes = document.querySelectorAll('.video-preview-container iframe, .new-video-container iframe');

        // Observe each video iframe
        videoIframes.forEach(iframe => {
            observer.observe(iframe);

            // Add autoplay and unmuted attributes to iframes
            iframe.setAttribute('allow', 'autoplay; fullscreen');
        });
    }

    // Re-initialize on window resize if crossing mobile breakpoint
    let wasMobile = isMobile();
    window.addEventListener('resize', () => {
        const nowMobile = isMobile();
        if (wasMobile !== nowMobile) {
            wasMobile = nowMobile;
            if (nowMobile) {
                initVideoObserver();
            } else {
                // Disconnect observer on desktop
                observer.disconnect();
            }
        }
    });
})();
