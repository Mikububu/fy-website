#!/bin/bash

# Blog Post Migration Workflow
# Migrates Substack posts to Forbidden Yoga website with full SEO optimization
#
# Usage: ./blog-post-migration.sh <post-slug>
# Example: ./blog-post-migration.sh why-a-woman-initiated-in-the-left

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
POST_SLUG="$1"

if [ -z "$POST_SLUG" ]; then
    echo "ERROR: No post slug provided"
    echo "Usage: ./blog-post-migration.sh <post-slug>"
    exit 1
fi

echo "========================================"
echo "Blog Post Migration Workflow"
echo "Post: $POST_SLUG"
echo "========================================"
echo ""

# Step 1: Verify post HTML exists
POST_HTML="$REPO_ROOT/posts/${POST_SLUG}.html"
if [ ! -f "$POST_HTML" ]; then
    echo "❌ ERROR: Post HTML not found at $POST_HTML"
    exit 1
fi
echo "✓ Found post HTML"

# Step 2: Extract Instagram video links from post
echo ""
echo "Step 1: Searching for Instagram embeds..."
IG_LINKS=$(grep -o 'instagram.com/reel/[^/"]*' "$POST_HTML" || echo "")

if [ -z "$IG_LINKS" ]; then
    echo "  ℹ No Instagram embeds found in post"
else
    echo "  Found Instagram embed(s):"
    echo "$IG_LINKS" | while read -r link; do
        echo "    - https://$link"
    done
fi

# Step 3: Download Instagram videos and extract thumbnails
echo ""
echo "Step 2: Processing Instagram videos..."

if [ -n "$IG_LINKS" ]; then
    mkdir -p "$REPO_ROOT/temp"

    REEL_ID=$(echo "$IG_LINKS" | head -1 | grep -o 'reel/[^/]*' | cut -d'/' -f2)

    echo "  Downloading Instagram reel: $REEL_ID"
    yt-dlp -o "$REPO_ROOT/temp/${POST_SLUG}-ig-video.mp4" "https://www.instagram.com/reel/${REEL_ID}/" 2>&1 | tail -3

    if [ -f "$REPO_ROOT/temp/${POST_SLUG}-ig-video.mp4" ]; then
        echo "  ✓ Video downloaded"

        # Extract frame at 2 seconds for featured image
        echo "  Extracting featured image frame..."
        ffmpeg -i "$REPO_ROOT/temp/${POST_SLUG}-ig-video.mp4" -ss 00:00:02 -vframes 1 -q:v 2 \
            "$REPO_ROOT/images/${POST_SLUG}-featured.jpg" -y 2>&1 | tail -1

        if [ -f "$REPO_ROOT/images/${POST_SLUG}-featured.jpg" ]; then
            echo "  ✓ Featured image extracted"
        fi

        # Create thumbnail (600x600 max)
        echo "  Creating thumbnail..."
        ffmpeg -i "$REPO_ROOT/images/${POST_SLUG}-featured.jpg" \
            -vf "scale=600:600:force_original_aspect_ratio=decrease" \
            "$REPO_ROOT/blog-thumbnails/${POST_SLUG}.jpg" -y 2>&1 | tail -1

        if [ -f "$REPO_ROOT/blog-thumbnails/${POST_SLUG}.jpg" ]; then
            echo "  ✓ Thumbnail created"
        fi

        # Cleanup
        rm -rf "$REPO_ROOT/temp"
    else
        echo "  ⚠ Failed to download video"
    fi
else
    echo "  Skipping - no Instagram videos to process"
fi

# Step 4: Placeholder for Claude SEO analysis
echo ""
echo "Step 3: SEO Optimization (requires Claude)"
echo "  ⚠ This step requires manual Claude intervention with SEODEEP keyword"
echo "  Claude will analyze the image/video and optimize:"
echo "    - Meta descriptions"
echo "    - Alt tags"
echo "    - File names"
echo "    - Open Graph tags"
echo "    - Twitter Cards"
echo "    - Schema.org markup"
echo "    - Article tags"
echo ""
echo "  📝 TODO: Run 'SEODEEP' command with Claude on this post"

# Step 5: Git operations
echo ""
echo "Step 4: Git Operations"
read -p "Commit and push changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$REPO_ROOT"

    echo "  Adding files to git..."
    git add "posts/${POST_SLUG}.html" \
           "images/${POST_SLUG}-featured.jpg" \
           "blog-thumbnails/${POST_SLUG}.jpg" \
           2>/dev/null || true

    echo "  Committing..."
    git commit -m "Migrate blog post: $POST_SLUG

- Add Instagram video embed
- Extract and optimize featured image
- Create thumbnail for blog listing
- SEO optimization pending

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    echo "  Pushing to remote..."
    git push origin main

    echo "  ✓ Changes committed and pushed"
else
    echo "  ℹ Skipping git operations"
fi

echo ""
echo "========================================"
echo "Migration workflow complete!"
echo ""
echo "Next steps:"
echo "1. Use Claude with SEODEEP keyword to optimize SEO"
echo "2. Verify deployment on Netlify"
echo "3. Check live site: https://forbidden-yoga.com/posts/${POST_SLUG}.html"
echo "========================================"
