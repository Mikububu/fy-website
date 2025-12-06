// Keyword navigation system - click keywords to see related posts
(function() {
    // Load keyword index
    let keywordIndex = null;

    fetch('/keyword-index.json')
        .then(response => response.json())
        .then(data => {
            keywordIndex = data;
            initKeywordNavigation();
        })
        .catch(err => console.log('Keyword index not loaded:', err));

    function initKeywordNavigation() {
        // Add click handlers to all clickable keywords
        const keywords = document.querySelectorAll('.clickable-keyword');

        keywords.forEach(keyword => {
            keyword.style.cursor = 'pointer';

            keyword.addEventListener('click', function() {
                const keywordText = this.getAttribute('data-keyword');
                showRelatedPosts(keywordText);
            });
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
