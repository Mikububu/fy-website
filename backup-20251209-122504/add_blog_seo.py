#!/usr/bin/env python3
import json
import re
from pathlib import Path
from datetime import datetime

# Load posts data
with open('posts-data.json', 'r') as f:
    posts = json.load(f)

def add_seo_tags(html_file, post_data):
    """Add comprehensive SEO tags to a blog post"""
    
    with open(html_file, 'r') as f:
        content = f.read()
    
    # Skip if already has Open Graph tags
    if 'og:type' in content:
        print(f"Skipping {html_file.name} - already has SEO tags")
        return False
    
    # Extract existing title and description
    title_match = re.search(r'<title>(.*?)</title>', content)
    desc_match = re.search(r'<meta name="description" content="(.*?)"', content)
    
    if not title_match or not desc_match:
        print(f"Warning: Could not find title/description in {html_file.name}")
        return False
    
    existing_title = title_match.group(1)
    existing_desc = desc_match.group(1)
    
    # Parse date
    date_obj = datetime.strptime(post_data['date'], '%a, %d %b %Y %H:%M:%S %Z')
    iso_date = date_obj.strftime('%Y-%m-%dT%H:%M:%S+00:00')
    
    # Create SEO tags block
    seo_tags = f'''
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://forbidden-yoga.com{post_data['url']}">
    <meta property="og:title" content="{post_data['title']} | Forbidden Yoga">
    <meta property="og:description" content="{post_data['description']}">
    <meta property="og:image" content="{post_data['image']}">
    <meta property="article:published_time" content="{iso_date}">
    <meta property="article:author" content="Michael Perin Wogenburg">
    <meta property="article:section" content="Tantra Yoga">
    <meta property="article:tag" content="tantra yoga, kundalini, spiritual practice, conscious transformation">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://forbidden-yoga.com{post_data['url']}">
    <meta property="twitter:title" content="{post_data['title']}">
    <meta property="twitter:description" content="{post_data['description']}">
    <meta property="twitter:image" content="{post_data['image']}">

    <!-- Canonical URL -->
    <link rel="canonical" href="https://forbidden-yoga.com{post_data['url']}">

    <!-- Article Structured Data -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "{post_data['title']}",
      "description": "{post_data['description']}",
      "image": "{post_data['image']}",
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
      "datePublished": "{iso_date}",
      "dateModified": "{iso_date}",
      "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "https://forbidden-yoga.com{post_data['url']}"
      }},
      "keywords": "tantra yoga, kundalini awakening, spiritual transformation, sacred practices"
    }}
    </script>
'''
    
    # Insert SEO tags after existing meta description
    updated_content = content.replace(
        f'<meta name="description" content="{existing_desc}">',
        f'<meta name="description" content="{existing_desc}">\n{seo_tags}'
    )
    
    # Add CTA section before closing article tag
    cta_section = '''
    <!-- CTA Section -->
    <section style="margin-top: 60px; padding: 40px; background-color: rgba(184, 212, 212, 0.3); border-radius: 15px; text-align: center;">
        <h3 style="font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 20px; color: #1a1a1a;">Experience Forbidden Yoga</h3>
        <p style="font-size: 1.1rem; margin-bottom: 25px; line-height: 1.6;">Ready to dive deeper into tantric practices? Explore our <a href="/#slc-section" style="color: #423737; font-weight: 600; text-decoration: underline;">luxury retreats</a> in Mongolia, Bali, and Colombia.</p>
        <a href="/#slc-section" style="display: inline-block; padding: 15px 35px; background-color: #B8D4D4; color: #1a1a1a; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.05rem; transition: all 0.3s ease;">Learn About Sensual Liberation Retreats</a>
    </section>
'''
    
    updated_content = updated_content.replace('</article>', f'{cta_section}\n    </article>')
    
    # Write updated content
    with open(html_file, 'w') as f:
        f.write(updated_content)
    
    print(f"✅ Updated {html_file.name}")
    return True

# Process all posts
posts_dir = Path('posts')
updated_count = 0

for post in posts:
    if post.get('url') and post['url'].startswith('/posts/'):
        filename = post['url'].replace('/posts/', '')
        html_file = posts_dir / filename
        
        if html_file.exists():
            if add_seo_tags(html_file, post):
                updated_count += 1
        else:
            print(f"Warning: File not found: {html_file}")

print(f"\n✨ Updated {updated_count} blog posts with comprehensive SEO tags")
