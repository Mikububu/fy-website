#!/usr/bin/env node
const fs = require('fs');

// Read the current JSON
const seoData = JSON.parse(fs.readFileSync('image-seo-descriptions.json', 'utf8'));

// Slug mappings
const slugMappings = {
  'a-holistic-approach-to-divorce': 'divorce-without-discord',
  'anais-nin-the-house-of-incest': 'water-consciousness-and-the-forbidden-realm',
  'dark-alchemy': 'movie-a-dark-song-not-everything-can-be-forgiven',
  'hermanns-story-of-his-sensual-liberation': 'hermanns-fy-yoga-retreat-in-rio-de-janeiro',
  'how-to-deliver-visionary-idea-in': 'on-relationships-and-tantra-the-energetic-debt-you',
  'not-a-john-baldessari-artwork': 'yoni-trataka-gazing-at-the-source',
  'soulmates-among-the-stars-the-ultimate': 'the-last-thing-money-can-buy',
  'string-theory-tantric-secrets-and': 'everything-vibrates',
  'tantra-online': 'online-study-a-forbidden-yoga-lineage',
  'the-compass-of-zen': 'bodhisattva-sexuality-when-sex-becomes-sacred-serv',
  'why-a-woman-initiated-in-the-left': 'when-the-source-becomes-the-destroyer',
  'yogic-transmission-in-raja-yoga': 'the-five-sub-chakras-of-the-heart',
  'from-a-shakta-tantra-stream-to-forbidden': 'forbidden-yoga-guardian-of-indias-vanishing-left-h'
};

console.log('📝 Updating image SEO descriptions with new slugs...\n');

// Update thumbnails
Object.entries(slugMappings).forEach(([oldSlug, newSlug]) => {
  const oldThumbnailKey = `${oldSlug}.jpg`;
  const newThumbnailKey = `${newSlug}.jpg`;

  if (seoData.thumbnails && seoData.thumbnails[oldThumbnailKey]) {
    seoData.thumbnails[newThumbnailKey] = seoData.thumbnails[oldThumbnailKey];
    delete seoData.thumbnails[oldThumbnailKey];
    console.log(`✓ Updated thumbnail: ${oldSlug} → ${newSlug}`);
  }
});

// Update blog_post_images
Object.entries(slugMappings).forEach(([oldSlug, newSlug]) => {
  if (seoData.blog_post_images && seoData.blog_post_images[oldSlug]) {
    seoData.blog_post_images[newSlug] = seoData.blog_post_images[oldSlug];
    delete seoData.blog_post_images[oldSlug];
    console.log(`✓ Updated blog images: ${oldSlug} → ${newSlug}`);
  }
});

// Write updated JSON
fs.writeFileSync('image-seo-descriptions.json', JSON.stringify(seoData, null, 2));

console.log(`\n✓ Updated image-seo-descriptions.json\n`);
