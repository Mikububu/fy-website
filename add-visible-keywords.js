const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Adding visible keyword tags to all blog posts...\n');

// Enhanced keyword extraction with Sanskrit term recognition
function extractKeywords(html, title, description) {
    const keywords = new Set();

    // Extract text content (strip HTML)
    const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ');

    // Common stop words to filter out
    const stopWords = new Set([
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
        'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
        'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
        'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
        'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
        'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
        'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
        'most', 'us', 'is', 'are', 'was', 'been', 'has', 'had', 'were', 'said', 'did',
        'having', 'may', 'should', 'each', 'more', 'very', 'much', 'own', 'such',
        'here', 'those', 'both', 'through', 'being', 'where', 'does', 'many', 'before',
        'must', 'might', 'without', 'every', 'between', 'another', 'however', 'still',
        'since', 'during', 'always', 'something', 'either', 'whether', 'everything'
    ]);

    // Sanskrit/yogic terms (with various spellings)
    const sanskritPattern = /((?:maha)?vidya[s]?|sadhana|prana|chakra[s]?|tantra|tantric|kundalini|kriya[s]?|yoga|yogi[s]?|guru[s]?|mantra[s]?|mudra[s]?|asana[s]?|pranayama|samadhi|dharma|karma|shakti|shiva|kali|durga|tara|bhairavi|chinnamasta|dhumavati|bagalamukhi|matangi|kamala|bhuvaneshwari|tripura|sundari|nitya[s]?|manonasha|andhakarra|sparsha|pooja|puja|embodied?|somatic|sensual|forbidden|liberation|retreat[s]?|healing|consciousness|spiritual|awakening|shadow|transformation|embodiment|sacred|divine|practice[s]?|ritual[s]?)/gi;

    // Extract Sanskrit/specialized terms first
    let match;
    while ((match = sanskritPattern.exec(textContent)) !== null) {
        const term = match[1].toLowerCase();
        keywords.add(term);
    }

    // Extract capitalized multi-word terms (proper nouns, Sanskrit names)
    const properNounPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    while ((match = properNounPattern.exec(textContent)) !== null) {
        const term = match[1];
        if (term.length <= 40) { // Reasonable length for a term
            keywords.add(term.toLowerCase());
        }
    }

    // Extract words 6+ characters (sophisticated terms)
    const words = textContent.toLowerCase().match(/\b[a-z]{6,}\b/g) || [];
    const wordFreq = {};

    words.forEach(word => {
        if (!stopWords.has(word)) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
    });

    // Sort by frequency, take top terms
    const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([word]) => word);

    topWords.forEach(word => keywords.add(word));

    // Prioritize terms from title and description
    if (title) {
        const titleWords = title.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        titleWords.forEach(word => {
            if (!stopWords.has(word)) {
                keywords.add(word);
            }
        });
    }

    if (description) {
        const descWords = description.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
        descWords.forEach(word => {
            if (!stopWords.has(word)) {
                keywords.add(word);
            }
        });
    }

    // Convert to array and return top 20
    return Array.from(keywords).slice(0, 20);
}

// Extract title and description from HTML
function extractMetadata(html) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);

    return {
        title: titleMatch ? titleMatch[1] : '',
        description: descMatch ? descMatch[1] : ''
    };
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    // Skip if already has keyword section
    if (html.includes('class="post-keywords"')) {
        console.log(`  ⊘ ${file}: Already has keywords`);
        return;
    }

    // Extract metadata and keywords
    const { title, description } = extractMetadata(html);
    const keywords = extractKeywords(html, title, description);

    if (keywords.length === 0) {
        console.log(`  ⊘ ${file}: No keywords found`);
        return;
    }

    // Create keyword HTML
    const keywordTags = keywords.map(kw => `<span class="keyword-tag">${kw}</span>`).join('\n            ');

    const keywordSection = `
        <div class="post-keywords">
            <h3>Keywords</h3>
            <div class="keyword-cloud">
            ${keywordTags}
            </div>
        </div>`;

    // Insert before the "Back to all posts" link
    const backLinkPattern = /(\s*<a href="\/#blog-section" class="back-link">)/;

    if (backLinkPattern.test(html)) {
        html = html.replace(backLinkPattern, keywordSection + '\n$1');
        fs.writeFileSync(filepath, html);
        updated++;
        console.log(`  ✓ ${file}: Added ${keywords.length} keywords`);
    } else {
        console.log(`  ✗ ${file}: Could not find insertion point`);
    }
});

console.log(`\n✓ Added keyword sections to ${updated} blog posts`);
console.log('\nNow adding CSS styles for keyword display...');

// Add CSS for keyword display
const cssPath = './blog-post.css';
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('.post-keywords')) {
    const keywordCSS = `

/* Keyword Tags Section */
.post-keywords {
    margin: 3rem 0 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, rgba(122, 153, 153, 0.1), rgba(122, 153, 153, 0.05));
    border-radius: 12px;
    border: 1px solid rgba(122, 153, 153, 0.2);
}

.post-keywords h3 {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    color: #7a9999;
    margin: 0 0 1.5rem 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 600;
}

.keyword-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
}

.keyword-tag {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: rgba(122, 153, 153, 0.15);
    color: #5a7979;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border: 1px solid rgba(122, 153, 153, 0.3);
    cursor: default;
}

.keyword-tag:hover {
    background: rgba(122, 153, 153, 0.25);
    border-color: rgba(122, 153, 153, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .post-keywords {
        padding: 1.5rem;
        margin: 2rem 0 1.5rem;
    }

    .post-keywords h3 {
        font-size: 1.25rem;
        margin-bottom: 1rem;
    }

    .keyword-cloud {
        gap: 0.5rem;
    }

    .keyword-tag {
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
    }
}
`;

    css += keywordCSS;
    fs.writeFileSync(cssPath, css);
    console.log('✓ Added keyword CSS to blog-post.css');
} else {
    console.log('⊘ Keyword CSS already exists');
}

console.log('\n✓ Complete! All blog posts now have visible keyword tags.');
