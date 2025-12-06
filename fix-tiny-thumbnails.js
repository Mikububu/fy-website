const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const postsDir = './posts';
const thumbnailsDir = './blog-thumbnails';

console.log('Finding and fixing tiny thumbnails (36x36)...\n');

// Posts with tiny thumbnails
const tinyThumbnails = [
    'indian-tantra-mahavidyas-versus-nityas',
    'krama-rishi-nyasa-with-iya',
    'string-theory-tantric-secrets-and',
    'the-animal-puja',
    'what-you-can-expect-booking-forbidden',
    'why-a-woman-initiated-in-the-left',
    'why-our-society-cannot-heal'
];

tinyThumbnails.forEach(slug => {
    const htmlPath = path.join(postsDir, `${slug}.html`);

    if (!fs.existsSync(htmlPath)) {
        console.log(`  ✗ ${slug}: HTML file not found`);
        return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Find first blog-images image
    const imgMatch = html.match(/src="(\/blog-images\/[^"]+)"/);

    if (!imgMatch) {
        console.log(`  ⊘ ${slug}: No blog-images found`);
        return;
    }

    const imagePath = imgMatch[1].replace(/^\//, '');

    if (!fs.existsSync(imagePath)) {
        console.log(`  ✗ ${slug}: Image not found at ${imagePath}`);
        return;
    }

    // Determine output format from original tiny thumbnail
    const oldThumb = fs.readdirSync(thumbnailsDir).find(f => f.startsWith(slug));
    const ext = oldThumb ? path.extname(oldThumb) : '.png';
    const thumbnailPath = path.join(thumbnailsDir, `${slug}${ext}`);

    try {
        // Copy and resize image to thumbnail
        execSync(`sips -z 600 600 "${imagePath}" --out "${thumbnailPath}"`, { stdio: 'pipe' });
        console.log(`  ✓ ${slug}: Created thumbnail from ${imagePath}`);
    } catch (err) {
        console.log(`  ✗ ${slug}: Error - ${err.message}`);
    }
});

console.log('\n✓ Fixed tiny thumbnails');
