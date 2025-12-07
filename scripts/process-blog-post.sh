#!/bin/bash

# COMPLETE Blog Post Processing Script
# Handles any video embed, resizes images, triggers SEODEEP
# Usage: ./process-blog-post.sh <post-slug> <image-path>

set -e

REPO_ROOT="/Volumes/LaCie/CLAUDE"
POST_SLUG="$1"
SOURCE_IMAGE="$2"

if [ -z "$POST_SLUG" ]; then
    echo "❌ ERROR: No post slug provided"
    echo ""
    echo "Usage: ./process-blog-post.sh <post-slug> <image-path>"
    echo ""
    echo "Examples:"
    echo "  ./process-blog-post.sh why-a-woman-initiated ~/Downloads/chamunda.jpg"
    echo "  ./process-blog-post.sh tantra-online ~/Desktop/goddess.gif"
    echo ""
    exit 1
fi

POST_HTML="$REPO_ROOT/posts/${POST_SLUG}.html"

if [ ! -f "$POST_HTML" ]; then
    echo "❌ ERROR: Post HTML not found at $POST_HTML"
    exit 1
fi

echo "========================================"
echo "COMPLETE BLOG POST PROCESSING"
echo "Post: $POST_SLUG"
echo "========================================"
echo ""

# Step 1: Handle featured image
if [ -n "$SOURCE_IMAGE" ]; then
    if [ ! -f "$SOURCE_IMAGE" ]; then
        echo "❌ ERROR: Source image not found: $SOURCE_IMAGE"
        exit 1
    fi

    echo "🖼  Step 1: Processing featured image..."

    # Get image info
    IMAGE_INFO=$(file "$SOURCE_IMAGE")
    echo "  Source: $(basename "$SOURCE_IMAGE")"
    echo "  Type: $IMAGE_INFO"

    # Detect image dimensions
    if command -v identify &> /dev/null; then
        DIMENSIONS=$(identify -format "%wx%h" "$SOURCE_IMAGE" 2>/dev/null || echo "unknown")
        WIDTH=$(echo $DIMENSIONS | cut -d'x' -f1)
        HEIGHT=$(echo $DIMENSIONS | cut -d'x' -f2)
        echo "  Dimensions: ${WIDTH}x${HEIGHT}"
    else
        echo "  ⚠ ImageMagick not installed - using ffmpeg for resize"
        WIDTH=9999  # Force resize if we can't detect
    fi

    FEATURED_IMAGE="$REPO_ROOT/images/${POST_SLUG}-featured.jpg"
    THUMBNAIL_IMAGE="$REPO_ROOT/blog-thumbnails/${POST_SLUG}.jpg"

    # Check if resize needed (max 1000px width)
    if [ "$WIDTH" != "unknown" ] && [ "$WIDTH" -gt 1000 ]; then
        echo "  Image too large (${WIDTH}px > 1000px), resizing..."

        # Resize featured image to max 1000px width, maintain aspect ratio
        ffmpeg -i "$SOURCE_IMAGE" \
            -vf "scale='min(1000,iw)':'min(1000*ih/iw,ih)':force_original_aspect_ratio=decrease" \
            -q:v 2 \
            "$FEATURED_IMAGE" \
            -y -loglevel error

        if [ -f "$FEATURED_IMAGE" ]; then
            NEW_SIZE=$(identify -format "%wx%h" "$FEATURED_IMAGE" 2>/dev/null || echo "resized")
            echo "  ✅ Featured image resized: $NEW_SIZE"
        fi
    else
        # Image is acceptable size, just copy and convert to JPG
        echo "  Image size OK, converting to JPG..."

        ffmpeg -i "$SOURCE_IMAGE" \
            -q:v 2 \
            "$FEATURED_IMAGE" \
            -y -loglevel error

        if [ -f "$FEATURED_IMAGE" ]; then
            echo "  ✅ Featured image created"
        fi
    fi

    # Create thumbnail (600px max, square if possible)
    echo "  Creating thumbnail (600px)..."
    ffmpeg -i "$FEATURED_IMAGE" \
        -vf "scale='min(600,iw)':'min(600*ih/iw,ih)':force_original_aspect_ratio=decrease" \
        -q:v 2 \
        "$THUMBNAIL_IMAGE" \
        -y -loglevel error

    if [ -f "$THUMBNAIL_IMAGE" ]; then
        THUMB_SIZE=$(identify -format "%wx%h" "$THUMBNAIL_IMAGE" 2>/dev/null || echo "created")
        THUMB_FILESIZE=$(du -h "$THUMBNAIL_IMAGE" | cut -f1)
        echo "  ✅ Thumbnail created: $THUMB_SIZE ($THUMB_FILESIZE)"
    fi

else
    echo "ℹ️  Step 1: No image provided - skipping image processing"
    echo "   If you need to add an image later, run:"
    echo "   ./process-blog-post.sh $POST_SLUG /path/to/image.jpg"
fi

echo ""
echo "📊 Step 2: File status check..."
echo "  Post HTML: ✅ exists"

if [ -f "$REPO_ROOT/images/${POST_SLUG}-featured.jpg" ]; then
    FEAT_SIZE=$(identify -format "%wx%h" "$REPO_ROOT/images/${POST_SLUG}-featured.jpg" 2>/dev/null || echo "unknown")
    FEAT_FILESIZE=$(du -h "$REPO_ROOT/images/${POST_SLUG}-featured.jpg" | cut -f1)
    echo "  Featured image: ✅ $FEAT_SIZE ($FEAT_FILESIZE)"
else
    echo "  Featured image: ⚠ not created"
fi

if [ -f "$REPO_ROOT/blog-thumbnails/${POST_SLUG}.jpg" ]; then
    THUMB_SIZE=$(identify -format "%wx%h" "$REPO_ROOT/blog-thumbnails/${POST_SLUG}.jpg" 2>/dev/null || echo "unknown")
    THUMB_FILESIZE=$(du -h "$REPO_ROOT/blog-thumbnails/${POST_SLUG}.jpg" | cut -f1)
    echo "  Thumbnail: ✅ $THUMB_SIZE ($THUMB_FILESIZE)"
else
    echo "  Thumbnail: ⚠ not created"
fi

echo ""
echo "========================================"
echo "✅ Image processing complete!"
echo ""
echo "NEXT STEP: Tell Claude to run SEODEEP"
echo ""
echo "Say: 'SEODEEP ${POST_SLUG}'"
echo ""
echo "Claude will then:"
echo "  1. Analyze post content and image"
echo "  2. Generate 8-12 SEMANTIC keywords (NOT generic words!)"
echo "  3. Replace ALL keyword tags in HTML"
echo "  4. Rename image with SEO-friendly filename"
echo "  5. Optimize all meta tags (OG, Twitter, Schema)"
echo "  6. Add featured image to post content"
echo "  7. Commit ALL changes (HTML + images)"
echo "  8. Push to trigger deployment"
echo "  9. Verify on live site"
echo "========================================"
