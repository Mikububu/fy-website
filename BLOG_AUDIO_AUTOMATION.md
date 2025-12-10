# Blog Audio Automation System

## Overview

Automated pipeline to convert blog posts to audio narration and publish to Spotify:

```
Blog Post (HTML) → Extract Text → ElevenLabs API → Audio File → Spotify Upload → Auto-embed in Blog
```

## Architecture

### Components:

1. **Text Extractor** - Extracts clean text from blog post HTML
2. **ElevenLabs Generator** - Converts text to audio (David Attenborough voice)
3. **Spotify Publisher** - Uploads audio to Spotify podcast
4. **Blog Embedder** - Automatically embeds Spotify player in blog post
5. **Workflow Orchestrator** - Manages the entire pipeline

## Requirements

### API Keys Needed:

1. **ElevenLabs API Key** - For text-to-speech
   - Sign up: https://elevenlabs.io
   - Get API key from dashboard
   - Voice ID for David Attenborough clone

2. **Spotify for Podcasters API** (Anchor.fm)
   - Sign up: https://podcasters.spotify.com
   - Create podcast: "Forbidden Yoga"
   - Get API credentials

### Environment Variables:

```bash
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
SPOTIFY_PODCAST_ID=your_podcast_id_here
SPOTIFY_ACCESS_TOKEN=your_token_here
```

## Workflow Steps

### Step 1: Extract Text from Blog Post

```javascript
function extractBlogText(htmlFile) {
  // Parse HTML
  // Extract main content from .post-content
  // Remove HTML tags, keep only text
  // Clean up formatting
  // Add intro/outro
  return cleanText;
}
```

### Step 2: Generate Audio with ElevenLabs

```javascript
async function generateAudio(text, outputPath) {
  // Call ElevenLabs API
  // Use David Attenborough voice clone
  // Save MP3 file locally
  return audioFilePath;
}
```

### Step 3: Upload to Spotify

```javascript
async function uploadToSpotify(audioFile, metadata) {
  // Upload audio to Spotify Podcasters
  // Set episode title, description
  // Publish episode
  return { episodeId, embedUrl };
}
```

### Step 4: Auto-embed in Blog

```javascript
async function embedInBlog(htmlFile, spotifyEpisodeId) {
  // Parse blog HTML
  // Insert Spotify iframe after title
  // Save updated HTML
  return success;
}
```

## Usage

### Single Post:

```bash
node automate-blog-audio.js posts/my-new-post.html
```

### Batch Process:

```bash
node automate-blog-audio.js --all
```

### Watch Mode (Auto-process new posts):

```bash
node automate-blog-audio.js --watch
```

## Implementation Plan

### Phase 1: Manual Workflow (Today)
- Create scripts for each step
- Test with one blog post
- Verify audio quality
- Confirm Spotify upload works

### Phase 2: Semi-Automation (This Week)
- Create single command to run all steps
- Add error handling
- Create progress tracking

### Phase 3: Full Automation (Next Week)
- Watch for new blog posts
- Auto-generate and publish
- Send notification when complete

## Cost Estimation

### ElevenLabs:
- Free tier: 10,000 characters/month
- Creator tier: $22/month - 100,000 characters
- Average blog post: ~5,000 characters
- Cost per post: ~$1.10 (on Creator tier)

### Spotify:
- FREE (Spotify for Podcasters is free)

## Next Steps

1. Get ElevenLabs API key
2. Set up Spotify podcast
3. Create automation scripts
4. Test with one post
5. Deploy full automation

Do you want me to start building this now?
