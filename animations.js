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
