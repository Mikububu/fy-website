// HLS Video Player for Hero Section
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('hero-video');
    const videoSrc = 'https://cdn.jwplayer.com/manifests/GcW2Vpgz.m3u8';

    if (video) {
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
