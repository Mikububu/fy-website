const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const blogPostsJson = './blog-posts.json';
const thumbnailsDir = './blog-thumbnails';

console.log('Rebuilding blog-posts.json with all 43 real posts...\n');

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
const blogPosts = [];

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const html = fs.readFileSync(filepath, 'utf8');
    const slug = file.replace('.html', '');

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    let title = titleMatch ? titleMatch[1].replace(' | Forbidden Yoga', '').trim() : slug;

    // Extract meta description
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const description = descMatch ? descMatch[1] : '';

    // Extract published date
    const dateMatch = html.match(/<meta property="article:published_time" content="([^"]+)"/);
    let date = '';
    if (dateMatch) {
        const d = new Date(dateMatch[1]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        date = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    // Check for thumbnail in blog-thumbnails directory
    const possibleThumbnails = [
        `blog-thumbnails/${slug}.png`,
        `blog-thumbnails/${slug}.jpg`,
        `blog-thumbnails/${slug}.jpeg`,
        `blog-thumbnails/${slug}.webp`
    ];

    let thumbnail = '';
    for (const thumbPath of possibleThumbnails) {
        if (fs.existsSync(thumbPath)) {
            thumbnail = `/${thumbPath}`;
            break;
        }
    }

    // If no thumbnail found, try to extract first image from post
    if (!thumbnail) {
        const imgMatch = html.match(/<img[^>]+src="([^"]+blog-images[^"]+)"/);
        if (imgMatch) {
            thumbnail = imgMatch[1];
        }
    }

    blogPosts.push({
        title: title,
        description: description,
        slug: slug,
        link: `/posts/${slug}.html`,
        thumbnail: thumbnail,
        date: date
    });

    console.log(`  ✓ ${slug}`);
    console.log(`    Title: ${title}`);
    console.log(`    Thumbnail: ${thumbnail || 'MISSING'}`);
    console.log(`    Date: ${date}`);
});

// Sort by date (newest first)
blogPosts.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
});

// Write to blog-posts.json
fs.writeFileSync(blogPostsJson, JSON.stringify(blogPosts, null, 2));

console.log(`\n✓ Created blog-posts.json with ${blogPosts.length} posts`);

// Show posts with missing thumbnails
const missingThumbnails = blogPosts.filter(p => !p.thumbnail);
if (missingThumbnails.length > 0) {
    console.log(`\n⚠️  ${missingThumbnails.length} posts with MISSING thumbnails:`);
    missingThumbnails.forEach(p => console.log(`  - ${p.slug}`));
}
