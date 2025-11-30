#!/usr/bin/env python3
import os
import re

# Directory containing blog posts
posts_dir = 'posts'

# Get all HTML files
html_files = [f for f in os.listdir(posts_dir) if f.endswith('.html')]

print(f'Updating font weight in {len(html_files)} blog posts...\n')

for filename in html_files:
    filepath = os.path.join(posts_dir, filename)

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f'✗ Error reading {filename}: {e}')
        continue

    # Replace font-weight: 100 with font-weight: 400 in body style
    content = re.sub(
        r'(body\s*\{[^}]*font-family:\s*[^;]+;\s*)font-weight:\s*100;',
        r'\1font-weight: 400;',
        content
    )

    # Also update the Google Fonts URL to only load 400 weight (remove 100)
    content = content.replace(
        'family=Roboto:wght@100;400',
        'family=Roboto:wght@400'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'✓ Updated {filename}')

print(f'\n✅ Successfully updated {len(html_files)} blog posts to use Roboto normal weight (400)')
