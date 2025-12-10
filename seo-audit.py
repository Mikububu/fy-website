#!/usr/bin/env python3
"""
Comprehensive SEO audit for all blog posts.
Checks: H1/H3 structure, meta tags, OG tags, Twitter cards, Schema.org, images
"""

import json
import re
from bs4 import BeautifulSoup
from pathlib import Path

POSTS_DIR = Path(__file__).parent / "posts"

def audit_seo(html_file):
    """Comprehensive SEO audit for a single post."""
    issues = []
    warnings = []

    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')
    filename = html_file.name

    # 1. Check H1 with class="post-title"
    h1 = soup.find('h1', class_='post-title')
    if not h1:
        issues.append("Missing H1 with class='post-title'")
    elif h1.get_text().strip() == filename.replace('.html', ''):
        warnings.append("H1 title is just the filename - needs proper title")

    # 2. Check H3 with class="post-subtitle"
    h3 = soup.find('h3', class_='post-subtitle')
    if not h3:
        issues.append("Missing H3 with class='post-subtitle'")

    # 3. Check meta description
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if not meta_desc or not meta_desc.get('content', '').strip():
        issues.append("Missing or empty meta description")
    elif len(meta_desc.get('content', '')) < 50:
        warnings.append(f"Meta description too short ({len(meta_desc.get('content', ''))} chars)")
    elif len(meta_desc.get('content', '')) > 160:
        warnings.append(f"Meta description too long ({len(meta_desc.get('content', ''))} chars)")

    # 4. Check OG tags
    og_title = soup.find('meta', attrs={'property': 'og:title'})
    og_desc = soup.find('meta', attrs={'property': 'og:description'})
    og_image = soup.find('meta', attrs={'property': 'og:image'})
    og_url = soup.find('meta', attrs={'property': 'og:url'})

    if not og_title or not og_title.get('content', '').strip():
        issues.append("Missing og:title")
    if not og_desc or not og_desc.get('content', '').strip():
        issues.append("Missing og:description")
    if not og_image or not og_image.get('content', '').strip():
        issues.append("Missing og:image")
    if not og_url or not og_url.get('content', '').strip():
        warnings.append("Missing og:url")

    # 5. Check Twitter cards
    tw_card = soup.find('meta', attrs={'name': 'twitter:card'})
    tw_title = soup.find('meta', attrs={'name': 'twitter:title'})
    tw_desc = soup.find('meta', attrs={'name': 'twitter:description'})
    tw_image = soup.find('meta', attrs={'name': 'twitter:image'})

    if not tw_card:
        warnings.append("Missing twitter:card")
    if not tw_title or not tw_title.get('content', '').strip():
        issues.append("Missing twitter:title")
    if not tw_desc or not tw_desc.get('content', '').strip():
        issues.append("Missing twitter:description")
    if not tw_image or not tw_image.get('content', '').strip():
        warnings.append("Missing twitter:image")

    # 6. Check Schema.org JSON-LD
    schema_script = soup.find('script', attrs={'type': 'application/ld+json'})
    if not schema_script:
        warnings.append("Missing Schema.org JSON-LD")
    else:
        try:
            schema = json.loads(schema_script.string)
            if not schema.get('headline'):
                warnings.append("Schema.org missing headline")
            if not schema.get('description'):
                warnings.append("Schema.org missing description")
        except:
            warnings.append("Invalid Schema.org JSON")

    # 7. Check canonical URL
    canonical = soup.find('link', attrs={'rel': 'canonical'})
    if not canonical or not canonical.get('href', '').strip():
        warnings.append("Missing canonical URL")

    # 8. Check content
    post_content = soup.find('div', class_='post-content')
    if post_content:
        paragraphs = post_content.find_all('p')
        text = ' '.join([p.get_text().strip() for p in paragraphs])
        word_count = len(text.split())
        if word_count < 50:
            issues.append(f"Very low content ({word_count} words)")
        elif word_count < 200:
            warnings.append(f"Low content ({word_count} words)")

    # 9. Check images for Substack CDN
    substack_imgs = 0
    for img in soup.find_all('img'):
        src = img.get('src', '')
        if 'substackcdn.com' in src or 'substack-post-media' in src:
            substack_imgs += 1
        if not img.get('alt'):
            warnings.append("Image missing alt text")
    if substack_imgs > 0:
        warnings.append(f"{substack_imgs} image(s) still using Substack CDN")

    # 10. Check for <hr> tags
    hr_tags = soup.find_all('hr')
    if hr_tags:
        warnings.append(f"{len(hr_tags)} <hr> tag(s) found")

    return issues, warnings

def main():
    print("🔍 Comprehensive SEO Audit\n")
    print("=" * 80)

    all_posts = sorted([f for f in POSTS_DIR.glob("*.html") if not f.name.startswith("._")])

    total_issues = 0
    total_warnings = 0
    posts_with_issues = []

    for post_file in all_posts:
        issues, warnings = audit_seo(post_file)

        if issues or warnings:
            posts_with_issues.append((post_file.name, issues, warnings))
            total_issues += len(issues)
            total_warnings += len(warnings)

            status = "❌" if issues else "⚠️"
            print(f"\n{status} {post_file.name}")
            for issue in issues:
                print(f"   ❌ {issue}")
            for warning in warnings:
                print(f"   ⚠️  {warning}")
        else:
            print(f"✅ {post_file.name}")

    print("\n" + "=" * 80)
    print(f"\n📊 SEO AUDIT SUMMARY:")
    print(f"   Total posts: {len(all_posts)}")
    print(f"   Posts with issues: {len([p for p in posts_with_issues if p[1]])}")
    print(f"   Posts with warnings only: {len([p for p in posts_with_issues if not p[1] and p[2]])}")
    print(f"   Posts fully optimized: {len(all_posts) - len(posts_with_issues)}")
    print(f"   Total critical issues: {total_issues}")
    print(f"   Total warnings: {total_warnings}")

if __name__ == '__main__':
    main()
