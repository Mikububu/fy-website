const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const imageMap = JSON.parse(fs.readFileSync('image-map.json', 'utf8'));

let updated = 0;
let totalReplaced = 0;

// Build reverse mapping: S3 image ID -> local path
const idToLocal = {};
Object.keys(imageMap).forEach(slug => {
    imageMap[slug].forEach(img => {
        // Extract image ID from S3 URL: bf3d00fc-03f5-43a3-96fc-92ef7dd83914_3024x2731
        const match = img.original.match(/\/([a-f0-9\-]+_\d+x\d+)\.(jpeg|jpg|png|webp)$/);
        if (match) {
            const imageId = match[1];
            idToLocal[imageId] = img.local;
        }
    });
});

console.log(`Found ${Object.keys(idToLocal).length} image mappings\n`);

// Process each HTML file
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;
    let replacedCount = 0;

    // Replace all Substack CDN URLs
    // Pattern: https://substackcdn.com/image/fetch/...https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F[IMAGE_ID]_[DIMS].[EXT]
    const pattern = /https:\/\/substackcdn\.com\/image\/fetch\/[^"'\s]+https%3A%2F%2Fsubstack-post-media\.s3\.amazonaws\.com%2Fpublic%2Fimages%2F([a-f0-9\-]+_\d+x\d+)\.(jpeg|jpg|png|webp)/g;

    content = content.replace(pattern, (match, imageId, ext) => {
        if (idToLocal[imageId]) {
            replacedCount++;
            changed = true;
            return idToLocal[imageId];
        }
        return match;
    });

    // Also replace direct S3 URLs
    const s3Pattern = /https:\/\/substack-post-media\.s3\.amazonaws\.com\/public\/images\/([a-f0-9\-]+_\d+x\d+)\.(jpeg|jpg|png|webp)/g;

    content = content.replace(s3Pattern, (match, imageId, ext) => {
        if (idToLocal[imageId]) {
            replacedCount++;
            changed = true;
            return idToLocal[imageId];
        }
        return match;
    });

    if (changed) {
        fs.writeFileSync(filepath, content);
        updated++;
        totalReplaced += replacedCount;
        console.log(`✓ Updated ${replacedCount} image references in: ${file}`);
    }
});

console.log(`\n✓ Updated ${updated} posts (${totalReplaced} total image references replaced)`);

// Verify no Substack URLs remain
console.log('\nVerifying...');
let remainingCount = 0;
files.forEach(file => {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
    const matches = content.match(/substack-post-media/g);
    if (matches) {
        remainingCount += matches.length;
        console.log(`⚠ ${file} still has ${matches.length} Substack references`);
    }
});

if (remainingCount === 0) {
    console.log('✓ All Substack image URLs successfully replaced!');
} else {
    console.log(`⚠ ${remainingCount} Substack references still remain`);
}
