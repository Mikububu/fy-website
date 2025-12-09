#!/usr/bin/env python3
"""
Standardize all blog posts with consistent, clean HTML structure.
Preserves existing content, just ensures consistent wrapper/meta tags.
"""

import re
from pathlib import Path

def standardize_post(filepath):
    """Standardize a single post's HTML structure."""
    print(f"Standardizing: {filepath.name}")

    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Extract key components
    title_match = re.search(r'<title>(.*?)</title>', html)
    title = title_match.group(1).replace(' | Forbidden Yoga', '').strip() if title_match else "Untitled"

    # Get h1 title
    h1_match = re.search(r'<h1[^>]*class="post-title"[^>]*>(.*?)</h1>', html)
    h1_title = h1_match.group(1).strip() if h1_match else title

    # Get subtitle
    h3_match = re.search(r'<h3[^>]*class="post-subtitle"[^>]*>(.*?)</h3>', html)
    subtitle = h3_match.group(1).strip() if h3_match else ""

    # Get date
    time_match = re.search(r'<time[^>]*>(.*?)</time>', html)
    date = time_match.group(1).strip() if time_match else "May 28, 2024"

    # Get slug
    slug = filepath.stem

    # Get post-content
    content_match = re.search(
        r'<div class="post-content">(.*?)</div>\s*<a [^>]*class="back-link"',
        html,
        re.DOTALL
    )

    if not content_match:
        print(f"  ⚠️  Could not extract post-content")
        return False

    post_content = content_match.group(1).strip()

    # Build standardized HTML
    standard_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{h1_title} | Forbidden Yoga</title>
    <meta name="description" content="{subtitle[:160] if subtitle else h1_title}">
    <meta name="keywords" content="tantra yoga, kundalini awakening, tantric healing, sacred sexuality, spiritual awakening, {slug.replace('-', ' ')}, forbidden yoga">
    <link rel="stylesheet" href="/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@100;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/blog-post.css">
    <link rel="canonical" href="https://forbidden-yoga.com/posts/{slug}.html">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://forbidden-yoga.com/posts/{slug}.html">
    <meta property="og:title" content="{h1_title} | Forbidden Yoga">
    <meta property="og:description" content="{subtitle[:160] if subtitle else h1_title}">
    <meta property="og:image" content="https://forbidden-yoga.com/images/{slug}-featured.jpg">
    <meta property="og:site_name" content="Forbidden Yoga">
    <meta property="article:author" content="Michael Perin Wogenburg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{h1_title}">
    <meta name="twitter:description" content="{subtitle[:160] if subtitle else h1_title}">
    <meta name="twitter:image" content="https://forbidden-yoga.com/images/{slug}-featured.jpg">
    <script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{h1_title}",
  "description": "{subtitle if subtitle else h1_title}",
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
        <h1 class="post-title">{h1_title}</h1>
        <h3 class="post-subtitle">{subtitle}</h3>
        <div class="post-meta">
            <time>{date}</time>
        </div>
        <div class="post-content">
{post_content}
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

    # Write standardized HTML
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(standard_html)

    print(f"  ✅ Standardized")
    return True

def main():
    posts_dir = Path('/Volumes/LaCie/CLAUDE/posts')

    # Get all posts (skip resource forks)
    post_files = sorted([p for p in posts_dir.glob('*.html') if not p.name.startswith('._')])

    print(f"Standardizing {len(post_files)} posts\n")

    success = 0
    for post_file in post_files:
        if standardize_post(post_file):
            success += 1

    print(f"\n✅ Standardized {success}/{len(post_files)} posts")

if __name__ == '__main__':
    main()
