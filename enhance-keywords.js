const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Enhancing keywords with contextual industry terms...\n');

// Enhanced keyword extraction with contextual multi-word phrases
function extractKeywords(html, title, description) {
    const keywords = new Set();

    // Extract text content (strip HTML)
    const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ');

    const combinedText = (textContent + ' ' + title + ' ' + description).toLowerCase();

    // Multi-word contextual phrases (industry terms, wellness concepts)
    const contextualPhrases = [
        'sexual wellness', 'luxury spa', 'wellness retreat', 'tantric retreat',
        'sensual liberation', 'spiritual awakening', 'consciousness work',
        'shadow work', 'inner work', 'personal transformation', 'sacred sexuality',
        'divine feminine', 'divine masculine', 'kundalini awakening', 'energy work',
        'somatic therapy', 'body work', 'breathwork', 'spiritual practice',
        'mindfulness practice', 'meditation retreat', 'yoga retreat', 'healing retreat',
        'self-discovery', 'personal growth', 'spiritual development', 'conscious living',
        'holistic healing', 'alternative therapy', 'therapeutic bodywork',
        'spiritual coaching', 'life coaching', 'wellness coaching', 'intimacy coaching',
        'relationship therapy', 'couples retreat', 'personal development',
        'consciousness exploration', 'spiritual journey', 'transformative experience',
        'luxury wellness', 'boutique retreat', 'private retreat', 'bespoke experience',
        'forbidden yoga', 'vamachara tantra', 'left-hand path', 'tantric practice',
        'kriya yoga', 'raja yoga', 'hatha yoga', 'kundalini yoga', 'laya yoga',
        'advaita vedanta', 'non-dual awareness', 'shamanic practice', 'ritual practice'
    ];

    // Check for multi-word phrases
    contextualPhrases.forEach(phrase => {
        if (combinedText.includes(phrase)) {
            keywords.add(phrase);
        }
    });

    // Sanskrit/yogic single terms
    const sanskritPattern = /(mahavidya[s]?|sadhana|prana|chakra[s]?|tantra|tantric|kundalini|kriya[s]?|yoga|yogi[s]?|guru[s]?|mantra[s]?|mudra[s]?|asana[s]?|pranayama|samadhi|dharma|karma|shakti|shiva|kali|durga|tara|bhairavi|chinnamasta|dhumavati|bagalamukhi|matangi|kamala|bhuvaneshwari|tripura|sundari|nitya[s]?|manonasha|andhakarra|sparsha|puja|embodied?|somatic|sensual|forbidden|liberation|healing|consciousness|spiritual|awakening|shadow|transformation|embodiment|sacred|divine|ritual[s]?)/gi;

    let match;
    while ((match = sanskritPattern.exec(combinedText)) !== null) {
        keywords.add(match[1].toLowerCase());
    }

    // Industry/wellness terms
    const industryTerms = [
        'wellness', 'retreat', 'spa', 'luxury', 'bespoke', 'private', 'exclusive',
        'transformative', 'immersive', 'intensive', 'personalized', 'authentic',
        'traditional', 'ancient', 'mystical', 'esoteric', 'shamanic', 'ceremonial',
        'meditation', 'mindfulness', 'breathwork', 'bodywork', 'therapy', 'coaching',
        'intimacy', 'sexuality', 'relationship', 'couples', 'partnership',
        'psychotherapy', 'psychology', 'philosophy', 'spirituality', 'metaphysics',
        'consciousness', 'awareness', 'presence', 'embodiment', 'somatic',
        'emotional', 'physical', 'mental', 'energetic', 'vibrational'
    ];

    industryTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (regex.test(combinedText)) {
            keywords.add(term);
        }
    });

    // Convert to array, prioritize multi-word phrases, limit to 15-20 best keywords
    const keywordArray = Array.from(keywords);
    const multiWord = keywordArray.filter(k => k.includes(' '));
    const singleWord = keywordArray.filter(k => !k.includes(' '));

    // Return mix: prioritize multi-word phrases (max 8), then single words
    return [...multiWord.slice(0, 8), ...singleWord.slice(0, 12)];
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

    // Extract metadata
    const { title, description } = extractMetadata(html);

    // Extract enhanced keywords
    const keywords = extractKeywords(html, title, description);

    if (keywords.length === 0) {
        console.log(`  ⊘ ${file}: No keywords extracted`);
        return;
    }

    // Find and replace the keyword cloud section
    const keywordCloudRegex = /(<div class="keyword-cloud">)([\s\S]*?)(<\/div>\s*<\/div>)/;

    if (!keywordCloudRegex.test(html)) {
        console.log(`  ✗ ${file}: No keyword cloud found`);
        return;
    }

    // Generate new keyword tags HTML
    const keywordTags = keywords.map(keyword =>
        `            <span class="keyword-tag">${keyword}</span>`
    ).join('\n');

    // Replace the keyword cloud content
    html = html.replace(keywordCloudRegex, `$1\n${keywordTags}\n            $3`);

    fs.writeFileSync(filepath, html);
    updated++;
    console.log(`  ✓ ${file}: Updated with ${keywords.length} enhanced keywords`);
});

console.log(`\n✓ Enhanced keywords in ${updated} blog posts`);
