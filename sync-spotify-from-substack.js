#!/usr/bin/env node
/**
 * Sync Spotify episodes from Substack to website
 * Checks each website post, fetches Substack version, and adds missing Spotify embeds
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { JSDOM } = require('jsdom');

const postsDir = './posts';
const substackBase = 'https://forbiddenyoga.substack.com/p/';

// Fetch URL content
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Extract Spotify episode ID from Substack HTML
function extractSpotifyFromSubstack(html) {
  const spotifyMatch = html.match(/spotify\.com\/embed\/episode\/([a-zA-Z0-9]+)/);
  return spotifyMatch ? spotifyMatch[1] : null;
}

// Check if website post already has Spotify
function hasSpotify(html) {
  return /spotify\.com\/embed\/episode/.test(html);
}

// Add Spotify iframe to website HTML
function addSpotifyToPost(html, episodeId) {
  const spotifyIframe = `
<p></p><iframe data-attrs="{\\"image\\":\\"https://i.scdn.co/image/ab6765630000ba8a9c74155d3d1ef72a5ee30b65\\",\\"title\\":\\"Episode Title\\",\\"subtitle\\":\\"Forbidden-Yoga.com\\",\\"description\\":\\"Episode\\",\\"url\\":\\"https://open.spotify.com/episode/${episodeId}\\",\\"belowTheFold\\":false,\\"noScroll\\":false}" src="https://open.spotify.com/embed/episode/${episodeId}" frameborder="0" gesture="media" allowfullscreen="true" allow="encrypted-media" data-component-name="Spotify2ToDOM" class="spotify-wrap podcast"></iframe><p></p>`;

  // Insert after first paragraph with "This essay was written"
  const introPattern = /(<p><span>This essay was written.*?<\/p>)/;

  if (introPattern.test(html)) {
    return html.replace(introPattern, `$1${spotifyIframe}`);
  }

  // Fallback: insert after first image
  const imagePattern = /(<\/figure><\/div>)/;
  if (imagePattern.test(html)) {
    return html.replace(imagePattern, `$1${spotifyIframe}`);
  }

  return null;
}

async function syncPost(filename) {
  const slug = filename.replace('.html', '');
  const websiteFile = path.join(postsDir, filename);
  const substackUrl = substackBase + slug;

  console.log(`\n📄 Checking: ${slug}`);

  // Read website HTML
  const websiteHtml = fs.readFileSync(websiteFile, 'utf8');

  // Check if already has Spotify
  if (hasSpotify(websiteHtml)) {
    console.log(`  ✅ Already has Spotify - skipping`);
    return { status: 'skip', slug };
  }

  // Fetch Substack version
  console.log(`  🌐 Fetching Substack...`);
  let substackHtml;
  try {
    substackHtml = await fetchUrl(substackUrl);
  } catch (error) {
    console.log(`  ⚠️  Substack not found or error: ${error.message}`);
    return { status: 'no_substack', slug };
  }

  // Extract Spotify from Substack
  const episodeId = extractSpotifyFromSubstack(substackHtml);

  if (!episodeId) {
    console.log(`  ℹ️  No Spotify on Substack`);
    return { status: 'no_spotify', slug };
  }

  console.log(`  🎵 Found Spotify: ${episodeId}`);

  // Add Spotify to website HTML
  const updatedHtml = addSpotifyToPost(websiteHtml, episodeId);

  if (!updatedHtml) {
    console.log(`  ❌ Could not find insertion point`);
    return { status: 'failed', slug, episodeId };
  }

  // Save updated HTML
  fs.writeFileSync(websiteFile, updatedHtml);
  console.log(`  ✅ MIGRATED: ${episodeId}`);

  return { status: 'migrated', slug, episodeId };
}

async function main() {
  console.log('🎵 Syncing Spotify from Substack to Website');
  console.log('='.repeat(60));

  // Get all website posts
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));

  const results = {
    migrated: [],
    skipped: [],
    noSpotify: [],
    noSubstack: [],
    failed: []
  };

  // Process each post
  for (const file of files) {
    const result = await syncPost(file);

    if (result.status === 'migrated') results.migrated.push(result);
    else if (result.status === 'skip') results.skipped.push(result);
    else if (result.status === 'no_spotify') results.noSpotify.push(result);
    else if (result.status === 'no_substack') results.noSubstack.push(result);
    else if (result.status === 'failed') results.failed.push(result);

    // Small delay to avoid hammering Substack
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total posts checked: ${files.length}`);
  console.log(`✅ Newly migrated: ${results.migrated.length}`);
  console.log(`⏭️  Already had Spotify: ${results.skipped.length}`);
  console.log(`ℹ️  No Spotify on Substack: ${results.noSpotify.length}`);
  console.log(`⚠️  No Substack version: ${results.noSubstack.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.migrated.length > 0) {
    console.log('\n🎉 Newly Migrated Posts:');
    console.log('-'.repeat(60));
    results.migrated.forEach(r => {
      console.log(`  • ${r.slug}`);
      console.log(`    Episode: ${r.episodeId}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Migrations (manual review needed):');
    console.log('-'.repeat(60));
    results.failed.forEach(r => {
      console.log(`  • ${r.slug}`);
      console.log(`    Episode: ${r.episodeId}`);
    });
  }
}

main().catch(console.error);
