#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Load the image SEO descriptions from JSON
const seoData = JSON.parse(fs.readFileSync('image-seo-descriptions.json', 'utf8'));

const postsDir = './posts';

// Template descriptions for common image types when specific descriptions aren't available
const templateDescriptions = {
  'michael-portrait': 'Michael Wogenburg - Shakta Tantra lineage holder and Kaula left-hand path guardian - Forbidden Yoga founder',
  'group-meditation': 'Group tantric meditation practice - nude participants in sacred circle - embodiment and conscious presence work - Sensual Liberation Retreat',
  'teaching-diagram': 'Tantric teaching diagram - Kundalini awakening methodology - Sanskrit terminology and energy anatomy - authentic lineage transmission',
  'ritual-space': 'Sacred tantric ritual chamber - candlelight ceremony space - puja altar and meditation cushions - conscious sexuality temple',
  'intimate-practice': 'Intimate tantric practice - conscious touch and embodiment - Sparsha Puja sacred sexuality - vulnerability and healing work'
};

console.log('🔍 Scanning blog posts for images...\n');

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));

let totalImages = 0;
let updatedImages = 0;

files.forEach(file => {
  const slug = file.replace('.html', '');
  const filepath = path.join(postsDir, file);
  let html = fs.readFileSync(filepath, 'utf8');
  let modified = false;

  // Find all image tags with blog-images
  const imageRegex = /<img[^>]+src="\/blog-images\/([^"]+)"[^>]*>/g;
  let match;

  while ((match = imageRegex.exec(html)) !== null) {
    totalImages++;
    const fullTag = match[0];
    const imagePath = match[1];

    // Extract current alt text if exists
    const altMatch = fullTag.match(/alt="([^"]*)"/);
    const currentAlt = altMatch ? altMatch[1] : '';

    // Check if we have a specific description for this image
    let newAlt = null;

    // Try to find in our SEO data
    if (seoData.blog_post_images && seoData.blog_post_images[slug]) {
      const imgMatch = imagePath.match(/img-(\d+)/);
      if (imgMatch) {
        const imgKey = `img-${imgMatch[1]}`;
        if (seoData.blog_post_images[slug][imgKey]) {
          newAlt = seoData.blog_post_images[slug][imgKey];
        }
      }
    }

    // If no specific description, use smart templating
    if (!newAlt || newAlt === currentAlt) {
      // Skip if already has good alt text (> 50 chars)
      if (currentAlt.length > 50) {
        continue;
      }

      // Apply template based on image filename patterns
      if (imagePath.includes('michael') || slug.includes('wogenburg')) {
        newAlt = templateDescriptions['michael-portrait'];
      } else if (imagePath.match(/img-[0-9]+/) && currentAlt.length < 20) {
        // Generic placeholder for now
        newAlt = `Tantric practice and embodiment work - ${slug.replace(/-/g, ' ')} - Forbidden Yoga Sensual Liberation Retreat`;
      }
    }

    // Update the HTML if we have a new description
    if (newAlt && newAlt !== currentAlt) {
      let newTag;
      if (altMatch) {
        // Replace existing alt
        newTag = fullTag.replace(/alt="[^"]*"/, `alt="${newAlt}"`);
      } else {
        // Add alt attribute
        newTag = fullTag.replace(/<img/, `<img alt="${newAlt}"`);
      }

      html = html.replace(fullTag, newTag);
      modified = true;
      updatedImages++;
    }
  }

  if (modified) {
    fs.writeFileSync(filepath, html);
    console.log(`✓ ${slug}: Updated image alt tags`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`✓ IMAGE SEO UPDATE COMPLETE`);
console.log(`  Total images found: ${totalImages}`);
console.log(`  Images updated: ${updatedImages}`);
console.log(`${'='.repeat(60)}\n`);
