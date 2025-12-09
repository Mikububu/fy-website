#!/usr/bin/env python3
"""
Check all blog posts for content issues:
- No text content
- No images
- Broken image markup
"""

import re
from pathlib import Path

def check_post(filepath):
    """Check a post for issues."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return [f"Encoding error - not a valid HTML file"]

    issues = []

    # Find post-content div
    content_match = re.search(
        r'<div class="post-content">(.*?)</div>\s*<a [^>]*class="back-link"',
        content,
        re.DOTALL
    )

    if not content_match:
        issues.append("No post-content div found")
        return issues

    post_content = content_match.group(1)

    # Check for text paragraphs
    paragraphs = re.findall(r'<p>(?!<img)(.*?)</p>', post_content, re.DOTALL)
    text_paragraphs = [p for p in paragraphs if p.strip() and not p.strip().startswith('<img')]

    if len(text_paragraphs) < 2:
        issues.append(f"Very short content ({len(text_paragraphs)} text paragraphs)")

    # Check for images
    images = re.findall(r'<img[^>]+src="([^"]+)"', post_content)

    if not images:
        issues.append("No images")

    # Check for broken Cloudflare markup
    if 'captioned-image-container' in post_content:
        issues.append("Has broken Cloudflare image markup")

    if ',w_' in post_content or ',c_limit' in post_content:
        issues.append("Has Cloudflare URL parameters")

    return issues

def main():
    posts_dir = Path('/Volumes/LaCie/CLAUDE/posts')

    all_issues = {}

    for post_file in sorted(posts_dir.glob('*.html')):
        issues = check_post(post_file)
        if issues:
            all_issues[post_file.name] = issues

    if all_issues:
        print(f"\nFound issues in {len(all_issues)} posts:\n")
        for post, issues in all_issues.items():
            print(f"{post}:")
            for issue in issues:
                print(f"  - {issue}")
            print()
    else:
        print("\n✅ All posts look good!")

if __name__ == '__main__':
    main()
