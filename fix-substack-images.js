const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const postsToFix = [
    'indian-tantra-mahavidyas-versus-nityas',
    'what-you-can-expect-booking-forbidden',
    'why-our-society-cannot-heal'
];

const postsDir = './posts';
const blogImagesDir = './blog-images';

console.log('Fixing Substack images in problematic posts...\n');

async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Follow redirect
                downloadImage(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });

            fileStream.on('error', (err) => {
                fs.unlink(outputPath, () => {});
                reject(err);
            });
        }).on('error', reject);
    });
}

async function fixPost(slug) {
    const filepath = path.join(postsDir, `${slug}.html`);
    let html = fs.readFileSync(filepath, 'utf8');

    // Find all Substack images
    const substackRegex = /src="(https:\/\/substackcdn\.com[^"]+)"/g;
    const matches = [...html.matchAll(substackRegex)];

    if (matches.length === 0) {
        console.log(`  ⊘ ${slug}: No Substack images found`);
        return;
    }

    console.log(`  Processing ${slug}: Found ${matches.length} Substack images`);

    let imageIndex = 0;
    for (const match of matches) {
        const substackUrl = match[1];
        const localFilename = `${slug}-img-${imageIndex}.jpg`;
        const localPath = path.join(blogImagesDir, localFilename);
        const localUrl = `/blog-images/${localFilename}`;

        try {
            // Download the image
            console.log(`    Downloading image ${imageIndex}...`);
            await downloadImage(substackUrl, localPath);

            // Replace in HTML
            html = html.replace(substackUrl, localUrl);

            console.log(`    ✓ Replaced with ${localFilename}`);
            imageIndex++;
        } catch (err) {
            console.log(`    ✗ Failed to download image ${imageIndex}: ${err.message}`);
        }
    }

    // Write updated HTML
    fs.writeFileSync(filepath, html);
    console.log(`  ✓ ${slug}: Updated ${imageIndex} images\n`);
}

async function main() {
    for (const slug of postsToFix) {
        await fixPost(slug);
    }
    console.log('✓ Done fixing Substack images');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
