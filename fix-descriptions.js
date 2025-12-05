const fs = require('fs');
const path = require('path');

const posts = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));
let updated = 0;

// Descriptions that are just slug-like text need to be replaced
const slugPatterns = [
  /^[a-z0-9\s]+$/,  // All lowercase words
  /^(the|a|an|my|our|why|how)\s/i  // Starts with common words but all lowercase
];

posts.forEach(post => {
  const htmlPath = path.join('./posts', post.slug + '.html');
  if (!fs.existsSync(htmlPath)) return;

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Check if description looks like a slug (all lowercase, no punctuation)
  const isSlugLike = post.description &&
    post.description === post.description.toLowerCase() &&
    !post.description.includes('.') &&
    !post.description.includes(',') &&
    post.description.length < 100;

  if (isSlugLike) {
    // Try to extract a better description from the HTML content
    // Look for the first paragraph in the body content
    const paragraphMatch = html.match(/<div[^>]*class="[^"]*body[^"]*"[^>]*>[\s\S]*?<p>([^<]+)<\/p>/i) ||
                          html.match(/<p>([A-Z][^<]{50,})<\/p>/);

    if (paragraphMatch) {
      let newDesc = paragraphMatch[1].trim();
      // Clean up and truncate
      newDesc = newDesc.replace(/&[^;]+;/g, ' ').trim();
      if (newDesc.length > 200) {
        newDesc = newDesc.substring(0, 197) + '...';
      }

      if (newDesc.length > 30 && newDesc !== post.description) {
        console.log(`Fixing: "${post.slug}"`);
        console.log(`  Old: "${post.description}"`);
        console.log(`  New: "${newDesc}"`);
        post.description = newDesc;
        updated++;
      }
    }
  }
});

fs.writeFileSync('posts-data.json', JSON.stringify(posts, null, 2));
console.log(`\nUpdated ${updated} post descriptions`);
