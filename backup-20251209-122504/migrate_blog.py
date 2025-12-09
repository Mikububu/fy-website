#!/usr/bin/env python3
import urllib.request
import re
import json
import os
from datetime import datetime
from html import unescape

def fetch_rss():
    """Fetch RSS feed from Substack"""
    url = 'https://forbiddenyoga.substack.com/feed'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        return response.read().decode('utf-8')

def parse_rss(xml):
    """Parse RSS XML and extract posts"""
    posts = []

    # Find all items
    item_pattern = re.compile(r'<item>(.*?)</item>', re.DOTALL)
    items = item_pattern.findall(xml)

    for item_xml in items:
        # Extract fields
        title_match = re.search(r'<title><!\[CDATA\[(.*?)\]\]></title>', item_xml)
        desc_match = re.search(r'<description><!\[CDATA\[(.*?)\]\]></description>', item_xml)
        link_match = re.search(r'<link>(.*?)</link>', item_xml)
        date_match = re.search(r'<pubDate>(.*?)</pubDate>', item_xml)
        content_match = re.search(r'<content:encoded><!\[CDATA\[(.*?)\]\]></content:encoded>', item_xml, re.DOTALL)

        if title_match and content_match:
            title = unescape(title_match.group(1))
            description = unescape(desc_match.group(1)) if desc_match else ''
            link = link_match.group(1) if link_match else ''
            pub_date = date_match.group(1) if date_match else ''
            content = content_match.group(1)

            # Create slug from link
            slug = link.split('/p/')[-1] if '/p/' in link else re.sub(r'[^a-z0-9]+', '-', title.lower())

            posts.append({
                'title': title,
                'description': description,
                'link': link,
                'pubDate': pub_date,
                'content': content,
                'slug': slug
            })

    return posts

def generate_post_html(post):
    """Generate HTML for a single post"""
    # Format date
    try:
        date_obj = datetime.strptime(post['pubDate'], '%a, %d %b %Y %H:%M:%S %Z')
        formatted_date = date_obj.strftime('%B %d, %Y')
    except:
        formatted_date = post['pubDate']

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{post['title']} | Forbidden Yoga</title>
    <meta name="description" content="{post['description']}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@100;400&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Roboto', sans-serif;
            font-weight: 100;
            background-color: #f3f2de;
            color: #2a2a2a;
            line-height: 1.8;
        }}

        .header {{
            background-color: #f3f2de;
            padding: 40px 20px;
            text-align: center;
        }}

        .logo-link {{
            display: inline-block;
        }}

        .logo {{
            max-width: 200px;
            height: auto;
        }}

        .post-container {{
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 20px;
        }}

        .post-title {{
            font-family: 'Playfair Display', serif;
            font-size: 3.5rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 20px;
            line-height: 1.2;
        }}

        .post-meta {{
            font-size: 0.95rem;
            color: #666;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid #d0d0d0;
        }}

        .post-description {{
            font-size: 1.2rem;
            font-style: italic;
            color: #4a4a4a;
            margin-bottom: 40px;
        }}

        .post-content {{
            font-size: 1.05rem;
            line-height: 1.9;
        }}

        .post-content p {{
            margin-bottom: 1.5em;
        }}

        .post-content h1, .post-content h2, .post-content h3 {{
            font-family: 'Playfair Display', serif;
            margin-top: 2em;
            margin-bottom: 0.8em;
            color: #1a1a1a;
        }}

        .post-content h1 {{ font-size: 2.5rem; }}
        .post-content h2 {{ font-size: 2rem; }}
        .post-content h3 {{ font-size: 1.5rem; }}

        .post-content img {{
            max-width: 100%;
            height: auto;
            margin: 2em 0;
            border-radius: 8px;
        }}

        .post-content a {{
            color: #4a8a8a;
            text-decoration: underline;
        }}

        .post-content a:hover {{
            color: #2a6a6a;
        }}

        .post-content iframe {{
            max-width: 100%;
            margin: 2em 0;
        }}

        .post-content em {{
            font-style: italic;
        }}

        .post-content strong {{
            font-weight: 400;
        }}

        .back-link {{
            display: inline-block;
            margin-top: 60px;
            padding: 12px 24px;
            background-color: #b8d4d4;
            color: #1a1a1a;
            text-decoration: none;
            border-radius: 30px;
            font-size: 0.95rem;
            transition: background-color 0.3s ease;
        }}

        .back-link:hover {{
            background-color: #a0c0c0;
        }}

        @media (max-width: 768px) {{
            .post-title {{
                font-size: 2.5rem;
            }}

            .post-content {{
                font-size: 1rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <a href="/" class="logo-link">
            <img src="/FY LOGO white no bg 2000.png" alt="Forbidden Yoga" class="logo">
        </a>
    </div>

    <article class="post-container">
        <h1 class="post-title">{post['title']}</h1>
        <div class="post-meta">
            {formatted_date}
        </div>
        {'<p class="post-description">' + post['description'] + '</p>' if post['description'] else ''}
        <div class="post-content">
            {post['content']}
        </div>
        <a href="/#blog-section" class="back-link">← Back to all posts</a>
    </article>
</body>
</html>'''

def main():
    try:
        print('Fetching RSS feed...')
        rss = fetch_rss()

        print('Parsing posts...')
        posts = parse_rss(rss)

        print(f'Found {len(posts)} posts')

        # Create posts directory
        posts_dir = 'posts'
        if not os.path.exists(posts_dir):
            os.makedirs(posts_dir)

        # Generate HTML for each post
        post_list = []
        for post in posts:
            print(f"Processing: {post['title']}")
            html = generate_post_html(post)
            filename = f"{post['slug']}.html"

            with open(os.path.join(posts_dir, filename), 'w', encoding='utf-8') as f:
                f.write(html)

            post_list.append({
                'title': post['title'],
                'description': post['description'],
                'date': post['pubDate'],
                'url': f'/posts/{filename}'
            })

        # Save post list as JSON for blog.js
        with open('posts-data.json', 'w', encoding='utf-8') as f:
            json.dump(post_list, f, indent=2, ensure_ascii=False)

        print(f'\\n✅ Success! Generated {len(posts)} blog posts')
        print(f'Posts saved to: {posts_dir}')
        print(f'Post data saved to: posts-data.json')

    except Exception as e:
        print(f'❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == '__main__':
    main()
