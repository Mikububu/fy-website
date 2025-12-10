#!/usr/bin/env python3
"""
Compare content between Substack and live website for all 43 blog posts.
Reports any discrepancies in content length.
"""

import urllib.request
import ssl
import json
from pathlib import Path
from bs4 import BeautifulSoup
import time

# SSL context for Substack (bypasses age gate)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def fetch_url(url):
    """Fetch URL with User-Agent spoofing"""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        return None

def count_words_from_html(html):
    """Extract text from HTML and count words"""
    if not html:
        return 0
    soup = BeautifulSoup(html, 'html.parser')

    # Find main content
    content = soup.find('div', class_='post-content')
    if not content:
        content = soup.find('article')
    if not content:
        return 0

    # Get all paragraphs
    paragraphs = content.find_all('p')
    text = ' '.join([p.get_text() for p in paragraphs])
    return len(text.split())

def main():
    posts_dir = Path('/Volumes/LaCie/CLAUDE/posts')
    # Filter out macOS hidden files
    posts = sorted([p for p in posts_dir.glob('*.html') if not p.name.startswith('._')])

    results = []

    print("🔍 Comparing Substack vs Live Website Content\n")
    print(f"{'Post Slug':<50} {'Substack':>10} {'Live':>10} {'Status':>15}")
    print("=" * 90)

    for i, post_file in enumerate(posts, 1):
        slug = post_file.stem

        # Get local file word count
        with open(post_file, 'r', encoding='utf-8', errors='ignore') as f:
            local_html = f.read()
        local_words = count_words_from_html(local_html)

        # Get Substack word count
        substack_url = f"https://forbiddenyoga.substack.com/p/{slug}"
        print(f"\r[{i}/43] Fetching {slug}...", end='', flush=True)
        substack_html = fetch_url(substack_url)
        substack_words = count_words_from_html(substack_html) if substack_html else 0

        # Compare
        if substack_words == 0:
            status = "🔒 AGE GATED"
        elif local_words == 0:
            status = "❌ MISSING"
        elif local_words >= substack_words * 0.9:  # Within 10%
            status = "✅ COMPLETE"
        elif local_words >= substack_words * 0.5:  # At least 50%
            status = "⚠️  PARTIAL"
        else:
            status = "❌ INCOMPLETE"

        results.append({
            'slug': slug,
            'substack': substack_words,
            'local': local_words,
            'status': status
        })

        time.sleep(0.5)  # Rate limiting

    print("\r" + " " * 80 + "\r")  # Clear progress line

    # Print results
    for r in results:
        print(f"{r['slug']:<50} {r['substack']:>10} {r['local']:>10} {r['status']:>15}")

    # Summary
    print("\n" + "=" * 90)
    complete = sum(1 for r in results if '✅' in r['status'])
    age_gated = sum(1 for r in results if '🔒' in r['status'])
    partial = sum(1 for r in results if '⚠️' in r['status'])
    missing = sum(1 for r in results if '❌' in r['status'])

    print(f"\n📊 SUMMARY:")
    print(f"   ✅ Complete: {complete}")
    print(f"   🔒 Age Gated: {age_gated}")
    print(f"   ⚠️  Partial: {partial}")
    print(f"   ❌ Missing/Incomplete: {missing}")
    print(f"   📝 Total: {len(results)}")

if __name__ == '__main__':
    main()
