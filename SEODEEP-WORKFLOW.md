# SEODEEP Workflow Documentation

## Overview

SEODEEP is the complete blog post conversion workflow that transforms Substack posts into fully optimized, standalone blog posts for forbidden-yoga.com.

## What SEODEEP Does

1. **Cleans Substack HTML** - Removes all bloat (pencraft classes, visibility-check divs, byline wrappers, post-ufi elements, etc.)
2. **Embeds Videos** - Detects and embeds video links from external platforms (Daydream.live, YouTube, Vimeo, Instagram)
3. **Downloads & Optimizes Images** - All images downloaded locally to `/blog-images/`
4. **Creates Featured Image** - Generates featured image in `/images/` for OG tags
5. **Creates Thumbnail** - Generates optimized thumbnail (600px max) in `/blog-thumbnails/`
6. **Optimizes SEO** - Updates all meta tags (OG, Twitter, Schema.org) with post-specific data
7. **Manages Keywords** - Ensures 8-12 specific tantric/spiritual keywords per post
8. **Rebuilds Keyword Frequency** - Updates conditional keyword styling system

## SEODEEP Checklist

When running SEODEEP on a post, verify ALL of these:

### 1. HTML Cleanup
- [ ] All Substack classes removed (pencraft, visibility-check, byline-wrapper, post-ufi)
- [ ] Clean article structure with only blog-post.css styling
- [ ] No external Substack dependencies

**Verification:**
```bash
grep -c "pencraft\|visibility-check\|byline-wrapper\|post-ufi" posts/POST-SLUG.html
# Should return: 0
```

### 2. Video Embedding
- [ ] Check Substack post for video links at END of post content
- [ ] Look for: Daydream.live, YouTube, Vimeo, Instagram reels
- [ ] Embed video with responsive iframe at top of post content
- [ ] Use 16:9 aspect ratio (padding-bottom: 56.25%)

**Video Embed Template:**
```html
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2em 0;">
    <iframe src="VIDEO_URL"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen>
    </iframe>
</div>
```

**Important:** Substack Mux videos CANNOT be embedded directly. User uploads videos to external platforms (Daydream.live, etc.) and adds link at end of Substack post.

### 3. Images
- [ ] All images downloaded to `/Volumes/LaCie/CLAUDE/blog-images/POST-SLUG-img-N.jpg`
- [ ] Featured image created in `/Volumes/LaCie/CLAUDE/images/POST-SLUG-featured.jpg`
- [ ] Thumbnail created in `/Volumes/LaCie/CLAUDE/blog-thumbnails/POST-SLUG.jpg`
- [ ] Thumbnail is 600px max dimension
- [ ] Thumbnail file size < 100KB

**Verification:**
```bash
ls -lh /Volumes/LaCie/CLAUDE/blog-images/POST-SLUG*
ls -lh /Volumes/LaCie/CLAUDE/images/POST-SLUG-featured.jpg
ls -lh /Volumes/LaCie/CLAUDE/blog-thumbnails/POST-SLUG.jpg
identify /Volumes/LaCie/CLAUDE/blog-thumbnails/POST-SLUG.jpg
```

### 4. SEO Meta Tags
- [ ] OG image points to featured image
- [ ] Twitter image points to featured image
- [ ] Schema.org image points to featured image
- [ ] Meta description extracted from first paragraph
- [ ] All URLs use correct post slug

**Verification:**
```bash
grep -c "og:image\|twitter:image" posts/POST-SLUG.html
# Should return: 4 (og:image, twitter:image, and Schema.org image reference)
```

### 5. Keywords
- [ ] 8-12 specific tantric/spiritual/psychological keywords
- [ ] NO generic keywords (man, woman, sex, energy, power, spiritual, perin, michael, wogenburg)
- [ ] All keywords have `data-keyword` attributes
- [ ] Keywords section uses `.keyword-cloud` wrapper

**Verification:**
```bash
grep "data-keyword=" posts/POST-SLUG.html | wc -l
# Should return: 8-12
```

### 6. Keyword Frequency Rebuild
- [ ] Run `node /Volumes/LaCie/CLAUDE/build-keyword-frequency.js`
- [ ] Verify keyword-frequency.json updated
- [ ] Check which keywords became shared vs unique

**Command:**
```bash
node /Volumes/LaCie/CLAUDE/build-keyword-frequency.js
```

## Complete SEODEEP Workflow

### Step 1: Fetch and Clean
1. Get Substack URL from user
2. Fetch HTML content
3. Extract clean article text (remove all Substack UI)
4. Extract title, subtitle, date

