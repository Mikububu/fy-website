const fs = require('fs');
const path = require('path');

// Read posts-data.json
const postsData = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));

console.log(`Total posts in posts-data.json: ${postsData.length}\n`);

const missing = [];
const existing = [];

postsData.forEach(post => {
    if (post.image) {
        // Extract filename from path like "/blog-thumbnails/tantra-online.jpg"
        const filename = post.image.replace('/blog-thumbnails/', '');
        const filepath = path.join('blog-thumbnails', filename);

        if (fs.existsSync(filepath)) {
            existing.push(filename);
        } else {
            missing.push({
                title: post.title,
                slug: post.slug,
                expectedFile: filename
            });
        }
    }
});

console.log(`✓ Found ${existing.length} thumbnails`);
console.log(`✗ Missing ${missing.length} thumbnails\n`);

if (missing.length > 0) {
    console.log('Missing thumbnails:');
    missing.forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   Expected: ${item.expectedFile}`);
        console.log(`   Slug: ${item.slug}\n`);
    });
}
