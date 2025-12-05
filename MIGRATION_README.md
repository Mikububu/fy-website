# Automated Substack Migration

## Quick Start

```bash
# Run the migration script
node migrate-substack.js
```

That's it! The script will:
- ✅ Fetch all posts from Substack RSS
- ✅ Scrape each post's content
- ✅ Download all images (TODO: needs implementation)
- ✅ Fix video embeds (no more .m3u8 downloads!)
- ✅ Generate HTML files in /posts/
- ✅ Wait 10-30 seconds between posts (polite scraping)

## Current Status

**TESTING MODE**: Script currently processes only first 3 posts for testing.

To process ALL posts, edit `migrate-substack.js` line 226:
```javascript
// Change this:
const testPosts = posts.slice(0, 3);

// To this:
const testPosts = posts; // All posts
```

## What Works

✅ RSS feed fetching
✅ HTML content extraction
✅ Image URL detection
✅ JW Player video detection and fixing
✅ Polite delays between requests
✅ HTML file generation
✅ Progress logging

## What Needs Implementation

🔧 **Image downloading** - Currently just logs URLs, doesn't actually download
   - Line 157: `downloadImage()` function needs implementation
   - Use `https.get()` to download and `fs.writeFileSync()` to save

🔧 **Better content extraction** - Current regex is simple
   - May need to handle Substack's specific HTML structure better

🔧 **Error recovery** - Script stops on errors
   - Add try/catch and continue on individual post failures

## Output

After running, you'll have:

```
/posts/
  post-slug-1.html
  post-slug-2.html
  ...

/images/posts/
  post-slug-1/
    image-1.jpg
    image-2.jpg
  post-slug-2/
    ...

migration-results.json  (index of all migrated posts)
```

## Configuration

Edit CONFIG object in `migrate-substack.js`:

```javascript
const CONFIG = {
  substackUrl: 'https://forbidden-yoga.substack.com',
  rssFeedUrl: 'https://forbidden-yoga.substack.com/feed',
  outputDir: './posts',
  imagesDir: './images/posts',
  delayBetweenPosts: [10000, 30000],  // 10-30 seconds
  delayBetweenMedia: [30000, 60000],  // 30-60 seconds
};
```

## Timeline Estimate

For ~50 posts with delays:
- 10-30s per post = 8-25 minutes total
- Plus media downloads = 30-60 minutes total

**Perfect for lazy automation! Just run and get coffee ☕**

## Next Steps

1. **Test with 3 posts** (current default)
2. **Implement image downloading** if needed
3. **Remove test limit** to process all posts
4. **Run full migration**
5. **Verify results**
6. **Update blog.js** to use local posts
7. **Phase 2: Add keyword extraction**

## Troubleshooting

**"Module not found"**
- This uses only built-in Node modules (https, fs, path)
- No npm install needed!

**Posts look broken**
- Check migration-results.json for errors
- Verify HTML in /posts/ directory
- May need to adjust content extraction regex

**Videos still trigger downloads**
- Check that script replaced .m3u8 with correct player URLs
- Format should be: `cdn.jwplayer.com/players/[ID]-IxzuqJ4M.html`
