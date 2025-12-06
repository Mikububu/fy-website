const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const postsDir = './posts';
const imagesDir = './blog-images';

// Create directory
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

console.log(`Processing ${files.length} blog posts...\n`);

const imageUrls = [];

// Extract the ACTUAL S3 URLs from the HTML (not the CDN wrapper URLs)
files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const slug = file.replace('.html', '');
    const content = fs.readFileSync(filepath, 'utf8');

    // Look for the actual S3 URLs in data-attrs or direct src
    // Pattern: https://substack-post-media.s3.amazonaws.com/public/images/[ID]_[dimensions].[ext]
    const s3Pattern = /https:\/\/substack-post-media\.s3\.amazonaws\.com\/public\/images\/[a-f0-9\-]+_\d+x\d+\.(jpeg|jpg|png|webp)/g;

    let match;
    let imageIndex = 0;

    while ((match = s3Pattern.exec(content)) !== null) {
        const s3Url = match[0];
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const localFilename = `${slug}-img-${imageIndex}.${ext}`;

        imageUrls.push({
            url: s3Url,
            path: path.join(imagesDir, localFilename),
            slug: slug,
            index: imageIndex,
            filename: localFilename
        });

        imageIndex++;
    }
});

console.log(`Found ${imageUrls.length} S3 images to download\n`);

// Save mapping
const imageMap = {};
imageUrls.forEach(img => {
    if (!imageMap[img.slug]) imageMap[img.slug] = [];
    imageMap[img.slug].push({
        original: img.url,
        local: `/blog-images/${img.filename}`,
        index: img.index
    });
});

fs.writeFileSync('image-map.json', JSON.stringify(imageMap, null, 2));

// Download using wget with retry
let completed = 0;
let succeeded = 0;
let failed = 0;

function downloadNext(index) {
    if (index >= imageUrls.length) {
        console.log(`\n✓ Completed: ${succeeded} successful, ${failed} failed`);
        console.log(`Next: Run node replace-content-images.js to update HTML`);
        return;
    }

    const img = imageUrls[index];

    // Use wget with user agent to avoid blocking
    const cmd = `curl -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${img.url}" -o "${img.path}" --connect-timeout 10 --max-time 30 2>/dev/null`;

    exec(cmd, (error) => {
        completed++;

        if (!error && fs.existsSync(img.path)) {
            const stats = fs.statSync(img.path);
            if (stats.size > 1000) { // At least 1KB
                succeeded++;
                console.log(`✓ [${completed}/${imageUrls.length}] ${img.filename} (${Math.round(stats.size/1024)}KB)`);
            } else {
                failed++;
                fs.unlinkSync(img.path); // Remove tiny/failed file
                console.log(`✗ [${completed}/${imageUrls.length}] ${img.filename} (too small)`);
            }
        } else {
            failed++;
            console.log(`✗ [${completed}/${imageUrls.length}] ${img.filename} (download failed)`);
        }

        // Download next after small delay
        setTimeout(() => downloadNext(index + 1), 200);
    });
}

// Start downloading
downloadNext(0);