### Step 2: Find Video Link
1. Check END of Substack post content for video URLs
2. Look for: `daydream.live`, `youtube.com`, `youtu.be`, `vimeo.com`, `instagram.com/reel`
3. If found, prepare iframe embed

### Step 3: Download Images
1. Extract all image URLs from HTML
2. Download each to `/blog-images/POST-SLUG-img-N.jpg`
3. Create featured image from largest/best image
4. Create thumbnail (600px max)

### Step 4: Build HTML
1. Use blog-post.css template
2. Add video embed at top if video found
3. Add clean article content
4. Add keywords section
5. Update all SEO meta tags with featured image

### Step 5: Verify & Rebuild
1. Run SEODEEP checklist (see above)
2. Rebuild keyword frequency data
3. Verify all files exist

## Example: Full SEODEEP Run

```bash
# Post: what-you-can-expect-booking-forbidden
# URL: https://forbiddenyoga.substack.com/p/what-you-can-expect-booking-forbidden
# Video: https://app.daydream.live/creators/comprehensive-pink-cicada-966/what-you-can-expect-booking-forbidden-yoga-experiences

# 1. Clean HTML - DONE
grep -c "pencraft" posts/what-you-can-expect-booking-forbidden.html
# Output: 0 ✓

# 2. Video embedded - DONE
grep -c "daydream.live" posts/what-you-can-expect-booking-forbidden.html
# Output: 1 ✓

# 3. Images verified - DONE
ls -lh blog-images/what-you-can-expect-booking-forbidden-img-*.jpg
# Output:
# -rwx------  964B what-you-can-expect-booking-forbidden-img-0.jpg
# -rwx------  3.9K what-you-can-expect-booking-forbidden-img-1.jpg
# -rwx------  4.0K what-you-can-expect-booking-forbidden-img-2.jpg
ls -lh images/what-you-can-expect-booking-forbidden-featured.jpg
# Output: -rwx------  515K ✓

ls -lh blog-thumbnails/what-you-can-expect-booking-forbidden.jpg
# Output: -rwx------  53K ✓

identify blog-thumbnails/what-you-can-expect-booking-forbidden.jpg
# Output: JPEG 450x600 ✓

# 4. SEO tags verified - DONE
grep "og:image" posts/what-you-can-expect-booking-forbidden.html
# Output: Points to what-you-can-expect-booking-forbidden-featured.jpg ✓

# 5. Keywords verified - DONE
grep "data-keyword=" posts/what-you-can-expect-booking-forbidden.html | wc -l
# Output: 10 ✓
# Keywords: Tantric Sessions, Shadow Work, Somatic Trauma Release, Embodied Practice,
#           Conscious Touch, Non-Ordinary States, Edge Work, Kundalini Activation,
#           Surrender Practice, Sacred Container

# 6. Keyword frequency rebuilt - DONE
node build-keyword-frequency.js
# Output: 396 keywords, 33 shared, 363 unique ✓
```

## Post-SEODEEP Next Steps

### IMPORTANT: Git Worktree Workflow

**Repository Structure:**
- Main repo: `/Volumes/LaCie/CLAUDE` (Netlify builds from here)
- Worktree: `/Users/michaelperinwogenburg/.claude-worktrees/CLAUDE/[branch-name]`

**⚠️ CRITICAL:** Always commit and push from **main repo**, NOT from worktree!

**Correct Workflow:**
1. Make changes in worktree
2. `cd /Volumes/LaCie/CLAUDE` (switch to main repo)
3. Commit and push from main repo
4. Netlify will then build from the pushed changes

**Deployment Steps:**
1. **Git Commit** - Commit HTML + images FROM MAIN REPO (`/Volumes/LaCie/CLAUDE`)
2. **Push to Deploy** - Triggers Netlify deployment (waits 1-2 minutes)
3. **Verify Deployment** - Compare live vs local code (see below)
4. **Test Keywords** - Verify shared keywords are clickable, unique keywords are plain text

## Deployment Verification

After pushing, SEODEEP MUST verify the deployment was successful by comparing live site with local code:

### Verification Checklist

**Run WebFetch on live URL:**
```
https://forbidden-yoga.com/posts/POST-SLUG.html
```

**Compare these elements:**

1. **Video Embed**
   - Local: Should have iframe with video URL
   - Live: Should match local iframe src
   - ❌ FAIL if live has no video embed

2. **OG Image Tag**
   - Local: `og:image` points to `images/POST-SLUG-featured.jpg`
   - Live: Should match local og:image URL
   - ❌ FAIL if live uses wrong image (e.g., "Bali Tantra Retreat 1.jpg")

