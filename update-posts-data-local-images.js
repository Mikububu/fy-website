const fs = require('fs');

// Read posts-data.json
const postsData = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));

// Update each post to use local image path
postsData.forEach(post => {
    if (post.image) {
        const ext = post.image.includes('.png') ? 'png' : 'jpg';
        post.image = `/blog-thumbnails/${post.slug}.${ext}`;
    }
});

// Write updated posts-data.json
fs.writeFileSync('posts-data.json', JSON.stringify(postsData, null, 2));

console.log(`✓ Updated ${postsData.length} posts with local image paths`);
