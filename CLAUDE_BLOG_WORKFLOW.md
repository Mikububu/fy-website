# Claude Blog Post Migration Workflow

## Overview
This workflow migrates Substack blog posts to forbidden-yoga.com with full SEO optimization, Instagram video embedding, and automatic thumbnail generation.

## Prerequisites
- yt-dlp installed (`brew install yt-dlp`)
- ffmpeg installed (`brew install ffmpeg`)
- Post HTML file exists in `/posts/`
- Instagram video embedded in Substack post (if applicable)

---

## Workflow Steps

### 1. Manual Preparation (User)
User manually updates the Substack post:
- Embeds Instagram video in Substack post
- Removes any Substack-specific videos
- Ensures content is finalized

### 2. Run Migration Script

```bash
cd /Volumes/LaCie/CLAUDE
./scripts/blog-post-migration.sh <post-slug>
```

**What it does:**
- ✅ Downloads Instagram video from embedded link
- ✅ Extracts frame at 2s as featured image
- ✅ Creates 600px thumbnail for blog listing
- ✅ Saves to correct directories
- ⚠️ **Does NOT** handle SEO optimization (requires Claude)

### 3. Claude SEO Optimization (SEODEEP)

**Trigger:** User types `SEODEEP` in conversation

**When Claude sees SEODEEP, perform these steps:**

#### A. Analyze the Post Content
1. Read the post HTML file completely
2. Analyze the main themes, concepts, and teachings
3. Identify the featured image (if exists)
4. Read/view the image to understand visual content
5. Determine:
   - Main subject (deity, concept, person, practice, etc.)
   - Specific traditions mentioned (Shakta Tantra, Kaula, White Tigress, etc.)
   - Key philosophical concepts
   - Practices or techniques discussed
   - Visual style (AI-generated, photo, artwork)

#### B. Generate 8-12 Semantic Keywords
**CRITICAL:** Replace ALL existing keyword tags with proper semantic keywords.

**Rules for semantic keywords:**
- Use SPECIFIC concepts, NOT generic words
- ✅ GOOD: "Yogini", "Shakta Tantra", "Chamunda Devi", "Kaula Tradition", "White Tigress", "Kundalini Shakti"
- ❌ BAD: "man", "power", "came", "entire", "heart", "love", "deep", "spiritual", "energy"
- Each keyword must be clickable and meaningful
- Focus on tantric deities, traditions, practices, and philosophical concepts
- Use proper names and technical terms from the tradition
- Aim for 8-12 keywords total

**Example semantic keywords:**
```html
<span class="keyword-tag clickable-keyword" data-keyword="Chamunda Devi">Chamunda Devi</span>
<span class="keyword-tag clickable-keyword" data-keyword="Shakta Tantra">Shakta Tantra</span>
<span class="keyword-tag clickable-keyword" data-keyword="Yogini Tradition">Yogini Tradition</span>
<span class="keyword-tag clickable-keyword" data-keyword="Kaula Practice">Kaula Practice</span>
<span class="keyword-tag clickable-keyword" data-keyword="Left-Hand Path">Left-Hand Path</span>
<span class="keyword-tag clickable-keyword" data-keyword="Kundalini Shakti">Kundalini Shakti</span>
```

#### C. Optimize Filename
Rename image with SEO-friendly hyphenated keywords:
```bash
# Example:
chamunda-devi-tantric-goddess-yogini-visualization.jpg
# NOT: IMG_1234.jpg or generic-image.jpg
```

#### D. Update HTML Meta Tags

Add/update these in `<head>`:

```html
<!-- Open Graph -->
<meta property="og:image" content="https://forbidden-yoga.com/images/{seo-filename}.jpg">
<meta property="og:image:alt" content="{Detailed description with keywords}">
<meta property="og:image:width" content="{width}">
<meta property="og:image:height" content="{height}">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://forbidden-yoga.com/images/{seo-filename}.jpg">
<meta name="twitter:image:alt" content="{Same as og:image:alt}">

<!-- Article Tags (deity/concept specific) -->
<meta property="article:tag" content="Main Subject">
<meta property="article:tag" content="Related Concept 1">
<meta property="article:tag" content="Related Concept 2">
<meta property="article:tag" content="Tradition/System">
```

#### E. Update Schema.org Markup

Upgrade image from simple URL to full ImageObject:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "image": {
    "@type": "ImageObject",
    "url": "https://forbidden-yoga.com/images/{seo-filename}.jpg",
    "description": "Detailed description including context, subject, style, and keywords",
    "width": "{width}",
    "height": "{height}"
  }
}
</script>
```

#### F. Add Featured Image to Post Content

Insert image at top of post content (inside `.post-content` div):

```html
<div class="post-content">
    <!-- Featured Image -->
    <img src="../images/{seo-filename}.jpg"
         alt="{Detailed SEO description}"
         width="{width}"
         height="{height}">

    <!-- Rest of content... -->
