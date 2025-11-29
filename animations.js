// Ticket Animation - Beam from Nose Effect
document.addEventListener('DOMContentLoaded', function() {
    const nasiContainer = document.querySelector('.nasi-image-container');
    const tickets = document.querySelectorAll('.ticket');

    if (nasiContainer && tickets.length > 0) {
        // Only add hover on devices that support it
        if (window.matchMedia('(hover: hover)').matches) {
            nasiContainer.addEventListener('mouseenter', function() {
                tickets.forEach(ticket => {
                    ticket.classList.add('active');
                });
            });

            nasiContainer.addEventListener('mouseleave', function() {
                tickets.forEach(ticket => {
                    ticket.classList.remove('active');
                });
            });
        }
    }
});

// Organic Bubble Animation
document.addEventListener('DOMContentLoaded', function() {
    const bubbles = document.querySelectorAll('.content-bubble, .main-heading-bubble');

    bubbles.forEach((bubble, index) => {
        // Create subtle floating animation with different timings for each bubble
        const duration = 4 + (index * 0.5); // 4s, 4.5s, 5s, etc.
        const delay = index * 0.3; // Stagger the start

        bubble.style.animation = `floatBubble ${duration}s ease-in-out ${delay}s infinite`;
    });
});

// Add CSS animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes floatBubble {
        0%, 100% {
            transform: translate(0, 0) scale(1);
        }
        25% {
            transform: translate(3px, -5px) scale(1.01);
        }
        50% {
            transform: translate(-2px, -8px) scale(0.99);
        }
        75% {
            transform: translate(-4px, -3px) scale(1.01);
        }
    }
`;
document.head.appendChild(style);

// SLC Number Count-Up Animation
document.addEventListener('DOMContentLoaded', function() {
    const numberElements = document.querySelectorAll('.slc-number-circle .number');

    // Intersection Observer to trigger animation when section comes into view
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate all numbers when section is visible
                numberElements.forEach(numberElement => {
                    animateNumber(numberElement);
                });
                // Stop observing after first trigger
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe the SLC section
    const slcSection = document.querySelector('.slc-section');
    if (slcSection) {
        observer.observe(slcSection);
    }

    function animateNumber(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 1500; // 1.5 seconds
        const startTime = performance.now();
        const start = 0;

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * easeOutQuart);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = target; // Ensure final value is exact
            }
        }

        requestAnimationFrame(updateNumber);
    }
});
