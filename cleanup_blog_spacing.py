#!/usr/bin/env python3
import os
import re

# Directory containing blog posts
posts_dir = 'posts'

# Get all HTML files
html_files = [f for f in os.listdir(posts_dir) if f.endswith('.html') and not f.startswith('._')]

print(f'Cleaning up spacing in {len(html_files)} blog posts...\n')

for filename in html_files:
    filepath = os.path.join(posts_dir, filename)

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f'✗ Error reading {filename}: {e}')
        continue

    # Remove empty paragraph tags that create gaps
    content = re.sub(r'<p>\s*</p>', '', content)

    # Remove multiple consecutive empty paragraphs
    content = re.sub(r'(<p></p>\s*)+', '', content)

    # Make the container width flexible - change max-width to use viewport width
    content = re.sub(
        r'(\.post-container\s*\{\s*)max-width:\s*800px;',
        r'\1max-width: min(90%, 1000px);',
        content
    )

    # Reduce margin on video embeds and image containers
    content = re.sub(
        r'(\.post-content\s+iframe\s*\{[^}]*?)margin:\s*2em 0;',
        r'\1margin: 1.5em 0;',
        content
    )

    content = re.sub(
        r'(\.post-content\s+img\s*\{[^}]*?)margin:\s*2em 0;',
        r'\1margin: 1.5em 0;',
        content
    )

    # Add styling for native video embeds and captioned images to reduce spacing
    if '.native-video-embed' not in content and '.captioned-image-container' not in content:
        # Add these styles after the iframe style
        video_styles = '''
        .post-content .native-video-embed {
            margin: 1.5em 0;
        }

        .post-content .captioned-image-container {
            margin: 1.5em 0;
        }
'''
        content = re.sub(
            r'(\.post-content\s+iframe\s*\{[^}]*\})',
            r'\1' + video_styles,
            content,
            count=1
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'✓ Cleaned {filename}')

print(f'\n✅ Successfully cleaned spacing in {len(html_files)} blog posts')
