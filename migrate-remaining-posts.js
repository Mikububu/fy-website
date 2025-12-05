/**
 * Migrate remaining posts from sitemap (posts not in RSS feed)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load already migrated posts
const existingResults = JSON.parse(fs.readFileSync('migration-results.json', 'utf8'));
const migratedSlugs = new Set(existingResults.posts.map(p => p.slug));

console.log(`📋 Already migrated: ${migratedSlugs.size} posts`);

// Fetch sitemap
console.log('📡 Fetching sitemap...');
const sitemap = execSync('curl -s "https://forbiddenyoga.substack.com/sitemap.xml"', { encoding: 'utf8' });

// Extract all post URLs
const urlMatches = sitemap.match(/<loc>(https:\/\/forbiddenyoga\.substack\.com\/p\/[^<]+)<\/loc>/g);
const allUrls = urlMatches.map(match => {
  const url = match.match(/<loc>([^<]+)<\/loc>/)[1];
  return {
    url,
    slug: url.split('/').pop()
  };
});

console.log(`✅ Found ${allUrls.length} total posts in sitemap`);

// Filter to only remaining posts
const remainingPosts = allUrls.filter(post => !migratedSlugs.has(post.slug));

console.log(`🔄 Need to migrate: ${remainingPosts.length} remaining posts\n`);

if (remainingPosts.length === 0) {
  console.log('✅ All posts already migrated!');
  process.exit(0);
}

// Use the migration functions from the main script
const { scrapePost, processMedia, generateHtml, sleep, randomDelay } = require('./migrate-substack-curl.js');

async function migrateRemainingPosts() {
  const CONFIG = {
    delayBetweenPosts: [10000, 30000]
  };

  const results = [];

  for (let i = 0; i < remainingPosts.length; i++) {
    const post = remainingPosts[i];

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Processing remaining post ${i + 1}/${remainingPosts.length}`);
    console.log('='.repeat(60));
    console.log(`   ${post.url}`);

    try {
      // Minimal post object
      const postObj = {
        title: post.slug.replace(/-/g, ' '),
        link: post.url,
        slug: post.slug,
        date: new Date().toISOString(),
        description: ''
      };

      // Scrape
      const html = execSync(`curl -sL "${post.url}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

      // Extract title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) {
        postObj.title = titleMatch[1].replace(' | Forbidden-Yoga.com', '').trim();
      }

      // Extract content
      const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      const content = contentMatch ? contentMatch[1] : '';

      // Extract images
      const images = [];
      const imgRegex = /<img[^>]+src="([^">]+)"/gi;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(content)) !== null) {
        images.push(imgMatch[1]);
      }

      // Extract videos
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

      // Fix video embeds
      let fixedContent = content;
      for (const video of videos) {
        const correctEmbed = `https://cdn.jwplayer.com/players/${video.mediaId}-IxzuqJ4M.html`;
        const badEmbed = `cdn.jwplayer.com/manifests/${video.mediaId}.m3u8`;
        fixedContent = fixedContent.replace(new RegExp(badEmbed, 'g'), correctEmbed);
      }

      // Generate HTML
      const postDate = new Date();
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
    <title>${postObj.title} | Forbidden Yoga</title>
    <meta name="description" content="">
    <link rel="stylesheet" href="../styles.css">
</head>
<body>
    <article class="post-container">
        <h1>${postObj.title}</h1>
        <div class="post-meta">
            <time>${formattedDate}</time>
        </div>
        <div class="post-content">
            ${fixedContent}
        </div>
        <a href="/#blog-section" class="back-link">← Back to all posts</a>
    </article>
</body>
</html>`;

      const outputPath = path.join('./posts', `${post.slug}.html`);
      fs.writeFileSync(outputPath, template);

      console.log(`   ✅ Saved to: ${outputPath}`);

      results.push({
        slug: post.slug,
        title: postObj.title,
        url: `/posts/${post.slug}.html`,
        date: postObj.date,
        status: 'success'
      });

      // Delay
      if (i < remainingPosts.length - 1) {
        const delay = Math.floor(Math.random() * (CONFIG.delayBetweenPosts[1] - CONFIG.delayBetweenPosts[0])) + CONFIG.delayBetweenPosts[0];
        console.log(`\n⏸️  Waiting ${Math.round(delay / 1000)}s before next post...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // Merge with existing results
  const allResults = [...existingResults.posts, ...results];
  fs.writeFileSync(
    'migration-results.json',
    JSON.stringify({
      posts: allResults,
      migrationDate: new Date().toISOString(),
      totalPosts: allResults.length,
      processedPosts: allResults.length
    }, null, 2)
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ REMAINING POSTS MIGRATION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📊 Results:`);
  console.log(`   Previously migrated: ${migratedSlugs.size}`);
  console.log(`   Newly migrated: ${results.length}`);
  console.log(`   Total posts: ${allResults.length}`);
  console.log(`\n📄 Results saved to: migration-results.json`);
}

migrateRemainingPosts().catch(console.error);
