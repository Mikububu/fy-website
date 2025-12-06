#!/bin/bash
for file in posts/how-to-deliver-visionary-idea-in.html posts/a-holistic-approach-to-divorce.html posts/anais-nin-the-house-of-incest.html posts/dark-alchemy.html posts/from-a-shakta-tantra-stream-to-forbidden.html; do
  echo "=== $file ==="
  echo -n "H1: "
  grep -o '<h1>[^<]*</h1>' "$file" | sed 's/<[^>]*>//g'
  echo -n "Meta title: "
  grep 'og:title' "$file" | grep -o 'content="[^"]*"' | sed 's/content="//;s/"$//' | head -1
  echo ""
done
