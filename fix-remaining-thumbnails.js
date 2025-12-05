const fs = require('fs');
const path = require('path');

const posts = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));
let updated = 0;

// Posts with placeholder images that need fixing
const postsToFix = [
  'anais-nin-the-house-of-incest',
  'krama-rishi-nyasa-with-iya',
  'string-theory-tantric-secrets-and',
  'why-a-woman-initiated-in-the-left',
  'indian-tantra-mahavidyas-versus-nityas',
  'why-our-society-cannot-heal',
  'what-you-can-expect-booking-forbidden',
  'the-animal-puja'
];

const avatarId = '10275e41-1116-4dd0-a1c5-e98a7d7ae090'; // Avatar image to skip

posts.forEach(post => {
  if (!postsToFix.includes(post.slug)) return;

  const htmlPath = path.join('./posts', post.slug + '.html');
  if (!fs.existsSync(htmlPath)) {
    console.log(`HTML not found: ${post.slug}`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Pattern to find S3 image URLs (URL-encoded format)
  // Matches: substack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F{id}_{dimensions}.{ext}
  const encodedPattern = /substack-post-media\.s3\.amazonaws\.com%2Fpublic%2Fimages%2F([a-f0-9\-]+)_(\d+x\d+)\.(jpeg|jpg|png|webp|gif)/gi;

  let match;
  let foundImage = null;

  while ((match = encodedPattern.exec(html)) !== null) {
    const imageId = match[1];
    const dimensions = match[2];
    const extension = match[3];

    // Skip avatar image and gifs (not good for thumbnails)
    if (imageId === avatarId) continue;
    if (extension === 'gif') continue;

    // Build the proper CDN URL
    const s3Url = `https://substack-post-media.s3.amazonaws.com/public/images/${imageId}_${dimensions}.${extension}`;
    const encodedS3Url = encodeURIComponent(s3Url);
    foundImage = `https://substackcdn.com/image/fetch/w_1200,h_630,c_fill,f_auto,q_auto:good,fl_progressive:steep/${encodedS3Url}`;
    break; // Use the first valid image
  }

  // If no jpeg/png found, try with gif
  if (!foundImage) {
    encodedPattern.lastIndex = 0;
    while ((match = encodedPattern.exec(html)) !== null) {
      const imageId = match[1];
      const dimensions = match[2];
      const extension = match[3];

      if (imageId === avatarId) continue;

      const s3Url = `https://substack-post-media.s3.amazonaws.com/public/images/${imageId}_${dimensions}.${extension}`;
      const encodedS3Url = encodeURIComponent(s3Url);
      foundImage = `https://substackcdn.com/image/fetch/w_1200,h_630,c_fill,f_auto,q_auto:good,fl_progressive:steep/${encodedS3Url}`;
      break;
    }
  }

  if (foundImage && foundImage !== post.image) {
    console.log(`Fixed: ${post.slug}`);
    post.image = foundImage;
    updated++;
  } else if (!foundImage) {
    console.log(`No image found in: ${post.slug}`);
  }
});

fs.writeFileSync('posts-data.json', JSON.stringify(posts, null, 2));
console.log(`\nUpdated ${updated} thumbnails`);
