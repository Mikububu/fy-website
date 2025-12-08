#!/bin/bash
# Batch SEODEEP processing script
# Processes all posts with Substack bloat and tracks age-restricted ones

cd /Volumes/LaCie/CLAUDE

echo "=== BATCH SEODEEP PROCESSING ==="
echo "Finding all posts with Substack bloat..."

# Get list of posts with pencraft classes (Substack bloat)
posts_with_bloat=$(cd posts && grep -l "pencraft" *.html)

total=$(echo "$posts_with_bloat" | wc -l | tr -d ' ')
current=0

echo "Found $total posts needing SEODEEP"
echo ""

for html_file in $posts_with_bloat; do
  current=$((current + 1))
  slug=$(basename "$html_file" .html)

  echo "[$current/$total] Processing: $slug"

  # Run SEODEEP
  python3 convert-blog-post-full.py "https://forbiddenyoga.substack.com/p/$slug" > "/tmp/seodeep-${slug}.log" 2>&1

  # Check if age-restricted
  if grep -q "Podcast post with no article content" "/tmp/seodeep-${slug}.log"; then
    echo "  → Age-restricted (needs manual content)"
    # Add to age-restricted list if not already there
    if ! grep -q "^- $slug$" age-restricted-posts.txt; then
      echo "- $slug" >> age-restricted-posts.txt
    fi
  else
    echo "  → Content extracted successfully"
  fi

  echo ""
done

echo "=== BATCH PROCESSING COMPLETE ==="
echo ""
echo "Age-restricted posts: $(grep -c '^- ' age-restricted-posts.txt)"
echo "See age-restricted-posts.txt for full list"
echo ""
echo "Next steps:"
echo "  1. Review processed posts"
echo "  2. Commit and push changes"
echo "  3. Rebuild keyword frequency: node build-keyword-frequency.js"
echo "  4. Add manual content to age-restricted posts"
