const fs = require('fs');
const path = require('path');

// Load the global keywords data
const keywordsData = JSON.parse(fs.readFileSync('./keywords-data.json', 'utf8'));

// Important terms seed list for direct matching (from extract-keywords.js)
const importantTermsSeed = new Set([
    // Authors and teachers
    'osho', 'rajneesh', 'ramana', 'maharshi', 'nisargadatta', 'maharaj',
    'krishnamurti', 'jiddu krishnamurti', 'eckhart tolle', 'tolle',
    'ram dass', 'dass', 'timothy leary', 'terence mckenna', 'mckenna',
    'rumi', 'hafiz', 'kabir', 'mirabai', 'rilke', 'nin', 'anais nin',
    'campbell', 'joseph campbell', 'eliade', 'mircea eliade',
    'jung', 'freud', 'sigmund freud', 'reich', 'wilhelm reich', 'lowen', 'alexander lowen',
    'grof', 'stanislav grof', 'wilber', 'ken wilber', 'kornfield', 'jack kornfield',
    'sapolsky', 'robert sapolsky', 'behave', 'baboons',
    // Relational and intimacy practices
    'bdsm', 'roleplay', 'role play', 'dominance', 'submission',
    'power exchange', 'kink', 'fetish', 'shibari', 'bondage',
    'pornography', 'porn', 'humiliation', 'sadism', 'masochism',
    // Forbidden Yoga specific
    'testimonial', 'testimonials', 'sensual liberation retreat', 'slr',
    'sensual massage', 'ayurvedic', 'ayurveda', 'aggression',
    // Key concepts
    'shadow work', 'trauma', 'somatic', 'embodiment', 'breathwork',
    'kundalini', 'chakras', 'tantra', 'meditation', 'ritual'
]);

const postsDir = './posts';

console.log('Extracting keywords dynamically from each blog post...\n');

// Extract text content from HTML
function extractTextFromHTML(html) {
    // Remove script and style tags
    let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text.toLowerCase();
}

// Normalize text for matching (remove diacritics, etc.)
function normalizeForMatching(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

// Extract keywords from a blog post
function extractKeywordsFromPost(html, filename) {
    const text = extractTextFromHTML(html);
    const normalizedText = normalizeForMatching(text);

    const foundKeywords = [];

    // First, check important seed terms directly (these might not be in global data)
    for (const term of importantTermsSeed) {
        const normalizedTerm = normalizeForMatching(term);
        // Use word boundary matching for better accuracy
        const regex = new RegExp('\\b' + normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\-]+') + '\\b', 'gi');
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
            foundKeywords.push({
                keyword: term,
                globalCount: 1000, // High priority for seed terms
                postCount: matches.length
            });
        }
    }

    // Then combine words and phrases from the global data
    const allKeywords = [
        ...keywordsData.words.map(w => [w.text, w.count]),
        ...keywordsData.phrases.map(p => [p.text, p.count])
    ];

    // Check each keyword and phrase from the global data
    for (const [keyword, count] of allKeywords) {
        const normalizedKeyword = normalizeForMatching(keyword);

        // Skip very common generic keywords that would appear in almost every post
        const skipKeywords = ['yoga', 'forbidden', 'practice', 'practices', 'posts'];
        if (skipKeywords.includes(keyword)) continue;

        // Skip if already found from seed terms
        if (Array.from(importantTermsSeed).some(term => normalizeForMatching(term) === normalizedKeyword)) {
            continue;
        }

        // Check if keyword appears in the text
        if (normalizedText.includes(normalizedKeyword)) {
            foundKeywords.push({
                keyword: keyword,
                globalCount: count,
                // Count occurrences in this post
                postCount: (normalizedText.match(new RegExp(normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
            });
        }
    }

    // Sort by relevance: prioritize by post count, then global count
    foundKeywords.sort((a, b) => {
        if (b.postCount !== a.postCount) {
            return b.postCount - a.postCount;
        }
        return b.globalCount - a.globalCount;
    });

    // Take top 18-20 keywords to capture more specific terms
    const topKeywords = foundKeywords.slice(0, 20).map(k => k.keyword);

    return topKeywords;
}

// Update HTML with new keywords
function updateKeywordsInHTML(html, keywords) {
    if (keywords.length === 0) {
        return html;
    }

    // Find and replace keyword cloud
    const keywordCloudRegex = /(<div class="keyword-cloud">)([\s\S]*?)(<\/div>\s*<\/div>)/;

    if (!keywordCloudRegex.test(html)) {
        console.log('    ⚠ No keyword cloud found in HTML');
        return html;
    }

    const keywordTags = keywords.map(keyword =>
        `            <span class="keyword-tag clickable-keyword" data-keyword="${keyword}">${keyword}</span>`
    ).join('\n');

    return html.replace(keywordCloudRegex, `$1\n${keywordTags}\n            $3`);
}

// Process all blog posts
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const html = fs.readFileSync(filepath, 'utf8');

    console.log(`\n📄 ${file}`);

    const keywords = extractKeywordsFromPost(html, file);

    if (keywords.length === 0) {
        console.log('  ⊘ No keywords found');
        return;
    }

    console.log(`  ✓ Found ${keywords.length} keywords:`);
    console.log(`    ${keywords.slice(0, 10).join(', ')}${keywords.length > 10 ? '...' : ''}`);

    const updatedHTML = updateKeywordsInHTML(html, keywords);

    if (updatedHTML !== html) {
        fs.writeFileSync(filepath, updatedHTML);
        updated++;
        console.log('  ✓ Updated HTML file');
    } else {
        console.log('  ⚠ No changes made');
    }
});

console.log(`\n\n✅ Updated ${updated} of ${files.length} blog posts with dynamic keywords`);
