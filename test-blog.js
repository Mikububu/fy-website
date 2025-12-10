// TEST BLOG - Links to LOCAL posts instead of Substack

// Load blog posts from posts-data.json
async function loadBlogPosts() {
    const blogGrid = document.getElementById('blog-grid');

    try {
        const response = await fetch('/posts-data.json?v=' + Date.now());
        if (!response.ok) throw new Error('Failed to load posts-data.json');

        const posts = await response.json();
        if (!posts || posts.length === 0) throw new Error('No posts found');

        // Clear loading
        blogGrid.innerHTML = '';

        // Create blog post cards - LINK TO LOCAL POSTS
        posts.forEach((post) => {
            const card = document.createElement('article');
            card.className = 'blog-card';

            // Use LOCAL URL (not Substack)
            const postUrl = post.url || post.link;

            // Format date
            let displayDate = post.date;
            if (displayDate && displayDate.includes('GMT')) {
                const parsedDate = new Date(displayDate);
                displayDate = parsedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }

            card.innerHTML = `
                <a href="${postUrl}" class="blog-card-link">
                    ${post.image ? `
                        <div class="blog-card-image">
                            <img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.parentElement.style.display='none'">
                        </div>
                    ` : ''}
                    <div class="blog-card-content">
                        <h3 class="blog-card-title">${post.title}</h3>
                        <p class="blog-card-description">${post.description}</p>
                    </div>
                </a>
            `;

            blogGrid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogGrid.innerHTML = `
            <div class="error">
                <p>Unable to load blog posts.</p>
            </div>
        `;
    }
}

// Load posts when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBlogPosts);
} else {
    loadBlogPosts();
}
