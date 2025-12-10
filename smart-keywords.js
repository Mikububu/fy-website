const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Applying smart, contextual keywords...\n');

// Intelligently extract meaningful keywords based on content analysis
function getSmartKeywords(html, title, description) {
    const text = (html + ' ' + title + ' ' + description).toLowerCase();
    const keywords = [];

    // Define meaningful multi-word phrases by category
    const meaningfulPhrases = {
        // Wellness & Spa Industry
        'sexual wellness': /\b(sexual\s+wellness|intimate\s+wellness|erotic\s+wellness)/i,
        'luxury spa': /\b(luxury\s+spa|boutique\s+spa|exclusive\s+spa)/i,
        'wellness retreat': /\b(wellness\s+retreat|healing\s+retreat|transformative\s+retreat)/i,
        'tantric retreat': /\b(tantric?\s+retreat|tantra\s+retreat)/i,
        'sensual bodywork': /\b(sensual\s+bodywork|tantric?\s+bodywork|sacred\s+bodywork)/i,

        // Forbidden Yoga Specific
        'forbidden yoga': /\bforbidden\s+yoga/i,
        'vamachara tantra': /\b(vamachara|left.?hand\s+path|left.?hand\s+tantra)/i,
        'Andhakaara Path To Power': /\b(andhakaara|andhakarra)\s+path\s+to\s+power/i,
        'Mahavidya': /\b(mahavidya|ten\s+mahavidya)/i,
        'White Tigress': /\bwhite\s+tigress\b/i,
        'Jade Dragon': /\bjade\s+dragon\b/i,
        'Taoist': /\btaoist\b/i,

        // Practices & Modalities
        'kundalini awakening': /\b(kundalini\s+awaken|kundalini\s+rising|kundalini\s+energy)/i,
        'breathwork': /\b(breath\s*work|pranayama|breathing\s+technique)/i,
        'shadow work': /\b(shadow\s+work|shadow\s+integration|inner\s+shadow)/i,
        'somatic therapy': /\b(somatic\s+therap|somatic\s+practice|body.?based\s+therap)/i,
        'energy work': /\b(energy\s+work|energetic\s+healing|energy\s+healing)/i,

        // Yoga Traditions
        'kriya yoga': /\bkriya\s+yoga/i,
        'kundalini yoga': /\bkundalini\s+yoga/i,
        'raja yoga': /\braja\s+yoga/i,
        'hatha yoga': /\bhatha\s+yoga/i,
        'tantra yoga': /\b(tantra\s+yoga|tantric?\s+yoga)/i,

        // Philosophy & Spirituality
        'advaita vedanta': /\badvaita\s+vedanta/i,
        'non-dual awareness': /\b(non.?dual|nondual|advaita)/i,
        'sacred sexuality': /\b(sacred\s+sex|divine\s+sex|spiritual\s+sex)/i,
        'conscious intimacy': /\b(conscious\s+intima|mindful\s+intima|aware\s+intima)/i,

        // Personal Development
        'personal transformation': /\b(personal\s+transform|self.?transform|inner\s+transform)/i,
        'spiritual awakening': /\b(spiritual\s+awaken|consciousness\s+awaken)/i,
        'self-discovery': /\b(self.?discover|personal\s+discover|inner\s+discover)/i,
        'emotional healing': /\b(emotional\s+heal|emotional\s+release|emotional\s+work)/i,

        // Therapy & Coaching
        'relationship therapy': /\b(relationship\s+therap|couples?\s+therap|partnership\s+therap)/i,
        'intimacy coaching': /\b(intimacy\s+coach|sexual\s+coach|relationship\s+coach)/i,
        'psychotherapy': /\b(psychotherap|depth\s+psycholog|jungian)/i,

        // Experience Types
        'private retreat': /\b(private\s+retreat|one.?on.?one\s+retreat|individual\s+retreat)/i,
        'immersive experience': /\b(immersive\s+experience|intensive\s+retreat|deep\s+dive)/i,
        'bespoke retreat': /\b(bespoke|personalized\s+retreat|customized\s+retreat)/i,

        // Location/Setting
        'vienna': /\bvienna/i,
        'austria': /\baustria/i,
        'europe': /\beurope/i,

        // Single meaningful terms (only if multi-word not found)
        'tantra': /\btantra\b/i,
        'meditation': /\bmeditat/i,
        'mindfulness': /\bmindful/i,
        'consciousness': /\bconsciousness/i,
        'embodiment': /\b(embodied|embodiment)/i,
        'ritual': /\britual/i,
        'ceremony': /\bceremon/i,
        'healing': /\bheal(ing|th)/i,
        'wellness': /\bwellness/i,
        'spirituality': /\b(spiritual|spirituality)/i
    };

    // Check for each meaningful phrase
    for (const [keyword, pattern] of Object.entries(meaningfulPhrases)) {
        if (pattern.test(text)) {
            keywords.push(keyword);
        }
    }

    // Remove duplicates and limit to 12-15 best keywords
    const uniqueKeywords = [...new Set(keywords)];

    // Prioritize multi-word phrases
    const multiWord = uniqueKeywords.filter(k => k.includes(' '));
    const singleWord = uniqueKeywords.filter(k => !k.includes(' '));

    return [...multiWord.slice(0, 10), ...singleWord.slice(0, 5)].slice(0, 15);
}

// Extract title and description
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

    const { title, description } = extractMetadata(html);
    const keywords = getSmartKeywords(html, title, description);

    if (keywords.length === 0) {
        console.log(`  ⊘ ${file}: No meaningful keywords found`);
        return;
    }

    // Find and replace keyword cloud
    const keywordCloudRegex = /(<div class="keyword-cloud">)([\s\S]*?)(<\/div>\s*<\/div>)/;

    if (!keywordCloudRegex.test(html)) {
        console.log(`  ✗ ${file}: No keyword cloud found`);
        return;
    }

    const keywordTags = keywords.map(keyword =>
        `            <span class="keyword-tag">${keyword}</span>`
    ).join('\n');

    html = html.replace(keywordCloudRegex, `$1\n${keywordTags}\n            $3`);

    fs.writeFileSync(filepath, html);
    updated++;
    console.log(`  ✓ ${file}: ${keywords.length} keywords - ${keywords.slice(0, 5).join(', ')}...`);
});

console.log(`\n✓ Updated ${updated} blog posts with smart, meaningful keywords`);
