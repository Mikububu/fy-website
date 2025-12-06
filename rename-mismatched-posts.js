#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const blogImagesDir = './blog-images';
const blogThumbnailsDir = './blog-thumbnails';

// Function to convert title to slug
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// Mappings from current slug to correct title
const renameMap = {
  'a-holistic-approach-to-divorce': 'Divorce without Discord?',
  'anais-nin-the-house-of-incest': 'Water Consciousness and the Forbidden Realm',
  'dark-alchemy': 'Movie: A DARK SONG - Not everything can be forgiven',
  'hermanns-story-of-his-sensual-liberation': "Hermann's FY Yoga retreat in Rio de Janeiro",
  'how-to-deliver-visionary-idea-in': 'On Relationships and Tantra: The Energetic Debt You Carry',
  'not-a-john-baldessari-artwork': 'Yoni Trataka: Gazing at the Source',
  'soulmates-among-the-stars-the-ultimate': 'The Last Thing Money Can Buy',
  'string-theory-tantric-secrets-and': 'Everything Vibrates',
  'tantra-online': 'ONLINE STUDY - A Forbidden Yoga Lineage',
  'the-compass-of-zen': 'Bodhisattva Sexuality: When Sex Becomes Sacred Service',
  'why-a-woman-initiated-in-the-left': 'When the Source Becomes the Destroyer',
  'yogic-transmission-in-raja-yoga': 'The Five Sub-Chakras of the Heart',
  'from-a-shakta-tantra-stream-to-forbidden': "Forbidden-Yoga: Guardian of India's Vanishing Left-Handed Tantric Heritage"
};

console.log('📝 Renaming mismatched posts...\n');

let renamed = 0;

Object.entries(renameMap).forEach(([oldSlug, correctTitle]) => {
  const newSlug = titleToSlug(correctTitle);

  console.log(`\n${oldSlug} → ${newSlug}`);
  console.log(`  Title: "${correctTitle}"`);

  // 1. Rename HTML file
  const oldHtmlPath = path.join(postsDir, `${oldSlug}.html`);
  const newHtmlPath = path.join(postsDir, `${newSlug}.html`);

  if (fs.existsSync(oldHtmlPath)) {
    // Update all internal references in the HTML
    let html = fs.readFileSync(oldHtmlPath, 'utf8');

    // Update canonical URL
    html = html.replace(
      new RegExp(`/${oldSlug}\\.html`, 'g'),
      `/${newSlug}.html`
    );

    // Update og:url
    html = html.replace(
      new RegExp(`posts/${oldSlug}\\.html`, 'g'),
      `posts/${newSlug}.html`
    );

    // Update blog image references
    html = html.replace(
      new RegExp(`/${oldSlug}-img-`, 'g'),
      `/${newSlug}-img-`
    );

    // Update thumbnail reference
    html = html.replace(
      new RegExp(`/${oldSlug}\\.jpg`, 'g'),
      `/${newSlug}.jpg`
    );

    // Write updated HTML to new location
    fs.writeFileSync(newHtmlPath, html);
    console.log(`  ✓ Renamed HTML file`);

    // Delete old file
    fs.unlinkSync(oldHtmlPath);
  } else {
    console.log(`  ⚠️  HTML file not found`);
  }

  // 2. Rename blog images
  const oldImagePattern = new RegExp(`^${oldSlug}-img-`);
  const imageFiles = fs.readdirSync(blogImagesDir);
  let imageCount = 0;

  imageFiles.forEach(file => {
    if (oldImagePattern.test(file)) {
      const newFileName = file.replace(oldImagePattern, `${newSlug}-img-`);
      const oldImagePath = path.join(blogImagesDir, file);
      const newImagePath = path.join(blogImagesDir, newFileName);

      fs.renameSync(oldImagePath, newImagePath);
      imageCount++;
    }
  });

  if (imageCount > 0) {
    console.log(`  ✓ Renamed ${imageCount} blog images`);
  }

  // 3. Rename thumbnail
  const oldThumbnail = path.join(blogThumbnailsDir, `${oldSlug}.jpg`);
  const newThumbnail = path.join(blogThumbnailsDir, `${newSlug}.jpg`);

  if (fs.existsSync(oldThumbnail)) {
    fs.renameSync(oldThumbnail, newThumbnail);
    console.log(`  ✓ Renamed thumbnail`);
  }

  renamed++;
});

console.log(`\n${'='.repeat(60)}`);
console.log(`✓ RENAME COMPLETE`);
console.log(`  Renamed: ${renamed} posts`);
console.log(`${'='.repeat(60)}\n`);
