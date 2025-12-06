const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Creating keyword index for clickable navigation...\n');

// Build index of all keywords and which posts they appear in
const keywordIndex = {};
const postMetadata = {};

// First pass: collect all keywords from all posts
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const html = fs.readFileSync(filepath, 'utf8');

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' | Forbidden Yoga', '') : file.replace('.html', '');

    // Extract keywords from the keyword cloud
    const keywordMatches = html.match(/<span class="keyword-tag">([^<]+)<\/span>/g);

    if (keywordMatches) {
        const keywords = keywordMatches.map(match =>
            match.replace(/<span class="keyword-tag">([^<]+)<\/span>/, '$1')
        );

        // Store post metadata
        postMetadata[file] = {
            title: title,
            slug: file.replace('.html', ''),
            keywords: keywords
        };

        // Index keywords
        keywords.forEach(keyword => {
            if (!keywordIndex[keyword]) {
                keywordIndex[keyword] = [];
            }
            keywordIndex[keyword].push(file);
        });
    }
});

// Filter: only keep keywords that appear in 2+ posts
const popularKeywords = {};
Object.entries(keywordIndex).forEach(([keyword, posts]) => {
    if (posts.length >= 2) {
        popularKeywords[keyword] = posts;
    }
});

console.log(`Found ${Object.keys(popularKeywords).length} keywords appearing in 2+ posts`);
console.log(`Total keywords before filtering: ${Object.keys(keywordIndex).length}\n`);

// Show top keywords by frequency
const sortedKeywords = Object.entries(popularKeywords)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20);

console.log('Top 20 most common keywords:');
sortedKeywords.forEach(([keyword, posts]) => {
    console.log(`  ${keyword}: ${posts.length} posts`);
});

// Save the index as JSON
const indexData = {
    keywords: popularKeywords,
    posts: postMetadata
};

fs.writeFileSync('keyword-index.json', JSON.stringify(indexData, null, 2));
console.log('\n✓ Created keyword-index.json');

// Now update all HTML files to make keywords clickable
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    const post = postMetadata[file];
    if (!post || !post.keywords) return;

    // Replace each keyword with clickable version
    post.keywords.forEach(keyword => {
        const isPopular = popularKeywords[keyword] && popularKeywords[keyword].length >= 2;

        if (isPopular) {
            // Make it clickable with data attribute
            const oldTag = `<span class="keyword-tag">${keyword}</span>`;
            const newTag = `<span class="keyword-tag clickable-keyword" data-keyword="${keyword.toLowerCase()}">${keyword}</span>`;
            html = html.replace(oldTag, newTag);
        }
    });

    fs.writeFileSync(filepath, html);
    updated++;
});

console.log(`✓ Updated ${updated} posts with clickable keywords`);
