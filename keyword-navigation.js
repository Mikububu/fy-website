// Keyword navigation system - click keywords to see related posts
(function() {
    // Save scroll position when navigating away
    const blogSection = document.getElementById('blog-section');
    if (blogSection) {
        // Restore scroll position when page loads
        const savedScroll = sessionStorage.getItem('blogScrollPosition');
        if (savedScroll) {
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScroll));
                sessionStorage.removeItem('blogScrollPosition');
            }, 100);
        }

        // Save scroll position when clicking blog links
        const blogLinks = document.querySelectorAll('a[href^="/posts/"]');
        blogLinks.forEach(link => {
            link.addEventListener('click', () => {
                sessionStorage.setItem('blogScrollPosition', window.scrollY);
            });
        });
    }

    // Handle back button clicks from blog posts
    const backLinks = document.querySelectorAll('a[href="/#blog-section"]');
    if (backLinks.length > 0) {
        backLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const savedScroll = sessionStorage.getItem('blogScrollPosition');
                if (savedScroll) {
                    e.preventDefault();
                    window.location.href = '/#blog-section';
                    setTimeout(() => {
                        window.scrollTo(0, parseInt(savedScroll));
                        sessionStorage.removeItem('blogScrollPosition');
                    }, 100);
                }
            });
        });
    }

    // Load keyword index and frequency data
    let keywordIndex = null;
    let keywordFrequency = null;

    // Load both data files
    Promise.all([
        fetch('/keyword-index.json').then(r => r.json()).catch(err => null),
        fetch('/keyword-frequency.json').then(r => r.json()).catch(err => null)
    ]).then(([indexData, frequencyData]) => {
        keywordIndex = indexData;
        keywordFrequency = frequencyData;
        initKeywordNavigation();
    });

    function initKeywordNavigation() {
        // Get all keyword elements
        const keywords = document.querySelectorAll('.clickable-keyword');

        keywords.forEach(keyword => {
            const keywordText = keyword.getAttribute('data-keyword');

            // Check if this keyword appears in 2+ posts (shared keyword)
            const isShared = keywordFrequency &&
                            keywordFrequency.shared.some(item => item.keyword === keywordText);

            if (isShared) {
                // Shared keywords: make them clickable and styled
                keyword.classList.add('shared-keyword');
                keyword.style.cursor = 'pointer';

                keyword.addEventListener('click', function() {
                    showRelatedPosts(keywordText);
                });
            } else {
                // Unique keywords: remove clickable styling, keep as plain text
                keyword.classList.add('unique-keyword');
                keyword.classList.remove('clickable-keyword');
            }
        });
    }

    function showRelatedPosts(keywordText) {
        if (!keywordIndex || !keywordIndex.keywords[keywordText]) return;

        const relatedPostSlugs = keywordIndex.keywords[keywordText];
        const relatedPosts = relatedPostSlugs.map(slug => keywordIndex.posts[slug]);

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'keyword-modal';
        modal.innerHTML = `
            <div class="keyword-modal-content">
                <button class="keyword-modal-close">&times;</button>
                <h2>Posts about: ${keywordText}</h2>
                <p class="keyword-count">${relatedPosts.length} post${relatedPosts.length > 1 ? 's' : ''}</p>
                <div class="related-posts-list">
                    ${relatedPosts.map(post => `
                        <a href="/posts/${post.slug}.html" class="related-post-item">
                            <h3>${post.title}</h3>
                            <div class="related-post-keywords">
                                ${post.keywords.slice(0, 5).map(k =>
                                    `<span class="mini-keyword-tag">${k}</span>`
                                ).join('')}
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Save scroll position when clicking modal links
        modal.querySelectorAll('.related-post-item').forEach(link => {
            link.addEventListener('click', () => {
                sessionStorage.setItem('blogScrollPosition', window.scrollY);
            });
        });

        // Close on click outside or close button
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('keyword-modal-close')) {
                modal.remove();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
})();