3. **Keyword Count**
   - Local: Count `data-keyword=` attributes
   - Live: Should match local count
   - ❌ FAIL if counts differ

4. **Substack Bloat**
   - Local: Zero instances of pencraft, visibility-check, byline-wrapper
   - Live: Should also be zero
   - ❌ FAIL if live still has Substack classes

### Verification Script

```bash
# Get keyword count from local
LOCAL_KEYWORDS=$(grep -c 'data-keyword=' posts/POST-SLUG.html)

# Get OG image from local
LOCAL_OG=$(grep 'og:image' posts/POST-SLUG.html | grep -o 'content="[^"]*"')

# Get video embed status from local
LOCAL_VIDEO=$(grep -c 'iframe' posts/POST-SLUG.html)

echo "Local Verification:"
echo "  Keywords: $LOCAL_KEYWORDS"
echo "  OG Image: $LOCAL_OG"
echo "  Video Embed: $LOCAL_VIDEO"

# Then use WebFetch to check live site and compare
```

### Common Deployment Issues

**Issue: Live site shows old version**
- **Cause:** Changes not committed/pushed OR Netlify cache
- **Solution:** Check git status, push if needed, clear Netlify cache

**Issue: Video missing on live site**
- **Cause:** Video embed not in committed HTML
- **Solution:** Verify local HTML has iframe, recommit if missing

**Issue: OG image wrong on live site**
- **Cause:** Featured image not uploaded or OG tag not updated
- **Solution:** Verify featured image exists in repo, check og:image tag

**Issue: Keywords different count**
- **Cause:** HTML out of sync
- **Solution:** Check git diff, ensure latest version pushed

## Video Detection Intelligence

### Where User Adds Video Links

User uploads videos to external platforms (because Substack Mux videos can't be embedded directly) and adds the link at the **END of the Substack post content**, after the final paragraph.

### Supported Video Platforms

1. **Daydream.live** - `https://app.daydream.live/creators/...`
2. **YouTube** - `https://youtube.com/watch?v=...` or `https://youtu.be/...`
3. **Vimeo** - `https://vimeo.com/...`
4. **Instagram Reels** - `https://instagram.com/reel/...`

### Detection Method

1. Use WebFetch to get Substack post
2. Look for video URLs after final paragraph
3. Extract URL
4. Embed with responsive iframe

## Files Modified by SEODEEP

- `/Volumes/LaCie/CLAUDE/posts/POST-SLUG.html` - Main blog post
- `/Volumes/LaCie/CLAUDE/blog-images/POST-SLUG-img-*.jpg` - Post images
- `/Volumes/LaCie/CLAUDE/images/POST-SLUG-featured.jpg` - Featured image for OG tags
- `/Volumes/LaCie/CLAUDE/blog-thumbnails/POST-SLUG.jpg` - Thumbnail for listings
- `/Volumes/LaCie/CLAUDE/keyword-frequency.json` - Updated keyword data

## Common Issues

### Issue: Age-restricted Substack post (empty content)
- **Cause:** Post has age-restriction gate, content hidden behind "Verify age" button
- **Detection:** `<div class="available-content"><div dir="auto" class="body markup"></div></div>` is empty
- **Solution:** User must provide the full text content manually - script cannot extract it automatically
- **Warning:** Alert user immediately if empty content detected, don't attempt multiple extraction methods

### Issue: Video not embedding
- **Cause:** Video link not at end of Substack post
- **Solution:** Check Substack post source, look for video URL manually

### Issue: Thumbnail too large
- **Cause:** Original image very high resolution
- **Solution:** Use ffmpeg to resize: `ffmpeg -i input.jpg -vf "scale=600:600:force_original_aspect_ratio=decrease" output.jpg`

### Issue: Featured image wrong
- **Cause:** Auto-selected wrong image
- **Solution:** Manually copy best image to `images/POST-SLUG-featured.jpg`

### Issue: Keywords not showing conditional styling
- **Cause:** Forgot to rebuild keyword frequency
- **Solution:** Run `node build-keyword-frequency.js`

## SEODEEP Success Criteria

A post is 100% SEODEEP complete when:

✅ Zero Substack classes in HTML
✅ Video embedded (if video exists in Substack post)
✅ All images downloaded locally
✅ Featured image exists and referenced in OG tags
✅ Thumbnail exists and < 100KB
✅ 8-12 specific keywords tagged
✅ Keyword frequency data rebuilt
✅ All SEO meta tags point to correct images/URLs

## Version History

- **v1.0** (Dec 2024) - Initial SEODEEP workflow
- **v2.0** (Dec 2024) - Added video detection and embedding
- **v2.1** (Dec 2024) - Added double-check verification process
