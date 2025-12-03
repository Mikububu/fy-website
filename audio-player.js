// Audio Player for Hymn.m4a
document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('hymn-audio');
    const toggleBtn = document.getElementById('audio-toggle');
    const playIcon = toggleBtn.querySelector('.play-icon');
    const pauseIcon = toggleBtn.querySelector('.pause-icon');

    // Start playing on load (browsers may block this)
    audio.play().catch(err => {
        console.log('Autoplay was prevented:', err);
        // If autoplay fails, show play icon
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    });

    toggleBtn.addEventListener('click', function() {
        if (audio.paused) {
            audio.play();
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            audio.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    });
});
