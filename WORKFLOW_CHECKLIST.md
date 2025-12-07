# Claude Code Workflow Checklist

## CRITICAL: Before Marking ANY Website Task as Complete

### 1. Verify Changes Are in Main Repo
```bash
cd /Volumes/LaCie/CLAUDE
git status
```

### 2. Add All Changes
```bash
git add .
# OR for specific files:
git add path/to/file
```

### 3. Commit with Proper Message
```bash
git commit -m "$(cat <<'EOF'
[Clear description of changes]

- Bullet point of change 1
- Bullet point of change 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 4. Push to Remote (Triggers Netlify Deploy)
```bash
git push origin main
```

### 5. Verify Netlify Deploy
- Wait 1-2 minutes for Netlify build
- Check live site to confirm changes are visible
- DO NOT mark task complete until verified on live site

## Common Mistakes to Avoid

❌ **NEVER** mark a task complete without pushing to remote
❌ **NEVER** assume changes are deployed without verification
❌ **NEVER** work only in worktree without merging to main
❌ **NEVER** forget that Netlify deploys from main branch only

## Image/Media Workflow

When adding images or media to blog posts:

1. ✅ Create/download the actual image file
2. ✅ Add image to HTML as `<img>` tag (not just meta tags!)
3. ✅ Update all SEO meta tags (og:image, twitter:image, schema.org)
4. ✅ Verify image file exists in repo
5. ✅ Commit image file AND HTML changes together
6. ✅ Push to main
7. ✅ Verify image displays on live site

## This File's Purpose

This checklist exists because I previously forgot to:
- Push changes to remote (December 7, 2025)
- Add actual featured image to blog post HTML (December 7, 2025)
- Verify deployment before marking tasks complete

**I will reference this file before completing any website-related task.**
