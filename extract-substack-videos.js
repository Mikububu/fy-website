/**
 * Extract and catalog all video embeds from Substack posts
 * Finds: JW Player, YouTube, Vimeo, Spotify audio, etc.
 */

const fs = require('fs');
const path = require('path');

console.log('🎥 Extracting video embeds from posts...\n');

const results = JSON.parse(fs.readFileSync('migration-results.json', 'utf8'));
const posts = results.posts;

const videoData = [];

posts.forEach((post, index) => {
  const htmlPath = path.join('./posts', `${post.slug}.html`);

  if (!fs.existsSync(htmlPath)) {
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Find all video/audio embeds
  const videos = [];

  // JW Player
  const jwPlayerRegex = /cdn\.jwplayer\.com\/(?:players|manifests)\/([A-Za-z0-9-]+)/g;
  let match;
  while ((match = jwPlayerRegex.exec(html)) !== null) {
    videos.push({
      type: 'jwplayer',
      id: match[1],
      url: `https://cdn.jwplayer.com/players/${match[1]}-IxzuqJ4M.html`
    });
  }

  // YouTube
  const youtubeRegex = /youtube\.com\/embed\/([A-Za-z0-9_-]+)/g;
  while ((match = youtubeRegex.exec(html)) !== null) {
    videos.push({
      type: 'youtube',
      id: match[1],
      url: `https://www.youtube.com/embed/${match[1]}`
    });
  }

  // Vimeo
  const vimeoRegex = /player\.vimeo\.com\/video\/(\d+)/g;
  while ((match = vimeoRegex.exec(html)) !== null) {
    videos.push({
      type: 'vimeo',
      id: match[1],
      url: `https://player.vimeo.com/video/${match[1]}`
    });
  }

  // Spotify
  const spotifyRegex = /open\.spotify\.com\/embed\/(episode|track|album)\/([A-Za-z0-9]+)/g;
  while ((match = spotifyRegex.exec(html)) !== null) {
    videos.push({
      type: 'spotify',
      id: match[2],
      url: `https://open.spotify.com/embed/${match[1]}/${match[2]}`
    });
  }

  // Substack audio
  const substackAudioRegex = /<audio src="([^"]+)"/g;
  while ((match = substackAudioRegex.exec(html)) !== null) {
    videos.push({
      type: 'substack-audio',
      url: match[1]
    });
  }

  if (videos.length > 0) {
    console.log(`${index + 1}. ${post.title}`);
    videos.forEach(v => {
      console.log(`   📹 ${v.type}: ${v.url}`);
    });
    console.log('');

    videoData.push({
      slug: post.slug,
      title: post.title,
      videos: videos
    });
  }
});

// Save results
fs.writeFileSync('video-catalog.json', JSON.stringify(videoData, null, 2));

console.log(`\n✅ Found videos in ${videoData.length} posts`);
console.log(`📄 Catalog saved to: video-catalog.json`);
