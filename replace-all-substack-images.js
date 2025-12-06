const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const imageMapPath = './image-map.json';

console.log('Emergency Fix: Replacing ALL Substack image URLs with local copies\n');
console.log('=================================================================\n');

// Load image map
const imageMap = JSON.parse(fs.readFileSync(imageMapPath, 'utf8'));

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

let totalReplacements = 0;
let postsFixed = 0;

files.forEach(file => {
    const slug = file.replace('.html', '');
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    if (!imageMap[slug]) {
        return;
    }

    let changed = false;
    let count = 0;

    imageMap[slug].forEach(img => {
        // Extract the image ID from the original S3 URL
        const idMatch = img.original.match(/\/([a-f0-9\-]+_\d+x\d+\.\w+)$/);
        if (!idMatch) {
            const heicMatch = img.original.match(/\/([a-f0-9\-]+)\.(heic|jpeg|jpg|png|webp|gif)$/);
            if (heicMatch) {
                const imageId = heicMatch[1];
                const ext = heicMatch[2];

                // Replace ALL variations of this image URL
                // Pattern 1: substackcdn.com with encoded S3 URL
                const cdnPattern1 = new RegExp(`https://substackcdn\\.com/image/fetch/[^"'\\s]*${imageId}[^"'\\s]*\\.${ext}`, 'g');
                const matches1 = html.match(cdnPattern1);
                if (matches1) {
                    html = html.replace(cdnPattern1, img.local);
                    count += matches1.length;
                    changed = true;
                }

                // Pattern 2: Direct S3 URL
                const s3Pattern = new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const matches2 = html.match(s3Pattern);
                if (matches2) {
                    html = html.replace(s3Pattern, img.local);
                    count += matches2.length;
                    changed = true;
                }
            }
            return;
        }

        const imageFilename = idMatch[1];

        // Replace ALL variations of this image URL

        // Pattern 1: substackcdn.com with transform parameters
        const cdnPattern1 = new RegExp(`https://substackcdn\\.com/image/fetch/[^"'\\s]+${imageFilename.replace(/\./g, '\\.')}`, 'g');
        const matches1 = html.match(cdnPattern1);
        if (matches1) {
            html = html.replace(cdnPattern1, img.local);
            count += matches1.length;
            changed = true;
        }

        // Pattern 2: Direct S3 URL
        const s3Pattern = new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches2 = html.match(s3Pattern);
        if (matches2) {
            html = html.replace(s3Pattern, img.local);
            count += matches2.length;
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filepath, html);
        postsFixed++;
        totalReplacements += count;
        console.log(`✓ ${file}: Fixed ${count} image URLs`);
    }
});

console.log(`\n✓ Fixed ${totalReplacements} image references in ${postsFixed} posts`);

// Final verification
console.log('\n\nFinal Verification:');
let remainingTotal = 0;
const postsWithRemaining = [];

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const html = fs.readFileSync(filepath, 'utf8');

    // Only count actual content image URLs, not profile/comment links
    const contentImageMatches = html.match(/https:\/\/(substackcdn\.com\/image\/fetch|substack-post-media\.s3\.amazonaws\.com)/g);
    if (contentImageMatches) {
        remainingTotal += contentImageMatches.length;
        postsWithRemaining.push(`${file}: ${contentImageMatches.length}`);
    }
});

if (remainingTotal === 0) {
    console.log('  ✓ All Substack content image URLs successfully replaced!');
} else {
    console.log(`  ⚠ ${remainingTotal} Substack image URLs still remain in ${postsWithRemaining.length} posts:`);
    postsWithRemaining.forEach(p => console.log(`    ${p}`));
}
