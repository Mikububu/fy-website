#!/usr/bin/env python3
"""
Complete blog post conversion script (SEODEEP)
- Fetches post from Substack URL
- Downloads and optimizes images locally
- Creates featured image and thumbnails
- Detects JW Player videos and downloads poster images
- Cleans up Substack HTML
- Applies blog-post.css styling
- Adds keyword section
- Updates OG tags with correct featured image
"""

import urllib.request
import urllib.parse
import re
import json
import os
import sys
import subprocess
from pathlib import Path
from html import unescape
from datetime import datetime

def fetch_post_html(url):
    """Fetch individual post HTML from Substack"""
    print(f"Fetching post from: {url}")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        return response.read().decode('utf-8')

def extract_slug_from_url(url):
    """Extract slug from Substack URL"""
    if '/p/' in url:
        slug = url.split('/p/')[-1].rstrip('/')
        # Remove any query parameters
        slug = slug.split('?')[0]
        return slug
    return None

def download_image(image_url, slug, img_index):
    """Download image and save locally"""
    blog_images_dir = Path('/Volumes/LaCie/CLAUDE/blog-images')
    blog_images_dir.mkdir(exist_ok=True)

    # Create filename
    ext = '.jpg'  # Default to jpg
    if image_url.endswith('.png'):
        ext = '.png'
    elif image_url.endswith('.webp'):
        ext = '.webp'
    elif image_url.endswith('.gif'):
        ext = '.gif'

    local_filename = f"{slug}-img-{img_index}{ext}"
    local_path = blog_images_dir / local_filename

    try:
        print(f"  Downloading image {img_index}: {image_url[:80]}...")
        req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            image_data = response.read()

        with open(local_path, 'wb') as f:
            f.write(image_data)

        print(f"  ✓ Saved to: {local_filename}")
        return f"/blog-images/{local_filename}"
    except Exception as e:
        print(f"  ✗ Error downloading image: {e}")
        return image_url  # Return original URL if download fails

def detect_jwplayer_video(html_content):
    """Detect JW Player video links at end of Substack post"""
    # Look for JW Player preview links at the end of content
    # Format: https://cdn.jwplayer.com/previews/MEDIAID-HASH
    jwplayer_pattern = r'https://cdn\.jwplayer\.com/previews/([A-Za-z0-9\-]+)'
    matches = re.findall(jwplayer_pattern, html_content)

    if matches:
        # Extract media ID (first part before dash)
        media_id = matches[-1].split('-')[0]  # Use last match (end of post)
        print(f"  ✓ Found JW Player video: {media_id}")
        return media_id

    return None

