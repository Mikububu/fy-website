#!/usr/bin/env python3
"""
Re-download all images from original Substack posts.
This ensures we get the correct images for each post.
"""

import subprocess
import sys
from pathlib import Path

# List of all 43 post slugs
POST_SLUGS = [
    "4-paths-into-the-forbidden",
    "5-karmendriyas-and-5-jnanendriyas",
    "a-holistic-approach-to-divorce",
    "anais-nin-the-house-of-incest",
    "beyond-the-naked-surface",
    "dark-alchemy",
    "forbidden-yoga-embracing-the-unconventional",
    "from-a-shakta-tantra-stream-to-forbidden",
    "from-emptiness-to-ecstasy-my-journey",
    "from-freud-to-taoism-and-tantra-sexual",
    "from-language-modulation-to-rolegame",
    "hermanns-story-of-his-sensual-liberation",
    "how-to-deliver-visionary-idea-in",
    "indian-tantra-mahavidyas-versus-nityas",
    "krama-rishi-nyasa-with-iya",
    "muladhara-chakra-petals",
    "my-new-approach-to-therapy",
    "not-a-john-baldessari-artwork",
    "our-brains-urge-for-mystical-experiences",
    "reclaiming-your-voice-working-through",
    "run-away-from-tantra",
    "sensual-liberation-retreats-with",
    "soulmates-among-the-stars-the-ultimate",
    "sparsha-puja-in-a-mental-institution",
    "string-theory-tantric-secrets-and",
    "tantra-online",
    "the-animal-puja",
    "the-breath-of-god",
    "the-compass-of-zen",
    "the-distant-god-fallacy",
    "the-eight-limitations-of-man-according",
    "the-energetic-anatomist",
    "the-forgotten-gateways-of-the-human",
    "the-joy-of-torture",
    "the-next-generation-of-wellness-retreats",
    "the-parallel-self",
    "the-sexual-teachings-of-the-white",
    "the-solace-of-the-scene",
    "what-you-can-expect-booking-forbidden",
    "why-a-woman-initiated-in-the-left",
    "why-i-teach-taoist-sensual-bodywork",
    "why-our-society-cannot-heal",
    "yogic-transmission-in-raja-yoga",
]

def main():
    print(f"Re-downloading images from Substack for {len(POST_SLUGS)} posts\n")

    # Clear existing blog-images directory
    blog_images_dir = Path('/Volumes/LaCie/CLAUDE/blog-images')

    print(f"Clearing {blog_images_dir}...")
    for img_file in blog_images_dir.glob('*'):
        if img_file.is_file() and not img_file.name.startswith('.'):
            img_file.unlink()

    print("Starting re-download...\n")

    success = 0
    failed = []

    for i, slug in enumerate(POST_SLUGS, 1):
        print(f"[{i}/{len(POST_SLUGS)}] {slug}")

        # Run convert-blog-post-full.py which downloads images
        url = f"https://forbiddenyoga.substack.com/p/{slug}"

        try:
            result = subprocess.run(
                ['python3', 'convert-blog-post-full.py', url],
                capture_output=True,
                text=True,
                timeout=60,
                cwd='/Volumes/LaCie/CLAUDE'
            )

            if result.returncode == 0:
                print(f"  ✅ Downloaded")
                success += 1
            else:
                print(f"  ❌ Failed: {result.stderr[:100]}")
                failed.append(slug)

        except subprocess.TimeoutExpired:
            print(f"  ❌ Timeout")
            failed.append(slug)
        except Exception as e:
            print(f"  ❌ Error: {str(e)[:100]}")
            failed.append(slug)

    print(f"\n{'='*80}")
    print(f"✅ Successfully downloaded: {success}/{len(POST_SLUGS)}")

    if failed:
        print(f"\n❌ Failed posts ({len(failed)}):")
        for slug in failed:
            print(f"  - {slug}")
    else:
        print("\n🎉 All images successfully re-downloaded from Substack!")

if __name__ == '__main__':
    main()
