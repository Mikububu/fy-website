#!/usr/bin/env node
/**
 * Sync semantic keywords to SEO meta tags and enhance JSON-LD structured data
 * This helps search engines AND AI systems understand content semantically
 */

const fs = require('fs');
const path = require('path');

const postsDir = './posts';
let updated = 0;
let skipped = 0;

// Process each post
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    // Extract semantic keywords from keyword-cloud
    const keywordCloudMatch = html.match(/<div class="keyword-cloud">([\s\S]*?)<\/div>/);
    if (!keywordCloudMatch) {
        console.log(`  - ${file}: No keyword-cloud found, skipping`);
        skipped++;
        return;
    }

    // Extract individual keywords from data-keyword attributes
    const keywordRegex = /data-keyword="([^"]+)"/g;
    const keywords = [];
    let match;
    while ((match = keywordRegex.exec(keywordCloudMatch[1])) !== null) {
        keywords.push(match[1]);
    }

    if (keywords.length === 0) {
        console.log(`  - ${file}: No keywords found in cloud, skipping`);
        skipped++;
        return;
    }

    let modified = false;

    // 1. Update meta keywords tag
    const metaKeywordsRegex = /<meta name="keywords" content="[^"]*">/;
    const newMetaKeywords = `<meta name="keywords" content="${keywords.join(', ')}">`;

    if (metaKeywordsRegex.test(html)) {
        const oldMeta = html.match(metaKeywordsRegex)[0];
        if (oldMeta !== newMetaKeywords) {
            html = html.replace(metaKeywordsRegex, newMetaKeywords);
            modified = true;
        }
    }

    // 2. Update JSON-LD structured data with keywords
    const jsonLdRegex = /<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/;
    const jsonLdMatch = html.match(jsonLdRegex);

    if (jsonLdMatch) {
        try {
            const jsonLd = JSON.parse(jsonLdMatch[1]);

            // Add keywords array to JSON-LD
            const oldKeywords = JSON.stringify(jsonLd.keywords || []);
            jsonLd.keywords = keywords;

            // Add article:tag for each keyword (helps AI systems)
            // Create about array for key concepts
            const aboutEntries = keywords.slice(0, 5).map(kw => ({
                "@type": "Thing",
                "name": kw
            }));

            if (aboutEntries.length > 0) {
                jsonLd.about = aboutEntries;
            }

            // Check if JSON-LD actually changed
            if (JSON.stringify(jsonLd.keywords) !== oldKeywords || !jsonLd.about) {
                const newJsonLd = JSON.stringify(jsonLd, null, 2);
                html = html.replace(jsonLdRegex, `<script type="application/ld+json">\n${newJsonLd}\n    </script>`);
                modified = true;
            }
        } catch (e) {
            console.log(`  ! ${file}: Could not parse JSON-LD: ${e.message}`);
        }
    }

    // 3. Add article:tag meta tags for Open Graph (helps social/AI systems)
    const ogTagsRegex = /<meta property="article:section"[^>]*>/;
    if (ogTagsRegex.test(html) && !html.includes('article:tag')) {
        const ogTags = keywords.slice(0, 5).map(kw =>
            `    <meta property="article:tag" content="${kw}">`
        ).join('\n');

        html = html.replace(ogTagsRegex, (match) => match + '\n' + ogTags);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filepath, html);
        console.log(`  ✓ ${file}: Synced ${keywords.length} semantic keywords to SEO`);
        updated++;
    } else {
        console.log(`  - ${file}: Already up to date`);
        skipped++;
    }
});

console.log(`\n✓ Updated ${updated} posts, skipped ${skipped}`);
console.log('\nSEO enhancements applied:');
console.log('  • Meta keywords synced with semantic keywords');
console.log('  • JSON-LD BlogPosting now includes keywords array');
console.log('  • JSON-LD "about" property added for top concepts');
console.log('  • Open Graph article:tag meta tags added');
console.log('\nThis helps:');
console.log('  • Search engines understand topical relevance');
console.log('  • AI systems extract structured knowledge');
console.log('  • Social platforms categorize content correctly');
