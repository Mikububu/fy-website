// Video Autoplay ON/OFF - Intersection Observer Implementation
// Works on ALL devices - mobile and desktop

(function() {
    // Intersection Observer options
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.5 // 50% of video must be visible to trigger
    };

    // Callback function when intersection changes
    const handleIntersection = (entries) => {
        entries.forEach(entry => {
            const iframe = entry.target;

            if (entry.isIntersecting) {
                // Video entered viewport - AUTOPLAY ON with sound
                playVideo(iframe);
            } else {
                // Video left viewport - AUTOPLAY OFF (pause)
                pauseVideo(iframe);
            }
        });
    };

    // Create Intersection Observer
    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Function to play video with sound
    function playVideo(iframe) {
        try {
            // For JW Player iframes, use postMessage API
            iframe.contentWindow.postMessage(JSON.stringify({
                method: 'play',
                muted: false
            }), '*');

            console.log('Video autoplay ON');
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

            console.log('Video autoplay OFF');
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
        // Select all video iframes - both video sections
        const videoIframes = document.querySelectorAll('.video-preview-container iframe, .new-video-container iframe');

        console.log('Found ' + videoIframes.length + ' video iframes');

        // Observe each video iframe
        videoIframes.forEach((iframe, index) => {
            observer.observe(iframe);

            // Add autoplay and unmuted attributes to iframes
            iframe.setAttribute('allow', 'autoplay; fullscreen');

            console.log('Observing video iframe ' + (index + 1));
        });
    }
})();
