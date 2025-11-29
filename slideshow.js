// Slideshow functionality with auto-play, arrows, and swipe support
let currentSlide = 0;
let autoPlayInterval;
const slides = document.getElementsByClassName("slide");
const slideDelay = 2000; // 2 seconds

// Show specific slide
function showSlide(n) {
    if (n >= slides.length) {
        currentSlide = 0;
    }
    if (n < 0) {
        currentSlide = slides.length - 1;
    }

    // Hide all slides
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }

    // Show current slide
    slides[currentSlide].style.display = "block";
}

// Change slide (called by arrow buttons)
function changeSlide(direction) {
    currentSlide += direction;
    showSlide(currentSlide);
    resetAutoPlay();
}

// Auto-advance to next slide
function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
}

// Start auto-play
function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, slideDelay);
}

// Reset auto-play (when user manually changes slide)
function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    startAutoPlay();
}

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        // Swipe left - next slide
        changeSlide(1);
    }
    if (touchEndX > touchStartX + 50) {
        // Swipe right - previous slide
        changeSlide(-1);
    }
}

const slideshowContainer = document.querySelector('.slideshow-container');

slideshowContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

slideshowContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

// Initialize slideshow
showSlide(currentSlide);
startAutoPlay();
