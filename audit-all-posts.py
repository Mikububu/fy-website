#!/usr/bin/env python3
"""
Audit all blog posts for common issues encountered during recent fixes:
1. Missing SEODEEP template headers (H1 with class="post-title", H3 with class="post-subtitle")
2. Section headers using <em> instead of <strong>
3. Grey <hr> lines before sections
4. Non-functional Substack audio/video players
5. Images with potential scaling issues
"""

import os
import sys
from bs4 import BeautifulSoup
from pathlib import Path

POSTS_DIR = Path("/Volumes/LaCie/CLAUDE/posts")

def audit_post(html_file):
    """Audit a single blog post for common issues."""
    issues = []

    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, OSError):
        # Skip files that can't be read as UTF-8 (binary files, etc.)
        return ["❌ Unable to read file (encoding error)"]

    soup = BeautifulSoup(content, 'html.parser')

    # Check 1: SEODEEP template headers
    h1_with_class = soup.find('h1', class_='post-title')
    h3_with_class = soup.find('h3', class_='post-subtitle')

    if not h1_with_class:
        issues.append("❌ Missing H1 with class='post-title'")
    if not h3_with_class:
        issues.append("❌ Missing H3 with class='post-subtitle'")

    # Check 2: Section headers using <em> instead of <strong>
    # Look for patterns like <p><em>text</em></p> that might be section headers
    italic_paragraphs = []
    for p in soup.find_all('p'):
        em_tag = p.find('em')
        if em_tag and len(p.find_all()) == 1:  # Only contains the em tag
            text = em_tag.get_text().strip()
            if len(text) < 100 and not text.endswith('.'):  # Likely a header, not body text
                italic_paragraphs.append(text)

    if italic_paragraphs:
        issues.append(f"⚠️  Found {len(italic_paragraphs)} potential section headers using <em>: {', '.join(italic_paragraphs[:3])}")

    # Check 3: Grey <hr> lines
    hr_tags = soup.find_all('hr')
    if hr_tags:
        issues.append(f"⚠️  Found {len(hr_tags)} <hr> tag(s) (grey lines)")

    # Check 4: Substack audio/video players
    audio_embeds = soup.find_all('div', {'data-component-name': 'AudioEmbedPlayer'})
    if audio_embeds:
        issues.append(f"⚠️  Found {len(audio_embeds)} Substack audio player(s)")

    video_embeds = soup.find_all('div', class_=lambda x: x and 'video-embed' in x if x else False)
    substack_videos = [v for v in video_embeds if v.find('iframe') and 'substack' in str(v.find('iframe').get('src', ''))]
    if substack_videos:
        issues.append(f"⚠️  Found {len(substack_videos)} Substack video embed(s)")

    # Check 5: Images with Substack CDN URLs
    substack_images = []
    for img in soup.find_all('img'):
        src = img.get('src', '')
        if 'substackcdn.com' in src or 'substack-post-media.s3.amazonaws.com' in src:
            substack_images.append(src)

    if substack_images:
        issues.append(f"⚠️  Found {len(substack_images)} image(s) still using Substack CDN URLs")

    # Check 6: Posts with no meaningful text content
    post_content_div = soup.find('div', class_='post-content')
    if post_content_div:
        # Get all paragraph text, excluding figure captions
        paragraphs = post_content_div.find_all('p')
        text_content = ' '.join([p.get_text().strip() for p in paragraphs if not p.find_parent('figcaption')])
        word_count = len(text_content.split())

        if word_count < 50:  # Less than 50 words means essentially empty
            issues.append(f"❌ POST HAS NO CONTENT - only {word_count} words of text")

    return issues

def main():
    print("🔍 Auditing all blog posts for common issues...\n")

    all_posts = sorted([f for f in POSTS_DIR.glob("*.html") if not f.name.startswith("._")])
    posts_with_issues = []
    total_issues = 0

    for post_file in all_posts:
        issues = audit_post(post_file)

        if issues:
            posts_with_issues.append((post_file.name, issues))
            total_issues += len(issues)
            print(f"\n📄 {post_file.name}")
            for issue in issues:
                print(f"   {issue}")
        else:
            print(f"✅ {post_file.name}")

    # Summary
    print("\n" + "="*80)
    print(f"\n📊 SUMMARY:")
    print(f"   Total posts checked: {len(all_posts)}")
    print(f"   Posts with issues: {len(posts_with_issues)}")
    print(f"   Posts clean: {len(all_posts) - len(posts_with_issues)}")
    print(f"   Total issues found: {total_issues}")

    if posts_with_issues:
        print("\n📋 Posts needing attention:")
        for filename, issues in posts_with_issues:
            print(f"   - {filename} ({len(issues)} issue(s))")

    print("\n")

if __name__ == '__main__':
    main()
