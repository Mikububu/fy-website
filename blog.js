// Load blog posts - automatically fetches from Substack RSS when hosted
async function loadBlogPosts() {
    const blogGrid = document.getElementById('blog-grid');

    try {
        // Check if we're on Netlify or a live server
        const isLocalFile = window.location.protocol === 'file:';

        let posts = [];

        if (!isLocalFile) {
            // On live server - fetch from RSS via Netlify function
            try {
                const response = await fetch('/.netlify/functions/rss-proxy');

                if (response.ok) {
                    const xmlText = await response.text();
                    posts = parseRSSFeed(xmlText);
                }
            } catch (error) {
                console.log('Netlify function not available, using fallback data');
            }
        }

        // Fallback to hardcoded data if RSS fetch failed or viewing locally
        // ALL 12 posts from Forbidden Yoga archive
        if (posts.length === 0) {
            posts = [
                {
                    "title": "Run Away From Tantra",
                    "description": "Why Real Tantrics Have to Meditate on the Graveyard",
                    "link": "https://www.forbidden-yoga.com/p/run-away-from-tantra",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5cbe063b-58e6-4476-856d-4216bba743b2_3584x4800.png",
                    "date": "Nov 24, 2025"
                },
                {
                    "title": "From Language Modulation To Rolegame Scripts",
                    "description": "Real Life Sadhanas in the Forbidden Yoga lineage",
                    "link": "https://www.forbidden-yoga.com/p/from-language-modulation-to-rolegame",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1d8b73f9-a213-408a-8ad0-f20442a2f17a_1024x559.jpeg",
                    "date": "Nov 22, 2025"
                },
                {
                    "title": "The Parallel Self",
                    "description": "A look at the teacher behind Forbidden Yoga and the hidden architecture that shapes his work",
                    "link": "https://www.forbidden-yoga.com/p/the-parallel-self",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7d4caf15-6f71-4c3f-808e-870f767e873d_1000x667.jpeg",
                    "date": "Nov 21, 2025"
                },
                {
                    "title": "The Distant God Fallacy",
                    "description": "A Blueprint for the Post-Religious Age",
                    "link": "https://www.forbidden-yoga.com/p/the-distant-god-fallacy",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F24032ed9-179a-4191-8ca0-012072a171cd_3456x5184.jpeg",
                    "date": "Nov 19, 2025"
                },
                {
                    "title": "Beyond the Naked Surface",
                    "description": "Forbidden Yoga appears chaotic until the ancient structure underneath becomes visible",
                    "link": "https://www.forbidden-yoga.com/p/beyond-the-naked-surface",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1beefb9f-04d8-43a3-9090-3b60667e2511_1152x648.gif",
                    "date": "Nov 18, 2025"
                },
                {
                    "title": "The Breath of God",
                    "description": "The Missing Link Between Yoga, Couples Meditation and Breathwork",
                    "link": "https://www.forbidden-yoga.com/p/the-breath-of-god",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F42a4ac9e-84fe-4554-82cd-adee730be87c_5272x4164.jpeg",
                    "date": "Nov 15, 2025"
                },
                {
                    "title": "The Energetic Anatomist",
                    "description": "How Stanislav reads the holographic structure of relationships, clears hostile magic, and identifies exactly who drains you",
                    "link": "https://www.forbidden-yoga.com/p/the-energetic-anatomist",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb6000ed9-e795-485f-abe8-592365959b6e_8192x5464.jpeg",
                    "date": "Nov 15, 2025"
                },
                {
                    "title": "4 Paths Into the Forbidden",
                    "description": "What you can get from us!",
                    "link": "https://www.forbidden-yoga.com/p/4-paths-into-the-forbidden",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F140f3b70-09c8-4371-b03a-d755ae695181_3362x1860.jpeg",
                    "date": "Nov 10, 2025"
                },
                {
                    "title": "When the Source Becomes the Destroyer",
                    "description": "The Predator's Transaction: Why Yoginīs Hold Life and Death in Their Hands",
                    "link": "https://www.forbidden-yoga.com/p/why-a-woman-initiated-in-the-left",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fba5b960c-5884-41a9-bacb-5d321784f799_1290x959.jpeg",
                    "date": "Nov 10, 2025"
                },
                {
                    "title": "Indian Tantra - Mahavidyas versus Nityas",
                    "description": "Why We Work Through The Body, Not Primarily Mantra Sadhana",
                    "link": "https://www.forbidden-yoga.com/p/indian-tantra-mahavidyas-versus-nityas",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-video.s3.amazonaws.com%2Fvideo_upload%2Fpost%2F178415569%2F85756739-5835-4af4-9eaa-8a027aa59dce%2Ftranscoded-00000.png",
                    "date": "Nov 9, 2025"
                },
                {
                    "title": "Why our society cannot heal",
                    "description": "(but maybe some of us can)",
                    "link": "https://www.forbidden-yoga.com/p/why-our-society-cannot-heal",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-video.s3.amazonaws.com%2Fvideo_upload%2Fpost%2F178404378%2F0e279d59-fbc1-4487-b2a6-7cdbb30a1ca3%2Ftranscoded-00001.png",
                    "date": "Nov 9, 2025"
                },
                {
                    "title": "What you can expect booking Forbidden Yoga experiences",
                    "description": "Welcome to the edge of the forbidden, where practice becomes life and life becomes practice",
                    "link": "https://www.forbidden-yoga.com/p/what-you-can-expect-booking-forbidden",
                    "image": "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-video.s3.amazonaws.com%2Fvideo_upload%2Fpost%2F178395424%2F39f82b4c-a48f-4e96-9c29-0e3f0b6863a4%2Ftranscoded-00001.png",
                    "date": "Nov 9, 2025"
                }
            ];
        }

        if (posts.length === 0) {
            blogGrid.innerHTML = '<p class="error">No blog posts found.</p>';
            return;
        }

        // Clear loading message
        blogGrid.innerHTML = '';

        // Create blog post cards
        posts.forEach((post) => {
            const card = document.createElement('article');
            card.className = 'blog-card';

            card.innerHTML = `
                <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="blog-card-link">
                    ${post.image ? `
                        <div class="blog-card-image">
                            <img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.parentElement.style.display='none'">
                        </div>
                    ` : ''}
                    <div class="blog-card-content">
                        <h3 class="blog-card-title">${post.title}</h3>
                        <p class="blog-card-description">${post.description}</p>
                        ${post.date ? `<time class="blog-card-date">${post.date}</time>` : ''}
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
                <p><a href="https://www.forbidden-yoga.com" target="_blank">Visit the blog directly</a></p>
            </div>
        `;
    }
}

// Parse RSS XML feed into blog post objects
function parseRSSFeed(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const items = xml.querySelectorAll('item');
    const posts = [];

    items.forEach((item) => {
        const title = item.querySelector('title')?.textContent || 'Untitled';
        const description = item.querySelector('description')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '#';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const enclosure = item.querySelector('enclosure');
        const imageUrl = enclosure?.getAttribute('url') || '';

        // Format date
        let formattedDate = '';
        if (pubDate) {
            const date = new Date(pubDate);
            formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        posts.push({
            title,
            description,
            link,
            image: imageUrl,
            date: formattedDate
        });
    });

    return posts;
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadBlogPosts);
