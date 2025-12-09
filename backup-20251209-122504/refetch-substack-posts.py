#!/usr/bin/env python3
"""
Script to re-fetch missing blog post content from Substack
Handles text, images, videos, audio embeds, and Spotify embeds
"""

import json
import requests
import feedparser
import time
from datetime import datetime
from pathlib import Path

# Configuration
SUBSTACK_RSS_URL = "https://michaelperin.substack.com/feed"
POSTS_DIR = Path("posts")
POSTS_DATA_FILE = "posts-data.json"

# Posts that need content re-fetched (empty content)
POSTS_TO_REFETCH = [
    "5-karmendriyas-and-5-jnanendriyas",
    "a-holistic-approach-to-divorce",
    "hermanns-story-of-his-sensual-liberation",
    "muladhara-chakra-petals",
    "my-new-approach-to-therapy",
    "our-brains-urge-for-mystical-experiences",
    "reclaiming-your-voice-working-through",
    "soulmates-among-the-stars-the-ultimate",
    "tantra-online",
    "the-joy-of-torture",
    "yogic-transmission-in-raja-yoga"
]

def fetch_substack_feed():
    """Fetch the Substack RSS feed"""
    print(f"Fetching Substack feed from: {SUBSTACK_RSS_URL}")
    feed = feedparser.parse(SUBSTACK_RSS_URL)
    print(f"Found {len(feed.entries)} posts in feed")
    return feed

def slugify(text):
    """Convert title to URL-friendly slug"""
    import re
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def extract_content_with_embeds(entry):
    """Extract full content including text, images, videos, and audio/Spotify embeds"""
    content = entry.get('content', [{}])[0].get('value', '')
    summary = entry.get('summary', '')

    # Use content if available, otherwise summary
    html_content = content if content else summary

    return html_content

