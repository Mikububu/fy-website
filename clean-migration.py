#!/usr/bin/env python3
"""
Clean migration script: Rebuild all blog posts with minimal, clean HTML.
No keywords, no image renaming, just clean structure.
"""

import re
import subprocess
from pathlib import Path
from datetime import datetime

def get_original_substack_html(slug):
    """Get original HTML from git history (first import)."""
    # Try to find the original import
    result = subprocess.run(
        ['git', 'log', '--all', '--format=%H', '--', f'posts/{slug}.html'],
        capture_output=True,
        text=True,
        cwd='/Volumes/LaCie/CLAUDE'
    )

    commits = result.stdout.strip().split('\n')
    if not commits or commits[0] == '':
        return None

    # Get the OLDEST commit (original import)
    oldest_commit = commits[-1]

    result = subprocess.run(
        ['git', 'show', f'{oldest_commit}:posts/{slug}.html'],
        capture_output=True,
        text=True,
        cwd='/Volumes/LaCie/CLAUDE'
    )

    return result.stdout if result.returncode == 0 else None

def extract_post_metadata(html):
    """Extract title, subtitle, date from HTML."""
    # Extract title
    title_match = re.search(r'<title>(.*?)</title>', html)
    title = title_match.group(1) if title_match else "Untitled"
    title = title.replace(' | Forbidden Yoga', '').strip()

    # Extract meta description (often the subtitle)
    desc_match = re.search(r'<meta name="description" content="([^"]+)"', html)
    subtitle = desc_match.group(1) if desc_match else ""

    # Extract date from meta or article
    date_match = re.search(r'<time[^>]*>([^<]+)</time>', html)
    if not date_match:
        date_match = re.search(r'<div class="post-meta">\s*([^<]+)', html)
    date = date_match.group(1).strip() if date_match else "May 28, 2024"

    return title, subtitle, date

def extract_clean_content(html):
    """Extract clean text content from HTML."""
    # Find post-content div
    content_match = re.search(
        r'<div class="post-content">(.*?)</div>\s*(?:<a [^>]*class="back-link"|</div>)',
        html,
        re.DOTALL
    )

    if not content_match:
        return []

    content = content_match.group(1)

    # Remove all broken Cloudflare image markup
    content = re.sub(r'<div class="captioned-image-container">.*?</figure></div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<figure>.*?</figure>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div[^>]*class="image[^"]*"[^>]*>.*?</div>', '', content, flags=re.DOTALL)

    # Remove video/button placeholders
    content = re.sub(r'<div[^>]*data-component-name="VideoEmbedPlayer"[^>]*>.*?</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<p[^>]*data-component-name="ButtonCreateButton"[^>]*>.*?</p>', '', content, flags=re.DOTALL)

    # Remove broken headers
    content = re.sub(r'<h[1-6][^>]*class="header-anchor-post"[^>]*>.*?</h[1-6]>', '', content, flags=re.DOTALL)

    # Extract paragraphs
    paragraphs = re.findall(r'<p>(.*?)</p>', content, flags=re.DOTALL)

    # Clean each paragraph
    clean_paras = []
    for p in paragraphs:
        # Remove HTML tags
        p_clean = re.sub(r'<[^>]+>', '', p)
        # Decode entities
        p_clean = p_clean.replace('&quot;', '"').replace('&amp;', '&').replace('&#39;', "'")
        p_clean = p_clean.strip()

        # Skip very short or empty paragraphs
        if len(p_clean) > 15:
            clean_paras.append(p_clean)

    return clean_paras

def find_post_images(slug, blog_images_dir):
    """Find all images for a post, preferring .jpg over .png."""
    images = []

    # Look for numbered images
    for i in range(20):  # Check up to img-19
        jpg_path = blog_images_dir / f"{slug}-img-{i}.jpg"
        png_path = blog_images_dir / f"{slug}-img-{i}.png"

        # Prefer .jpg, but check file size
        if jpg_path.exists():
            size = jpg_path.stat().st_size
            # Skip tiny files (corrupted placeholders)
            if size > 10000:  # 10KB minimum
                images.append(f"/blog-images/{slug}-img-{i}.jpg")
        elif png_path.exists():
            size = png_path.stat().st_size
            if size > 10000:
                images.append(f"/blog-images/{slug}-img-{i}.png")

    return images

