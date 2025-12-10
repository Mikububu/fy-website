# Spotify Integration Guide for Blog Audio Automation

## Understanding Spotify APIs

There are **two different Spotify systems** with different APIs:

### 1. Spotify Web API (What You Have Now)
**Your Credentials:**
- Client ID: `63972a490a7e4268944acaead115b986`
- Client Secret: `315eaddd95604d31a31418a69507699c`

**What It Does:**
- Search for music/podcasts
- Get user playlists
- Play tracks
- Get podcast metadata

**What It CANNOT Do:**
- ❌ Upload podcast episodes
- ❌ Create podcast episodes
- ❌ Publish to your podcast

### 2. Spotify for Podcasters (What You Need)
**Access:** https://podcasters.spotify.com

**What It Does:**
- ✅ Upload podcast episodes
- ✅ Publish episodes
- ✅ Manage your podcast
- ✅ Get episode analytics

**The Problem:**
- No official API for uploading episodes
- Must use manual upload or RSS feed

---

## Three Options for Spotify Integration

### Option 1: Manual Upload (Recommended for Now)
**How It Works:**
1. Script generates MP3 file
2. You manually upload to Spotify Podcasters dashboard
3. Script auto-embeds player in blog post

**Pros:**
- ✅ Works immediately
- ✅ No additional setup
- ✅ Simple and reliable

**Cons:**
- ❌ Manual step required (2 minutes per episode)

**Workflow:**
```bash
# 1. Generate audio
node automate-blog-audio.js posts/my-post.html

# 2. Manually upload to Spotify
# Go to: https://podcasters.spotify.com
# Upload: ./audio-generated/my-post.mp3

# 3. Auto-embed in blog
node automate-blog-audio.js --embed posts/my-post.html <episode-id>
```

---

### Option 2: RSS Feed Integration (Fully Automated)
**How It Works:**
1. Create RSS podcast feed on your server
2. Script generates MP3 and updates RSS feed
3. Spotify automatically pulls new episodes from RSS
4. Script auto-embeds player in blog post

**Pros:**
- ✅ Fully automated
- ✅ Industry standard
- ✅ Works with all podcast platforms (Apple, Google, etc.)

**Cons:**
- ❌ Requires RSS feed setup
- ❌ Episodes take 15-60 minutes to appear on Spotify

**What You Need:**
1. Create RSS feed file (podcast.xml)
2. Host MP3 files on your server
3. Submit RSS feed to Spotify for Podcasters
4. Spotify checks RSS feed every hour for new episodes

**Implementation:**
```javascript
// 1. Generate MP3
await generateAudio(text, title, outputPath);

// 2. Upload MP3 to server
await uploadMp3ToServer(outputPath);

// 3. Add episode to RSS feed
await addToRssFeed({
  title: metadata.title,
  description: metadata.subtitle,
  audioUrl: `https://forbidden-yoga.com/audio/${filename}.mp3`,
  pubDate: new Date()
});

// 4. Spotify auto-syncs from RSS within 1 hour
// 5. Auto-embed when episode appears
```

---

### Option 3: Anchor API (If Available)
**How It Works:**
1. Use unofficial Anchor API
2. Script uploads directly to Anchor/Spotify

**Pros:**
- ✅ Fully automated
- ✅ Immediate publishing

**Cons:**
- ❌ Unofficial API (could break)
- ❌ May violate terms of service
- ❌ Requires authentication flow

**Not Recommended:** Unstable and unofficial

---

## Recommended Approach: Start with Option 1, Migrate to Option 2

### Phase 1: Manual Upload (Today)
Use current script with manual Spotify upload. This gets you up and running immediately.

**Time per post:** 5 minutes
- 1 minute: Generate audio
- 2 minutes: Upload to Spotify
- 2 minutes: Get episode ID and embed

### Phase 2: RSS Feed (Next Week)
Build RSS feed system for full automation.

**Time per post:** 30 seconds
- 30 seconds: Run script (generates audio, updates RSS, embeds player)
- Spotify auto-syncs within 1 hour

---

## Setting Up RSS Feed Integration (Option 2)

### Step 1: Create RSS Feed Structure

Create `podcast.xml` in your root directory:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Forbidden Yoga</title>
    <link>https://forbidden-yoga.com</link>
    <language>en-us</language>
    <description>Essays on Tantra, sensual liberation, and forbidden wisdom</description>

    <itunes:author>Michael Perin Wogenburg</itunes:author>
    <itunes:owner>
      <itunes:email>your-email@forbidden-yoga.com</itunes:email>
      <itunes:name>Michael Perin Wogenburg</itunes:name>
    </itunes:owner>
    <itunes:image href="https://forbidden-yoga.com/podcast-artwork.jpg"/>
    <itunes:category text="Religion &amp; Spirituality">
      <itunes:category text="Spirituality"/>
    </itunes:category>

    <!-- Episodes will be added here -->

  </channel>
</rss>
```

### Step 2: Host MP3 Files

Create `/audio/` directory on your server:
```bash
mkdir -p /path/to/website/audio
```

Configure Netlify to serve MP3 files:
```toml
# netlify.toml
[[headers]]
  for = "/audio/*"
  [headers.values]
    Content-Type = "audio/mpeg"
    Cache-Control = "public, max-age=31536000"
```

### Step 3: Update Script to Add RSS Entries

Add this function to `automate-blog-audio.js`:

```javascript
function addEpisodeToRss(metadata, mp3Url) {
  const rssPath = './podcast.xml';
  const xml = fs.readFileSync(rssPath, 'utf8');

  const episodeItem = `
    <item>
      <title>${metadata.title}</title>
      <description>${metadata.subtitle || metadata.title}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <enclosure url="${mp3Url}" type="audio/mpeg" length="${metadata.fileSize}"/>
      <guid isPermaLink="false">${metadata.guid}</guid>
      <itunes:duration>${metadata.duration}</itunes:duration>
    </item>
  `;

  const updatedXml = xml.replace('</channel>', `${episodeItem}\n  </channel>`);
  fs.writeFileSync(rssPath, updatedXml);
}
```

### Step 4: Submit RSS Feed to Spotify

1. Go to: https://podcasters.spotify.com
2. Click "Add Your Podcast"
3. Enter RSS feed URL: `https://forbidden-yoga.com/podcast.xml`
4. Spotify validates and imports your podcast
5. Future episodes auto-sync from RSS

---

## Current Status

**Installed:**
- ✅ ElevenLabs integration (needs API key)
- ✅ Text extraction from blog posts
- ✅ Auto-embed Spotify player

**Not Installed:**
- ⏸️ Spotify upload (manual for now)
- ⏸️ RSS feed generation (future enhancement)

**Next Steps:**
1. Get ElevenLabs API key and voice ID
2. Test audio generation with one post
3. Manual upload to Spotify
4. Test auto-embed functionality
5. Consider RSS feed integration for full automation

---

## Cost Comparison

### Option 1: Manual Upload
- **Time cost:** 2 minutes per episode
- **Monetary cost:** $0

### Option 2: RSS Feed
- **Setup time:** 2-3 hours (one-time)
- **Time per episode:** 0 minutes (fully automated)
- **Hosting cost:** Negligible (MP3 files on Netlify)
- **Monetary cost:** $0

**Recommendation:** Start with Option 1, implement Option 2 when you have 5+ posts ready for audio.
