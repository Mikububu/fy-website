#!/usr/bin/env python3
"""
Fix missing SEO tags in blog posts.
Adds: OG tags, Twitter cards, Schema.org JSON-LD, canonical URLs
"""

import json
import re
from bs4 import BeautifulSoup
from pathlib import Path

POSTS_DIR = Path(__file__).parent / "posts"
BASE_URL = "https://forbidden-yoga.com"

def fix_seo_tags(html_file):
    """Fix missing SEO tags for a single post."""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')
    filename = html_file.name
    slug = filename.replace('.html', '')
    changes = []

    # Get existing values
    title_tag = soup.find('title')
    title = title_tag.get_text().replace(' | Forbidden Yoga', '').strip() if title_tag else slug.replace('-', ' ').title()

    meta_desc = soup.find('meta', attrs={'name': 'description'})
    description = meta_desc.get('content', '') if meta_desc else ''

    # If description is empty or too short, try to extract from content
    if len(description) < 50:
        post_content = soup.find('div', class_='post-content')
        if post_content:
            first_p = post_content.find('p')
            if first_p:
                text = first_p.get_text().strip()
                if len(text) > 50:
                    description = text[:157] + '...' if len(text) > 160 else text

    # Find the <head> element
    head = soup.find('head')
    if not head:
        return None

    # Check for og:title
    og_title = soup.find('meta', attrs={'property': 'og:title'})
    if not og_title or not og_title.get('content', '').strip():
        if og_title:
            og_title['content'] = f"{title} | Forbidden Yoga"
        else:
            new_tag = soup.new_tag('meta', property='og:title', content=f"{title} | Forbidden Yoga")
            head.append(new_tag)
        changes.append("Added og:title")

    # Check for og:description
    og_desc = soup.find('meta', attrs={'property': 'og:description'})
    if not og_desc or not og_desc.get('content', '').strip():
        if og_desc:
            og_desc['content'] = description
        else:
            new_tag = soup.new_tag('meta', property='og:description', content=description)
            head.append(new_tag)
        changes.append("Added og:description")

    # Check for og:image
    og_image = soup.find('meta', attrs={'property': 'og:image'})
    if not og_image or not og_image.get('content', '').strip():
        image_url = f"{BASE_URL}/images/{slug}-featured.jpg"
        if og_image:
            og_image['content'] = image_url
        else:
            new_tag = soup.new_tag('meta', property='og:image', content=image_url)
            head.append(new_tag)
        changes.append("Added og:image")

    # Check for og:url
    og_url = soup.find('meta', attrs={'property': 'og:url'})
    if not og_url or not og_url.get('content', '').strip():
        url = f"{BASE_URL}/posts/{filename}"
        if og_url:
            og_url['content'] = url
        else:
            new_tag = soup.new_tag('meta', property='og:url', content=url)
            head.append(new_tag)
        changes.append("Added og:url")

    # Check for og:type
    og_type = soup.find('meta', attrs={'property': 'og:type'})
    if not og_type:
        new_tag = soup.new_tag('meta', property='og:type', content='article')
        head.append(new_tag)
        changes.append("Added og:type")

    # Check for og:site_name
    og_site = soup.find('meta', attrs={'property': 'og:site_name'})
    if not og_site:
        new_tag = soup.new_tag('meta', property='og:site_name', content='Forbidden Yoga')
        head.append(new_tag)
        changes.append("Added og:site_name")

    # Check for twitter:card
    tw_card = soup.find('meta', attrs={'name': 'twitter:card'})
    if not tw_card:
        new_tag = soup.new_tag('meta')
        new_tag['name'] = 'twitter:card'
        new_tag['content'] = 'summary_large_image'
        head.append(new_tag)
        changes.append("Added twitter:card")

    # Check for twitter:title
    tw_title = soup.find('meta', attrs={'name': 'twitter:title'})
    if not tw_title or not tw_title.get('content', '').strip():
        if tw_title:
            tw_title['content'] = title
        else:
            new_tag = soup.new_tag('meta')
            new_tag['name'] = 'twitter:title'
            new_tag['content'] = title
            head.append(new_tag)
        changes.append("Added twitter:title")

    # Check for twitter:description
    tw_desc = soup.find('meta', attrs={'name': 'twitter:description'})
    if not tw_desc or not tw_desc.get('content', '').strip():
        if tw_desc:
            tw_desc['content'] = description
        else:
            new_tag = soup.new_tag('meta')
            new_tag['name'] = 'twitter:description'
            new_tag['content'] = description
            head.append(new_tag)
        changes.append("Added twitter:description")

    # Check for twitter:image
    tw_image = soup.find('meta', attrs={'name': 'twitter:image'})
    if not tw_image or not tw_image.get('content', '').strip():
        image_url = f"{BASE_URL}/images/{slug}-featured.jpg"
        if tw_image:
            tw_image['content'] = image_url
        else:
            new_tag = soup.new_tag('meta')
            new_tag['name'] = 'twitter:image'
            new_tag['content'] = image_url
            head.append(new_tag)
        changes.append("Added twitter:image")

    # Check for canonical URL
    canonical = soup.find('link', attrs={'rel': 'canonical'})
    if not canonical or not canonical.get('href', '').strip():
        url = f"{BASE_URL}/posts/{filename}"
        if canonical:
            canonical['href'] = url
        else:
            new_tag = soup.new_tag('link', rel='canonical', href=url)
            head.append(new_tag)
        changes.append("Added canonical URL")

    # Check for Schema.org JSON-LD
    schema_script = soup.find('script', attrs={'type': 'application/ld+json'})
    if not schema_script:
        schema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": description,
            "image": f"{BASE_URL}/images/{slug}-featured.jpg",
            "author": {
                "@type": "Person",
                "name": "Michael Perin Wogenburg"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Forbidden Yoga"
            }
        }
        script_tag = soup.new_tag('script', type='application/ld+json')
        script_tag.string = json.dumps(schema, indent=2)
        head.append(script_tag)
        changes.append("Added Schema.org JSON-LD")

    if changes:
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        return changes
    return None

def main():
    print("🔧 Fixing missing SEO tags...\n")

    all_posts = sorted([f for f in POSTS_DIR.glob("*.html") if not f.name.startswith("._")])
    fixed_count = 0

    for post_file in all_posts:
        changes = fix_seo_tags(post_file)
        if changes:
            fixed_count += 1
            print(f"✅ {post_file.name}")
            for change in changes:
                print(f"   - {change}")
        else:
            print(f"⏭️  {post_file.name} (no changes needed)")

    print(f"\n📊 Fixed SEO tags in {fixed_count} of {len(all_posts)} posts")

if __name__ == '__main__':
    main()
