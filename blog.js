// TEMPORARY: Mapping of local URLs to Substack URLs
const substackMapping = {
  "/posts/run-away-from-tantra.html": "https://forbiddenyoga.substack.com/p/run-away-from-tantra",
  "/posts/from-language-modulation-to-rolegame.html": "https://forbiddenyoga.substack.com/p/from-language-modulation-to-rolegame",
  "/posts/the-parallel-self.html": "https://forbiddenyoga.substack.com/p/the-parallel-self",
  "/posts/the-distant-god-fallacy.html": "https://forbiddenyoga.substack.com/p/the-distant-god-fallacy",
  "/posts/beyond-the-naked-surface.html": "https://forbiddenyoga.substack.com/p/beyond-the-naked-surface",
  "/posts/the-breath-of-god.html": "https://forbiddenyoga.substack.com/p/the-breath-of-god",
  "/posts/the-energetic-anatomist.html": "https://forbiddenyoga.substack.com/p/the-energetic-anatomist",
  "/posts/4-paths-into-the-forbidden.html": "https://forbiddenyoga.substack.com/p/4-paths-into-the-forbidden",
  "/posts/when-the-source-becomes-the-destroyer.html": "https://forbiddenyoga.substack.com/p/why-a-woman-initiated-in-the-left",
  "/posts/indian-tantra-mahavidyas-versus-nityas.html": "https://forbiddenyoga.substack.com/p/indian-tantra-mahavidyas-versus-nityas",
  "/posts/why-our-society-cannot-heal.html": "https://forbiddenyoga.substack.com/p/why-our-society-cannot-heal",
  "/posts/what-you-can-expect-booking-forbidden.html": "https://forbiddenyoga.substack.com/p/what-you-can-expect-booking-forbidden",
  "/posts/the-forgotten-gateways-of-the-human.html": "https://forbiddenyoga.substack.com/p/the-forgotten-gateways-of-the-human",
  "/posts/from-a-shakta-tantra-stream-to-forbidden.html": "https://forbiddenyoga.substack.com/p/from-a-shakta-tantra-stream-to-forbidden",
  "/posts/the-solace-of-the-scene.html": "https://forbiddenyoga.substack.com/p/the-solace-of-the-scene",
  "/posts/the-animal-puja.html": "https://forbiddenyoga.substack.com/p/the-animal-puja",
  "/posts/the-eight-limitations-of-man-according.html": "https://forbiddenyoga.substack.com/p/the-eight-limitations-of-man-according",
  "/posts/forbidden-yoga-embracing-the-unconventional.html": "https://forbiddenyoga.substack.com/p/forbidden-yoga-embracing-the-unconventional",
  "/posts/the-next-generation-of-wellness-retreats.html": "https://forbiddenyoga.substack.com/p/the-next-generation-of-wellness-retreats",
  "/posts/from-freud-to-taoism-and-tantra-sexual.html": "https://forbiddenyoga.substack.com/p/from-freud-to-taoism-and-tantra-sexual"
};

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

            // TEMPORARY: Link to Substack using mapping, fallback to homepage
            const localUrl = post.url || post.link;
            const postUrl = substackMapping[localUrl] || 'https://forbiddenyoga.substack.com/';
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
