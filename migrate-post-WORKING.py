#!/usr/bin/env python3
"""
WORKING blog post migration script
Correctly extracts title, subtitle, date, and content from Substack
"""

import urllib.request
import urllib.parse
import re
import json
import sys
import ssl
from pathlib import Path
from html import unescape
from datetime import datetime
from urllib.parse import urlparse

# SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def fetch_post_html(url, timeout=30):
    """Fetch post HTML from Substack with timeout"""
    print(f"Fetching: {url}")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ssl_context, timeout=timeout) as response:
        return response.read().decode('utf-8')

def extract_slug_from_url(url):
    """Extract slug from Substack URL"""
    if '/p/' in url:
        slug = url.split('/p/')[-1].rstrip('/')
        slug = slug.split('?')[0]
        return slug
    return None

def get_original_filename(image_url):
    """Extract original filename from Substack CDN URL"""
    parsed = urlparse(image_url)
    path = parsed.path

    filename = path.split('/')[-1]

    # If it's a complex CDN URL, try to extract the actual image hash
    if 'substack-post-media' in image_url or 'substackcdn.com' in image_url:
        # Look for image hash pattern in URL
        hash_match = re.search(r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', image_url)
        if hash_match:
            image_hash = hash_match.group(1)
            # Get extension from URL
            if '.png' in image_url:
                return f"{image_hash}.png"
            elif '.gif' in image_url:
                return f"{image_hash}.gif"
            elif '.webp' in image_url:
                return f"{image_hash}.webp"
            else:
                return f"{image_hash}.jpg"

    if not filename or filename == '':
        filename = 'image.jpg'

    return filename

def download_image(image_url, timeout=30):
    """Download image and save with ORIGINAL filename"""
    blog_images_dir = Path('/Volumes/LaCie/CLAUDE/blog-images')
    blog_images_dir.mkdir(exist_ok=True)

    # Get original filename from URL
    original_filename = get_original_filename(image_url)
    local_path = blog_images_dir / original_filename

    # Skip if already downloaded
    if local_path.exists():
        print(f"  ✓ Already exists: {original_filename}")
        return f"/blog-images/{original_filename}"

    try:
        print(f"  Downloading: {original_filename}")
        req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ssl_context, timeout=timeout) as response:
            image_data = response.read()

        with open(local_path, 'wb') as f:
            f.write(image_data)

        print(f"  ✓ Saved: {original_filename} ({len(image_data)} bytes)")
        return f"/blog-images/{original_filename}"

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return image_url  # Return original URL if download fails

def extract_json_ld(html_content):
    """Extract metadata from JSON-LD schema"""
    json_ld_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html_content, re.DOTALL)
    if json_ld_match:
        try:
            json_data = json.loads(json_ld_match.group(1))
            return {
                'title': json_data.get('headline', ''),
                'subtitle': json_data.get('description', ''),
                'date_published': json_data.get('datePublished', ''),
                'og_image': json_data.get('image', [{}])[0].get('@type') == 'ImageObject' and json_data.get('image', [{}])[0].get('url') or ''
            }
        except:
            return {}
    return {}

def extract_images(html_content):
    """Extract all unique image URLs from Substack post content"""
    image_urls = set()

    # Find images in the available-content section
    content_match = re.search(r'<div class="available-content">(.*?)</div>\s*</div>\s*</div>', html_content, re.DOTALL)
    if not content_match:
        # Try broader match
        content_match = re.search(r'<div class="available-content">(.*)', html_content, re.DOTALL)
        if not content_match:
            return []

    content_section = content_match.group(1)

    # Find all img src attributes - get the raw S3 URLs from substack-post-media
    for match in re.finditer(r'https://substack-post-media\.s3\.amazonaws\.com/public/images/([a-f0-9-]+\.(?:png|jpg|jpeg|gif|webp))', content_section):
        # Reconstruct clean S3 URL
        filename = match.group(1)
        clean_url = f"https://substack-post-media.s3.amazonaws.com/public/images/{filename}"
        image_urls.add(clean_url)

    return list(image_urls)

