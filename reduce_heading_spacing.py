#!/usr/bin/env python3
import os
import re

# Directory containing blog posts
posts_dir = 'posts'

# Get all HTML files
html_files = [f for f in os.listdir(posts_dir) if f.endswith('.html') and not f.startswith('._')]

print(f'Reducing heading spacing in {len(html_files)} blog posts...\n')

for filename in html_files:
    filepath = os.path.join(posts_dir, filename)

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f'✗ Error reading {filename}: {e}')
        continue

    # Reduce heading top margin from 2em to 1em
    content = re.sub(
        r'(\.post-content\s+h[123],\s*\.post-content\s+h[123],\s*\.post-content\s+h[123]\s*\{[^}]*?)margin-top:\s*2em;',
        r'\1margin-top: 1em;',
        content
    )

    # Alternative pattern in case headings are styled individually
    content = re.sub(
        r'(\.post-content\s+h[123]\s*\{[^}]*?)margin-top:\s*2em;',
        r'\1margin-top: 1em;',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'✓ Updated {filename}')

print(f'\n✅ Successfully reduced heading spacing in {len(html_files)} blog posts')
