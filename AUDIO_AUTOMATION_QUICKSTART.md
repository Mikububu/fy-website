# Blog Audio Automation - Quick Start Guide

## Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install jsdom dotenv
```

### 2. Get ElevenLabs API Key

1. Go to: https://elevenlabs.io
2. Sign up for free account (10,000 chars/month free)
3. Get API key from: https://elevenlabs.io/app/settings
4. Get or create David Attenborough voice ID

### 3. Set Environment Variables

Copy the template:
```bash
cp .env.audio-automation .env
```

Edit `.env` and add your keys:
```bash
ELEVENLABS_API_KEY=sk_...your_key
ELEVENLABS_VOICE_ID=...your_voice_id
```

## Usage

### Test Text Extraction (No API calls)

```bash
node automate-blog-audio.js --text-only posts/run-away-from-tantra.html
```

This will show you exactly what text will be narrated.

### Generate Audio for One Post

```bash
node automate-blog-audio.js posts/run-away-from-tantra.html
```

This will:
1. Extract text from blog post
2. Generate audio with ElevenLabs
3. Save MP3 to `./audio-generated/`
4. Show you manual steps for Spotify upload

### Embed Spotify Player (After Manual Upload)

After you've uploaded to Spotify and have the episode ID:

```bash
node automate-blog-audio.js --embed posts/run-away-from-tantra.html 4ziiwrGOokjfLkArbESZWJ
```

This automatically inserts the Spotify player into your blog post.

## Workflow

### Complete Process for New Blog Post:

1. **Write blog post** in your editor

2. **Generate audio:**
   ```bash
   node automate-blog-audio.js posts/my-new-post.html
   ```

3. **Upload to Spotify:**
   - Go to: https://podcasters.spotify.com
   - Upload the MP3 from `./audio-generated/my-new-post.mp3`
   - Set title and description
   - Publish episode

4. **Auto-embed player:**
   ```bash
   node automate-blog-audio.js --embed posts/my-new-post.html <episode-id>
   ```

5. **Deploy blog:**
   ```bash
   git add posts/my-new-post.html
   git commit -m "Add audio narration to post"
   git push
   ```

Done! Your blog post now has audio narration.

## Cost

### ElevenLabs Pricing:
- **Free tier:** 10,000 characters/month
- **Starter:** $5/month - 30,000 characters
- **Creator:** $22/month - 100,000 characters

Average blog post: ~5,000 characters
- Free tier: 2 posts/month
- Creator tier: 20 posts/month

### Spotify:
- **FREE** (Spotify for Podcasters is free)

## Automation (Future)

### Batch Process All Posts:

```bash
# Process all posts without audio
for file in posts/*.html; do
  if ! grep -q "spotify.com/embed" "$file"; then
    node automate-blog-audio.js "$file"
  fi
done
```

### Watch Mode (Coming Soon):

```bash
node automate-blog-audio.js --watch
```

Automatically processes new blog posts as you create them.

## Troubleshooting

### "ELEVENLABS_API_KEY not set"
- Make sure you copied `.env.audio-automation` to `.env`
- Check that your API key is correct

### Audio quality issues
- Adjust voice settings in code
- Try different voice models
- Check text extraction is clean

### Spotify upload fails
- Currently manual upload required
- Future: RSS feed automation

## Next Steps

1. ✅ Test text extraction with your posts
2. ✅ Generate one audio file
3. ✅ Upload to Spotify manually
4. ✅ Auto-embed player
5. 🔄 Build RSS feed automation (optional)
6. 🔄 Create watch mode for new posts (optional)

Ready to try it?