def clean_html_content(html_content, image_map):
    """Extract and clean blog post content from Substack"""

    # Extract from JSON-LD first
    json_ld = extract_json_ld(html_content)

    # Extract title from HTML
    title_match = re.search(r'<h1[^>]*class="[^"]*post-title[^"]*"[^>]*>(.*?)</h1>', html_content, re.DOTALL)
    if title_match:
        title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
        title = unescape(title)
    else:
        title = json_ld.get('title', 'Untitled')

    # Extract subtitle
    subtitle_match = re.search(r'<h3[^>]*class="[^"]*subtitle[^"]*"[^>]*>(.*?)</h3>', html_content, re.DOTALL)
    if subtitle_match:
        subtitle = re.sub(r'<[^>]+>', '', subtitle_match.group(1)).strip()
        subtitle = unescape(subtitle)
    else:
        subtitle = json_ld.get('subtitle', '')

    # Extract date from JSON-LD (better formatted)
    date_iso = json_ld.get('date_published', datetime.now().isoformat() + 'Z')

    # Parse date for display
    try:
        date_obj = datetime.fromisoformat(date_iso.replace('Z', '+00:00'))
        date_display = date_obj.strftime('%b %d, %Y')
    except:
        date_display = ''

    # Extract main content from available-content div
    content_match = re.search(r'<div class="available-content">\s*<div[^>]*class="body markup"[^>]*>(.*?)</div>\s*</div>', html_content, re.DOTALL)
    if not content_match:
        # Try simpler pattern
        content_match = re.search(r'<div class="available-content">(.*?)</div>\s*</div>\s*</div>', html_content, re.DOTALL)
        if not content_match:
            print("WARNING: Could not find available-content div")
            return {
                'title': title,
                'subtitle': subtitle,
                'date_iso': date_iso,
                'date_display': date_display,
                'content': ''
            }

    content = content_match.group(1)

    # AGGRESSIVE CLEANING - Remove ALL Substack bloat

    # Remove ALL divs completely
    content = re.sub(r'<div[^>]*>', '', content)
    content = re.sub(r'</div>', '', content)

    # Remove figure, picture, source tags
    content = re.sub(r'<figure[^>]*>', '', content)
    content = re.sub(r'</figure>', '', content)
    content = re.sub(r'<picture[^>]*>', '', content)
    content = re.sub(r'</picture>', '', content)
    content = re.sub(r'<source[^>]*>', '', content)

    # Remove ALL buttons and SVGs
    content = re.sub(r'<button[^>]*>.*?</button>', '', content, flags=re.DOTALL)
    content = re.sub(r'<svg[^>]*>.*?</svg>', '', content, flags=re.DOTALL)

    # Remove all link wrappers around images
    content = re.sub(r'<a[^>]*class="[^"]*image-link[^"]*"[^>]*>', '', content)
    content = re.sub(r'</a>', '', content)

    # Clean img tags - keep ONLY src with local path
    def replace_img(match):
        # Find the src URL in the original img tag
        src_match = re.search(r'src="([^"]+)"', match.group(0))
        if src_match:
            original_src = src_match.group(1)
            # Find the base Substack URL (before CDN transformation)
            base_match = re.search(r'substack-post-media\.s3\.amazonaws\.com/public/images/([a-f0-9-]+\.(png|jpg|gif|webp))', original_src)
            if base_match:
                # Look for this image in our image_map
                for orig_url, local_path in image_map.items():
                    if base_match.group(1) in orig_url:
                        return f'<img src="{local_path}" alt="">'
            # Fallback: try direct match
            local_src = image_map.get(original_src, original_src)
            return f'<img src="{local_src}" alt="">'
        return ''

    content = re.sub(r'<img[^>]*>', replace_img, content)

    # Remove iframes (Spotify embeds, etc.) - we'll handle these separately if needed
    content = re.sub(r'<iframe[^>]*>.*?</iframe>', '', content, flags=re.DOTALL)

    # Clean up headers - remove all attributes
    content = re.sub(r'<h([1-6])[^>]*>', r'<h\1>', content)

    # Clean up paragraphs - remove all attributes
    content = re.sub(r'<p[^>]*>', '<p>', content)

    # Clean up spans and other inline tags - remove all attributes
    content = re.sub(r'<(span|strong|em|i|b)[^>]*>', r'<\1>', content)

    # Remove empty paragraphs
    content = re.sub(r'<p>\s*</p>', '', content)

    # Clean up excessive whitespace
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    content = content.strip()

    return {
        'title': title,
        'subtitle': subtitle,
        'date_iso': date_iso,
        'date_display': date_display,
        'content': content
    }

