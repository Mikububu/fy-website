const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Extracting REAL meaningful keywords...\n');

// Extract only meaningful, complete terms - NO fragments, NO "the", NO duplicates
function extractMeaningfulKeywords(html, title, description) {
    const text = (html + ' ' + title + ' ' + description).toLowerCase();
    const keywords = new Set();

    // Specific Sanskrit philosophical terms (complete words only)
    const sanskritTerms = {
        // Core concepts
        'chitta': /\bchitta\b/i,
        'manas': /\bmanas\b/i,
        'buddhi': /\bbuddhi\b/i,
        'ahamkara': /\bahamkara\b/i,
        'vaikrita': /\bvaikrita\b/i,
        'vrittis': /\bvritti?s?\b/i,
        'manonasha': /\b(manonasha|mano.?nasha)\b/i,
        'prakriti': /\bprakriti\b/i,
        'purusha': /\bpurusha\b/i,
        'samadhi': /\bsamadhi\b/i,
        'prana': /\bprana\b/i,

        // Deities & Powers
        'Kali': /\bkali\b/i,
        'Shiva': /\bshiva\b/i,
        'Shakti': /\bshakti\b/i,
        'Durga': /\bdurga\b/i,
        'Tara': /\btara\b/i,
        'Bhairavi': /\bbhairavi\b/i,
        'Chinnamasta': /\bchinnamasta\b/i,
        'Dhumavati': /\bdhumavati\b/i,
        'Bagalamukhi': /\bbagalamukhi\b/i,
        'Matangi': /\bmatangi\b/i,
        'Kamala': /\bkamala\b/i,
        'Bhuvaneshwari': /\bbhuvaneshwari\b/i,

        // Texts & Lineages
        'Kularṇava Tantra': /\bkularnava\s+tantra\b/i,
        'Vijñāna Bhairava': /\bvijnana\s+bhairava\b/i,
        'Advaita Vedanta': /\badvaita\s+vedanta\b/i,
        'Vamachara': /\bvamachara\b/i,
        'Kaula': /\bkaula\b/i,

        // Chakras
        'muladhara': /\bmuladhara\b/i,
        'svadhisthana': /\bsvadhisthana\b/i,
        'manipura': /\bmanipura\b/i,
        'anahata': /\banahata\b/i,
        'vishuddha': /\bvishuddha\b/i,
        'ajna': /\bajna\b/i,
        'sahasrara': /\bsahasrara\b/i,

        // Practices
        'kundalini awakening': /\bkundalini\s+awaken/i,
        'kundalini yoga': /\bkundalini\s+yoga/i,
        'kriya yoga': /\bkriya\s+yoga/i,
        'raja yoga': /\braja\s+yoga/i,
        'hatha yoga': /\bhatha\s+yoga/i,
        'tantra yoga': /\btantra\s+yoga/i,
        'laya yoga': /\blaya\s+yoga/i,

        // Specific Terms
        'sparsha puja': /\bsparsha\s+puj/i,
        'sparsha': /\bsparsha\b/i,
        'puja': /\bpuja\b/i,
        'sadhana': /\bsadhana\b/i,
        'diksha': /\bdiksha\b/i,
        'guru': /\bguru\b/i,
        'mantra': /\bmantra\b/i,
        'mudra': /\bmudra\b/i,
        'bandha': /\bbandha\b/i,
        'pranayama': /\bpranayama\b/i,

        // Forbidden Yoga Specific
        'forbidden yoga': /\bforbidden\s+yoga/i,
        'Andhakaara Path': /\b(andhakaara|andhakarra)\s+path/i,
        'mahavidyas': /\bmahavidya/i,
        'nityas': /\bnitya/i,
    };

    // Industry/Wellness terms (meaningful phrases only)
    const industryTerms = {
        'sexual wellness': /\bsexual\s+wellness/i,
        'luxury spa': /\bluxury\s+spa/i,
        'wellness retreat': /\bwellness\s+retreat/i,
        'tantric retreat': /\btantric?\s+retreat/i,
        'sensual bodywork': /\bsensual\s+bodywork/i,
        'shadow work': /\bshadow\s+work/i,
        'breathwork': /\bbreath\s*work/i,
        'somatic therapy': /\bsomatic\s+therap/i,
        'energy work': /\benergy\s+work/i,
        'sacred sexuality': /\bsacred\s+sex/i,
        'divine feminine': /\bdivine\s+feminine/i,
        'divine masculine': /\bdivine\s+masculine/i,
        'personal transformation': /\bpersonal\s+transform/i,
        'spiritual awakening': /\bspiritual\s+awaken/i,
        'consciousness exploration': /\bconsciousness\s+explor/i,
        'non-dual awareness': /\b(non.?dual|nondual)\s+aware/i,
        'embodied practice': /\bembodied\s+practice/i,
        'tantric practice': /\btantric?\s+practice/i,
    };

    // Combine all patterns
    const allPatterns = { ...sanskritTerms, ...industryTerms };

    // Check each pattern
    for (const [keyword, pattern] of Object.entries(allPatterns)) {
        if (pattern.test(text)) {
            keywords.add(keyword);
        }
    }

    // Convert to array and ensure uniqueness
    const keywordArray = Array.from(keywords);

    // Remove any that contain "the" or are fragments
    const cleanKeywords = keywordArray.filter(k =>
        !k.includes(' the ') &&
        k.length > 2 &&
        !k.match(/^\w{1,2}$/)
    );

    // Prioritize multi-word phrases, limit to 12-15
    const multiWord = cleanKeywords.filter(k => k.includes(' '));
    const singleWord = cleanKeywords.filter(k => !k.includes(' '));

    return [...multiWord.slice(0, 8), ...singleWord.slice(0, 7)];
}

// Extract metadata
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
    const keywords = extractMeaningfulKeywords(html, title, description);

    if (keywords.length === 0) {
        console.log(`  ⊘ ${file}: No keywords found`);
        return;
    }

    // Remove duplicates (case-insensitive)
    const uniqueKeywords = [];
    const seen = new Set();
    for (const kw of keywords) {
        const lower = kw.toLowerCase();
        if (!seen.has(lower)) {
            seen.add(lower);
            uniqueKeywords.push(kw);
        }
    }

    // Find and replace keyword cloud
    const keywordCloudRegex = /(<div class="keyword-cloud">)([\s\S]*?)(<\/div>\s*<\/div>)/;

    if (!keywordCloudRegex.test(html)) {
        console.log(`  ✗ ${file}: No keyword cloud found`);
        return;
    }

    const keywordTags = uniqueKeywords.map(keyword =>
        `            <span class="keyword-tag">${keyword}</span>`
    ).join('\n');

    html = html.replace(keywordCloudRegex, `$1\n${keywordTags}\n            $3`);

    fs.writeFileSync(filepath, html);
    updated++;
    console.log(`  ✓ ${file}: ${uniqueKeywords.length} keywords - ${uniqueKeywords.join(', ')}`);
});

console.log(`\n✓ Updated ${updated} blog posts with clean, meaningful keywords`);
