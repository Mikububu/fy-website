/**
 * Generate posts-data.json from migration results with featured images
 */

const fs = require('fs');
const path = require('path');

console.log('📋 Generating posts-data.json...\n');

// Load migration results
const results = JSON.parse(fs.readFileSync('migration-results.json', 'utf8'));
const posts = results.posts;

const postsData = [];

posts.forEach((post, index) => {
  console.log(`${index + 1}/${posts.length} Processing: ${post.title}`);

  const htmlPath = path.join('./posts', `${post.slug}.html`);

  if (!fs.existsSync(htmlPath)) {
    console.log(`   ⚠️  HTML not found, skipping`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract description from meta tag or first paragraph
  let description = '';
  const metaMatch = html.match(/<meta name="description" content="([^"]+)"/);
  if (metaMatch) {
    description = metaMatch[1];
  } else {
    const pMatch = html.match(/<p[^>]*>([^<]{50,200})</);
    if (pMatch) {
      description = pMatch[1].substring(0, 160) + '...';
    }
  }

  // Find first local image in post
  let featuredImage = '';
  const imageMatch = html.match(/\/images\/posts\/[^"'\s]+\.(jpg|png)/);
  if (imageMatch) {
    featuredImage = imageMatch[0];
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
    date: displayDate,
    description: description || post.title,
    image: featuredImage
  });

  if (featuredImage) {
    console.log(`   ✅ Featured image: ${featuredImage}`);
  } else {
    console.log(`   ℹ️  No image found`);
  }
});

// Sort by date (newest first)
postsData.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write posts-data.json
fs.writeFileSync('posts-data.json', JSON.stringify(postsData, null, 2));

console.log(`\n✅ Generated posts-data.json with ${postsData.length} posts`);
console.log(`📄 File saved: posts-data.json`);
