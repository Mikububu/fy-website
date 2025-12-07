# Conditional Keyword Styling System

## Overview

Implemented a dynamic keyword system where visual styling is conditional based on keyword frequency across all blog posts. This allows keywords to organically "find their brothers" as new posts are added.

## How It Works

### 1. Keyword Classification

Keywords are automatically classified into two categories:

- **Shared Keywords (33 total)**: Keywords appearing in 2+ posts
  - Get colored backgrounds and hover effects
  - Are clickable and show related posts
  - Examples: "Shadow Work" (4 posts), "Shakta Tantra" (4 posts), "Kriya Yoga" (3 posts)

- **Unique Keywords (363 total)**: Keywords appearing in only 1 post
  - Shown as plain text with subtle border
  - Not clickable
  - Maintain semantic value without visual emphasis
  - Can become "shared" when new posts with matching keywords are added

### 2. Architecture

**Build Script**: `build-keyword-frequency.js`
- Scans all 43 HTML posts in `/posts/` directory
- Extracts keywords from `data-keyword` attributes
- Generates `keyword-frequency.json` with classification data
- Run with: `node /Volumes/LaCie/CLAUDE/build-keyword-frequency.js`

**JavaScript**: `keyword-navigation.js` (updated)
- Loads `keyword-frequency.json` on page load
- Dynamically applies CSS classes based on keyword frequency:
  - `.shared-keyword` for keywords in 2+ posts
  - `.unique-keyword` for keywords in only 1 post
- Adds click handlers only to shared keywords

**CSS**: `blog-post.css` (updated)
- `.shared-keyword`: Colored, animated, clickable styling
- `.unique-keyword`: Transparent background, subtle border, no hover effects

**Rebuild Script**: `rebuild-keywords.sh`
- Convenience script to regenerate frequency data
- Run after adding/updating blog posts
- Usage: `./rebuild-keywords.sh`

### 3. Current Statistics (43 posts)

- Total unique keywords: **396**
- Shared keywords (2+ posts): **33** (8.3%)
- Unique keywords (1 post only): **363** (91.7%)

**Top 10 Shared Keywords:**
1. Shadow Work - 4 posts
2. Shakta Tantra - 4 posts
3. Kriya Yoga - 3 posts
4. Advaita Vedanta - 3 posts
5. Tantric Initiation - 3 posts
6. Laya Yoga - 3 posts
7. Sensual Liberation - 2 posts
8. Spiritual Crisis - 2 posts
9. Tanmatras - 2 posts
10. Indriyas - 2 posts

### 4. User Experience

**For Readers:**
- Visually emphasized keywords indicate topics with multiple posts
- Clicking shared keywords reveals all related posts
- Unique keywords provide semantic context without distraction

**For Content Growth:**
- As new posts are added, unique keywords can organically become shared
- No manual tagging required - system auto-updates on rebuild
- Encourages thematic consistency across blog

### 5. Workflow for Adding New Posts

1. Create new blog post with keyword tags
2. Run: `./rebuild-keywords.sh` (or `node build-keyword-frequency.js`)
3. Refresh blog pages to see updated keyword styling
4. Unique keywords that now appear in 2+ posts automatically become clickable

### 6. Technical Details

**File Locations:**
- `/Volumes/LaCie/CLAUDE/build-keyword-frequency.js` - Frequency analyzer
- `/Volumes/LaCie/CLAUDE/keyword-frequency.json` - Generated data file
- `/Volumes/LaCie/CLAUDE/keyword-navigation.js` - Frontend logic
- `/Volumes/LaCie/CLAUDE/blog-post.css` - Styling rules
- `/Volumes/LaCie/CLAUDE/rebuild-keywords.sh` - Rebuild helper

**HTML Structure** (unchanged):
```html
<div class="keyword-cloud">
  <span class="keyword-tag clickable-keyword" data-keyword="Shadow Work">Shadow Work</span>
  <span class="keyword-tag clickable-keyword" data-keyword="Unique Concept">Unique Concept</span>
</div>
```

**JavaScript applies classes dynamically:**
```javascript
// Shared keyword (2+ posts)
<span class="keyword-tag clickable-keyword shared-keyword" data-keyword="Shadow Work">

// Unique keyword (1 post only)
<span class="keyword-tag unique-keyword" data-keyword="Unique Concept">
```

### 7. Benefits

- **Organic Growth**: Keywords naturally evolve from unique to shared
- **Visual Hierarchy**: Important (frequent) keywords stand out
- **SEO Value**: All keywords remain in HTML for search engines
- **User Navigation**: Shared keywords enable cross-post discovery
- **No Manual Work**: Automatic classification based on actual usage

## Round 2 Completion Summary

All 43 posts have been updated with specific tantric/spiritual/psychological keywords. Generic keywords (man, woman, sex, energy, power, spiritual, perin, michael, wogenburg) have been completely eliminated.

Each post now has 8-12 highly specific keywords creating unique semantic fingerprints optimized for SEO and internal linking.
