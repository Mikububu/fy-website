const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Extracting only RARE, UNIQUE, INTERESTING keywords...\n');

// Extract ONLY the rare, specific terms - NOT generic ones that appear everywhere
function extractRareKeywords(html, title) {
    const text = (html + ' ' + title).toLowerCase();
    const keywords = new Set();

    // ONLY specific, rare, interesting terms
    const rareTerms = {
        // Specific Sanskrit psychology (NOT generic)
        'chitta': /\bchitta\b/i,
        'manas': /\bmanas\b/i,
        'buddhi': /\bbuddhi\b/i,
        'ahamkara': /\bahamkara\b/i,
        'vaikrita': /\bvaikrita\b/i,
        'prathamika': /\bprathamika\b/i,
        'vrittis': /\bvritti?s?\b/i,
        'manonasha': /\b(mano.?nasha|manonasha)\b/i,

        // Specific sense organs
        'indriyas': /\bindriya[s]?\b/i,
        'jnanendriyas': /\bjnanendriya[s]?\b/i,
        'karmendriyas': /\bkarmendriya[s]?\b/i,

        // Specific elements
        'mahabhutas': /\bmahabhuta[s]?\b/i,
        'prakriti': /\bprakriti\b/i,
        'purusha': /\bpurusha\b/i,

        // Specific chakras (when main topic)
        'muladhara': /\bmuladhara\b/i,
        'svadhisthana': /\bsvadhisthana\b/i,
        'manipura': /\bmanipura\b/i,
        'anahata': /\banahata\b/i,
        'vishuddha': /\bvishuddha\b/i,
        'ajna': /\bajna\b/i,
        'sahasrara': /\bsahasrara\b/i,

        // Specific deities
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
        'Tripura Sundari': /\btripura.?sundari\b/i,

        // Specific texts
        'Kularṇava Tantra': /\bkularnava.?tantra\b/i,
        'Vijñāna Bhairava': /\bvijnana.?bhairava\b/i,
        'Tantra Shastra': /\btantra.?shastra\b/i,
        'Yoga Sutras': /\byoga.?sutra[s]?\b/i,

        // Specific lineages
        'Vamachara': /\bvamachara\b/i,
        'Kaula': /\bkaula\b/i,
        'Krama': /\bkrama\b/i,
        'Trika': /\btrika\b/i,
        'Andhakaara': /\b(andhakaara|andhakarra)\b/i,

        // Specific rare practices
        'sparsha puja': /\bsparsha.?puj/i,
        'nyasa': /\bnyasa\b/i,
        'kevala kumbhaka': /\bkevala.?kumbhaka\b/i,
        'vajroli mudra': /\bvajroli.?mudra\b/i,
        'yoni mudra': /\byoni.?mudra\b/i,
        'khechari mudra': /\bkhechari.?mudra\b/i,
        'shambhavi mudra': /\bshambhavi.?mudra\b/i,

        // Specific states
        'samadhi': /\bsamadhi\b/i,
        'turiya': /\bturiya\b/i,
        'moksha': /\bmoksha\b/i,
        'kaivalya': /\bkaivalya\b/i,

        // Specific industry terms (only when mentioned)
        'sexual wellness': /\bsexual.?wellness\b/i,
        'sensual bodywork': /\bsensual.?bodywork\b/i,
        'somatic therapy': /\bsomatic.?therap/i,
        'tantric massage': /\btantric.?massage\b/i,
        'luxury spa': /\bluxury.?spa\b/i,
        'wellness retreat': /\bwellness.?retreat\b/i,
        'tantric retreat': /\btantric?.?retreat\b/i,
        'intimacy coaching': /\bintimacy.?coach/i,
        'couples therapy': /\bcouples?.?therap/i,
        'shadow work': /\bshadow.?work\b/i,
        'divine feminine': /\bdivine.?feminine\b/i,
        'divine masculine': /\bdivine.?masculine\b/i,

        // Philosophical concepts
        'Advaita Vedanta': /\badvaita.?vedanta\b/i,
        'non-dual awareness': /\b(non.?dual|nondual).?aware/i,

        // Specific yoga types (only when focus)
        'kriya yoga': /\bkriya.?yoga\b/i,
        'raja yoga': /\braja.?yoga\b/i,
        'hatha yoga': /\bhatha.?yoga\b/i,
        'laya yoga': /\blaya.?yoga\b/i,

        // Meaningful concepts
        'transformation': /\btransform(ation|ative)\b/i,
        'kundalini awakening': /\bkundalini.?awaken/i,
        'breathwork': /\bbreath.?work\b/i,
    };

    // Count frequency
    const termFrequency = {};

    for (const [keyword, pattern] of Object.entries(rareTerms)) {
        const matches = text.match(new RegExp(pattern, 'gi'));
        if (matches && matches.length >= 2) { // Must appear at least 2 times to be relevant
            termFrequency[keyword] = matches.length;
        }
    }

    // Sort by frequency, take top 8-12 MOST mentioned
    const sortedTerms = Object.entries(termFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([term]) => term);

    return sortedTerms;
}

// Extract metadata
function extractMetadata(html) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    return { title: titleMatch ? titleMatch[1] : '' };
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    const { title } = extractMetadata(html);
    const keywords = extractRareKeywords(html, title);

    if (keywords.length === 0) {
        console.log(`  ⊘ ${file}: No unique keywords (too generic)`);
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
    console.log(`  ✓ ${file}: ${keywords.join(', ')}`);
});

console.log(`\n✓ Updated ${updated} posts with rare, interesting keywords`);
console.log('Note: Generic terms like "forbidden yoga", "kundalini", "tantra yoga" removed');
