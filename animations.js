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

// SLC Number Cycling Animation - Numbers rotate through their ranges
document.addEventListener('DOMContentLoaded', function() {
    const numberElements = document.querySelectorAll('.slc-number-circle .number');
    let intervals = [];

    // Intersection Observer to trigger animation when section comes into view
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Start cycling all numbers when section is visible
                numberElements.forEach((numberElement, index) => {
                    startCycling(numberElement, index);
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

    function startCycling(element, index) {
        const min = parseInt(element.getAttribute('data-min'));
        const max = parseInt(element.getAttribute('data-max'));
        let current = parseInt(element.getAttribute('data-current'));

        // Different speeds for each circle (between 2-4 seconds)
        const baseDelay = 2000 + (index * 300);

        // Random initial delay so they don't all change at once
        const initialDelay = Math.random() * 2000;

        setTimeout(() => {
            const interval = setInterval(() => {
                // Increment and cycle back to min if exceeding max
                current++;
                if (current > max) {
                    current = min;
                }

                // Smooth number transition with fade effect
                element.style.opacity = '0.3';

                setTimeout(() => {
                    element.textContent = current;
                    element.setAttribute('data-current', current);
                    element.style.opacity = '1';

                    // Random organic size variation (4rem to 5.5rem)
                    const randomSize = 4 + Math.random() * 1.5;
                    element.style.fontSize = `${randomSize}rem`;
                }, 150);

            }, baseDelay);

            intervals.push(interval);
        }, initialDelay);
    }

    // Cleanup intervals on page unload
    window.addEventListener('beforeunload', () => {
        intervals.forEach(interval => clearInterval(interval));
    });
});

// Physics-Based Bubble Bouncing Game
document.addEventListener('DOMContentLoaded', function() {
    const retreatsContainer = document.querySelector('.retreats-container');
    const mainBubble = document.querySelector('.large-organic-bg');
    const contentBubbles = document.querySelectorAll('.content-bubble');

    if (!retreatsContainer || !mainBubble || contentBubbles.length === 0) return;

    // Physics properties for each bubble
    const bubbles = Array.from(contentBubbles).map((element, index) => {
        const rect = element.getBoundingClientRect();
        const containerRect = retreatsContainer.getBoundingClientRect();

        return {
            element: element,
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2,
            vx: (Math.random() - 0.5) * 0.5, // Random velocity X
            vy: (Math.random() - 0.5) * 0.5, // Random velocity Y
            radius: Math.max(rect.width, rect.height) / 2,
            mass: rect.width * rect.height,
            originalX: rect.left - containerRect.left,
            originalY: rect.top - containerRect.top
        };
    });

    let isAnimating = false;
    let animationFrameId = null;

    // Main bubble bounds (approximate ellipse)
    function isInsideMainBubble(x, y) {
        const mainRect = mainBubble.getBoundingClientRect();
        const containerRect = retreatsContainer.getBoundingClientRect();

        const centerX = mainRect.left - containerRect.left + mainRect.width / 2;
        const centerY = mainRect.top - containerRect.top + mainRect.height / 2;
        const radiusX = mainRect.width / 2 - 50; // Padding
        const radiusY = mainRect.height / 2 - 50;

        // Ellipse equation
        const dx = (x - centerX) / radiusX;
        const dy = (y - centerY) / radiusY;
        return (dx * dx + dy * dy) <= 1;
    }

    // Get main bubble center and radii
    function getMainBubbleBounds() {
        const mainRect = mainBubble.getBoundingClientRect();
        const containerRect = retreatsContainer.getBoundingClientRect();

        return {
            centerX: mainRect.left - containerRect.left + mainRect.width / 2,
            centerY: mainRect.top - containerRect.top + mainRect.height / 2,
            radiusX: mainRect.width / 2 - 80,
            radiusY: mainRect.height / 2 - 80
        };
    }

    // Collision detection between two bubbles
    function checkCollision(b1, b2) {
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (b1.radius + b2.radius);
    }

    // Resolve collision between two bubbles (elastic collision)
    function resolveCollision(b1, b2) {
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return; // Prevent division by zero

        // Normal vector
        const nx = dx / distance;
        const ny = dy / distance;

        // Relative velocity
        const dvx = b2.vx - b1.vx;
        const dvy = b2.vy - b1.vy;

        // Relative velocity in collision normal direction
        const dvn = dvx * nx + dvy * ny;

        // Do not resolve if bubbles are separating
        if (dvn > 0) return;

        // Collision impulse
        const impulse = (2 * dvn) / (b1.mass + b2.mass);

        // Update velocities
        b1.vx += impulse * b2.mass * nx;
        b1.vy += impulse * b2.mass * ny;
        b2.vx -= impulse * b1.mass * nx;
        b2.vy -= impulse * b1.mass * ny;

        // Separate bubbles to prevent overlap
        const overlap = (b1.radius + b2.radius) - distance;
        const separationX = (overlap / 2) * nx;
        const separationY = (overlap / 2) * ny;

        b1.x -= separationX;
        b1.y -= separationY;
        b2.x += separationX;
        b2.y += separationY;
    }

    // Animation loop
    function animate() {
        const bounds = getMainBubbleBounds();

        bubbles.forEach(bubble => {
            // Update position
            bubble.x += bubble.vx;
            bubble.y += bubble.vy;

            // Check collision with main bubble boundary (ellipse)
            const dx = (bubble.x - bounds.centerX) / bounds.radiusX;
            const dy = (bubble.y - bounds.centerY) / bounds.radiusY;
            const distFromCenter = Math.sqrt(dx * dx + dy * dy);

            if (distFromCenter >= 1) {
                // Reflect velocity off ellipse boundary
                const normalX = dx / bounds.radiusX;
                const normalY = dy / bounds.radiusY;
                const normalLength = Math.sqrt(normalX * normalX + normalY * normalY);
                const nx = normalX / normalLength;
                const ny = normalY / normalLength;

                // Reflect velocity
                const dotProduct = bubble.vx * nx + bubble.vy * ny;
                bubble.vx -= 2 * dotProduct * nx;
                bubble.vy -= 2 * dotProduct * ny;

                // Push back inside
                const pushDistance = (distFromCenter - 0.95) * Math.min(bounds.radiusX, bounds.radiusY);
                bubble.x -= nx * pushDistance;
                bubble.y -= ny * pushDistance;
            }

            // Apply damping
            bubble.vx *= 0.99;
            bubble.vy *= 0.99;
        });

        // Check collisions between bubbles
        for (let i = 0; i < bubbles.length; i++) {
            for (let j = i + 1; j < bubbles.length; j++) {
                if (checkCollision(bubbles[i], bubbles[j])) {
                    resolveCollision(bubbles[i], bubbles[j]);
                }
            }
        }

        // Update DOM positions
        bubbles.forEach(bubble => {
            const left = bubble.x - bubble.radius;
            const top = bubble.y - bubble.radius;

            bubble.element.style.left = `${left}px`;
            bubble.element.style.top = `${top}px`;
        });

        if (isAnimating) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    // Start bouncing on hover
    if (window.matchMedia('(hover: hover)').matches) {
        retreatsContainer.addEventListener('mouseenter', function() {
            if (!isAnimating) {
                isAnimating = true;
                // Give bubbles a random push
                bubbles.forEach(bubble => {
                    bubble.vx = (Math.random() - 0.5) * 2;
                    bubble.vy = (Math.random() - 0.5) * 2;
                });
                animate();
            }
        });

        retreatsContainer.addEventListener('mouseleave', function() {
            isAnimating = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        });
    }
});
