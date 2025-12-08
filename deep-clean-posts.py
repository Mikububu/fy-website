#!/usr/bin/env python3
"""
Deep SEODEEP cleanup script for Forbidden Yoga blog posts.
- Removes all Substack bloat (pencraft, pc-*, button classes, svg icons)
- Simplifies image tags (removes srcset, data-attrs, keeps src)
- Removes <hr> tags
- Adds missing H3 subtitles from meta descriptions
- Converts italic headers (<p><em>text</em></p>) to <h2>
- Preserves all paragraph content and Spotify iframes
"""

import re
from bs4 import BeautifulSoup, NavigableString
from pathlib import Path

POSTS_DIR = Path(__file__).parent / "posts"

# Substack classes to remove
SUBSTACK_CLASSES = [
    'pencraft', 'pc-', 'button-wrapper', 'captioned-image-container',
    'image-link-expand', 'image2-inset', 'sizing-large', 'sizing-normal',
    'is-viewable-img', 'restack-image', 'view-image', 'icon-container'
]

def is_substack_class(class_name):
    """Check if a class is Substack-related."""
    if not class_name:
        return False
    return any(sub in class_name for sub in SUBSTACK_CLASSES)

def clean_post(html_file):
    """Clean a single blog post."""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')
    changes_made = []

    # 1. Remove all <hr> tags
    hr_tags = soup.find_all('hr')
    if hr_tags:
        for hr in hr_tags:
            hr.decompose()
        changes_made.append(f"Removed {len(hr_tags)} <hr> tags")

    # 2. Remove SVG elements (Substack icons)
    svg_tags = soup.find_all('svg')
    if svg_tags:
        for svg in svg_tags:
            svg.decompose()
        changes_made.append(f"Removed {len(svg_tags)} SVG icons")

    # 3. Remove button elements (Substack UI)
    button_tags = soup.find_all('button')
    if button_tags:
        for btn in button_tags:
            btn.decompose()
        changes_made.append(f"Removed {len(button_tags)} buttons")

    # 4. Clean up Substack divs with pencraft/pc-* classes
    substack_divs = soup.find_all('div', class_=lambda x: x and any(is_substack_class(c) for c in (x if isinstance(x, list) else [x])))
    for div in substack_divs:
        # If it only contains UI elements, remove it
        if not div.get_text(strip=True):
            div.decompose()

    # 5. Simplify images - remove srcset, data-attrs, keep only src
    for img in soup.find_all('img'):
        # Keep only essential attributes
        src = img.get('src', '')
        alt = img.get('alt', '')

        # Clear all attributes
        attrs_to_remove = [attr for attr in img.attrs if attr not in ['src', 'alt', 'width', 'height']]
        for attr in attrs_to_remove:
            del img[attr]

        # Add descriptive alt if empty
        if not alt:
            filename = Path(html_file).stem.replace('-', ' ').title()
            img['alt'] = f"Image from {filename}"

    # 6. Remove <picture> and <source> tags, keep inner <img>
    for picture in soup.find_all('picture'):
        img = picture.find('img')
        if img:
            picture.replace_with(img)

    # 7. Simplify figure/figcaption structures
    for figure in soup.find_all('figure'):
        # Remove anchor wrappers around images
        for a in figure.find_all('a', class_='image-link'):
            img = a.find('img')
            if img:
                a.replace_with(img)

    # 8. Remove empty paragraphs
    for p in soup.find_all('p'):
        if not p.get_text(strip=True) and not p.find(['img', 'iframe']):
            p.decompose()

    # 9. Remove button-wrapper divs (Substack call-to-action buttons)
    for wrapper in soup.find_all('p', class_='button-wrapper'):
        # Check if it's a Spotify link - keep those
        a = wrapper.find('a')
        if a and 'spotify' in a.get('href', '').lower():
            # Convert to simple link
            wrapper.name = 'p'
            wrapper['class'] = []
            del wrapper['data-attrs']
            del wrapper['data-component-name']
        else:
            wrapper.decompose()

    # 10. Clean data-* attributes from all elements
    for tag in soup.find_all(True):
        attrs_to_remove = [attr for attr in tag.attrs if attr.startswith('data-')]
        for attr in attrs_to_remove:
            del tag[attr]

    # 11. Remove empty class attributes and pencraft classes
    for tag in soup.find_all(True):
        if 'class' in tag.attrs:
            classes = tag.get('class', [])
            if isinstance(classes, list):
                cleaned = [c for c in classes if not is_substack_class(c)]
                if cleaned:
                    tag['class'] = cleaned
                else:
                    del tag['class']

    # 12. Remove empty anchor tags
    for a in soup.find_all('a'):
        if not a.get_text(strip=True) and not a.find(['img', 'iframe']):
            a.decompose()

    # 13. Convert italic headers to H2
    # Pattern: <p><em>Short Text Without Period</em></p>
    post_content = soup.find('div', class_='post-content')
    if post_content:
        em_converted = 0
        for p in post_content.find_all('p'):
            em = p.find('em')
            if em and len(p.find_all()) == 1:  # Only contains the em
                text = em.get_text().strip()
                # If short text without period, likely a header
                if len(text) < 100 and not text.endswith('.') and not text.endswith('?'):
                    # Create h2
                    h2 = soup.new_tag('h2')
                    h2.string = text
                    p.replace_with(h2)
                    em_converted += 1
        if em_converted:
            changes_made.append(f"Converted {em_converted} <em> tags to <h2>")

    # 14. Add H3 subtitle if missing
    h3_subtitle = soup.find('h3', class_='post-subtitle')
    if not h3_subtitle:
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            h1 = soup.find('h1', class_='post-title')
            if h1:
                h3 = soup.new_tag('h3', attrs={'class': 'post-subtitle'})
                h3.string = meta_desc['content']
                h1.insert_after(h3)
                changes_made.append("Added H3 subtitle from meta description")

    if changes_made:
        # Write cleaned content
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        return changes_made
    return None

def main():
    print("🧹 Deep SEODEEP cleanup of all blog posts...\n")

    all_posts = sorted([f for f in POSTS_DIR.glob("*.html") if not f.name.startswith("._")])
    cleaned_count = 0

    for post_file in all_posts:
        changes = clean_post(post_file)
        if changes:
            cleaned_count += 1
            print(f"✅ {post_file.name}")
            for change in changes:
                print(f"   - {change}")
        else:
            print(f"⏭️  {post_file.name} (no changes needed)")

    print(f"\n📊 Cleaned {cleaned_count} of {len(all_posts)} posts")

if __name__ == '__main__':
    main()
