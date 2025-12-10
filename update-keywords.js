const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'posts');

// Step 1: Count keyword occurrences across all posts
const keywordCounts = new Map();
const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));

console.log(`Found ${postFiles.length} blog posts`);

// Extract keywords from all posts
postFiles.forEach(filename => {
    const filePath = path.join(postsDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find all data-keyword attributes
    const keywordRegex = /data-keyword="([^"]+)"/g;
    let match;

    while ((match = keywordRegex.exec(content)) !== null) {
        const keyword = match[1];
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    }
});

console.log('\nKeyword occurrence counts:');
const sortedKeywords = Array.from(keywordCounts.entries()).sort((a, b) => b[1] - a[1]);
sortedKeywords.forEach(([keyword, count]) => {
    console.log(`  ${keyword}: ${count} occurrence${count > 1 ? 's' : ''}`);
});

// Step 2: Update each post
let updatedPosts = 0;
postFiles.forEach(filename => {
    const filePath = path.join(postsDir, filename);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Find all keyword tags and update their classes
    const keywordTagRegex = /<span class="keyword-tag(?: clickable-keyword)?" data-keyword="([^"]+)">([^<]+)<\/span>/g;

    content = content.replace(keywordTagRegex, (match, keyword, text) => {
        const count = keywordCounts.get(keyword) || 0;
        const shouldBeClickable = count >= 2;
        const isCurrentlyClickable = match.includes('clickable-keyword');

        if (shouldBeClickable && !isCurrentlyClickable) {
            modified = true;
            return `<span class="keyword-tag clickable-keyword" data-keyword="${keyword}">${text}</span>`;
        } else if (!shouldBeClickable && isCurrentlyClickable) {
            modified = true;
            return `<span class="keyword-tag" data-keyword="${keyword}">${text}</span>`;
        }

        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        updatedPosts++;
        console.log(`\nUpdated: ${filename}`);
    }
});

console.log(`\n✓ Done! Updated ${updatedPosts} post(s).`);
console.log(`\nKeywords with 2+ occurrences (clickable):`);
sortedKeywords.filter(([_, count]) => count >= 2).forEach(([keyword, count]) => {
    console.log(`  • ${keyword} (${count} posts)`);
});
