/**
 * Generate posts-data.json WITH Substack CDN images for thumbnails
 */

const fs = require('fs');
const path = require('path');

console.log('📋 Generating posts-data.json with Substack images...\n');

const results = JSON.parse(fs.readFileSync('migration-results.json', 'utf8'));
const posts = results.posts;

const postsData = [];

posts.forEach((post, index) => {
  console.log(`${index + 1}/${posts.length} ${post.title}`);

  const htmlPath = path.join('./posts', `${post.slug}.html`);

  if (!fs.existsSync(htmlPath)) {
    console.log(`   ⚠️  HTML not found`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract description
  let description = '';
  const metaMatch = html.match(/<meta name="description" content="([^"]+)"/);
  if (metaMatch) {
    description = metaMatch[1];
  } else {
    const pMatch = html.match(/<p[^>]*>([^<]{50,200})</);
    if (pMatch) {
      description = pMatch[1].substring(0, 160).replace(/&[^;]+;/g, '') + '...';
    }
  }

  // Find first Substack CDN image (for thumbnail)
  let featuredImage = '';

  // Look for large content images (not avatars/icons)
  // Find images that are topImage or have width > 400
  const largeImageRegex = /https:\/\/substackcdn\.com\/image\/fetch\/[^"'\s]*_\d{3,4}x\d{3,4}\.(jpg|jpeg|png)/i;
  const imageMatch = html.match(largeImageRegex);

  if (imageMatch) {
    featuredImage = imageMatch[0];
    console.log(`   ✅ Image found`);
  } else {
    console.log(`   ℹ️  No image`);
  }

  // Format date
  let displayDate = post.date;
  if (displayDate && displayDate.includes('GMT')) {
    const parsedDate = new Date(displayDate);
    displayDate = parsedDate.toISOString();
  }

  postsData.push({
    title: post.title,
    slug: post.slug,
    url: `/posts/${post.slug}.html`,
    link: post.url, // Keep original Substack URL for mapping
    date: displayDate,
    description: description || post.title,
    image: featuredImage
  });
});

// Sort by date (newest first)
postsData.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write posts-data.json
fs.writeFileSync('posts-data.json', JSON.stringify(postsData, null, 2));

console.log(`\n✅ Generated posts-data.json with ${postsData.length} posts`);
console.log(`📄 File saved: posts-data.json`);

// Count posts with images
const withImages = postsData.filter(p => p.image).length;
console.log(`📷 Posts with images: ${withImages}/${postsData.length}`);