</div>
```

**DO NOT** use inline styles - let blog-post.css handle sizing (max-width: 1000px)

### 4. Commit and Deploy

**CRITICAL:** Always follow this checklist:

#### Git Workflow Checklist
```bash
cd /Volumes/LaCie/CLAUDE

# 1. Check status
git status

# 2. Add all changes
git add posts/{post-slug}.html
git add images/{seo-filename}.jpg
git add blog-thumbnails/{post-slug}.jpg

# 3. Commit with detailed message
git commit -m "Complete SEO optimization for {post-title}

- Added Instagram video embed
- Extracted and optimized featured image with SEO filename
- Created thumbnail for blog listing
- Full meta tag optimization (OG, Twitter, Schema.org)
- Added comprehensive article tags for {main-subject}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Push to trigger Netlify deploy
git push origin main
```

#### Deployment Verification
1. Wait 1-2 minutes for Netlify deployment
2. Check live post: `https://forbidden-yoga.com/posts/{post-slug}.html`
3. Verify featured image displays
4. Check homepage blog listing shows correct thumbnail
5. Test social media preview:
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

---

## Example: Full Workflow

### User Request
```
User: "I updated the 'destroyer' post on Substack with the Instagram video.
       Please migrate it with SEODEEP."
```

### Claude Response
```markdown
I'll migrate the blog post with full SEO optimization.

**Step 1: Running migration script...**
[Runs blog-post-migration.sh]
- ✅ Downloaded Instagram video
- ✅ Extracted featured image
- ✅ Created thumbnail

**Step 2: SEODEEP Analysis...**
[Analyzes image - it's Chamunda Devi, fierce tantric goddess]

**Step 3: SEO Optimization...**
- Renamed: chamunda-devi-tantric-goddess-yogini-visualization.jpg
- Updated meta tags with deity-specific keywords
- Added article tags: Chamunda Devi, Tantric Goddess, Yogini, Shakta Tantra
- Upgraded Schema.org to ImageObject
- Added featured image to post content

**Step 4: Deploying...**
[Commits and pushes to main]

✅ Complete! Netlify is deploying now.
Check: https://forbidden-yoga.com/posts/why-a-woman-initiated-in-the-left.html
```

---

## Common Mistakes to Avoid

❌ **Forgetting to commit image files**
✅ Always check `git status` before committing

❌ **Not pushing to remote**
✅ Run `git push origin main` - this triggers Netlify

❌ **Using inline styles on images**
✅ Let CSS handle styling (blog-post.css has max-width: 1000px)

❌ **Generic filenames like IMG_1234.jpg**
✅ Use SEO-friendly: deity-name-concept-keywords.jpg

❌ **Marking task complete before deployment verification**
✅ Wait for Netlify and verify live site

❌ **Only adding og:image URL without full metadata**
✅ Include width, height, alt text, and Schema.org ImageObject

---

## Files and Directories

```
/Volumes/LaCie/CLAUDE/
├── posts/
│   └── {post-slug}.html           # Main post HTML
├── images/
│   └── {seo-filename}.jpg         # Featured image (full size, ~1000px)
├── blog-thumbnails/
│   └── {post-slug}.jpg            # Thumbnail (600px, for homepage)
├── scripts/
│   └── blog-post-migration.sh     # Automated migration script
└── WORKFLOW_CHECKLIST.md          # Git workflow reminder
```

---

## Troubleshooting

### "Thumbnail not showing on homepage"
1. Check file exists: `/blog-thumbnails/{post-slug}.jpg`
2. Verify committed to git: `git log --name-only | grep blog-thumbnails`
3. Check deployed: `curl -I https://forbidden-yoga.com/blog-thumbnails/{post-slug}.jpg`
4. Clear social media caches (Facebook, Twitter, LinkedIn)

### "Featured image not displaying in post"
1. Verify image exists in `/images/` folder
2. Check HTML has correct relative path: `../images/{filename}.jpg`
3. Ensure image is inside `.post-content` div
4. Hard refresh browser (Cmd+Shift+R)

### "SEO tags not working for social media"
1. Verify absolute URLs: `https://forbidden-yoga.com/images/...`
2. Check image dimensions are specified
3. Force re-scrape on social platforms
4. Wait for Netlify deployment to complete

---

## Future Improvements

- [ ] Automate SEODEEP with Claude Agent SDK
- [ ] Create VS Code extension for one-click migration
- [ ] Add image optimization (WebP conversion)
- [ ] Automatic social media preview testing
- [ ] Batch migration for multiple posts
