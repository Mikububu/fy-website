const fs = require('fs');
const path = require('path');

// Load the alt text mapping
const mapping = JSON.parse(fs.readFileSync('image-alt-text-mapping.json', 'utf8'));

// Get all HTML files in posts directory
const postsDir = './posts';
const htmlFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));

let totalUpdated = 0;
let filesModified = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(postsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Find all img tags with blog-images src
  const imgRegex = /<img([^>]*?)src="(\/blog-images\/|https:\/\/forbidden-yoga\.com\/blog-images\/)([^"]+)"([^>]*?)(\s*\/?>)/g;

  content = content.replace(imgRegex, (match, before, prefix, filename, after, closing) => {
    // Check if this image has a mapping
    const altText = mapping[filename];
    if (!altText) {
      return match; // No mapping, leave unchanged
    }

    // Check if alt attribute already exists
    const hasAlt = /alt="[^"]*"/.test(before + after);

    if (hasAlt) {
      // Replace existing alt
      const newBefore = before.replace(/alt="[^"]*"/, `alt="${altText}"`);
      const newAfter = after.replace(/alt="[^"]*"/, `alt="${altText}"`);
      if (newBefore !== before || newAfter !== after) {
        modified = true;
        totalUpdated++;
        return `<img${newBefore}src="${prefix}${filename}"${newAfter}${closing}`;
      }
      return match;
    } else {
      // Add alt attribute
      modified = true;
      totalUpdated++;
      return `<img${before}src="${prefix}${filename}" alt="${altText}"${after}${closing}`;
    }
  });

  // Also update og:image meta tags (add proper alt in nearby elements if needed)
  // And ensure title attributes for images

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nDone! Updated ${totalUpdated} images across ${filesModified} files.`);
