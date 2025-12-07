const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const blogImagesDir = './blog-images';

// Images that were converted from PNG to JPG
const convertedImages = [
    '5-karmendriyas-and-5-jnanendriyas-img-0',
    'beyond-the-naked-surface-img-0',
    'run-away-from-tantra-img-0',
    'run-away-from-tantra-img-1',
    'the-breath-of-god-img-2',
    'the-breath-of-god-img-3',
    'the-compass-of-zen-img-0',
    'the-eight-limitations-of-man-according-img-0',
    'the-eight-limitations-of-man-according-img-1',
    'the-eight-limitations-of-man-according-img-2',
    'the-eight-limitations-of-man-according-img-3',
    'the-eight-limitations-of-man-according-img-4',
    'the-next-generation-of-wellness-retreats-img-0',
    'the-parallel-self-img-0',
    'the-parallel-self-img-2',
    'yogic-transmission-in-raja-yoga-img-0',
    'how-to-deliver-visionary-idea-in-img-1'
];

console.log('Fixing image extensions in HTML files (PNG -> JPG)...\n');

let totalFixed = 0;

for (const imageName of convertedImages) {
    const pngRef = `/blog-images/${imageName}.png`;
    const jpgRef = `/blog-images/${imageName}.jpg`;

    // Check if JPG exists
    const jpgPath = path.join(blogImagesDir, `${imageName}.jpg`);
    if (!fs.existsSync(jpgPath)) {
        console.log(`⚠ JPG not found: ${imageName}.jpg`);
        continue;
    }

    // Find the post slug from the image name
    const slugMatch = imageName.match(/^(.+)-img-\d+$/);
    if (!slugMatch) continue;
    const slug = slugMatch[1];

    const htmlPath = path.join(postsDir, `${slug}.html`);
    if (!fs.existsSync(htmlPath)) {
        console.log(`⚠ Post not found: ${slug}.html`);
        continue;
    }

    let html = fs.readFileSync(htmlPath, 'utf8');

    // Count occurrences
    const regex = new RegExp(pngRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = html.match(regex);

    if (matches && matches.length > 0) {
        html = html.replace(regex, jpgRef);
        fs.writeFileSync(htmlPath, html);
        console.log(`✓ ${slug}: ${matches.length} reference(s) updated (${imageName}.png -> .jpg)`);
        totalFixed += matches.length;
    }
}

console.log(`\n✓ Fixed ${totalFixed} total references\n`);
