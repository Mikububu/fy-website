const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'posts');

// Keywords to add if they appear in the post text
const keywordsToCheck = [
    'Nyasa',
    'Taoist',
    'Kundalini',
    'Shakti',
    'Tantra',
    'Chakra',
    'Prana',
    'Mantra',
    'Sadhana'
];

// Get all HTML files
const htmlFiles = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html');

console.log(`Checking ${htmlFiles.length} posts for missing keywords...\n`);

let totalAdded = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(postsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let addedKeywords = [];

    keywordsToCheck.forEach(keyword => {
        // Check if keyword appears in text (case-insensitive)
        const keywordRegex = new RegExp(keyword, 'i');
        const hasInText = keywordRegex.test(content);

        // Check if already tagged
        const tagRegex = new RegExp(`data-keyword="${keyword}"`, 'i');
        const hasTag = tagRegex.test(content);

        if (hasInText && !hasTag) {
            // Add keyword to keyword cloud
            const keywordTag = `            <span class="keyword-tag clickable-keyword" data-keyword="${keyword}">${keyword}</span>\n`;

            // Find the closing </div> of keyword-cloud
            const keywordCloudEndPattern = /(<div class="keyword-cloud">[\s\S]*?)(\s*<\/div>\s*<\/div>\s*(?:<section class="related-posts-grid">|<a[^>]*class="back-link"))/;

            if (keywordCloudEndPattern.test(content)) {
                content = content.replace(keywordCloudEndPattern, (match, before, after) => {
                    return before + keywordTag + '            </div>\n        </div>\n\n        ' + after.trim().replace(/^\s*<\/div>\s*<\/div>\s*/, '');
                });
                modified = true;
                addedKeywords.push(keyword);
            }
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`${file}: +${addedKeywords.join(', ')}`);
        totalAdded += addedKeywords.length;
    }
});

console.log(`\nTotal keywords added: ${totalAdded}`);
