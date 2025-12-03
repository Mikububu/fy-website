// Hand Pointer Animation
document.addEventListener('DOMContentLoaded', function() {
    const hand = document.getElementById('pointer-hand');
    const bubbles = document.querySelectorAll('.hand-bubble');

    bubbles.forEach((bubble, index) => {
        bubble.addEventListener('mouseenter', function() {
            const bubbleRect = bubble.getBoundingClientRect();
            const containerRect = bubble.parentElement.parentElement.getBoundingClientRect();

            // Calculate position relative to container
            const bubbleX = bubbleRect.left - containerRect.left + bubbleRect.width / 2;
            const bubbleY = bubbleRect.top - containerRect.top + bubbleRect.height / 2;

            // Position hand to point at bubble
            hand.style.left = bubbleX + 'px';
            hand.style.top = bubbleY + 'px';
            hand.style.transform = 'translate(-50%, -50%) rotate(' + (index * 45) + 'deg)';
        });
    });

    // Return hand to center when not hovering
    const handSection = document.querySelector('.hand-container');
    handSection.addEventListener('mouseleave', function() {
        hand.style.left = '50%';
        hand.style.top = '50%';
        hand.style.transform = 'translate(-50%, -50%) rotate(0deg)';
    });
});
