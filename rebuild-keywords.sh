#!/bin/bash

# Rebuild keyword frequency map
# Run this after updating blog posts to refresh which keywords are shared vs unique

echo "Rebuilding keyword frequency map..."
node /Volumes/LaCie/CLAUDE/build-keyword-frequency.js

echo ""
echo "Done! The keyword system will now:"
echo "  - Show colored/clickable styling for keywords appearing in 2+ posts"
echo "  - Show plain text (no color) for keywords appearing in only 1 post"
echo ""
echo "Reload any blog post pages to see the updated styling."
