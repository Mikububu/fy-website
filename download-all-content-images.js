const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

const postsDir = './posts';
const imagesDir = './blog-images';

// Create blog-images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

let totalImages = 0;
let downloadedImages = 0;
let imageMap = {}; // Track slug -> array of image URLs

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const slug = file.replace('.html', '');
    const content = fs.readFileSync(filepath, 'utf8');

    // Find all Substack CDN image URLs
    const imgRegex = /src="(https:\/\/substackcdn\.com\/image\/fetch\/[^"]+)"/g;
    let match;
    let imageIndex = 0;

    while ((match = imgRegex.exec(content)) !== null) {
        const substackUrl = match[1];
        totalImages++;

        // Generate local filename
        const localFilename = `${slug}-img-${imageIndex}.jpg`;
        const localPath = path.join(imagesDir, localFilename);

        if (!imageMap[slug]) {
            imageMap[slug] = [];
        }

        imageMap[slug].push({
            original: substackUrl,
            local: `/blog-images/${localFilename}`,
            index: imageIndex
        });

        imageIndex++;
    }
});

console.log(`Found ${totalImages} images across ${Object.keys(imageMap).length} posts`);
console.log(`\nStarting downloads...\n`);

// Save the image map for the replacement script
fs.writeFileSync('image-map.json', JSON.stringify(imageMap, null, 2));

// Download images using curl in batches
let downloadQueue = [];
Object.keys(imageMap).forEach(slug => {
    imageMap[slug].forEach(img => {
        downloadQueue.push({
            url: img.original,
            path: img.local.replace('/blog-images/', 'blog-images/')
        });
    });
});

// Process downloads in batches of 5
let completed = 0;
const batchSize = 5;

function downloadBatch(startIndex) {
    const batch = downloadQueue.slice(startIndex, startIndex + batchSize);

    if (batch.length === 0) {
        console.log(`\n✓ Downloaded ${completed} images`);
        console.log(`Next step: Run node replace-content-images.js to update HTML files`);
        return;
    }

    let batchCompleted = 0;

    batch.forEach((item, i) => {
        const cmd = `curl -L "${item.url}" -o "${item.path}" 2>/dev/null`;

        exec(cmd, (error) => {
            if (!error && fs.existsSync(item.path) && fs.statSync(item.path).size > 0) {
                const size = Math.round(fs.statSync(item.path).size / 1024);
                console.log(`✓ Downloaded: ${path.basename(item.path)} (${size}KB)`);
            } else {
                console.log(`✗ Failed: ${path.basename(item.path)}`);
            }

            completed++;
            batchCompleted++;

            if (batchCompleted === batch.length) {
                // Download next batch
                setTimeout(() => downloadBatch(startIndex + batchSize), 100);
            }
        });
    });
}

downloadBatch(0);