def download_jwplayer_poster(media_id, slug):
    """Download JW Player poster image and create featured image + thumbnail"""
    print(f"  Fetching JW Player metadata for: {media_id}")

    # Fetch JW Player metadata
    metadata_url = f"https://cdn.jwplayer.com/v2/media/{media_id}"
    req = urllib.request.Request(metadata_url, headers={'User-Agent': 'Mozilla/5.0'})

    try:
        with urllib.request.urlopen(req) as response:
            metadata = json.loads(response.read().decode('utf-8'))

        # Get highest quality poster image
        poster_url = f"https://cdn.jwplayer.com/v2/media/{media_id}/poster.jpg?width=1920"
        print(f"  Downloading JW Player poster: {poster_url}")

        # Download to temp file
        temp_poster = '/tmp/jwplayer-poster.jpg'
        req = urllib.request.Request(poster_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            poster_data = response.read()

        with open(temp_poster, 'wb') as f:
            f.write(poster_data)

        print(f"  ✓ Downloaded poster: {len(poster_data)} bytes")

        # Create featured image (1000px max)
        featured_path = f'/Volumes/LaCie/CLAUDE/images/{slug}-featured.jpg'
        subprocess.run([
            'ffmpeg', '-i', temp_poster,
            '-vf', "scale='min(1000,iw)':'min(1000*ih/iw,ih)':force_original_aspect_ratio=decrease",
            '-q:v', '2',
            featured_path, '-y'
        ], capture_output=True, check=True)

        print(f"  ✓ Created featured image: {featured_path}")

        # Create thumbnail (600px max)
        thumbnail_path = f'/Volumes/LaCie/CLAUDE/blog-thumbnails/{slug}.jpg'
        subprocess.run([
            'ffmpeg', '-i', temp_poster,
            '-vf', 'scale=600:600:force_original_aspect_ratio=decrease',
            '-q:v', '2',
            thumbnail_path, '-y'
        ], capture_output=True, check=True)

        print(f"  ✓ Created thumbnail: {thumbnail_path}")

        # Delete temp file
        os.remove(temp_poster)
        print(f"  ✓ Deleted temporary poster file")

        return f'https://forbidden-yoga.com/images/{slug}-featured.jpg'

    except Exception as e:
        print(f"  ✗ Error downloading JW Player poster: {e}")
        return None

def extract_and_download_images(html_content, slug):
    """Extract all images from HTML and download them locally"""
    image_map = {}  # Original URL -> Local URL
    img_counter = 0

    # Check for JW Player video first
    jw_media_id = detect_jwplayer_video(html_content)
    featured_image_url = None

    if jw_media_id:
        print("\n--- JW Player Video Detected ---")
        featured_image_url = download_jwplayer_poster(jw_media_id, slug)

    # Find all image URLs in src attributes
    img_pattern = r'<img[^>]+src="([^"]+)"[^>]*>'
    for match in re.finditer(img_pattern, html_content):
        img_url = match.group(1)

        # Skip if already processed
        if img_url in image_map:
            continue

        # Skip tiny images (avatars, icons)
        if 'w_32' in img_url or 'w_36' in img_url or 'w_48' in img_url:
            local_path = download_image(img_url, slug, img_counter)
            image_map[img_url] = local_path
            img_counter += 1
            continue

        # Download and map
        if img_url.startswith('http'):
            local_path = download_image(img_url, slug, img_counter)
            image_map[img_url] = local_path
            img_counter += 1

    # Also check picture/source tags
    source_pattern = r'<source[^>]+srcset="([^"]+)"[^>]*>'
    for match in re.finditer(source_pattern, html_content):
        srcset = match.group(1)
        # Extract first URL from srcset
        urls = re.findall(r'(https?://[^\s,]+)', srcset)
        for url in urls:
            if url not in image_map and url.startswith('http'):
                local_path = download_image(url, slug, img_counter)
                image_map[url] = local_path
                img_counter += 1
                break  # Only download first quality variant

    return image_map, featured_image_url

def clean_substack_html(html_content):
    """Remove all Substack-specific HTML/CSS and extract clean content"""

    # Extract title
    title_match = re.search(r'<h2[^>]*class="[^"]*pencraft[^"]*title[^"]*"[^>]*>(.*?)</h2>', html_content, re.DOTALL)
    if not title_match:
        title_match = re.search(r'<title>(.*?)</title>', html_content)
    title = title_match.group(1) if title_match else 'Untitled'
    title = re.sub(r'<[^>]+>', '', title)  # Strip HTML tags
    title = title.replace(' | Forbidden Yoga', '').strip()
    title = unescape(title)

    # Extract subtitle
    subtitle_match = re.search(r'<div[^>]*class="[^"]*subtitle[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    subtitle = ''
    if subtitle_match:
        subtitle = re.sub(r'<[^>]+>', '', subtitle_match.group(1)).strip()
        subtitle = unescape(subtitle)

    # Extract date
    date_match = re.search(r'<time[^>]*datetime="([^"]+)"[^>]*>([^<]+)</time>', html_content)
    if date_match:
        date_iso = date_match.group(1)
        date_display = date_match.group(2)
    else:
        date_match = re.search(r'<div[^>]*class="[^"]*meta[^"]*"[^>]*>([^<]+)</div>', html_content)
        date_display = date_match.group(1).strip() if date_match else ''
        date_iso = datetime.now().isoformat() + 'Z'

    # Extract main content from <div class="available-content"> or <div class="body markup">
    content_match = re.search(r'<div class="available-content"[^>]*>(.*?)</div>\s*<div', html_content, re.DOTALL)
    if not content_match:
        content_match = re.search(r'<div[^>]*class="body markup"[^>]*>(.*?)</div>\s*<div[^>]*class="post-footer', html_content, re.DOTALL)

    if content_match:
        main_content = content_match.group(1)
    else:
        # Fallback: try to extract everything between available-content and discussion
        content_match = re.search(r'<div class="available-content">(.*?)<div id="discussion"', html_content, re.DOTALL)
        main_content = content_match.group(1) if content_match else '<p>Content not available</p>'

    # Clean the main content
    # Remove all Substack UI elements
    main_content = re.sub(r'<div[^>]*class="[^"]*visibility-check[^"]*"[^>]*>.*?</div>', '', main_content, flags=re.DOTALL)
    main_content = re.sub(r'<div[^>]*class="[^"]*pencraft[^"]*"[^>]*>.*?</div>', '', main_content, flags=re.DOTALL | re.MULTILINE)
    main_content = re.sub(r'<button[^>]*>.*?</button>', '', main_content, flags=re.DOTALL)
    main_content = re.sub(r'<div[^>]*class="[^"]*byline[^"]*"[^>]*>.*?</div>', '', main_content, flags=re.DOTALL)
    main_content = re.sub(r'<div[^>]*class="[^"]*post-ufi[^"]*"[^>]*>.*?</div>', '', main_content, flags=re.DOTALL)

    # Remove Substack class attributes but keep the tags
    main_content = re.sub(r'<(p|h1|h2|h3|h4|div|span)[^>]*class="[^"]*pencraft[^"]*"[^>]*>', r'<\1>', main_content)
    main_content = re.sub(r'<(p|h1|h2|h3|h4|div|span)[^>]*dir="auto"[^>]*>', r'<\1>', main_content)

    # Clean up img tags - remove Substack attributes
    main_content = re.sub(
        r'<img[^>]*src="([^"]+)"[^>]*>',
        lambda m: f'<img src="{m.group(1)}" alt="">',
        main_content
    )

    # Remove empty tags
    main_content = re.sub(r'<(p|div|span)>\s*</\1>', '', main_content)
    main_content = re.sub(r'<(p|div|span)>\s*</\1>', '', main_content)  # Run twice for nested empties

    # Clean up video embeds - extract just the iframe
    main_content = re.sub(
        r'<div[^>]*class="[^"]*native-video-embed[^"]*"[^>]*>(.*?)</div>',
        lambda m: re.search(r'<(iframe|video)[^>]*>.*?</\1>', m.group(1), re.DOTALL).group(0) if re.search(r'<(iframe|video)[^>]*>', m.group(1)) else m.group(1),
        main_content,
        flags=re.DOTALL
    )

    return {
        'title': title,
        'subtitle': subtitle,
        'date_iso': date_iso,
        'date_display': date_display,
        'content': main_content.strip()
    }

def create_full_blog_post_html(post_data, slug, image_map, featured_image_url=None, keywords=None):
    """Create complete blog post HTML with blog-post.css styling"""

    # Replace image URLs in content
    content = post_data['content']
    for original_url, local_url in image_map.items():
        content = content.replace(original_url, local_url)

    # Generate meta description from first paragraph
    description_match = re.search(r'<p>(.*?)</p>', content, re.DOTALL)
    if description_match:
        description = re.sub(r'<[^>]+>', '', description_match.group(1))
        description = unescape(description)[:200]
    else:
        description = post_data.get('subtitle', '')[:200]

    # Use featured image from JW Player poster, or fall back to first image
    if featured_image_url:
        og_image = featured_image_url
    else:
        og_image = list(image_map.values())[0] if image_map else '/images/default-og-image.jpg'
        if not og_image.startswith('http'):
            og_image = f'https://forbidden-yoga.com{og_image}'

    # Create keywords section HTML
    keywords_html = ''
    if keywords and len(keywords) > 0:
        keywords_html = '''
        <div class="post-keywords">
            <h3>Keywords</h3>
            <div class="keyword-cloud">
'''
        for keyword in keywords:
            keywords_html += f'            <span class="keyword-tag clickable-keyword" data-keyword="{keyword}">{keyword}</span>\n'

        keywords_html += '''            </div>
        </div>
'''

    # Build HTML
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{post_data['title']} | Forbidden Yoga</title>
    <meta name="description" content="{description}">
    <meta name="keywords" content="tantra yoga, kundalini awakening, tantric healing, sacred sexuality, spiritual awakening, energy healing, chakra healing, breathwork, conscious touch, embodied spirituality, somatic healing, sensual liberation, {slug.replace('-', ' ')}, forbidden yoga">
    <link rel="stylesheet" href="../styles.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@100;400&display=swap" rel="stylesheet">

<link rel="stylesheet" href="../blog-post.css">

    <!-- Canonical URL -->
    <link rel="canonical" href="https://forbidden-yoga.com/posts/{slug}.html">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://forbidden-yoga.com/posts/{slug}.html">
    <meta property="og:title" content="{post_data['title']} | Forbidden Yoga">
    <meta property="og:description" content="{description}">
    <meta property="og:image" content="{og_image}">
    <meta property="og:site_name" content="Forbidden Yoga">
    <meta property="article:published_time" content="{post_data['date_iso']}">
    <meta property="article:author" content="Michael Perin Wogenburg">
    <meta property="article:section" content="Tantra Yoga">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://forbidden-yoga.com/posts/{slug}.html">
    <meta name="twitter:title" content="{post_data['title']}">
    <meta name="twitter:description" content="{description}">
    <meta name="twitter:image" content="{og_image}">
    <!-- Structured Data -->
    <script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{post_data['title']}",
  "description": "{description}",
  "image": "{og_image}",
  "author": {{
    "@type": "Person",
    "name": "Michael Perin Wogenburg",
    "url": "https://forbidden-yoga.com",
    "jobTitle": "Kundalini Yoga Teacher & Tantric Healing Practitioner"
  }},
  "publisher": {{
    "@type": "Organization",
    "name": "Forbidden Yoga",
    "logo": {{
      "@type": "ImageObject",
      "url": "https://forbidden-yoga.com/forbidden-yoga-logo-white.png"
    }}
  }},
  "datePublished": "{post_data['date_iso']}",
  "dateModified": "{post_data['date_iso']}",
  "mainEntityOfPage": {{
    "@type": "WebPage",
    "@id": "https://forbidden-yoga.com/posts/{slug}.html"
  }},
  "keywords": "tantra yoga, kundalini, spiritual practice, forbidden yoga, tantric healing"
}}
    </script>
    <link rel="icon" type="image/png" href="../favicon.png">
