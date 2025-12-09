#!/usr/bin/env python3
"""
Fix broken Cloudflare-style image markup in blog posts.
Converts broken srcset/picture elements to clean <img> tags.
"""

import re
import os
from pathlib import Path

def extract_image_filenames(broken_html):
    """Extract actual image filenames from broken markup."""
    # Find all references to blog-images files
    pattern = r'/blog-images/([\w-]+)-img-(\d+)\.(jpg|png|webp)'
    matches = re.findall(pattern, broken_html)

    # Get unique image files, sorted by number
    images = []
    seen = set()
    for slug, num, ext in matches:
        # Prefer .jpg over .webp
        filename = f"/blog-images/{slug}-img-{num}.jpg"
        if filename not in seen:
            images.append((int(num), filename))
            seen.add(filename)

    # Sort by image number
    images.sort()
    return [img[1] for img in images]

def fix_post(filepath):
    """Fix broken images in a single post."""
    print(f"Processing: {filepath}")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the post-content div (handle both link formats)
    content_match = re.search(
        r'<div class="post-content">(.*?)</div>\s*<a [^>]*class="back-link"[^>]*>',
        content,
        re.DOTALL
    )

    if not content_match:
        print(f"  ⚠️  Could not find post-content div")
        return False

    old_content = content_match.group(1)

    # Extract image filenames from broken markup
    images = extract_image_filenames(old_content)

    if not images:
        print(f"  ⚠️  No images found in markup")
        return False

    print(f"  Found {len(images)} images: {images}")

    # Remove all broken image markup (captioned-image-container, figure, picture, etc.)
    cleaned = re.sub(
        r'<div class="captioned-image-container">.*?</div>',
        '',
        old_content,
        flags=re.DOTALL
    )

    # Split into paragraphs
    paragraphs = re.findall(r'<p>.*?</p>', cleaned, re.DOTALL)

    if not paragraphs:
        print(f"  ⚠️  No paragraphs found")
        return False

    # Insert images between paragraphs at reasonable intervals
    new_paragraphs = []
    total_paras = len(paragraphs)
    img_interval = max(3, total_paras // (len(images) + 1))

    img_index = 0
    for i, para in enumerate(paragraphs):
        new_paragraphs.append(para)

        # Insert image after every N paragraphs
        if img_index < len(images) and (i + 1) % img_interval == 0 and i < total_paras - 1:
            new_paragraphs.append(f'            <p><img src="{images[img_index]}" alt=""></p>')
            img_index += 1

    # Add any remaining images at the end
    while img_index < len(images):
        new_paragraphs.append(f'            <p><img src="{images[img_index]}" alt=""></p>')
        img_index += 1

    new_content = '\n            '.join(new_paragraphs)

    # Replace the content
    new_full = content.replace(old_content, new_content)

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_full)

    print(f"  ✅ Fixed with {len(images)} images")
    return True

def main():
    posts_dir = Path('/Volumes/LaCie/CLAUDE/posts')

    # List of broken posts
    broken_posts = [
        'yogic-transmission-in-raja-yoga.html',
    ]

    fixed_count = 0
    for post in broken_posts:
        filepath = posts_dir / post
        if filepath.exists():
            if fix_post(filepath):
                fixed_count += 1

    print(f"\n✅ Fixed {fixed_count}/{len(broken_posts)} posts")

if __name__ == '__main__':
    main()
