# Automated Substack Migration Plan
**Date:** 2025-12-05
**Status:** Planning - NOT YET IMPLEMENTED

## Objective
Fully automated migration of ALL Substack posts to forbidden-yoga.com with:
- Zero manual work
- Automatic media download (images, videos)
- Proper video embedding (no download prompts)
- Slow/polite scraping with delays
- Keyword extraction for filtering (Phase 2)

## Current Situation
- Posts currently link to Substack
- Some posts manually copied to /posts/ folder
- Need to keep Substack links until migration is perfect

## Proposed Solution: RSS + Web Scraping

### Phase 1: Automated Content Migration

**Step 1: Fetch All Posts**
- Source: `https://forbidden-yoga.substack.com/feed` (RSS)
- Extract: title, slug, URL, date, excerpt
- No authentication needed

**Step 2: Scrape Each Post**
- Delay: 10-30 seconds between requests (polite scraping)
- Fetch full HTML from each post URL
- Extract:
  - Article content (clean HTML)
  - All images (download to local)
  - Embedded videos (JW Player, YouTube, Vimeo)
  - Metadata (author, tags, date)

**Step 3: Download & Process Media**
- Images: Save to `/images/posts/[slug]/`
- Videos:
  - JW Player: Extract media ID, create proper embed URL
    - Format: `https://cdn.jwplayer.com/players/[ID]-IxzuqJ4M.html`
    - NOT: `.m3u8` files (causes download prompts)
  - YouTube: Keep iframe embed
  - Vimeo: Keep iframe embed
- Delay: 30-60 seconds between large downloads

**Step 4: Generate HTML Files**
- Template: Use existing post template structure
- Output: `/posts/[slug].html`
- Include proper meta tags, structured data
- Maintain consistent styling with site

**Step 5: Create JSON Index**
```json
{
  "posts": [
    {
      "id": "slug",
      "title": "Post Title",
      "date": "2025-01-01",
      "excerpt": "...",
      "url": "/posts/slug.html",
      "keywords": [], // For Phase 2
      "media": {
        "images": [...],
        "videos": [...]
      }
    }
  ]
}
```

### Phase 2: Keyword Extraction & Filtering (LATER)

**After migration complete:**
- Extract keywords from all posts
- Create keyword index
- Add keyword filter UI to blog section
- Users can click keywords to filter posts

## Implementation Options

### Option A: Node.js Script (RECOMMENDED)
**Pros:**
- Can run locally on Mac
- Full control over scraping
- No Substack auth needed
- Can pause/resume

**Cons:**
- Need to install dependencies
- Takes time to run (intentionally slow)

### Option B: Substack Export ZIP
**Pros:**
- Faster processing
- Official export format

**Cons:**
- Need to manually export from Substack
- May not have media files

### Option C: Substack API
**Pros:**
- Most reliable
- Official method

**Cons:**
- Requires API access/auth token
- May not be available

## Next Steps

1. **Choose approach** (A, B, or C)
2. **Build migration script**:
   - RSS fetcher
   - HTML scraper
   - Media downloader
   - Template generator
   - JSON index creator
3. **Test on 2-3 posts** before full migration
4. **Run full migration** (with delays)
5. **Verify all posts** work correctly
6. **Update blog.js** to load from local posts
7. **Keep Substack links** until verified perfect
8. **Phase 2**: Add keyword extraction/filtering

## Technical Details

### Video Embed Fix
**WRONG (causes downloads):**
```html
<iframe src="https://cdn.jwplayer.com/manifests/J151XndT.m3u8"></iframe>
```

**CORRECT:**
```html
<iframe src="https://cdn.jwplayer.com/players/J151XndT-IxzuqJ4M.html"></iframe>
```

### JW Player Video Detection
- Look for: `jwplayer`, `cdn.jwplayer.com`, media IDs
- Extract media ID (e.g., `J151XndT`)
- Generate proper embed URL

### Delays for Polite Scraping
- Between posts: 10-30 seconds random
- Between media downloads: 30-60 seconds random
- Total time for 50 posts: ~30-60 minutes (acceptable)

## Files to Create

1. `migrate-substack.js` - Main migration script
2. `download-media.js` - Media downloader
3. `generate-html.js` - HTML template generator
4. `extract-keywords.js` - Keyword extractor (Phase 2)
5. `posts-index.json` - Generated index file

## Risks & Mitigation

**Risk:** Substack blocks scraping
- **Mitigation:** Use long delays, respect robots.txt, user agent

**Risk:** Video embeds break
- **Mitigation:** Test each video type, fallback to Substack link

**Risk:** Media files too large
- **Mitigation:** Check file size before download, optimize images

**Risk:** HTML structure changes
- **Mitigation:** Robust selectors, graceful fallbacks

## Success Criteria

- ✅ All posts migrated automatically
- ✅ All images downloaded and working
- ✅ All videos embedded properly (no download prompts)
- ✅ Posts match Substack quality
- ✅ Can switch from Substack links to local posts
- ✅ No manual work required

## Notes

- Keep Substack links active during testing
- Can run migration multiple times (idempotent)
- Script should be resumable (track progress)
- Log all errors for debugging
- Michael is "lazy" - solution must be 100% automated!

---

**Decision needed:** Which approach to implement?
