#!/usr/bin/env python3
"""
Fix posts missing H3 with class='post-subtitle' by extracting from meta description
"""

import sys
from bs4 import BeautifulSoup
from pathlib import Path

def fix_missing_h3(html_file):
    """Add missing H3 subtitle by extracting from meta description"""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')

    # Check if H3 subtitle already exists
    h3_with_class = soup.find('h3', class_='post-subtitle')
    if h3_with_class:
        print(f"✅ {html_file.name} already has H3 subtitle")
        return False

    # Get meta description
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if not meta_desc or not meta_desc.get('content'):
        print(f"⚠️  {html_file.name} has no meta description to use")
        return False

    subtitle_text = meta_desc.get('content').strip()
    if not subtitle_text:
        print(f"⚠️  {html_file.name} has empty meta description")
        return False

    # Find H1 with class='post-title'
    h1_title = soup.find('h1', class_='post-title')
    if not h1_title:
        print(f"❌ {html_file.name} has no H1 with class='post-title'")
        return False

    # Create new H3 subtitle
    new_h3 = soup.new_tag('h3', **{'class': 'post-subtitle'})
    new_h3.string = subtitle_text

    # Insert H3 after H1
    h1_title.insert_after(new_h3)

    # Write back
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(str(soup))

    print(f"✅ Fixed {html_file.name}: added subtitle '{subtitle_text[:50]}...'")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 fix-missing-h3.py <html_file> [<html_file2> ...]")
        sys.exit(1)

    fixed_count = 0
    for filename in sys.argv[1:]:
        file_path = Path(filename)
        if fix_missing_h3(file_path):
            fixed_count += 1

    print(f"\n✨ Fixed {fixed_count} file(s)")
