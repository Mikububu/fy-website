#!/usr/bin/env python3
import os
import re

# Directory containing blog posts
posts_dir = 'posts'

# Get all HTML files
html_files = [f for f in os.listdir(posts_dir) if f.endswith('.html') and not f.startswith('._')]

print(f'Adding styled container to {len(html_files)} blog posts...\n')

for filename in html_files:
    filepath = os.path.join(posts_dir, filename)

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f'✗ Error reading {filename}: {e}')
        continue

    # Update the post-container style to add background, padding, and rounded edges
    content = re.sub(
        r'(\.post-container\s*\{[^}]*?max-width:\s*800px;[^}]*?margin:\s*0 auto;[^}]*?)padding:\s*60px 20px;',
        r'\1padding: 40px 20px;',
        content,
        flags=re.DOTALL
    )

    # Add a new inner container style after the post-container style
    # Find the closing brace of post-container and add new style after it
    container_style = '''
        .post-inner-container {
            background-color: rgba(200, 198, 170, 0.3);
            padding: 50px 40px;
            border-radius: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 768px) {
            .post-inner-container {
                padding: 30px 20px;
                border-radius: 15px;
            }
        }
'''

    # Insert the new style after .post-container definition
    content = re.sub(
        r'(\.post-container\s*\{[^}]*\})',
        r'\1' + container_style,
        content,
        count=1
    )

    # Wrap the article content in the new container div
    # Find the article opening and wrap its contents
    content = re.sub(
        r'(<article class="post-container">)\s*(<h1 class="post-title">)',
        r'\1\n        <div class="post-inner-container">\n        \2',
        content
    )

    # Close the div before the back link
    content = re.sub(
        r'(</div>\s*<a href="/#blog-section" class="back-link">)',
        r'</div>\n        </div>\n        \1',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'✓ Updated {filename}')

print(f'\n✅ Successfully added styled container to {len(html_files)} blog posts')
