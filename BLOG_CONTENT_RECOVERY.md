# Blog Content Recovery Guide

## Missing Content Posts

The following **11 blog posts** have empty content and need to be manually recovered from Substack:

1. `5-karmendriyas-and-5-jnanendriyas.html`
2. `a-holistic-approach-to-divorce.html`
3. `hermanns-story-of-his-sensual-liberation.html`
4. `muladhara-chakra-petals.html`
5. `my-new-approach-to-therapy.html`
6. `our-brains-urge-for-mystical-experiences.html`
7. `reclaiming-your-voice-working-through.html`
8. `soulmates-among-the-stars-the-ultimate.html`
9. `tantra-online.html` ← User specifically asked about this one
10. `the-joy-of-torture.html`
11. `yogic-transmission-in-raja-yoga.html`

## What's Missing

These posts have:
- ✅ Title (fixed)
- ✅ Metadata (SEO tags, Open Graph, etc.)
- ✅ Logo
- ✅ Layout/styling
- ❌ **Actual blog post content** (text, images, videos, audio embeds)

## Recovery Options

### Option 1: Use the Refetch Script (When RSS is Available)

```bash
python3 refetch-substack-posts.py
```

The script will:
- Fetch posts from Substack RSS feed
- Extract full content including:
  - Text and formatting
  - Images
  - Video embeds (VideoEmbedPlayer placeholders)
  - Audio embeds
  - Spotify embeds
- Generate complete HTML files
- Preserve all embeds and media

**Note:** Currently the RSS feed appears empty or restricted. You may need to:
1. Check Substack settings to enable RSS feed
2. Use Substack API access if available
3. Export posts from Substack dashboard

### Option 2: Manual Recovery from Substack Dashboard

1. Go to https://michaelperin.substack.com/publish/posts
2. For each missing post, open the post editor
3. Copy the full HTML content
4. Paste into the `<div class="post-content">` section of the HTML file

### Option 3: Export from Substack

Substack allows exporting all posts:
1. Go to Settings → Data export
2. Download your content archive
3. Extract and migrate to HTML format

## Content Types to Preserve

When recovering content, make sure to include:

### Text Content
- Full article body
- Paragraph formatting
- Headings (h2, h3, etc.)
- Bold, italic, links

### Images
- Featured images
- Inline images
- Image captions
- Proper srcsets for responsive images

### Video Embeds
Look for `VideoEmbedPlayer` components with IDs like:
```html
<div data-component-name="VideoEmbedPlayer"
     id="media-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
     class="videoScrollTarget-SzB20Y">
```

These need manual video deployment on Substack.

### Audio/Spotify Embeds
- Audio player embeds
- Spotify playlist/track embeds
- Podcast embeds

Example Spotify embed:
```html
<iframe src="https://open.spotify.com/embed/track/xxxxx"
        width="100%"
        height="152"
        frameborder="0"
        allowtransparency="true"
        allow="encrypted-media">
</iframe>
```

## Script Features

The `refetch-substack-posts.py` script:

✅ Fetches from Substack RSS feed
✅ Extracts full HTML content with all embeds
✅ Preserves video embed placeholders
✅ Preserves audio/Spotify embeds
✅ Generates proper SEO metadata
✅ Maintains Forbidden Yoga styling
✅ Adds CTA sections
✅ Ready for future blog migrations

## Future Use

Keep this script for:
- Adding new Substack posts
- Updating existing posts
- Bulk migrations
- Backup and recovery

## Notes

- The script includes retry logic and rate limiting
- All embeds (video, audio, Spotify) are preserved in HTML
- Video embeds remain as placeholders for manual deployment
- Script is configured for michaelperin.substack.com feed