def build_clean_html(slug, title, subtitle, date, paragraphs, images):
    """Build clean, minimal HTML."""

    # Distribute images throughout content
    content_parts = []

    # First image at top if available
    if images:
        content_parts.append(f'            <p><img src="{images[0]}" alt=""></p>')
        remaining_images = images[1:]
    else:
        remaining_images = []

    # Add paragraphs with images distributed
    if paragraphs:
        img_interval = max(5, len(paragraphs) // (len(remaining_images) + 1)) if remaining_images else 999

        img_idx = 0
        for i, para in enumerate(paragraphs):
            content_parts.append(f'            <p>{para}</p>')

            # Add image every N paragraphs
            if img_idx < len(remaining_images) and (i + 1) % img_interval == 0 and i < len(paragraphs) - 2:
                content_parts.append(f'            <p><img src="{remaining_images[img_idx]}" alt=""></p>')
                img_idx += 1

        # Add remaining images at end
        while img_idx < len(remaining_images):
            content_parts.insert(-1, f'            <p><img src="{remaining_images[img_idx]}" alt=""></p>')
            img_idx += 1

    content_html = '\n'.join(content_parts)

    # Build full HTML
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Forbidden Yoga</title>
    <meta name="description" content="{subtitle[:160]}">
    <meta name="keywords" content="tantra yoga, kundalini awakening, tantric healing, sacred sexuality, spiritual awakening, {slug.replace('-', ' ')}, forbidden yoga">
    <link rel="stylesheet" href="/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="/blog-post.css">
    <link rel="canonical" href="https://forbidden-yoga.com/posts/{slug}.html">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://forbidden-yoga.com/posts/{slug}.html">
    <meta property="og:title" content="{title} | Forbidden Yoga">
    <meta property="og:description" content="{subtitle[:160]}">
    <meta property="og:image" content="https://forbidden-yoga.com/images/{slug}-featured.jpg">
    <meta property="og:site_name" content="Forbidden Yoga">
    <meta property="article:author" content="Michael Perin Wogenburg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{subtitle[:160]}">
    <meta name="twitter:image" content="https://forbidden-yoga.com/images/{slug}-featured.jpg">
    <script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{title}",
  "description": "{subtitle[:160]}",
  "image": "https://forbidden-yoga.com/blog-thumbnails/{slug}.png",
  "author": {{
    "@type": "Person",
    "name": "Michael Perin Wogenburg"
  }},
  "publisher": {{
    "@type": "Organization",
    "name": "Forbidden Yoga"
  }}
}}
    </script>
    <link rel="icon" type="image/png" href="/favicon.png">
</head>
<body>
    <article class="post-container">
        <a href="/#blog-section" class="top-back-link">← Back to all posts</a>
        <h1 class="post-title">{title}</h1>
        <h3 class="post-subtitle">{subtitle}</h3>
        <div class="post-meta">
            <time>{date}</time>
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

    return html

def migrate_post(slug, posts_dir, blog_images_dir):
    """Migrate a single post."""
    print(f"Migrating: {slug}")

    # Get original HTML
    original_html = get_original_substack_html(slug)
    if not original_html:
        print(f"  ⚠️  No git history found, reading current file")
        current_file = posts_dir / f"{slug}.html"
        if not current_file.exists():
            print(f"  ❌ File not found")
            return False
        with open(current_file, 'r', encoding='utf-8') as f:
            original_html = f.read()

    # Extract metadata
    title, subtitle, date = extract_post_metadata(original_html)

    # Extract content
    paragraphs = extract_clean_content(original_html)

    if not paragraphs:
        print(f"  ⚠️  No content extracted")
        return False

    # Find images
    images = find_post_images(slug, blog_images_dir)

    # Build clean HTML
    clean_html = build_clean_html(slug, title, subtitle, date, paragraphs, images)

    # Write file
    output_file = posts_dir / f"{slug}.html"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(clean_html)

    print(f"  ✅ {len(paragraphs)} paragraphs, {len(images)} images")
    return True

def main():
    posts_dir = Path('/Volumes/LaCie/CLAUDE/posts')
    blog_images_dir = Path('/Volumes/LaCie/CLAUDE/blog-images')

    # Get all current posts (skip macOS resource forks)
    post_files = sorted([p for p in posts_dir.glob('*.html') if not p.name.startswith('._')])

    print(f"Starting clean migration of {len(post_files)} posts\n")

    success_count = 0
    for post_file in post_files:
        slug = post_file.stem
        if migrate_post(slug, posts_dir, blog_images_dir):
            success_count += 1

    print(f"\n✅ Successfully migrated {success_count}/{len(post_files)} posts")

if __name__ == '__main__':
    main()
