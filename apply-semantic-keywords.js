#!/usr/bin/env node
/**
 * Apply semantic keywords from generate-keywords.py to all blog posts
 * This restores the carefully curated keywords that were lost during restores
 */

const fs = require('fs');
const path = require('path');

// Read and parse keywords from Python file
const pyContent = fs.readFileSync('./generate-keywords.py', 'utf8');

// Extract POST_KEYWORDS dictionary
const postKeywords = {};
const regex = /"([^"]+)":\s*\[([\s\S]*?)\]/g;
let match;

while ((match = regex.exec(pyContent)) !== null) {
    const slug = match[1];
    const keywordsStr = match[2];

    // Extract individual keywords
    const keywords = [];
    const kwRegex = /"([^"]+)"/g;
    let kwMatch;
    while ((kwMatch = kwRegex.exec(keywordsStr)) !== null) {
        keywords.push(kwMatch[1]);
    }

    if (keywords.length > 0) {
        postKeywords[slug] = keywords;
    }
}

console.log(`Loaded ${Object.keys(postKeywords).length} post keyword definitions\n`);

const postsDir = './posts';
let updated = 0;
let skipped = 0;

// Process each post
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

files.forEach(file => {
    const slug = file.replace('.html', '');
    const filepath = path.join(postsDir, file);

    if (!postKeywords[slug]) {
        console.log(`  - ${slug}: No keywords defined, skipping`);
        skipped++;
        return;
    }

    let html = fs.readFileSync(filepath, 'utf8');
    const keywords = postKeywords[slug];

    // Build keyword HTML
    const keywordTags = keywords.map(kw =>
        `            <span class="keyword-tag clickable-keyword" data-keyword="${kw}">${kw}</span>`
    ).join('\n');

    // Replace keyword cloud content
    const keywordCloudRegex = /(<div class="keyword-cloud">)([\s\S]*?)(<\/div>\s*<\/div>)/;

    if (keywordCloudRegex.test(html)) {
        html = html.replace(keywordCloudRegex, `$1\n${keywordTags}\n            $3`);
        fs.writeFileSync(filepath, html);
        console.log(`  ✓ ${slug}: Applied ${keywords.length} keywords`);
        updated++;
    } else {
        // Need to add keyword section
        const backLinkPattern = /(\s*<a href="\/#blog-section" class="back-link">)/;

        if (backLinkPattern.test(html)) {
            const keywordSection = `
        <div class="post-keywords">
            <h3>Keywords</h3>
            <div class="keyword-cloud">
${keywordTags}
            </div>
        </div>
`;
            html = html.replace(backLinkPattern, keywordSection + '\n$1');
            fs.writeFileSync(filepath, html);
            console.log(`  ✓ ${slug}: Added keyword section with ${keywords.length} keywords`);
            updated++;
        } else {
            console.log(`  ✗ ${slug}: Could not find insertion point`);
            skipped++;
        }
    }
});

console.log(`\n✓ Updated ${updated} posts, skipped ${skipped}`);
console.log('\nNow run: node create-keyword-index.js && node build-keyword-frequency.js');
