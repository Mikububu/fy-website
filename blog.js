// Load blog posts from posts-data.json
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

        // Check for pinned post and move to top
        const pinnedIndex = posts.findIndex(post => post.title && post.title.includes('What you can expect'));

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

            // TEMPORARY: Link all posts to Substack for 24 hours
            const postUrl = 'https://michaelperin.substack.com/';
            const isExternal = true;

            // Format date for display
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
                <a href="${postUrl}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''} class="blog-card-link">
                    ${post.image ? `
                        <div class="blog-card-image">
                            <img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.parentElement.style.display='none'">
                        </div>
                    ` : ''}
                    <div class="blog-card-content">
                        <h3 class="blog-card-title">${post.title}</h3>
                        <p class="blog-card-description">${post.description}</p>
                        ${displayDate ? `<p class="blog-card-date">${displayDate}</p>` : ''}
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
document.addEventListener('DOMContentLoaded', loadBlogPosts);
