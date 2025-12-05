/**
 * Automated Substack Migration Script
 * Fetches all posts from RSS, scrapes content, downloads media, generates HTML
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  substackUrl: 'https://forbiddenyoga.substack.com',
  rssFeedUrl: 'https://forbiddenyoga.substack.com/feed',
  outputDir: './posts',
  imagesDir: './images/posts',
  delayBetweenPosts: [10000, 30000], // 10-30 seconds
  delayBetweenMedia: [30000, 60000], // 30-60 seconds
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
};

// Utility: Random delay
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utility: Sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility: Fetch URL
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': CONFIG.userAgent
      }
    };

    protocol.get(url, options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Utility: Parse XML (simple RSS parser)
function parseRssXml(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
    const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1],
        link: linkMatch[1],
        slug: linkMatch[1].split('/').pop(),
        date: dateMatch ? dateMatch[1] : '',
        description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').substring(0, 160) : ''
      });
    }
  }

  return items;
}

// Step 1: Fetch RSS Feed
async function fetchRssFeed() {
  console.log('📡 Fetching RSS feed...');

  try {
    const xml = await fetchUrl(CONFIG.rssFeedUrl);
    const posts = parseRssXml(xml);

    console.log(`✅ Found ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error('❌ Error fetching RSS:', error.message);
    throw error;
  }
}

// Step 2: Scrape Individual Post
async function scrapePost(post) {
  console.log(`\n📄 Scraping: ${post.title}`);
  console.log(`   URL: ${post.link}`);

  try {
    const html = await fetchUrl(post.link);

    // Extract main content (simplified)
    const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const content = contentMatch ? contentMatch[1] : '';

    // Extract images
    const images = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      images.push(imgMatch[1]);
    }

    // Extract JW Player videos
    const videos = [];
    const jwPlayerRegex = /cdn\.jwplayer\.com\/(?:players|manifests)\/([A-Za-z0-9]+)/gi;
    let videoMatch;
    while ((videoMatch = jwPlayerRegex.exec(content)) !== null) {
      videos.push({
        type: 'jwplayer',
        mediaId: videoMatch[1].replace('.m3u8', '')
      });
    }

    console.log(`   📷 Images: ${images.length}`);
    console.log(`   🎥 Videos: ${videos.length}`);

    return {
      ...post,
      content,
      images,
      videos
    };
  } catch (error) {
    console.error(`   ❌ Error scraping post: ${error.message}`);
    return null;
  }
}

// Step 3: Download image (stub - needs implementation)
async function downloadImage(url, localPath) {
  console.log(`   📥 Would download: ${url} → ${localPath}`);
  // TODO: Implement actual image download
  return true;
}

// Step 4: Process Media
async function processMedia(post) {
  console.log(`\n💾 Processing media for: ${post.title}`);

  const postImageDir = path.join(CONFIG.imagesDir, post.slug);

  // Create directory if needed
  if (!fs.existsSync(postImageDir)) {
    fs.mkdirSync(postImageDir, { recursive: true });
  }

  // Process images (download in real implementation)
  for (let i = 0; i < post.images.length; i++) {
    const imageUrl = post.images[i];
    const filename = `image-${i + 1}.jpg`;
    const localPath = path.join(postImageDir, filename);

    await downloadImage(imageUrl, localPath);

    // Update content to use local path
    post.content = post.content.replace(imageUrl, `/images/posts/${post.slug}/${filename}`);

    // Delay between downloads
    if (i < post.images.length - 1) {
      const delay = randomDelay(...CONFIG.delayBetweenMedia);
      console.log(`   ⏸️  Waiting ${Math.round(delay / 1000)}s...`);
      await sleep(delay);
    }
  }

  // Fix video embeds
  for (const video of post.videos) {
    if (video.type === 'jwplayer') {
      const correctEmbed = `https://cdn.jwplayer.com/players/${video.mediaId}-IxzuqJ4M.html`;
      console.log(`   🎥 Fixed JW Player embed: ${video.mediaId}`);

      // Replace any .m3u8 references with correct embed
      const badEmbed = `cdn.jwplayer.com/manifests/${video.mediaId}.m3u8`;
      post.content = post.content.replace(new RegExp(badEmbed, 'g'), correctEmbed);
    }
  }

  return post;
}

// Step 5: Generate HTML File
async function generateHtml(post) {
  console.log(`\n📝 Generating HTML for: ${post.title}`);

  const postDate = new Date(post.date);
  const formattedDate = postDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | Forbidden Yoga</title>
    <meta name="description" content="${post.description}">
    <link rel="stylesheet" href="../styles.css">
</head>
<body>
    <article class="post-container">
        <h1>${post.title}</h1>
        <div class="post-meta">
            <time>${formattedDate}</time>
        </div>
        <div class="post-content">
            ${post.content}
        </div>
        <a href="/#blog-section" class="back-link">← Back to all posts</a>
    </article>
</body>
</html>`;

  const outputPath = path.join(CONFIG.outputDir, `${post.slug}.html`);
  fs.writeFileSync(outputPath, template);

  console.log(`   ✅ Saved to: ${outputPath}`);
}

// Main execution
async function main() {
  console.log('🚀 Starting Automated Substack Migration\n');
  console.log('⚙️  Configuration:');
  console.log(`   Substack: ${CONFIG.substackUrl}`);
  console.log(`   Output: ${CONFIG.outputDir}`);
  console.log(`   Delays: ${CONFIG.delayBetweenPosts[0] / 1000}-${CONFIG.delayBetweenPosts[1] / 1000}s between posts\n`);

  // Create directories
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG.imagesDir)) {
    fs.mkdirSync(CONFIG.imagesDir, { recursive: true });
  }

  try {
    // Step 1: Fetch all posts from RSS
    const posts = await fetchRssFeed();

    // Limit for testing
    const testPosts = posts.slice(0, 3); // Only first 3 for testing

    const results = [];

    // Step 2-5: Process each post
    for (let i = 0; i < testPosts.length; i++) {
      const post = testPosts[i];

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 Processing post ${i + 1}/${testPosts.length}`);
      console.log('='.repeat(60));

      // Scrape post
      const scrapedPost = await scrapePost(post);
      if (!scrapedPost) {
        console.log('   ⚠️  Skipping due to error');
        continue;
      }

      // Process media
      const postWithMedia = await processMedia(scrapedPost);

      // Generate HTML
      await generateHtml(postWithMedia);

      results.push({
        slug: post.slug,
        title: post.title,
        url: `/posts/${post.slug}.html`,
        date: post.date,
        status: 'success'
      });

      // Delay before next post
      if (i < testPosts.length - 1) {
        const delay = randomDelay(...CONFIG.delayBetweenPosts);
        console.log(`\n⏸️  Waiting ${Math.round(delay / 1000)}s before next post...`);
        await sleep(delay);
      }
    }

    // Save results index
    fs.writeFileSync(
      'migration-results.json',
      JSON.stringify({
        posts: results,
        migrationDate: new Date().toISOString(),
        totalPosts: posts.length,
        processedPosts: testPosts.length
      }, null, 2)
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ MIGRATION TEST COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Results:`);
    console.log(`   Total posts found: ${posts.length}`);
    console.log(`   Processed (test): ${testPosts.length}`);
    console.log(`   Successful: ${results.length}`);
    console.log(`\n📄 Results saved to: migration-results.json`);
    console.log(`\n💡 To process all posts, remove the .slice(0, 3) limit in the code`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
