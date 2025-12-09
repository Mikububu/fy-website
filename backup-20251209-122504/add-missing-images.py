#!/usr/bin/env python3
"""
Find all posts with images in blog-images folder but no images in HTML,
and add the images to the posts.
"""

import re
from pathlib import Path

def get_post_slug(filename):
    """Extract slug from HTML filename."""
    return filename.replace('.html', '')

def find_images_for_post(slug, blog_images_dir):
    """Find all images for a given post slug."""
    pattern = f"{slug}-img-*.jpg"
    images = sorted(blog_images_dir.glob(pattern))
    # Prefer .jpg over .png
    return [str(img.relative_to(blog_images_dir.parent)) for img in images]

def post_has_images(filepath):
    """Check if post already has images in content."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return True  # Skip files with encoding errors

    content_match = re.search(
        r'<div class="post-content">(.*?)</div>\s*<a [^>]*class="back-link"',
        content,
        re.DOTALL
    )

    if not content_match:
        return False

    post_content = content_match.group(1)
    return '<img' in post_content

def add_images_to_post(filepath, images):
    """Add images evenly distributed throughout post content."""
    print(f"Processing: {filepath.name}")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find post-content div
    content_match = re.search(
        r'<div class="post-content">(.*?)</div>\s*<a [^>]*class="back-link"',
        content,
        re.DOTALL
    )

    if not content_match:
        print(f"  ⚠️  Could not find post-content div")
        return False

    old_content = content_match.group(1)

    # Split into paragraphs
    paragraphs = re.findall(r'<p>.*?</p>', old_content, re.DOTALL)

    if not paragraphs:
        print(f"  ⚠️  No paragraphs found")
        return False

    # Insert images between paragraphs
    new_paragraphs = []
    total_paras = len(paragraphs)
    img_interval = max(1, total_paras // (len(images) + 1))

    img_index = 0
    for i, para in enumerate(paragraphs):
        # Add image before paragraph at intervals
        if img_index < len(images) and (i % img_interval == 0 or i == 0):
            new_paragraphs.append(f'            <p><img src="/{images[img_index]}" alt=""></p>')
            img_index += 1

        new_paragraphs.append(para)

    # Add any remaining images at the end
    while img_index < len(images):
        new_paragraphs.append(f'            <p><img src="/{images[img_index]}" alt=""></p>')
        img_index += 1

    new_content = '\n            '.join(new_paragraphs)

    # Replace content
    new_full = content.replace(old_content, new_content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_full)

    print(f"  ✅ Added {len(images)} images")
    return True

def main():
    posts_dir = Path('/Volumes/LaCie/CLAUDE/posts')
    blog_images_dir = Path('/Volumes/LaCie/CLAUDE/blog-images')

    posts_fixed = []

    for post_file in sorted(posts_dir.glob('*.html')):
        slug = get_post_slug(post_file.name)

        # Check if images exist for this post
        images = find_images_for_post(slug, blog_images_dir)

        if not images:
            continue

        # Check if post already has images
        if post_has_images(post_file):
            continue

        # Add images to post
        if add_images_to_post(post_file, images):
            posts_fixed.append(post_file.name)

    if posts_fixed:
        print(f"\n✅ Fixed {len(posts_fixed)} posts:")
        for post in posts_fixed:
            print(f"  - {post}")
    else:
        print("\n✅ All posts already have images!")

if __name__ == '__main__':
    main()
