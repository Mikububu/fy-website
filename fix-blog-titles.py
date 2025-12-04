#!/usr/bin/env python3
import json
import os
import re

# Read posts data
with open('posts-data.json', 'r', encoding='utf-8') as f:
    posts_data = json.load(f)

print(f"Found {len(posts_data)} posts in posts-data.json")

# Process each post
fixed_count = 0
for post in posts_data:
    # Get the filename from URL
    url = post.get('url', '')
    if not url.startswith('/posts/'):
        continue

    filename = url.replace('/posts/', 'posts/')

    if not os.path.exists(filename):
        print(f"File not found: {filename}")
        continue

    title = post.get('title', '')
    description = post.get('description', '')

    if not title:
        print(f"No title for {filename}")
        continue

    # Read the HTML file
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    # Check if title is empty
    if '<title> | Forbidden Yoga</title>' in html or '<h1 class="post-title"></h1>' in html:
        # Fix <title> tag
        html = html.replace(
            '<title> | Forbidden Yoga</title>',
            f'<title>{title} | Forbidden Yoga</title>'
        )

        # Fix <h1> tag
        html = html.replace(
            '<h1 class="post-title"></h1>',
            f'<h1 class="post-title">{title}</h1>'
        )

        # Write back
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)

        fixed_count += 1
        print(f"Fixed: {filename}")

print(f"\nFixed {fixed_count} blog posts")
