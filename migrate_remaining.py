#!/usr/bin/env python3
import urllib.request
import json
import os
from html import unescape

# Missing post URLs from the hardcoded fallback data
MISSING_POSTS = [
    "https://www.forbidden-yoga.com/p/the-sexual-teachings-of-the-white",
    "https://www.forbidden-yoga.com/p/sparsha-puja-in-a-mental-institution",
    "https://www.forbidden-yoga.com/p/string-theory-tantric-secrets-and",
    "https://www.forbidden-yoga.com/p/sensual-liberation-retreats-with",
    "https://www.forbidden-yoga.com/p/from-emptiness-to-ecstasy-my-journey",
    "https://www.forbidden-yoga.com/p/soulmates-among-the-stars-the-ultimate",
    "https://www.forbidden-yoga.com/p/reclaiming-your-voice-working-through",
    "https://www.forbidden-yoga.com/p/the-joy-of-torture",
    "https://www.forbidden-yoga.com/p/a-holistic-approach-to-divorce",
    "https://www.forbidden-yoga.com/p/krama-rishi-nyasa-with-iya",
    "https://www.forbidden-yoga.com/p/yogic-transmission-in-raja-yoga",
    "https://www.forbidden-yoga.com/p/why-i-teach-taoist-sensual-bodywork",
    "https://www.forbidden-yoga.com/p/our-brains-urge-for-mystical-experiences",
    "https://www.forbidden-yoga.com/p/muladhara-chakra-petals",
    "https://www.forbidden-yoga.com/p/my-new-approach-to-therapy",
    "https://www.forbidden-yoga.com/p/dark-alchemy",
    "https://www.forbidden-yoga.com/p/how-to-deliver-visionary-idea-in",
    "https://www.forbidden-yoga.com/p/hermanns-story-of-his-sensual-liberation",
    "https://www.forbidden-yoga.com/p/5-karmendriyas-and-5-jnanendriyas",
    "https://www.forbidden-yoga.com/p/anais-nin-the-house-of-incest",
    "https://www.forbidden-yoga.com/p/the-compass-of-zen",
    "https://www.forbidden-yoga.com/p/not-a-john-baldessari-artwork",
    "https://www.forbidden-yoga.com/p/tantra-online"
]

def fetch_post_html(url):
    """Fetch individual post HTML"""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        return response.read().decode('utf-8')

def extract_post_data(html, url):
    """Extract post data from HTML"""
    import re

    # Extract title
    title_match = re.search(r'<title>(.*?)</title>', html)
    title = title_match.group(1) if title_match else 'Untitled'
    title = title.replace(' | Forbidden Yoga', '').strip()

    # Extract meta description
    desc_match = re.search(r'<meta property="og:description" content="(.*?)"', html)
    description = desc_match.group(1) if desc_match else ''

    # Extract date
    date_match = re.search(r'<time[^>]*>(.*?)</time>', html)
    date = date_match.group(1) if date_match else ''

    # Extract main content
    content_match = re.search(r'<div class="available-content"[^>]*>(.*?)</div>\s*<div class="post-footer', html, re.DOTALL)
    if not content_match:
        content_match = re.search(r'<div class="body markup"[^>]*>(.*?)</div>\s*<div class="post-footer', html, re.DOTALL)

    content = content_match.group(1) if content_match else '<p>Content not available</p>'

    # Extract slug from URL
    slug = url.split('/p/')[-1]

    return {
        'title': unescape(title),
        'description': unescape(description),
        'link': url,
        'pubDate': date,
        'content': content,
        'slug': slug
    }

def generate_post_html(post):
    """Generate HTML for a single post"""
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
            {post['pubDate']}
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
        print(f'Fetching {len(MISSING_POSTS)} remaining posts...')

        posts_dir = 'posts'
        if not os.path.exists(posts_dir):
            os.makedirs(posts_dir)

        # Load existing posts-data.json
        with open('posts-data.json', 'r', encoding='utf-8') as f:
            all_posts = json.load(f)

        existing_urls = {post.get('link') or post.get('url', '') for post in all_posts}

        new_count = 0
        for url in MISSING_POSTS:
            if url in existing_urls:
                print(f'Skipping (already exists): {url}')
                continue

            print(f'Fetching: {url}')
            try:
                html = fetch_post_html(url)
                post = extract_post_data(html, url)

                # Generate HTML
                post_html = generate_post_html(post)
                filename = f"{post['slug']}.html"

                with open(os.path.join(posts_dir, filename), 'w', encoding='utf-8') as f:
                    f.write(post_html)

                # Add to posts list
                all_posts.append({
                    'title': post['title'],
                    'description': post['description'],
                    'date': post['pubDate'],
                    'url': f'/posts/{filename}'
                })

                new_count += 1
                print(f'  ✓ Generated {filename}')

            except Exception as e:
                print(f'  ✗ Error: {str(e)}')
                continue

        # Save updated posts-data.json
        with open('posts-data.json', 'w', encoding='utf-8') as f:
            json.dump(all_posts, f, indent=2, ensure_ascii=False)

        print(f'\n✅ Success! Added {new_count} new posts')
        print(f'Total posts now: {len(all_posts)}')

    except Exception as e:
        print(f'❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == '__main__':
    main()
