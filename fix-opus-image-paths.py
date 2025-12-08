#!/usr/bin/env python3
"""
Fix malformed image URLs created by Opus that look like:
/blog-images/post-img-0.jpg,w_1456,c_limit,f_auto,q_auto:good,/blog-images/post-img-2.jpg

Should be just:
/blog-images/post-img-0.jpg
"""

import re
import sys
from pathlib import Path

def fix_image_urls(html_content):
    """Remove Cloudinary-style URL parameters from local image paths"""
    # Pattern: /blog-images/filename.ext,anything,/blog-images/filename2.ext
    # Replace with just: /blog-images/filename.ext
    pattern = r'(/blog-images/[^"]+?)(,w_[^"]+?)(")'
    replacement = r'\1\3'

    fixed = re.sub(pattern, replacement, html_content)
    return fixed

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 fix-opus-image-paths.py <html_file> [<html_file2> ...]")
        sys.exit(1)

    fixed_count = 0
    for filename in sys.argv[1:]:
        filepath = Path(filename)

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        fixed_content = fix_image_urls(content)

        if content != fixed_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"✅ Fixed: {filepath.name}")
            fixed_count += 1
        else:
            print(f"⏭️  No changes needed: {filepath.name}")

    print(f"\n✨ Fixed {fixed_count} file(s)")

if __name__ == '__main__':
    main()
