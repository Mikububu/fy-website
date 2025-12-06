#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const postsDir = './posts';

// List of posts with mismatched titles
const mismatchedPosts = [
  'a-holistic-approach-to-divorce',
  'anais-nin-the-house-of-incest',
  'dark-alchemy',
  'from-a-shakta-tantra-stream-to-forbidden',
  'hermanns-story-of-his-sensual-liberation',
  'how-to-deliver-visionary-idea-in',
  'not-a-john-baldessari-artwork',
  'soulmates-among-the-stars-the-ultimate',
  'string-theory-tantric-secrets-and',
  'tantra-online',
  'the-compass-of-zen',
  'why-a-woman-initiated-in-the-left',
  'yogic-transmission-in-raja-yoga'
];

console.log('🔧 Fixing H1 titles to match meta og:title...\n');

let fixed = 0;

mismatchedPosts.forEach(slug => {
  const filepath = path.join(postsDir, `${slug}.html`);

  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  ${slug}: File not found`);
    return;
  }

  let html = fs.readFileSync(filepath, 'utf8');

  // Extract og:title
  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  if (!ogTitleMatch) {
    console.log(`⚠️  ${slug}: No og:title found`);
    return;
  }

  let correctTitle = ogTitleMatch[1];

  // Remove " | Forbidden Yoga" suffix if present
  correctTitle = correctTitle.replace(/ \| Forbidden Yoga$/, '');

  // Find and replace H1
  const h1Match = html.match(/<h1>([^<]+)<\/h1>/);
  if (!h1Match) {
    console.log(`⚠️  ${slug}: No H1 found`);
    return;
  }

  const oldH1 = h1Match[1];

  if (oldH1 === correctTitle) {
    console.log(`✓ ${slug}: Already correct`);
    return;
  }

  // Replace H1
  html = html.replace(/<h1>[^<]+<\/h1>/, `<h1>${correctTitle}</h1>`);

  fs.writeFileSync(filepath, html);
  console.log(`✓ ${slug}: Fixed H1 from "${oldH1}" to "${correctTitle}"`);
  fixed++;
});

console.log(`\n${'='.repeat(60)}`);
console.log(`✓ H1 FIX COMPLETE`);
console.log(`  Fixed: ${fixed} posts`);
console.log(`${'='.repeat(60)}\n`);
