#!/usr/bin/env node
/**
 * Audit Spotify Audio Migration from Substack
 * Checks all blog posts for Spotify embeds
 */

const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const posts = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));

console.log('🎵 Spotify Audio Migration Audit');
console.log('='.repeat(60));
console.log();

const results = {
    withSpotify: [],
    withoutSpotify: [],
    total: 0
};

posts.forEach(filename => {
    const filepath = path.join(postsDir, filename);
    const content = fs.readFileSync(filepath, 'utf8');

    // Check for Spotify embeds
    const hasSpotify = /spotify\.com|open\.spotify/i.test(content);

    // Extract episode ID if present
    let episodeId = null;
    const spotifyMatch = content.match(/spotify\.com\/episode\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
        episodeId = spotifyMatch[1];
    }

    // Extract title
    const titleMatch = content.match(/<h1[^>]*class="[^"]*post-title[^"]*"[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : filename.replace('.html', '');

    results.total++;

    if (hasSpotify) {
        results.withSpotify.push({
            filename,
            title,
            episodeId,
            url: episodeId ? `https://open.spotify.com/episode/${episodeId}` : null
        });
    } else {
        results.withoutSpotify.push({
            filename,
            title
        });
    }
});

// Print results
console.log(`📊 Summary:`);
console.log(`   Total posts: ${results.total}`);
console.log(`   Posts with Spotify: ${results.withSpotify.length}`);
console.log(`   Posts without Spotify: ${results.withoutSpotify.length}`);
console.log();

if (results.withSpotify.length > 0) {
    console.log(`✅ Posts WITH Spotify Audio (${results.withSpotify.length}):`);
    console.log('─'.repeat(60));
    results.withSpotify.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   File: ${post.filename}`);
        if (post.episodeId) {
            console.log(`   Episode ID: ${post.episodeId}`);
            console.log(`   URL: ${post.url}`);
        }
        console.log();
    });
}

if (results.withoutSpotify.length > 0) {
    console.log(`❌ Posts WITHOUT Spotify Audio (${results.withoutSpotify.length}):`);
    console.log('─'.repeat(60));
    results.withoutSpotify.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   File: ${post.filename}`);
        console.log();
    });
}

// Save detailed report
const reportPath = './spotify-migration-audit.json';
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`📄 Detailed report saved to: ${reportPath}`);
console.log();

// Exit code based on results
if (results.withoutSpotify.length > 0) {
    console.log(`⚠️  WARNING: ${results.withoutSpotify.length} posts are missing Spotify audio!`);
    process.exit(1);
} else {
    console.log('✅ All posts have Spotify audio embedded!');
    process.exit(0);
}
