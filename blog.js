// Fix iOS Safari hash anchor navigation
// iOS Safari doesn't reliably scroll to hash anchors when navigating from external pages
(function() {
    if (window.location.hash) {
        // Wait for DOM and layout to be ready
        setTimeout(function() {
            const hash = window.location.hash;
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
})();

// TEMPORARY: Complete mapping of all 43 local URLs to Substack URLs
const substackMapping = {
  "/posts/run-away-from-tantra.html": "https://forbiddenyoga.substack.com/p/run-away-from-tantra",
  "/posts/from-language-modulation-to-rolegame.html": "https://forbiddenyoga.substack.com/p/from-language-modulation-to-rolegame",
  "/posts/the-parallel-self.html": "https://forbiddenyoga.substack.com/p/the-parallel-self",
  "/posts/the-distant-god-fallacy.html": "https://forbiddenyoga.substack.com/p/the-distant-god-fallacy",
  "/posts/beyond-the-naked-surface.html": "https://forbiddenyoga.substack.com/p/beyond-the-naked-surface",
  "/posts/the-breath-of-god.html": "https://forbiddenyoga.substack.com/p/the-breath-of-god",
  "/posts/the-energetic-anatomist.html": "https://forbiddenyoga.substack.com/p/the-energetic-anatomist",
  "/posts/4-paths-into-the-forbidden.html": "https://forbiddenyoga.substack.com/p/4-paths-into-the-forbidden",
  "/posts/why-a-woman-initiated-in-the-left.html": "https://forbiddenyoga.substack.com/p/why-a-woman-initiated-in-the-left",
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
  "/posts/from-freud-to-taoism-and-tantra-sexual.html": "https://forbiddenyoga.substack.com/p/from-freud-to-taoism-and-tantra-sexual",
  "/posts/the-sexual-teachings-of-the-white.html": "https://forbiddenyoga.substack.com/p/the-sexual-teachings-of-the-white",
  "/posts/sparsha-puja-in-a-mental-institution.html": "https://forbiddenyoga.substack.com/p/sparsha-puja-in-a-mental-institution",
  "/posts/string-theory-tantric-secrets-and.html": "https://forbiddenyoga.substack.com/p/string-theory-tantric-secrets-and",
  "/posts/sensual-liberation-retreats-with.html": "https://forbiddenyoga.substack.com/p/sensual-liberation-retreats-with",
  "/posts/from-emptiness-to-ecstasy-my-journey.html": "https://forbiddenyoga.substack.com/p/from-emptiness-to-ecstasy-my-journey",
  "/posts/soulmates-among-the-stars-the-ultimate.html": "https://forbiddenyoga.substack.com/p/soulmates-among-the-stars-the-ultimate",
  "/posts/reclaiming-your-voice-working-through.html": "https://forbiddenyoga.substack.com/p/reclaiming-your-voice-working-through",
  "/posts/the-joy-of-torture.html": "https://forbiddenyoga.substack.com/p/the-joy-of-torture",
  "/posts/a-holistic-approach-to-divorce.html": "https://forbiddenyoga.substack.com/p/a-holistic-approach-to-divorce",
  "/posts/krama-rishi-nyasa-with-iya.html": "https://forbiddenyoga.substack.com/p/krama-rishi-nyasa-with-iya",
  "/posts/yogic-transmission-in-raja-yoga.html": "https://forbiddenyoga.substack.com/p/yogic-transmission-in-raja-yoga",
  "/posts/why-i-teach-taoist-sensual-bodywork.html": "https://forbiddenyoga.substack.com/p/why-i-teach-taoist-sensual-bodywork",
  "/posts/our-brains-urge-for-mystical-experiences.html": "https://forbiddenyoga.substack.com/p/our-brains-urge-for-mystical-experiences",
  "/posts/muladhara-chakra-petals.html": "https://forbiddenyoga.substack.com/p/muladhara-chakra-petals",
  "/posts/my-new-approach-to-therapy.html": "https://forbiddenyoga.substack.com/p/my-new-approach-to-therapy",
  "/posts/dark-alchemy.html": "https://forbiddenyoga.substack.com/p/dark-alchemy",
  "/posts/how-to-deliver-visionary-idea-in.html": "https://forbiddenyoga.substack.com/p/how-to-deliver-visionary-idea-in",
  "/posts/hermanns-story-of-his-sensual-liberation.html": "https://forbiddenyoga.substack.com/p/hermanns-story-of-his-sensual-liberation",
  "/posts/5-karmendriyas-and-5-jnanendriyas.html": "https://forbiddenyoga.substack.com/p/5-karmendriyas-and-5-jnanendriyas",
  "/posts/anais-nin-the-house-of-incest.html": "https://forbiddenyoga.substack.com/p/anais-nin-the-house-of-incest",
  "/posts/the-compass-of-zen.html": "https://forbiddenyoga.substack.com/p/the-compass-of-zen",
  "/posts/not-a-john-baldessari-artwork.html": "https://forbiddenyoga.substack.com/p/not-a-john-baldessari-artwork",
  "/posts/tantra-online.html": "https://forbiddenyoga.substack.com/p/tantra-online"
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

            // Link to local posts
            const localUrl = post.url || post.link;
            const postUrl = localUrl;
            const isExternal = false;

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
