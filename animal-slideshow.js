// Animal Slideshow functionality
let currentAnimalSlide = 0;

function showAnimalSlide(n) {
    const slides = document.querySelectorAll('.animal-slide');

    if (n >= slides.length) {
        currentAnimalSlide = 0;
    }
    if (n < 0) {
        currentAnimalSlide = slides.length - 1;
    }

    slides.forEach(slide => {
        slide.classList.remove('active-slide');
    });

    slides[currentAnimalSlide].classList.add('active-slide');
}

function changeAnimalSlide(n) {
    currentAnimalSlide += n;
    showAnimalSlide(currentAnimalSlide);
}

// Auto-advance animal slideshow every 5 seconds
setInterval(() => {
    changeAnimalSlide(1);
}, 5000);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    showAnimalSlide(currentAnimalSlide);
});
