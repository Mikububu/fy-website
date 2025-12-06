const fs = require('fs');
const path = require('path');

const postsToFix = [
    'indian-tantra-mahavidyas-versus-nityas',
    'what-you-can-expect-booking-forbidden',
    'why-our-society-cannot-heal'
];

const postsDir = './posts';
const blogImagesDir = './blog-images';

console.log('Adding images back to cleaned posts...\n');

function addImagesToPost(slug) {
    const filepath = path.join(postsDir, `${slug}.html`);
    let html = fs.readFileSync(filepath, 'utf8');

    // Find all images for this post
    const imageFiles = fs.readdirSync(blogImagesDir)
        .filter(f => f.startsWith(`${slug}-img-`) && f.endsWith('.jpg'))
        .sort();

    if (imageFiles.length === 0) {
        console.log(`  ⊘ ${slug}: No images found`);
        return;
    }

    console.log(`  Found ${imageFiles.length} images for ${slug}`);

    // Build image HTML - skip img-0 (it's the thumbnail/avatar)
    const imageHTML = imageFiles
        .filter((_, idx) => idx > 0) // Skip first image (img-0)
        .map(img => `            <img src="/blog-images/${img}" alt="${slug}" class="post-image">`)
        .join('\n');

    if (!imageHTML) {
        console.log(`  ⊘ ${slug}: Only thumbnail image, no content images to add`);
        return;
    }

    // Find the post-content div and add images at the beginning
    const postContentPattern = /(<div class="post-content">)\n([\s\S]*?)(\n        <\/div>)/;

    if (!postContentPattern.test(html)) {
        console.log(`  ✗ ${slug}: Could not find post-content div`);
        return;
    }

    html = html.replace(postContentPattern, `$1\n${imageHTML}\n$2$3`);

    fs.writeFileSync(filepath, html);
    console.log(`  ✓ ${slug}: Added ${imageFiles.length - 1} images to post\n`);
}

function main() {
    for (const slug of postsToFix) {
        addImagesToPost(slug);
    }
    console.log('✓ Done adding images to posts');
}

main();
