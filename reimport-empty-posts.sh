#!/bin/bash
# Re-import all 23 posts that have no content from Substack

set -e  # Exit on error

cd /Volumes/LaCie/CLAUDE

echo "Starting re-import of 23 posts with missing content..."
echo ""

# Array of slugs (removing .html extension)
posts=(
  "5-karmendriyas-and-5-jnanendriyas"
  "a-holistic-approach-to-divorce"
  "beyond-the-naked-surface"
  "forbidden-yoga-embracing-the-unconventional"
  "from-a-shakta-tantra-stream-to-forbidden"
  "from-language-modulation-to-rolegame"
  "hermanns-story-of-his-sensual-liberation"
  "how-to-deliver-visionary-idea-in"
  "krama-rishi-nyasa-with-iya"
  "muladhara-chakra-petals"
  "my-new-approach-to-therapy"
  "our-brains-urge-for-mystical-experiences"
  "reclaiming-your-voice-working-through"
  "run-away-from-tantra"
  "soulmates-among-the-stars-the-ultimate"
  "string-theory-tantric-secrets-and"
  "the-breath-of-god"
  "the-distant-god-fallacy"
  "the-joy-of-torture"
  "the-parallel-self"
  "the-sexual-teachings-of-the-white"
  "why-our-society-cannot-heal"
  "yogic-transmission-in-raja-yoga"
)

count=0
total=${#posts[@]}

for slug in "${posts[@]}"; do
  count=$((count + 1))
  echo "[$count/$total] Re-importing: $slug"

  # Run the conversion script
  python3 convert-blog-post-full.py "https://forbiddenyoga.substack.com/p/$slug"

  if [ $? -eq 0 ]; then
    echo "  ✅ Success"
  else
    echo "  ❌ Failed"
  fi

  echo ""
done

echo "Re-import complete! Run audit-all-posts.py to verify."
