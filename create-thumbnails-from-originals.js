const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const blogImagesDir = './blog-images';
const thumbnailsDir = './blog-thumbnails';
const postsDir = './posts';

console.log('Creating thumbnails from original blog-images...\n');

// Get all post slugs
const posts = fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.html') && !f.startsWith('.'))
    .map(f => f.replace('.html', ''));

let created = 0;
let skipped = 0;

posts.forEach(slug => {
    // Look for first image for this post (img-0)
    const possibleImages = [
        `${slug}-img-0.jpg`,
        `${slug}-img-0.png`,
        `${slug}-img-0.jpeg`,
        `${slug}-img-0.webp`
    ];

    let sourceImage = null;
    for (const img of possibleImages) {
        const imgPath = path.join(blogImagesDir, img);
        if (fs.existsSync(imgPath)) {
            sourceImage = imgPath;
            break;
        }
    }

    if (!sourceImage) {
        console.log(`  ⊘ ${slug}: No img-0 found in blog-images`);
        skipped++;
        return;
    }

    // Determine output format (prefer jpg for photos, keep png if original is png)
    const ext = path.extname(sourceImage);
    const thumbnailPath = path.join(thumbnailsDir, `${slug}${ext}`);

    try {
        // Create thumbnail with max 600px width/height, maintaining aspect ratio
        execSync(`sips -Z 600 "${sourceImage}" --out "${thumbnailPath}"`, { stdio: 'pipe' });
        console.log(`  ✓ ${slug}: Created from ${path.basename(sourceImage)}`);
        created++;
    } catch (err) {
        console.log(`  ✗ ${slug}: Error - ${err.message}`);
        skipped++;
    }
});

console.log(`\n✓ Created ${created} thumbnails from original images`);
console.log(`⊘ Skipped ${skipped} posts`);
