#!/usr/bin/env python3
"""
Simple BeautifulSoup-based Substack migration script
Properly parses HTML instead of using fragile regex
"""

import sys
import json
import urllib.request
import ssl
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re

# SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def fetch_url(url):
    """Fetch URL content"""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
        return response.read().decode('utf-8')

def extract_slug(url):
    """Extract slug from URL"""
    return url.split('/p/')[-1].rstrip('/').split('?')[0]

def get_image_hash_from_url(url):
    """Extract image hash from Substack URL"""
    match = re.search(r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', url)
    if match:
        ext = '.png' if '.png' in url else '.gif' if '.gif' in url else '.webp' if '.webp' in url else '.jpg'
        return match.group(1) + ext
    return None

def download_image(url):
    """Download image with original hash filename"""
    filename = get_image_hash_from_url(url)
    if not filename:
        return None

    local_path = Path(f'/Volumes/LaCie/CLAUDE/blog-images/{filename}')

    if local_path.exists():
        print(f"  ✓ Already exists: {filename}")
        return f"/blog-images/{filename}"

    try:
        print(f"  Downloading: {filename}")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
            image_data = response.read()
        local_path.write_bytes(image_data)
        print(f"  ✓ Saved: {filename}")
        return f"/blog-images/{filename}"
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return None

def clean_element(elem):
    """Recursively clean a BeautifulSoup element"""
    if elem is None:
        return

    # Remove all Substack-specific classes and attributes
    if elem.name:
        # Keep only essential attributes
        allowed_attrs = ['href', 'src', 'alt']
        attrs_to_remove = [attr for attr in elem.attrs if attr not in allowed_attrs]
        for attr in attrs_to_remove:
            del elem[attr]

    # Remove unwanted tags entirely
    unwanted_tags = ['button', 'svg', 'script', 'style', 'iframe', 'source', 'picture']
    for tag in unwanted_tags:
        for unwanted in elem.find_all(tag):
            unwanted.decompose()

    # Remove unwanted divs (keep simple structure)
    for div in elem.find_all('div'):
        # If div has no useful content, remove it
        div.unwrap()

    # Remove figures and wrappers
    for tag in elem.find_all(['figure', 'a']):
        tag.unwrap()

def migrate_post(url):
    """Main migration function"""
    slug = extract_slug(url)
    print(f"\n{'='*70}")
    print(f"Migrating: {slug}")
    print(f"{'='*70}\n")

    # Fetch HTML
    html = fetch_url(url)
    soup = BeautifulSoup(html, 'html.parser')

    # Extract JSON-LD metadata
    json_ld = soup.find('script', {'type': 'application/ld+json'})
    metadata = {}
    if json_ld:
        try:
            metadata = json.loads(json_ld.string)
        except:
            pass

    # Extract title
    title = metadata.get('headline', 'Untitled')

    # Extract subtitle
    subtitle_elem = soup.find('h3', class_=lambda x: x and 'subtitle' in x)
    subtitle = subtitle_elem.get_text().strip() if subtitle_elem else metadata.get('description', '')

    # Extract date
    date_iso = metadata.get('datePublished', datetime.now().isoformat() + 'Z')
    try:
        date_obj = datetime.fromisoformat(date_iso.replace('Z', '+00:00'))
        date_display = date_obj.strftime('%b %d, %Y')
    except:
        date_display = ''

    # Extract content from available-content div
    content_div = soup.find('div', class_='available-content')
    if not content_div:
        print("ERROR: Could not find content div")
        return False

    # Find body markup div
    body_div = content_div.find('div', class_='body markup')
    if not body_div:
        body_div = content_div

    # Download images BEFORE cleaning
    print("\n--- Downloading Images ---")
    image_map = {}
    for img in body_div.find_all('img'):
        src = img.get('src', '')
        if 'substack-post-media' in src:
            local_path = download_image(src)
            if local_path:
                image_map[src] = local_path
                img['src'] = local_path
                img['alt'] = ''

    print(f"\n✓ Downloaded {len(image_map)} images")

    # Clean the content
    print("\n--- Cleaning HTML ---")
    clean_element(body_div)

    # Get clean HTML
    content_html = str(body_div)

    # Final cleanup of any remaining wrapper
    content_html = content_html.replace('<div class="body markup">', '').replace('</div>', '', 1) if 'class="body markup"' in content_html else content_html

    # Generate meta description
    first_p = body_div.find('p')
    description = first_p.get_text()[:200] if first_p else subtitle[:200]

    # Get OG image (first downloaded image or default)
    og_image = list(image_map.values())[0] if image_map else '/images/default-og-image.jpg'
    if not og_image.startswith('http'):
        og_image = f'https://forbidden-yoga.com{og_image}'

    # Create HTML
    subtitle_html = f'\n        <h3 class="post-subtitle">{subtitle}</h3>' if subtitle else ''

    html_output = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Forbidden Yoga</title>
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
    <meta property="og:title" content="{title} | Forbidden Yoga">
    <meta property="og:description" content="{description}">
    <meta property="og:image" content="{og_image}">
    <meta property="og:site_name" content="Forbidden Yoga">
    <meta property="article:published_time" content="{date_iso}">
    <meta property="article:author" content="Michael Perin Wogenburg">
    <meta property="article:section" content="Tantra Yoga">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://forbidden-yoga.com/posts/{slug}.html">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">
    <meta name="twitter:image" content="{og_image}">

    <!-- Structured Data -->
    <script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{title}",
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
  "datePublished": "{date_iso}",
  "dateModified": "{date_iso}",
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

        <h1>{title}</h1>{subtitle_html}
        <div class="post-meta">
            <time>{date_display}</time>
        </div>
        <div class="post-content">
            {content_html}
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

    # Save file
    output_path = Path(f'/Volumes/LaCie/CLAUDE/posts/{slug}.html')
    output_path.write_text(html_output, encoding='utf-8')

    print(f"\n{'='*70}")
    print(f"✅ SUCCESS")
    print(f"{'='*70}")
    print(f"Title: {title}")
    print(f"Date: {date_display}")
    print(f"Images: {len(image_map)}")
    print(f"Saved: {output_path}")

    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 migrate-beautifulsoup.py <substack-url>")
        sys.exit(1)

    migrate_post(sys.argv[1])