def create_blog_post_html(entry, slug):
    """Create full HTML file for blog post"""

    title = entry.get('title', 'Untitled')
    published = entry.get('published_parsed', None)
    date_iso = datetime(*published[:6]).isoformat() + 'Z' if published else ''
    summary = entry.get('summary', '')[:200]

    # Extract image from entry
    image_url = ''
    if 'media_content' in entry:
        image_url = entry.media_content[0].get('url', '')
    elif 'links' in entry:
        for link in entry.links:
            if link.get('type', '').startswith('image/'):
                image_url = link.get('href', '')
                break

    # Get full content with embeds
    post_content = extract_content_with_embeds(entry)

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Forbidden Yoga</title>
    <meta name="description" content="{summary}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://forbidden-yoga.com/posts/{slug}.html">
    <meta property="og:title" content="{title} | Forbidden Yoga">
    <meta property="og:description" content="{summary}">
    <meta property="og:image" content="{image_url}">
    <meta property="article:published_time" content="{date_iso}">
    <meta property="article:author" content="Michael Perin Wogenburg">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://forbidden-yoga.com/posts/{slug}.html">
    <meta property="twitter:title" content="{title}">
    <meta property="twitter:description" content="{summary}">
    <meta property="twitter:image" content="{image_url}">

    <!-- Canonical URL -->
    <link rel="canonical" href="https://forbidden-yoga.com/posts/{slug}.html">

    <!-- Article Structured Data -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "{title}",
      "description": "{summary}",
      "image": "{image_url}",
      "author": {{
        "@type": "Person",
        "name": "Michael Perin Wogenburg",
        "url": "https://forbidden-yoga.com",
        "jobTitle": "Kundalini Yoga Teacher & Tantric Healing Practitioner"
      }},
      "publisher": {{
        "@type": "Organization",
        "name": "Forbidden Yoga",
        "logo": {{
          "@type": "ImageObject",
          "url": "https://forbidden-yoga.com/forbidden-yoga-logo-white.png"
        }}
      }},
      "datePublished": "{date_iso}",
      "dateModified": "{date_iso}",
      "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "https://forbidden-yoga.com/posts/{slug}.html"
      }},
      "keywords": "tantra yoga, kundalini awakening, spiritual transformation, sacred practices"
    }}
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@400&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Roboto', sans-serif;
            font-weight: 400;
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
            max-width: min(90%, 1000px);
            margin: 0 auto;
            padding: 40px 20px;
        }}
        .post-inner-container {{
            background-color: white;
            padding: 60px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}

        .post-title {{
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 20px;
            line-height: 1.2;
        }}

        .post-meta {{
            color: #666;
            font-size: 0.95rem;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e0e0e0;
        }}

        .post-content {{
            font-size: 1.1rem;
            line-height: 1.8;
        }}

        .post-content img {{
            max-width: 100%;
            height: auto;
            margin: 30px 0;
            border-radius: 4px;
        }}

        .post-content p {{
            margin-bottom: 1.5rem;
        }}

        .post-content h2, .post-content h3 {{
            font-family: 'Playfair Display', serif;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #1a1a1a;
        }}

        .post-content a {{
            color: #423737;
            text-decoration: underline;
        }}

        .back-link {{
            display: inline-block;
            margin-top: 40px;
            color: #423737;
            text-decoration: none;
            font-weight: 600;
        }}

        .back-link:hover {{
            text-decoration: underline;
        }}

        /* Spotify embed styling */
        iframe[src*="spotify"] {{
            border-radius: 12px;
            margin: 20px 0;
        }}

        /* Audio player styling */
        audio {{
            width: 100%;
            margin: 20px 0;
        }}

        @media (max-width: 768px) {{
            .post-inner-container {{
                padding: 30px 20px;
            }}

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
            <img src="/forbidden-yoga-logo-white.png" alt="Forbidden Yoga" class="logo">
        </a>
    </div>

    <article class="post-container">
        <div class="post-inner-container">
        <h1 class="post-title">{title}</h1>
        <div class="post-meta">

        </div>

        <div class="post-content">
            {post_content}
        </div>
        </div>
        <a href="/#blog-section" class="back-link">← Back to all posts</a>

    <!-- CTA Section -->
    <section style="margin-top: 60px; padding: 40px; background-color: rgba(184, 212, 212, 0.3); border-radius: 15px; text-align: center;">
        <h3 style="font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 20px; color: #1a1a1a;">Experience Forbidden Yoga</h3>
        <p style="font-size: 1.1rem; margin-bottom: 25px; line-height: 1.6;">Ready to dive deeper into tantric practices? Explore our <a href="/#slc-section" style="color: #423737; font-weight: 600; text-decoration: underline;">luxury retreats</a> anywhere you want them to be.</p>
        <a href="/#slc-section" style="display: inline-block; padding: 15px 35px; background-color: #B8D4D4; color: #1a1a1a; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.05rem; transition: all 0.3s ease;">Learn About Sensual Liberation Retreats</a>
    </section>

    </article>
</body>
</html>
'''

    return html

def main():
    """Main function to refetch posts"""

    # Fetch feed
    feed = fetch_substack_feed()

    # Create a mapping of titles to entries
    entries_by_title = {}
    for entry in feed.entries:
        slug = slugify(entry.title)
        entries_by_title[slug] = entry

    print(f"\nProcessing {len(POSTS_TO_REFETCH)} posts...")

    refetched = 0
    not_found = []

    for post_slug in POSTS_TO_REFETCH:
        # Try to find matching entry
        matching_entry = None

        # Direct slug match
        if post_slug in entries_by_title:
            matching_entry = entries_by_title[post_slug]
        else:
            # Try partial match
            for slug, entry in entries_by_title.items():
                if post_slug in slug or slug in post_slug:
                    matching_entry = entry
                    break

        if matching_entry:
            print(f"✓ Found content for: {post_slug}")

            # Create HTML
            html = create_blog_post_html(matching_entry, post_slug)

            # Write to file
            output_path = POSTS_DIR / f"{post_slug}.html"
            output_path.write_text(html, encoding='utf-8')

            refetched += 1
            time.sleep(0.5)  # Be nice to servers
        else:
            print(f"✗ Could not find content for: {post_slug}")
            not_found.append(post_slug)

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Successfully refetched: {refetched}")
    print(f"  Not found: {len(not_found)}")

    if not_found:
        print(f"\nPosts not found in feed:")
        for slug in not_found:
            print(f"  - {slug}")
        print("\nThese posts may need to be:")
        print("  1. Manually added from Substack dashboard")
        print("  2. Fetched from a different RSS feed")
        print("  3. Checked if they exist with a different slug")

if __name__ == "__main__":
    main()
