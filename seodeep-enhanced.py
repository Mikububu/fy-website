#!/usr/bin/env python3
"""
SEODEEP Enhanced - Comprehensive Blog Post Optimization Script
Features:
1. Cleans Substack HTML bloat
2. Downloads and optimizes images (with downscaling)
3. Creates featured images and thumbnails
4. Deep SEO image analysis (alt text, file naming)
5. Generates optimized meta tags
6. Manages keywords
"""

import os
import re
import sys
import json
import hashlib
from pathlib import Path
from urllib.parse import urlparse, unquote
import subprocess

# Configuration
BASE_DIR = Path('/Volumes/LaCie/CLAUDE')
POSTS_DIR = BASE_DIR / 'posts'
BLOG_IMAGES_DIR = BASE_DIR / 'blog-images'
THUMBNAILS_DIR = BASE_DIR / 'blog-thumbnails'
IMAGES_DIR = BASE_DIR / 'images'

# Image optimization settings
MAX_IMAGE_WIDTH = 1200  # Max width for blog images
THUMBNAIL_MAX_DIM = 600  # Max dimension for thumbnails
THUMBNAIL_QUALITY = 85  # JPEG quality for thumbnails
MAX_THUMBNAIL_SIZE_KB = 100  # Max thumbnail file size in KB

def ensure_directories():
    """Create necessary directories if they don't exist"""
    for dir_path in [BLOG_IMAGES_DIR, THUMBNAILS_DIR, IMAGES_DIR]:
        dir_path.mkdir(parents=True, exist_ok=True)

def download_image(url, output_path):
    """Download an image from URL"""
    try:
        result = subprocess.run(
            ['curl', '-sL', '-o', str(output_path), url],
            capture_output=True,
            timeout=30
        )
        return result.returncode == 0 and output_path.exists()
    except Exception as e:
        print(f"    Error downloading {url}: {e}")
        return False

