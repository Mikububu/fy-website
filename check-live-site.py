#!/usr/bin/env python3
"""
Check live Netlify site for broken posts (no images, no headlines, no content)
"""

import urllib.request
import ssl
from pathlib import Path
from bs4 import BeautifulSoup

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def check_live_post(slug):
    """Check if live post has headline, images, and content"""
    url = f"https://forbidden-yoga.com/posts/{slug}.html"

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
            html = response.read().decode('utf-8')

        soup = BeautifulSoup(html, 'html.parser')

        # Check for headline
        h1 = soup.find('h1', class_='post-title')
        has_headline = bool(h1 and h1.get_text().strip())

        # Check for images in content
        content = soup.find('div', class_='post-content')
        images = content.find_all('img') if content else []
        has_images = len(images) > 0

        # Check for text content
        paragraphs = content.find_all('p') if content else []
        text = ' '.join([p.get_text() for p in paragraphs])
        word_count = len(text.split())
        has_content = word_count > 50

        issues = []
        if not has_headline:
            issues.append("NO HEADLINE")
        if not has_images:
            issues.append("NO IMAGES")
        if not has_content:
            issues.append(f"NO CONTENT ({word_count} words)")

        return issues, word_count, len(images)

    except Exception as e:
        return [f"ERROR: {str(e)}"], 0, 0

def main():
    posts_dir = Path('/Volumes/LaCie/CLAUDE/posts')
    posts = sorted([p.stem for p in posts_dir.glob('*.html') if not p.name.startswith('._')])

    print("🔍 Checking Live Netlify Site\n")
    print(f"{'Post Slug':<50} {'Words':>7} {'Imgs':>5} {'Issues'}")
    print("=" * 100)

    broken = []

    for slug in posts:
        issues, words, imgs = check_live_post(slug)

        if issues:
            status = ", ".join(issues)
            print(f"❌ {slug:<50} {words:>7} {imgs:>5} {status}")
            broken.append((slug, issues))
        else:
            print(f"✅ {slug:<50} {words:>7} {imgs:>5}")

    print("\n" + "=" * 100)
    print(f"\n📊 SUMMARY:")
    print(f"   Total posts: {len(posts)}")
    print(f"   Broken posts: {len(broken)}")
    print(f"   Working posts: {len(posts) - len(broken)}")

    if broken:
        print(f"\n🔧 POSTS NEEDING FIXES:")
        for slug, issues in broken:
            print(f"   - {slug}: {', '.join(issues)}")

if __name__ == '__main__':
    main()
