const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://forbidden-yoga.com';
const AVATAR_IMAGE_ID = '10275e41-1116-4dd0-a1c5-e98a7d7ae090'; // The avatar image to skip
const DEFAULT_IMAGE = `${SITE_URL}/images/Bali%20Tantra%20Retreat%201.jpg`; // Fallback image

// Extract the first proper content image from a post
function extractContentImage(html) {
  // Match S3 image URLs - capture just the ID and dimensions
  const s3Pattern = /substack-post-media\.s3\.amazonaws\.com\/public\/images\/([a-f0-9\-]+_\d+x\d+)\.(jpeg|jpg|png|webp)/gi;

  const matches = [...html.matchAll(s3Pattern)];

  for (const match of matches) {
    const imageId = match[1];
    const extension = match[2];

    // Skip the avatar image
    if (imageId.includes(AVATAR_IMAGE_ID)) continue;

    // Skip very small images
    const dimensionMatch = imageId.match(/_(\d+)x(\d+)$/);
    if (dimensionMatch) {
      const width = parseInt(dimensionMatch[1]);
      const height = parseInt(dimensionMatch[2]);
      if (width < 200 && height < 200) continue;
    }

    // Build the Substack CDN URL with proper encoding
    const s3Url = `https://substack-post-media.s3.amazonaws.com/public/images/${imageId}.${extension}`;
    const encodedS3Url = encodeURIComponent(s3Url);
    return `https://substackcdn.com/image/fetch/w_1200,h_630,c_fill,f_auto,q_auto:good,fl_progressive:steep/${encodedS3Url}`;
  }

  return null;
}

// Update posts-data.json with correct images
function updatePostsData() {
  const postsData = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));
  const postsDir = './posts';
  let updated = 0;

  postsData.forEach(post => {
    const slug = post.slug;
    const htmlPath = path.join(postsDir, `${slug}.html`);

    if (!fs.existsSync(htmlPath)) {
      console.log(`Skipping ${slug} - HTML file not found`);
      return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const contentImage = extractContentImage(html);

    if (contentImage) {
      // Check if current image needs updating
      const hasAvatarImage = post.image && post.image.includes(AVATAR_IMAGE_ID);
      const hasSmallImage = post.image && post.image.includes('w_36,h_36');
      const hasBadUrl = post.image && (post.image.includes('$s_!') || post.image.endsWith('/png') || post.image.endsWith('/jpeg'));

      if (hasAvatarImage || hasSmallImage || hasBadUrl || !post.image) {
        console.log(`Updating ${slug}`);
        post.image = contentImage;
        updated++;
      }
    } else if (!post.image || post.image.includes(AVATAR_IMAGE_ID) || post.image.includes('$s_!')) {
      console.log(`${slug}: No content image found, using default`);
      post.image = DEFAULT_IMAGE;
      updated++;
    }
  });

  // Save updated posts-data.json
  fs.writeFileSync('posts-data.json', JSON.stringify(postsData, null, 2));
  console.log(`\nUpdated ${updated} posts in posts-data.json`);

  return postsData;
}

// Update SEO tags in HTML files to use correct images
function updateHtmlSeoImages(postsData) {
  const postsDir = './posts';
  let updated = 0;

  postsData.forEach(post => {
    const slug = post.slug;
    const htmlPath = path.join(postsDir, `${slug}.html`);

    if (!fs.existsSync(htmlPath)) return;

    let html = fs.readFileSync(htmlPath, 'utf8');
    const newImage = post.image;

    if (!newImage) return;

    // Check if we need to update (current SEO image is bad)
    const needsUpdate = html.includes(AVATAR_IMAGE_ID) ||
                       html.includes('w_36,h_36') ||
                       html.includes('$s_!');

    if (!needsUpdate) return;

    // Escape the image URL for use in replacement
    const escapedImage = newImage.replace(/\$/g, '$$$$');

    // Update og:image
    html = html.replace(
      /<meta property="og:image" content="[^"]*">/,
      `<meta property="og:image" content="${escapedImage}">`
    );

    // Update twitter:image
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*">/,
      `<meta name="twitter:image" content="${escapedImage}">`
    );

    // Update structured data image - match carefully to avoid breaking JSON
    html = html.replace(
      /("image":\s*")[^"]*(")/,
      `$1${escapedImage}$2`
    );

    fs.writeFileSync(htmlPath, html);
    updated++;
    console.log(`Updated SEO images in ${slug}.html`);
  });

  console.log(`\nUpdated SEO tags in ${updated} HTML files`);
}

// Run
console.log('=== Fixing Thumbnail Images ===\n');
const postsData = updatePostsData();
console.log('\n=== Updating HTML SEO Tags ===\n');
updateHtmlSeoImages(postsData);
console.log('\nDone!');