def get_image_dimensions(filepath):
    """Get image dimensions using identify command"""
    try:
        result = subprocess.run(
            ['identify', '-format', '%w %h', str(filepath)],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            w, h = result.stdout.strip().split()
            return int(w), int(h)
    except:
        pass
    return None, None

def optimize_image(input_path, output_path, max_width=None, quality=85):
    """Resize and optimize an image"""
    width, height = get_image_dimensions(input_path)

    if width is None:
        # Just copy if we can't get dimensions
        subprocess.run(['cp', str(input_path), str(output_path)])
        return True

    # Build ffmpeg/convert command
    if max_width and width > max_width:
        # Need to resize
        try:
            result = subprocess.run([
                'convert', str(input_path),
                '-resize', f'{max_width}x',
                '-quality', str(quality),
                str(output_path)
            ], capture_output=True)
            return result.returncode == 0
        except:
            pass

    # Just copy if no resize needed
    subprocess.run(['cp', str(input_path), str(output_path)])
    return True

def create_thumbnail(input_path, output_path, max_dim=600, max_kb=100):
    """Create an optimized thumbnail"""
    try:
        # First pass - resize
        result = subprocess.run([
            'convert', str(input_path),
            '-resize', f'{max_dim}x{max_dim}>',
            '-quality', '85',
            str(output_path)
        ], capture_output=True)

        if result.returncode != 0:
            subprocess.run(['cp', str(input_path), str(output_path)])
            return

        # Check file size and reduce quality if needed
        file_size_kb = output_path.stat().st_size / 1024
        quality = 80

        while file_size_kb > max_kb and quality > 30:
            subprocess.run([
                'convert', str(output_path),
                '-quality', str(quality),
                str(output_path)
            ], capture_output=True)
            file_size_kb = output_path.stat().st_size / 1024
            quality -= 10

    except Exception as e:
        print(f"    Error creating thumbnail: {e}")
        subprocess.run(['cp', str(input_path), str(output_path)])

def generate_seo_alt_text(filename, post_title):
    """Generate SEO-friendly alt text for an image"""
    # Clean filename
    name = Path(filename).stem
    name = re.sub(r'-img-\d+$', '', name)  # Remove -img-N suffix
    name = name.replace('-', ' ').replace('_', ' ')

    # Capitalize properly
    words = name.split()
    if len(words) > 0:
        base_alt = ' '.join(words[:5])  # First 5 words
    else:
        base_alt = post_title

    return f"{base_alt} - Forbidden Yoga tantric practice"

def extract_images_from_html(html):
    """Extract all image URLs from HTML"""
    images = []

    # Find all img tags with src
    for match in re.finditer(r'<img[^>]*src="([^"]+)"[^>]*>', html):
        src = match.group(1)
        # Skip data URLs and local paths that aren't Substack
        if src.startswith('data:'):
            continue
        images.append(src)

    # Also find srcset URLs
    for match in re.finditer(r'srcset="([^"]+)"', html):
        srcset = match.group(1)
        for part in srcset.split(','):
            url = part.strip().split()[0]
            if 'substackcdn.com' in url or 'substack-post-media' in url:
                images.append(url)

    return list(set(images))

def process_post(post_path):
    """Process a single blog post with full SEODEEP"""
    print(f"\n{'='*60}")
    print(f"Processing: {post_path.name}")

    with open(post_path, 'r', encoding='utf-8') as f:
        html = f.read()

    slug = post_path.stem

    # Extract title and subtitle
    title_match = re.search(r'<h1[^>]*class="post-title"[^>]*>([^<]+)</h1>', html)
    title = title_match.group(1) if title_match else slug.replace('-', ' ').title()

    subtitle_match = re.search(r'<h3[^>]*class="post-subtitle"[^>]*>([^<]+)</h3>', html)
    subtitle = subtitle_match.group(1) if subtitle_match else ''

    print(f"  Title: {title}")
    print(f"  Subtitle: {subtitle[:50]}..." if subtitle else "  No subtitle")

    # Find and download images
    images = extract_images_from_html(html)
    substack_images = [img for img in images if 'substackcdn.com' in img or 'substack-post-media' in img]

    if substack_images:
        print(f"  Found {len(substack_images)} Substack images to download")

        for i, img_url in enumerate(substack_images[:10]):  # Max 10 images
            local_name = f"{slug}-img-{i}.jpg"
            local_path = BLOG_IMAGES_DIR / local_name

            if not local_path.exists():
                print(f"    Downloading image {i}...")
                if download_image(img_url, local_path):
                    # Optimize the downloaded image
                    optimize_image(local_path, local_path, max_width=MAX_IMAGE_WIDTH)

            # Update HTML to use local path
            html = html.replace(img_url, f'/blog-images/{local_name}')

    # Create featured image and thumbnail if not exists
    first_local_img = BLOG_IMAGES_DIR / f"{slug}-img-0.jpg"
    if first_local_img.exists():
        # Featured image
        featured_path = IMAGES_DIR / f"{slug}-featured.jpg"
        if not featured_path.exists():
            print("  Creating featured image...")
            optimize_image(first_local_img, featured_path, max_width=1200, quality=90)

        # Thumbnail
        thumb_path = THUMBNAILS_DIR / f"{slug}.jpg"
        if not thumb_path.exists():
            print("  Creating thumbnail...")
            create_thumbnail(first_local_img, thumb_path)

    # Update SEO meta tags
    featured_url = f"https://forbidden-yoga.com/images/{slug}-featured.jpg"
    thumb_url = f"https://forbidden-yoga.com/blog-thumbnails/{slug}.jpg"

    # Update OG image
    html = re.sub(
        r'(<meta property="og:image" content=")[^"]*(")',
        f'\\1{featured_url}\\2',
        html
    )

    # Update Twitter image
    html = re.sub(
        r'(<meta name="twitter:image" content=")[^"]*(")',
        f'\\1{featured_url}\\2',
        html
    )

    # Save updated HTML
    with open(post_path, 'w', encoding='utf-8') as f:
        f.write(html)

    # Verification
    remaining_substack = len(re.findall(r'substackcdn\.com|substack-post-media', html))
    print(f"  Remaining Substack URLs: {remaining_substack}")

    return True

def run_seodeep(post_slug=None):
    """Run SEODEEP on one or all posts"""
    ensure_directories()

    if post_slug:
        post_path = POSTS_DIR / f"{post_slug}.html"
        if post_path.exists():
            process_post(post_path)
        else:
            print(f"Post not found: {post_slug}")
    else:
        # Process all posts
        for post_path in sorted(POSTS_DIR.glob('*.html')):
            process_post(post_path)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        run_seodeep(sys.argv[1])
    else:
        print("Usage: python seodeep-enhanced.py [post-slug]")
        print("       python seodeep-enhanced.py (run on all posts)")
        run_seodeep()
