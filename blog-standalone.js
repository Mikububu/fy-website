// Load blog posts from posts-data.json and display with local images
async function loadBlogPosts() {
    const blogGrid = document.getElementById('blog-grid');

    try {
        // Load from posts-data.json with cache busting
        const response = await fetch('/posts-data.json?v=' + Date.now());

        if (!response.ok) {
            throw new Error('Failed to load posts-data.json');
        }

        const posts = await response.json();

        if (!posts || posts.length === 0) {
            throw new Error('No posts found');
        }

        // Pin "4 Paths Into the Forbidden" at the top
        const pinnedIndex = posts.findIndex(post => post.title && post.title.includes('4 Paths Into the Forbidden'));
        if (pinnedIndex > 0) {
            const [pinnedPost] = posts.splice(pinnedIndex, 1);
            posts.unshift(pinnedPost);
        }

        // Clear loading message
        blogGrid.innerHTML = '';

        // Create blog post cards
        posts.forEach((post) => {
            const card = document.createElement('article');
            card.className = 'blog-card';

            // Use LOCAL post URL (not Substack)
            const localUrl = post.url || `/posts/${post.slug}.html`;

            // Use LOCAL thumbnail image
            const localImageExt = post.image && post.image.includes('.png') ? 'png' : 'jpg';
            const localImage = `/blog-thumbnails/${post.slug}.${localImageExt}`;

            card.innerHTML = `
                <a href="${localUrl}" class="blog-card-link">
                    <div class="blog-card-image">
                        <img src="${localImage}" alt="${post.title}" loading="lazy"
                             onerror="this.style.display='none'">
                    </div>
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
                <p>Unable to load blog posts. Please check that posts-data.json is available.</p>
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