</head>
<body>
    <article class="post-container">
        <a href="/#blog-section" class="top-back-link">← Back to all posts</a>

        <h1>{post_data['title']}</h1>'''

    if post_data.get('subtitle'):
        html += f'''
        <h3 class="post-subtitle">{post_data['subtitle']}</h3>'''

    html += f'''
        <div class="post-meta">
            <time>{post_data['date_display']}</time>
        </div>
        <div class="post-content">
            {content}
        </div>
{keywords_html}
        <a href="/#blog-section" class="back-link">← Back to all posts</a>
    </article>

    <footer class="footer">
        <div class="footer-email">love<span style="display:none">nospam</span>@<span style="display:none">antispam</span>forbidden-yoga.com</div>
        <div class="footer-links">
            <a href="/privacy.html">Privacy Policy</a>
            <span>•</span>
            <a href="/terms.html">Terms & Conditions</a>
        </div>
        <div class="footer-copyright">Spiritual Art Performance Project</div>
    </footer>

    <script src="/keyword-navigation.js"></script>
</body>
</html>
'''

    return html

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 convert-blog-post-full.py <substack-url> [keyword1,keyword2,...]")
        print("Example: python3 convert-blog-post-full.py https://forbiddenyoga.substack.com/p/my-post \"Shadow Work,Kundalini,Tantra\"")
        sys.exit(1)

    url = sys.argv[1]
    keywords = []
    if len(sys.argv) >= 3:
        keywords = [k.strip() for k in sys.argv[2].split(',')]

    # Extract slug
    slug = extract_slug_from_url(url)
    if not slug:
        print("Error: Could not extract slug from URL")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"Converting blog post: {slug}")
    print(f"{'='*60}\n")

    # Fetch HTML
    html_content = fetch_post_html(url)

    # Download images (and JW Player poster if present)
    print("\n--- Downloading Images ---")
    image_map, featured_image_url = extract_and_download_images(html_content, slug)
    print(f"Downloaded {len(image_map)} images\n")

    if featured_image_url:
        print(f"✓ Featured image from JW Player: {featured_image_url}\n")

    # Clean Substack HTML
    print("--- Extracting Clean Content ---")
    post_data = clean_substack_html(html_content)
    print(f"Title: {post_data['title']}")
    print(f"Date: {post_data['date_display']}")
    if post_data.get('subtitle'):
        print(f"Subtitle: {post_data['subtitle']}")

    # Create final HTML
    print("\n--- Generating Blog Post HTML ---")
    final_html = create_full_blog_post_html(post_data, slug, image_map, featured_image_url, keywords)

    # Write to file
    output_path = Path(f'/Volumes/LaCie/CLAUDE/posts/{slug}.html')
    output_path.write_text(final_html, encoding='utf-8')

    print(f"\n{'='*60}")
    print(f"✅ SUCCESS")
    print(f"{'='*60}")
    print(f"Blog post saved to: {output_path}")
    print(f"Images downloaded: {len(image_map)}")
    if keywords:
        print(f"Keywords added: {', '.join(keywords)}")
    print(f"\nNext steps:")
    print(f"  1. Review the generated HTML file")
    print(f"  2. Add/refine keywords if needed")
    print(f"  3. Run: ./rebuild-keywords.sh")
    print(f"  4. Verify the post at: /posts/{slug}.html")

if __name__ == '__main__':
    main()