def create_blog_post_html(post_data, slug, og_image):
    """Create clean blog post HTML"""

    # Generate meta description from content
    description_match = re.search(r'<p>(.*?)</p>', post_data['content'], re.DOTALL)
    if description_match:
        description = re.sub(r'<[^>]+>', '', description_match.group(1))
        description = unescape(description)[:200]
    else:
        description = post_data.get('subtitle', '')[:200]

    # Ensure OG image is absolute URL
    if og_image and not og_image.startswith('http'):
        og_image = f'https://forbidden-yoga.com{og_image}'

    # Subtitle section
    subtitle_html = ''
    if post_data.get('subtitle'):
        subtitle_html = f'\n        <h3 class="post-subtitle">{post_data["subtitle"]}</h3>'

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
    <meta property="twitter:image" content="{og_image}">

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

        <h1>{post_data['title']}</h1>{subtitle_html}
        <div class="post-meta">
            <time>{post_data['date_display']}</time>
        </div>
        <div class="post-content">
            {post_data['content']}
        </div>

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
        print("Usage: python3 migrate-post-WORKING.py <substack-url>")
        print("Example: python3 migrate-post-WORKING.py https://forbiddenyoga.substack.com/p/my-post")
        sys.exit(1)

    url = sys.argv[1]

    # Extract slug
    slug = extract_slug_from_url(url)
    if not slug:
        print("Error: Could not extract slug from URL")
        sys.exit(1)

    print(f"\n{'='*70}")
    print(f"MIGRATING: {slug}")
    print(f"{'='*70}\n")

    # Fetch HTML
    html_content = fetch_post_html(url, timeout=30)

    # Extract all image URLs
    print("\n--- Extracting Images ---")
    image_urls = extract_images(html_content)
    print(f"Found {len(image_urls)} images\n")

    # Download images with ORIGINAL filenames
    print("--- Downloading Images ---")
    image_map = {}
    for img_url in image_urls:
        local_path = download_image(img_url, timeout=30)
        image_map[img_url] = local_path

    print(f"\n✓ Downloaded {len(image_map)} images")

    # Clean HTML content
    print("\n--- Cleaning HTML ---")
    post_data = clean_html_content(html_content, image_map)
    print(f"Title: {post_data['title']}")
    print(f"Date: {post_data['date_display']}")
    if post_data.get('subtitle'):
        print(f"Subtitle: {post_data['subtitle']}")

    # Get first image for OG tags
    og_image = list(image_map.values())[0] if image_map else '/images/default-og-image.jpg'

    # Create final HTML
    print("\n--- Generating HTML ---")
    final_html = create_blog_post_html(post_data, slug, og_image)

    # Write to file
    output_path = Path(f'/Volumes/LaCie/CLAUDE/posts/{slug}.html')
    output_path.write_text(final_html, encoding='utf-8')

    print(f"\n{'='*70}")
    print(f"✅ SUCCESS")
    print(f"{'='*70}")
    print(f"Saved: {output_path}")
    print(f"Images: {len(image_map)} (original filenames preserved)")
    print(f"\nReview at: /posts/{slug}.html")

if __name__ == '__main__':
    main()
