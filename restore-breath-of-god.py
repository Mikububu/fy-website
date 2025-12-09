#!/usr/bin/env python3
"""
Restore the-breath-of-god.html with full content from git history.
Extracts clean text from broken Cloudflare markup and rebuilds with proper structure.
"""

import re
from pathlib import Path
import subprocess

def extract_clean_text(html):
    """Extract clean paragraph text from broken Cloudflare markup."""
    # Remove all image markup (captioned-image-container, figure, picture tags)
    cleaned = re.sub(r'<div class="captioned-image-container">.*?</figure></div>', '', html, flags=re.DOTALL)
    cleaned = re.sub(r'<figure>.*?</figure>', '', cleaned, flags=re.DOTALL)

    # Remove button wrappers
    cleaned = re.sub(r'<p[^>]*data-component-name="ButtonCreateButton"[^>]*>.*?</p>', '', cleaned, flags=re.DOTALL)

    # Remove video embed placeholders
    cleaned = re.sub(r'<div[^>]*data-component-name="VideoEmbedPlayer"[^>]*>.*?</div>', '', cleaned, flags=re.DOTALL)

    # Remove broken header elements
    cleaned = re.sub(r'<h[34][^>]*class="header-anchor-post"[^>]*>.*?</div></div></h[34]>', '', cleaned, flags=re.DOTALL)

    # Extract actual paragraph text
    paragraphs = re.findall(r'<p>(.*?)</p>', cleaned, flags=re.DOTALL)

    # Clean up each paragraph
    clean_paras = []
    for p in paragraphs:
        # Remove any remaining HTML tags
        p_clean = re.sub(r'<[^>]+>', '', p)
        # Decode HTML entities
        p_clean = p_clean.replace('&quot;', '"').replace('&amp;', '&')
        # Strip whitespace
        p_clean = p_clean.strip()
        if p_clean and len(p_clean) > 10:  # Skip very short fragments
            clean_paras.append(p_clean)

    return clean_paras

def main():
    # Get the full content from git
    result = subprocess.run(
        ['git', 'show', 'ecf7f5e:posts/the-breath-of-god.html'],
        capture_output=True,
        text=True,
        cwd='/Volumes/LaCie/CLAUDE'
    )

    old_html = result.stdout

    # Extract post-content section
    content_match = re.search(
        r'<div class="post-content">(.*?)</div>\s*</div>\s*<a [^>]*class="back-link"',
        old_html,
        re.DOTALL
    )

    if not content_match:
        print("Could not find post-content section")
        return

    old_content = content_match.group(1)
    paragraphs = extract_clean_text(old_content)

    print(f"Extracted {len(paragraphs)} clean paragraphs")

    # Valid images (prefer .jpg, use .png for larger files)
    images = [
        '/blog-images/the-breath-of-god-img-0.jpg',  # Featured image at top
        '/blog-images/the-breath-of-god-img-3.jpg',
        '/blog-images/the-breath-of-god-img-4.png',  # Use PNG (780KB) instead of small JPG
        '/blog-images/the-breath-of-god-img-5.png',
        '/blog-images/the-breath-of-god-img-6.png',
        '/blog-images/the-breath-of-god-img-7.png',
    ]

    # Build new content with images distributed throughout
    new_content_parts = []

    # Featured image at TOP
    new_content_parts.append(f'<p><img src="{images[0]}" alt=""></p>')

    # Distribute remaining images throughout paragraphs
    total_paras = len(paragraphs)
    img_interval = max(8, total_paras // len(images))  # Image every ~8 paragraphs

    img_index = 1  # Start from second image
    for i, para in enumerate(paragraphs):
        new_content_parts.append(f'<p>{para}</p>')

        # Insert image after certain paragraphs
        if img_index < len(images) and (i + 1) % img_interval == 0 and i < total_paras - 2:
            new_content_parts.append(f'<p><img src="{images[img_index]}" alt=""></p>')
            img_index += 1

    # Add any remaining images at the end (before email)
    while img_index < len(images):
        new_content_parts.insert(-1, f'<p><img src="{images[img_index]}" alt=""></p>')
        img_index += 1

    new_content = '\n            '.join(new_content_parts)

    # Read current file
    current_file = Path('/Volumes/LaCie/CLAUDE/posts/the-breath-of-god.html')
    with open(current_file, 'r', encoding='utf-8') as f:
        current_html = f.read()

    # Find and replace post-content
    current_content_match = re.search(
        r'(<div class="post-content">).*?(</div>\s*<a [^>]*class="back-link")',
        current_html,
        re.DOTALL
    )

    if not current_content_match:
        print("Could not find post-content in current file")
        return

    new_html = current_html[:current_content_match.start(1)] + \
               '<div class="post-content">\n            ' + \
               new_content + '\n        ' + \
               current_html[current_content_match.start(2):]

    # Write back
    with open(current_file, 'w', encoding='utf-8') as f:
        f.write(new_html)

    print(f"✅ Restored the-breath-of-god.html with {len(paragraphs)} paragraphs and {len(images)} images")

if __name__ == '__main__':
    main()
