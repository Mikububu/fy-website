const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Curating UNIQUE, contextual keywords for each post...\n');

// Extract only the SPECIFIC terms mentioned in THIS post (not generic ones)
function extractUniqueKeywords(html, title) {
    const text = (html + ' ' + title).toLowerCase();
    const keywords = new Set();

    // Specific Sanskrit/tantric terms - only add if actually mentioned
    const specificTerms = {
        // Yogic psychology terms
        'chitta': /\bchitta\b/i,
        'manas': /\bmanas\b/i,
        'buddhi': /\bbuddhi\b/i,
        'ahamkara': /\bahamkara\b/i,
        'vaikrita': /\bvaikrita\b/i,
        'prathamika': /\bprathamika\b/i,
        'vrittis': /\bvritti?s?\b/i,
        'manonasha': /\b(mano.?nasha|manonasha)\b/i,
        'indriyas': /\bindriya[s]?\b/i,
        'jnanendriyas': /\bjnanendriya[s]?\b/i,
        'karmendriyas': /\bkarmendriya[s]?\b/i,

        // Elements & Energy
        'mahabhutas': /\bmahabhuta[s]?\b/i,
        'prana': /\bprana\b/i,
        'kundalini': /\bkundalini\b/i,
        'chakra': /\bchakra[s]?\b/i,
        'muladhara': /\bmuladhara\b/i,
        'svadhisthana': /\bsvadhisthana\b/i,
        'manipura': /\bmanipura\b/i,
        'anahata': /\banahata\b/i,
        'vishuddha': /\bvishuddha\b/i,
        'ajna': /\bajna\b/i,
        'sahasrara': /\bsahasrara\b/i,

        // Deities
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

        // Texts & Philosophy
        'Kularṇava Tantra': /\bkularnava.?tantra\b/i,
        'Vijñāna Bhairava': /\bvijnana.?bhairava\b/i,
        'Advaita Vedanta': /\badvaita.?vedanta\b/i,
        'Tantra Shastra': /\btantra.?shastra\b/i,
        'Yoga Sutras': /\byoga.?sutra[s]?\b/i,

        // Lineages & Paths
        'Vamachara': /\bvamachara\b/i,
        'Kaula': /\bkaula\b/i,
        'Krama': /\bkrama\b/i,
        'Trika': /\btrika\b/i,
        'Andhakaara': /\b(andhakaara|andhakarra)\b/i,

        // Specific Practices
        'sparsha puja': /\bsparsha.?puj/i,
        'nyasa': /\bnyasa\b/i,
        'kevala kumbhaka': /\bkevala.?kumbhaka\b/i,
        'vajroli mudra': /\bvajroli.?mudra\b/i,
        'yoni mudra': /\byoni.?mudra\b/i,
        'khechari mudra': /\bkhechari.?mudra\b/i,

        // Philosophical Concepts
        'prakriti': /\bprakriti\b/i,
        'purusha': /\bpurusha\b/i,
        'samadhi': /\bsamadhi\b/i,
        'turiya': /\bturiya\b/i,
        'moksha': /\bmoksha\b/i,
        'kaivalya': /\bkaivalya\b/i,

        // Only add broader terms if specifically discussed
        'non-dual awareness': /\b(non.?dual|nondual).?aware/i,
        'shadow work': /\bshadow.?work\b/i,
        'sexual wellness': /\bsexual.?wellness\b/i,
        'sensual bodywork': /\bsensual.?bodywork\b/i,
        'somatic therapy': /\bsomatic.?therap/i,
        'breathwork': /\bbreath.?work\b/i,
        'tantric massage': /\btantric.?massage\b/i,
        'sacred sexuality': /\bsacred.?sex/i,
        'divine feminine': /\bdivine.?feminine\b/i,
        'divine masculine': /\bdivine.?masculine\b/i,
        'wellness retreat': /\bwellness.?retreat\b/i,
        'luxury spa': /\bluxury.?spa\b/i,
        'tantric retreat': /\btantric?.?retreat\b/i,
        'relationship healing': /\brelationship.?heal/i,
        'intimacy coaching': /\bintimacy.?coach/i,
        'couples therapy': /\bcouples?.?therap/i,

        // Yoga Types - only if specifically discussed
        'kundalini yoga': /\bkundalini.?yoga\b/i,
        'kriya yoga': /\bkriya.?yoga\b/i,
        'raja yoga': /\braja.?yoga\b/i,
        'hatha yoga': /\bhatha.?yoga\b/i,
        'laya yoga': /\blaya.?yoga\b/i,
        'tantra yoga': /\btantra.?yoga\b/i,

        // Always relevant
        'forbidden yoga': /\bforbidden.?yoga\b/i,
        'transformation': /\btransform(ation|ative)\b/i,
    };

    // Count frequency to prioritize most mentioned terms
    const termFrequency = {};

    for (const [keyword, pattern] of Object.entries(specificTerms)) {
        const matches = text.match(new RegExp(pattern, 'gi'));
        if (matches && matches.length > 0) {
            termFrequency[keyword] = matches.length;
        }
    }

    // Sort by frequency and take top 12-15 most relevant
    const sortedTerms = Object.entries(termFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
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
    const keywords = extractUniqueKeywords(html, title);

    if (keywords.length === 0) {
        console.log(`  ⊘ ${file}: No unique keywords found`);
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

console.log(`\n✓ Updated ${updated} posts with unique, contextual keywords`);
