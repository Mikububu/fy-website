/**
 * Download images from migrated posts and update HTML references
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🖼️  Starting image download for blog posts...\n');

// Load migration results
const results = JSON.parse(fs.readFileSync('migration-results.json', 'utf8'));
const posts = results.posts;

let totalImages = 0;
let downloadedImages = 0;
let errorCount = 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImagesForPost(post) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 Processing: ${post.title}`);
  console.log('='.repeat(60));

  const htmlPath = path.join('./posts', `${post.slug}.html`);

  if (!fs.existsSync(htmlPath)) {
    console.log('   ⚠️  HTML file not found, skipping');
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');

  // Find all Substack CDN images
  const imageRegex = /https:\/\/substackcdn\.com\/image\/fetch\/[^"'\s]+/g;
  const images = html.match(imageRegex) || [];

  console.log(`   📷 Found ${images.length} images`);
  totalImages += images.length;

  if (images.length === 0) return;

  // Create directory for this post's images
  const imageDir = path.join('./images/posts', post.slug);
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  for (let i = 0; i < images.length; i++) {
    const imageUrl = images[i];
    const ext = imageUrl.includes('.png') ? '.png' : '.jpg';
    const filename = `image-${i + 1}${ext}`;
    const localPath = path.join(imageDir, filename);
    const relativeUrl = `/images/posts/${post.slug}/${filename}`;

    try {
      console.log(`   📥 Downloading ${i + 1}/${images.length}...`);

      // Download image using curl
      execSync(`curl -sL "${imageUrl}" -o "${localPath}"`, {
        stdio: 'ignore',
        timeout: 30000
      });

      // Check if file was created
      if (fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        if (stats.size > 0) {
          console.log(`      ✅ Downloaded: ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);

          // Replace in HTML
          html = html.replace(imageUrl, relativeUrl);
          downloadedImages++;
        } else {
          console.log(`      ❌ Empty file, skipping`);
          fs.unlinkSync(localPath);
          errorCount++;
        }
      } else {
        console.log(`      ❌ Download failed`);
        errorCount++;
      }

      // Delay between downloads
      if (i < images.length - 1) {
        await sleep(1000); // 1 second between images
      }

    } catch (error) {
      console.log(`      ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  // Save updated HTML
  fs.writeFileSync(htmlPath, html);
  console.log(`   💾 Updated HTML with local image paths`);
}

async function main() {
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];

    await downloadImagesForPost(post);

    // Delay between posts
    if (i < posts.length - 1) {
      console.log(`\n⏸️  Waiting 2s before next post...`);
      await sleep(2000);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ IMAGE DOWNLOAD COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📊 Results:`);
  console.log(`   Total images found: ${totalImages}`);
  console.log(`   Successfully downloaded: ${downloadedImages}`);
  console.log(`   Errors/skipped: ${errorCount}`);
  console.log(`\n💾 All HTML files updated with local image paths`);
}

main().catch(console.error);
