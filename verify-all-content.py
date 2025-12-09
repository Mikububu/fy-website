#!/usr/bin/env python3
"""
Verify all blog posts have proper content and images.
"""

import re
from pathlib import Path

def count_text_content(html):
    """Count actual text content (not just images)."""
    content_match = re.search(
        r'<div class="post-content">(.*?)</div>\s*<a [^>]*class="back-link"',
        html,
        re.DOTALL
    )

    if not content_match:
        return 0

    content = content_match.group(1)

    # Extract all paragraph text (excluding image-only paragraphs)
    paragraphs = re.findall(r'<p>(.*?)</p>', content, flags=re.DOTALL)

    text_paras = 0
    for p in paragraphs:
        # Skip if paragraph only contains an image
        if re.match(r'^\s*<img[^>]*>\s*$', p):
            continue
        # Skip if paragraph is very short
        text = re.sub(r'<[^>]+>', '', p).strip()
        if len(text) > 20:
            text_paras += 1

    return text_paras

def count_images(html):
    """Count images in post content."""
    content_match = re.search(
        r'<div class="post-content">(.*?)</div>\s*<a [^>]*class="back-link"',
        html,
        re.DOTALL
    )

    if not content_match:
        return 0

    content = content_match.group(1)
    images = re.findall(r'<img[^>]+src="([^"]+)"', content)

    return len(images)

def get_title_subtitle(html):
    """Extract title and subtitle."""
    title_match = re.search(r'<h1[^>]*class="post-title"[^>]*>(.*?)</h1>', html)
    title = title_match.group(1).strip() if title_match else "[NO TITLE]"

    subtitle_match = re.search(r'<h3[^>]*class="post-subtitle"[^>]*>(.*?)</h3>', html)
    subtitle = subtitle_match.group(1).strip() if subtitle_match else "[NO SUBTITLE]"

    return title, subtitle

def check_post(filepath):
    """Check a single post."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
    except UnicodeDecodeError:
        return None

    title, subtitle = get_title_subtitle(html)
    text_paras = count_text_content(html)
    images = count_images(html)

    return {
        'title': title,
        'subtitle': subtitle,
        'text_paras': text_paras,
        'images': images
    }

def main():
    posts_dir = Path('/Volumes/LaCie/CLAUDE/posts')

    # Get all posts (skip resource forks)
    post_files = sorted([p for p in posts_dir.glob('*.html') if not p.name.startswith('._')])

    print(f"Verifying {len(post_files)} posts\n")
    print(f"{'Post':<50} {'Paras':<8} {'Images':<8} {'Status'}")
    print("=" * 80)

    issues = []

    for post_file in post_files:
        result = check_post(post_file)

        if result is None:
            print(f"{post_file.name:<50} {'ERROR':<8} {'ERROR':<8} Encoding error")
            issues.append(post_file.name)
            continue

        status = []
        if result['title'] == "[NO TITLE]":
            status.append("NO TITLE")
        if result['text_paras'] == 0:
            status.append("NO TEXT")
        if result['images'] == 0:
            status.append("NO IMAGES")
        if result['text_paras'] < 3 and result['text_paras'] > 0:
            status.append("SHORT")

        status_str = ", ".join(status) if status else "✓"

        print(f"{post_file.name:<50} {result['text_paras']:<8} {result['images']:<8} {status_str}")

        if status and "NO TEXT" in status:
            issues.append(post_file.name)

    print("\n" + "=" * 80)
    if issues:
        print(f"\n⚠️  {len(issues)} posts need attention:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("\n✅ All posts have content and images!")

if __name__ == '__main__':
    main()
