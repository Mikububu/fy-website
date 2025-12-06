const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const imageMap = JSON.parse(fs.readFileSync('image-map.json', 'utf8'));

let updated = 0;
let totalReplaced = 0;

Object.keys(imageMap).forEach(slug => {
    const filepath = path.join(postsDir, `${slug}.html`);

    if (!fs.existsSync(filepath)) {
        console.log(`✗ File not found: ${filepath}`);
        return;
    }

    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;
    let replacedCount = 0;

    // Replace S3 URLs (both direct and in srcset/href attributes)
    imageMap[slug].forEach(img => {
        const s3Url = img.original;

        // Replace in src, href, and srcset attributes
        // Pattern: any Substack CDN URL that contains this S3 image ID
        const imageId = s3Url.match(/\/([a-f0-9\-]+_\d+x\d+\.(jpeg|jpg|png|webp))$/)[1];

        // Match any substackcdn.com URL containing this image ID
        const pattern = new RegExp(`https://substackcdn\\.com/image/fetch/[^"']+${imageId.replace(/\./g, '\\.')}`, 'g');

        const matches = content.match(pattern);
        if (matches) {
            content = content.replace(pattern, img.local);
            replacedCount += matches.length;
            changed = true;
        }

        // Also replace direct S3 URLs
        const s3Pattern = new RegExp(s3Url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const s3Matches = content.match(s3Pattern);
        if (s3Matches) {
            content = content.replace(s3Pattern, img.local);
            replacedCount += s3Matches.length;
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filepath, content);
        updated++;
        totalReplaced += replacedCount;
        console.log(`✓ Updated ${replacedCount} image references in: ${slug}.html`);
    }
});

console.log(`\n✓ Updated ${updated} posts (${totalReplaced} total image references replaced)`);
