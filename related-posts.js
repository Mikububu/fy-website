// Load related posts dynamically
async function loadRelatedPosts() {
    try {
        const response = await fetch('/posts-data.json');
        const allPosts = await response.json();

        // Get current page URL
        const currentPath = window.location.pathname;

        // Filter out the current post
        const otherPosts = allPosts.filter(post => post.url !== currentPath);

        // Shuffle and take first 8 posts
        const shuffled = otherPosts.sort(() => 0.5 - Math.random());
        const selectedPosts = shuffled.slice(0, 8);

        const container = document.getElementById('related-posts-container');

        selectedPosts.forEach(post => {
            const postCard = document.createElement('a');
            postCard.href = post.url;
            postCard.className = 'post-card';

            postCard.innerHTML = `
                <img src="${post.image}" alt="${post.title}" loading="lazy">
                <div class="post-card-overlay">
                    <h4 class="post-card-title">${post.title}</h4>
                </div>
            `;

            container.appendChild(postCard);
        });
    } catch (error) {
        console.error('Error loading related posts:', error);
    }
}

// Load related posts when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRelatedPosts);
} else {
    loadRelatedPosts();
}
