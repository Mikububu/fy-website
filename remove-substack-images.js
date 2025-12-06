const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));

// Read posts-data.json to get local image paths
const postsData = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));
const imageMap = {};
postsData.forEach(post => {
    imageMap[post.slug] = post.image;
});

let updated = 0;
let errors = [];

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const slug = file.replace('.html', '');
    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;

    // Get local image path for this post
    const localImage = imageMap[slug] || '/blog-thumbnails/' + slug + '.jpg';
    const fullImageUrl = 'https://forbidden-yoga.com' + localImage;

    // Replace og:image meta tag
    const ogImagePattern = /<meta property="og:image" content="https:\/\/substackcdn\.com[^"]*">/;
    if (ogImagePattern.test(content)) {
        content = content.replace(
            ogImagePattern,
            `<meta property="og:image" content="${fullImageUrl}">`
        );
        changed = true;
    }

    // Replace twitter:image meta tag
    const twitterImagePattern = /<meta name="twitter:image" content="https:\/\/substackcdn\.com[^"]*">/;
    if (twitterImagePattern.test(content)) {
        content = content.replace(
            twitterImagePattern,
            `<meta name="twitter:image" content="${fullImageUrl}">`
        );
        changed = true;
    }

    // Replace structured data image
    const structuredDataPattern = /"image":\s*"https:\/\/substackcdn\.com[^"]*"/;
    if (structuredDataPattern.test(content)) {
        content = content.replace(
            structuredDataPattern,
            `"image": "${fullImageUrl}"`
        );
        changed = true;
    }

    // Replace any remaining substackcdn.com URLs in img tags
    const imgSubstackPattern = /src="https:\/\/substackcdn\.com[^"]*"/g;
    if (imgSubstackPattern.test(content)) {
        // For content images, we'll keep them for now (would need to download all)
        // Only replace if it's a clear meta/header image
        console.log(`  → Found Substack images in content: ${file}`);
    }

    if (changed) {
        fs.writeFileSync(filepath, content);
        updated++;
        console.log(`✓ Updated: ${file}`);
    } else {
        console.log(`  Already clean: ${file}`);
    }
});

console.log(`\n✓ Updated ${updated} posts`);
console.log(`  Skipped ${files.length - updated} posts (already clean)`);
if (errors.length > 0) {
    console.log(`\n✗ Errors:`);
    errors.forEach(err => console.log(`  ${err}`));
}
