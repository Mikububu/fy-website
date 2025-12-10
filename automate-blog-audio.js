#!/usr/bin/env node
/**
 * Blog Audio Automation System
 * Converts blog posts to audio narration and publishes to Spotify
 *
 * Usage:
 *   node automate-blog-audio.js posts/my-post.html
 *   node automate-blog-audio.js --all
 *   node automate-blog-audio.js --watch
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
require('dotenv').config();

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID, // David Attenborough voice
  SPOTIFY_PODCAST_ID: process.env.SPOTIFY_PODCAST_ID,
  SPOTIFY_ACCESS_TOKEN: process.env.SPOTIFY_ACCESS_TOKEN,

  AUDIO_OUTPUT_DIR: './audio-generated',
  MAX_TEXT_LENGTH: 50000, // ElevenLabs limit

  INTRO_TEXT: "This essay was written by Michael Perin Wogenburg and is narrated by a digital clone of David Attenborough created with Eleven Labs.",
  OUTRO_TEXT: "If you're interested in my project, don't hesitate to drop me a message."
};

// ============================================
// STEP 1: EXTRACT TEXT FROM BLOG POST
// ============================================

function extractBlogText(htmlFilePath) {
  console.log(`📖 Extracting text from: ${htmlFilePath}`);

  const html = fs.readFileSync(htmlFilePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Get title
  const titleElement = document.querySelector('h1.post-title, h1');
  const title = titleElement ? titleElement.textContent.trim() : 'Untitled';

  // Get subtitle if exists
  const subtitleElement = document.querySelector('h3.subtitle');
  const subtitle = subtitleElement ? subtitleElement.textContent.trim() : '';

  // Get main content
  const contentElement = document.querySelector('.available-content .body.markup');
  if (!contentElement) {
    throw new Error('Could not find blog content');
  }

  // Extract paragraphs and clean text
  const paragraphs = [];
  const walker = document.createTreeWalker(
    contentElement,
    dom.window.NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text.length > 0 && !isNavigationText(text)) {
      paragraphs.push(text);
    }
  }

  // Build final narration text
  const narrationParts = [
    title,
  ];

  if (subtitle) {
    narrationParts.push(subtitle);
  }

  narrationParts.push(CONFIG.INTRO_TEXT);
  narrationParts.push(...paragraphs);
  narrationParts.push(CONFIG.OUTRO_TEXT);

  const fullText = narrationParts.join('\n\n');

  console.log(`  ✅ Extracted ${fullText.length} characters`);
  console.log(`  📝 Title: ${title}`);

  return {
    title,
    subtitle,
    text: fullText,
    characterCount: fullText.length
  };
}

function isNavigationText(text) {
  const navigationPhrases = [
    'Back to all posts',
    'Like',
    'Share',
    'Subscribe',
    'View comments',
    'Previous',
    'Next',
    'Read more'
  ];

  return navigationPhrases.some(phrase => text.includes(phrase));
}

// ============================================
// STEP 2: GENERATE AUDIO WITH ELEVENLABS
// ============================================

async function generateAudio(text, title, outputPath) {
  console.log(`🎙️  Generating audio with ElevenLabs...`);

  if (!CONFIG.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not set in environment');
  }

  if (text.length > CONFIG.MAX_TEXT_LENGTH) {
    console.warn(`  ⚠️  Text is ${text.length} characters, exceeds limit. Truncating...`);
    text = text.substring(0, CONFIG.MAX_TEXT_LENGTH);
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${CONFIG.ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': CONFIG.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(audioBuffer);

  fs.writeFileSync(outputPath, buffer);

  const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`  ✅ Audio generated: ${outputPath} (${fileSizeMB} MB)`);

  return outputPath;
}

// ============================================
// STEP 3: UPLOAD TO SPOTIFY
// ============================================

async function uploadToSpotify(audioFilePath, metadata) {
  console.log(`📤 Uploading to Spotify...`);

  // NOTE: Spotify Podcasters (formerly Anchor) requires manual upload
  // or RSS feed integration. There's no direct API for uploading episodes.
  //
  // Options:
  // 1. Use Anchor API (if you have access)
  // 2. Upload via RSS feed
  // 3. Manual upload to Spotify Podcasters dashboard

  console.log(`  ℹ️  Spotify upload requires manual intervention or RSS feed`);
  console.log(`  📝 Episode metadata:`);
  console.log(`     Title: ${metadata.title}`);
  console.log(`     Audio: ${audioFilePath}`);
  console.log();
  console.log(`  📋 Next steps:`);
  console.log(`     1. Go to: https://podcasters.spotify.com`);
  console.log(`     2. Upload: ${audioFilePath}`);
  console.log(`     3. Set title: ${metadata.title}`);
  console.log(`     4. Publish episode`);
  console.log(`     5. Get episode ID from Spotify URL`);
  console.log(`     6. Run: node automate-blog-audio.js --embed <post-file> <episode-id>`);

  return {
    status: 'manual_upload_required',
    audioFile: audioFilePath,
    metadata
  };
}

// ============================================
// STEP 4: EMBED SPOTIFY IN BLOG POST
// ============================================

function embedSpotifyInBlog(htmlFilePath, episodeId) {
  console.log(`🔗 Embedding Spotify player in blog post...`);

  const html = fs.readFileSync(htmlFilePath, 'utf8');

  // Check if Spotify already embedded
  if (html.includes('spotify.com/embed/episode')) {
    console.log(`  ⚠️  Spotify player already embedded`);
    return false;
  }

  // Create Spotify iframe
  const spotifyIframe = `
<p></p><iframe data-attrs="{\\"image\\":\\"https://i.scdn.co/image/ab6765630000ba8a9c74155d3d1ef72a5ee30b65\\",\\"title\\":\\"Episode Title\\",\\"subtitle\\":\\"Forbidden-Yoga.com\\",\\"description\\":\\"Episode\\",\\"url\\":\\"https://open.spotify.com/episode/${episodeId}\\",\\"belowTheFold\\":false,\\"noScroll\\":false}" src="https://open.spotify.com/embed/episode/${episodeId}" frameborder="0" gesture="media" allowfullscreen="true" allow="encrypted-media" data-component-name="Spotify2ToDOM" class="spotify-wrap podcast"></iframe><p></p>`;

  // Insert after intro text (after first <p> with "This essay was written")
  const introPattern = /<p><span>This essay was written.*?<\/span>/;

  if (introPattern.test(html)) {
    const updatedHtml = html.replace(
      /(<p><span>This essay was written.*?<\/p>)/,
      `$1${spotifyIframe}`
    );

    fs.writeFileSync(htmlFilePath, updatedHtml);
    console.log(`  ✅ Spotify player embedded successfully`);
    return true;
  } else {
    console.error(`  ❌ Could not find intro text to insert Spotify player`);
    return false;
  }
}

// ============================================
// MAIN WORKFLOW
// ============================================

async function processPost(htmlFilePath, options = {}) {
  console.log();
  console.log('🎵 Blog Audio Automation');
  console.log('='.repeat(60));
  console.log();

  try {
    const filename = path.basename(htmlFilePath, '.html');
    const audioOutputPath = path.join(CONFIG.AUDIO_OUTPUT_DIR, `${filename}.mp3`);

    // Ensure audio output directory exists
    if (!fs.existsSync(CONFIG.AUDIO_OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.AUDIO_OUTPUT_DIR, { recursive: true });
    }

    // Step 1: Extract text
    const extracted = extractBlogText(htmlFilePath);

    if (options.textOnly) {
      console.log();
      console.log('📄 Extracted Text:');
      console.log('─'.repeat(60));
      console.log(extracted.text);
      return;
    }

    // Step 2: Generate audio
    if (!options.skipAudio) {
      await generateAudio(extracted.text, extracted.title, audioOutputPath);
    }

    // Step 3: Upload to Spotify (manual for now)
    const uploadResult = await uploadToSpotify(audioOutputPath, {
      title: extracted.title,
      subtitle: extracted.subtitle
    });

    console.log();
    console.log('✅ Processing complete!');
    console.log();

  } catch (error) {
    console.error();
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================
// CLI
// ============================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node automate-blog-audio.js <post-file.html>');
    console.log('  node automate-blog-audio.js --all');
    console.log('  node automate-blog-audio.js --embed <post-file> <episode-id>');
    console.log('  node automate-blog-audio.js --text-only <post-file>');
    process.exit(1);
  }

  // Embed Spotify in existing post
  if (args[0] === '--embed') {
    if (args.length < 3) {
      console.error('Usage: --embed <post-file> <episode-id>');
      process.exit(1);
    }

    const htmlFile = args[1];
    const episodeId = args[2];

    embedSpotifyInBlog(htmlFile, episodeId);
    return;
  }

  // Text extraction only
  if (args[0] === '--text-only') {
    await processPost(args[1], { textOnly: true });
    return;
  }

  // Process single post
  await processPost(args[0]);
}

main();
