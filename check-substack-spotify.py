#!/usr/bin/env python3
"""
Check which Substack posts have Spotify audio
"""

import json
import requests
from bs4 import BeautifulSoup
import time

# Load Substack URL mapping
with open('substack-url-mapping.json', 'r') as f:
    mapping = json.load(f)

print('🔍 Checking Substack Posts for Spotify Audio')
print('=' * 60)
print()

results = {
    'total': len(mapping),
    'with_spotify': [],
    'without_spotify': [],
    'errors': []
}

for local_path, substack_url in mapping.items():
    filename = local_path.split('/')[-1].replace('.html', '')
    print(f'Checking: {filename}...')

    try:
        response = requests.get(substack_url, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            # Check for Spotify iframes
            spotify_iframes = soup.find_all('iframe', src=lambda x: x and 'spotify' in x.lower())

            if spotify_iframes:
                episode_ids = []
                for iframe in spotify_iframes:
                    src = iframe.get('src', '')
                    if 'episode/' in src:
                        episode_id = src.split('episode/')[-1].split('?')[0]
                        episode_ids.append(episode_id)

                results['with_spotify'].append({
                    'filename': filename,
                    'local_path': local_path,
                    'substack_url': substack_url,
                    'episode_ids': episode_ids
                })
                print(f'  ✅ HAS Spotify: {len(episode_ids)} audio(s)')
            else:
                results['without_spotify'].append({
                    'filename': filename,
                    'local_path': local_path,
                    'substack_url': substack_url
                })
                print(f'  ❌ NO Spotify')
        else:
            results['errors'].append({
                'filename': filename,
                'url': substack_url,
                'error': f'HTTP {response.status_code}'
            })
            print(f'  ⚠️  Error: HTTP {response.status_code}')

    except Exception as e:
        results['errors'].append({
            'filename': filename,
            'url': substack_url,
            'error': str(e)
        })
        print(f'  ⚠️  Error: {e}')

    # Be nice to Substack servers
    time.sleep(1)
    print()

# Print summary
print()
print('=' * 60)
print('📊 SUMMARY')
print('=' * 60)
print(f'Total Substack posts checked: {results["total"]}')
print(f'Posts WITH Spotify on Substack: {len(results["with_spotify"])}')
print(f'Posts WITHOUT Spotify on Substack: {len(results["without_spotify"])}')
print(f'Errors: {len(results["errors"])}')
print()

if results['with_spotify']:
    print('✅ Substack Posts WITH Spotify:')
    print('-' * 60)
    for post in results['with_spotify']:
        print(f'  • {post["filename"]}')
        print(f'    Episodes: {", ".join(post["episode_ids"])}')
    print()

if results['without_spotify']:
    print('❌ Substack Posts WITHOUT Spotify:')
    print('-' * 60)
    for post in results['without_spotify']:
        print(f'  • {post["filename"]}')
    print()

# Save results
with open('substack-spotify-check.json', 'w') as f:
    json.dump(results, f, indent=2)

print('📄 Full results saved to: substack-spotify-check.json')
