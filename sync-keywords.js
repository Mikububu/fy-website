const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'posts');

// Keywords to check - if text contains the pattern, add the keyword
const keywordMappings = [
    { pattern: /\bnyasa\b/i, keyword: 'Nyasa' },
    { pattern: /\btaoist\b/i, keyword: 'Taoist' },
    { pattern: /\bsadhana\b|sādhana/i, keyword: 'Sadhana' },
    { pattern: /\bupasana\b|upāsanā/i, keyword: 'Upasana' },
    { pattern: /\britual\b/i, keyword: 'Ritual' },
    { pattern: /\bpuja\b|\bpūjā\b|\bpooja\b/i, keyword: 'Puja' },
    { pattern: /\bkundalini\b|kuṇḍalinī/i, keyword: 'Kundalini' },
    { pattern: /\bshakti\b|śakti/i, keyword: 'Shakti' },
    { pattern: /\btantra\b/i, keyword: 'Tantra' },
    { pattern: /\bchakra\b/i, keyword: 'Chakra' },
    { pattern: /\bmantra\b/i, keyword: 'Mantra' },
    { pattern: /\bprana\b|prāṇa/i, keyword: 'Prana' },
];

const htmlFiles = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html');

console.log(`Processing ${htmlFiles.length} posts...\n`);

let totalAdded = 0;
const summary = {};

htmlFiles.forEach(file => {
    const filePath = path.join(postsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const addedHere = [];

    keywordMappings.forEach(({ pattern, keyword }) => {
        // Check if keyword appears in post content (not just in keyword cloud)
        const postContent = content.split('keyword-cloud')[0]; // Only check actual content
        const hasInText = pattern.test(postContent);

        // Check if already tagged (exact match)
        const hasTag = new RegExp(`data-keyword="${keyword}"`, 'i').test(content);

        if (hasInText && !hasTag) {
            // Find the last keyword tag before </div></div> in keyword-cloud
            const keywordCloudMatch = content.match(/(<div class="keyword-cloud">[\s\S]*?)(\s*<\/div>\s*<\/div>\s*(?:<section|<a))/);

            if (keywordCloudMatch) {
                const keywordTag = `\n            <span class="keyword-tag clickable-keyword" data-keyword="${keyword}">${keyword}</span>`;
                const beforeClose = keywordCloudMatch[1];
                const afterClose = keywordCloudMatch[2];

                // Find last </span> in keyword cloud and add after it
                const lastSpanIndex = beforeClose.lastIndexOf('</span>');
                if (lastSpanIndex !== -1) {
                    const newBefore = beforeClose.slice(0, lastSpanIndex + 7) + keywordTag + beforeClose.slice(lastSpanIndex + 7);
                    content = content.replace(keywordCloudMatch[0], newBefore + afterClose);
                    modified = true;
                    addedHere.push(keyword);

                    if (!summary[keyword]) summary[keyword] = [];
                    summary[keyword].push(file);
                }
            }
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`${file}: +${addedHere.join(', ')}`);
        totalAdded += addedHere.length;
    }
});

console.log(`\n=== Summary ===`);
console.log(`Total keywords added: ${totalAdded}`);
Object.entries(summary).forEach(([keyword, files]) => {
    console.log(`${keyword}: added to ${files.length} posts`);
});
