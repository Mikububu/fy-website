const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const postsDir = './posts';
const imagesDir = './blog-images';
const MAX_FILE_SIZE_MB = 4; // Stay under 5MB limit
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Create directory
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

console.log(`Processing ${files.length} blog posts...\n`);

const imageUrls = [];

// Extract S3 URLs from HTML
files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const slug = file.replace('.html', '');
    const content = fs.readFileSync(filepath, 'utf8');

    const s3Pattern = /https:\/\/substack-post-media\.s3\.amazonaws\.com\/public\/images\/[a-f0-9\-]+_\d+x\d+\.(jpeg|jpg|png|webp)/g;

    let match;
    let imageIndex = 0;

    while ((match = s3Pattern.exec(content)) !== null) {
        const s3Url = match[0];
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const localFilename = `${slug}-img-${imageIndex}.${ext}`;
        const localPath = path.join(imagesDir, localFilename);

        // Skip if already exists and is under size limit
        if (fs.existsSync(localPath)) {
            const stats = fs.statSync(localPath);
            if (stats.size < MAX_FILE_SIZE_BYTES && stats.size > 1000) {
                console.log(`⊘ Skipping ${localFilename} (already exists, ${Math.round(stats.size/1024)}KB)`);
                imageIndex++;
                continue;
            }
        }

        imageUrls.push({
            url: s3Url,
            path: localPath,
            slug: slug,
            index: imageIndex,
            filename: localFilename
        });

        imageIndex++;
    }
});

console.log(`Found ${imageUrls.length} images to download/process\n`);

if (imageUrls.length === 0) {
    console.log('All images already downloaded and optimized!');
    process.exit(0);
}

let completed = 0;
let succeeded = 0;
let failed = 0;

function resizeIfNeeded(filepath) {
    return new Promise((resolve) => {
        const stats = fs.statSync(filepath);
        const sizeMB = stats.size / (1024 * 1024);

        if (stats.size <= MAX_FILE_SIZE_BYTES) {
            resolve({ resized: false, size: stats.size });
            return;
        }

        console.log(`  → Resizing ${path.basename(filepath)} (${sizeMB.toFixed(2)}MB > ${MAX_FILE_SIZE_MB}MB)`);

        // Try using sips (built-in macOS tool) first
        const resizeCmd = `sips -Z 2000 --setProperty formatOptions 85 "${filepath}"`;

        exec(resizeCmd, (error) => {
            if (error) {
                console.log(`  ✗ Resize failed, keeping original`);
                resolve({ resized: false, size: stats.size });
            } else {
                const newStats = fs.statSync(filepath);
                const newSizeMB = newStats.size / (1024 * 1024);
                console.log(`  ✓ Resized to ${newSizeMB.toFixed(2)}MB`);
                resolve({ resized: true, size: newStats.size });
            }
        });
    });
}

async function downloadAndProcess(index) {
    if (index >= imageUrls.length) {
        console.log(`\n✓ Completed: ${succeeded} successful, ${failed} failed`);
        console.log(`\nAll images are ready and under ${MAX_FILE_SIZE_MB}MB!`);
        return;
    }

    const img = imageUrls[index];

    // Download
    const cmd = `curl -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${img.url}" -o "${img.path}" --connect-timeout 10 --max-time 30 2>/dev/null`;

    exec(cmd, async (error) => {
        completed++;

        if (!error && fs.existsSync(img.path)) {
            const stats = fs.statSync(img.path);
            if (stats.size > 1000) { // At least 1KB
                const sizeMB = stats.size / (1024 * 1024);
                console.log(`✓ [${completed}/${imageUrls.length}] Downloaded ${img.filename} (${sizeMB.toFixed(2)}MB)`);

                // Resize if needed
                await resizeIfNeeded(img.path);
                succeeded++;
            } else {
                failed++;
                fs.unlinkSync(img.path);
                console.log(`✗ [${completed}/${imageUrls.length}] ${img.filename} (too small)`);
            }
        } else {
            failed++;
            console.log(`✗ [${completed}/${imageUrls.length}] ${img.filename} (download failed)`);
        }

        // Download next after small delay
        setTimeout(() => downloadAndProcess(index + 1), 300);
    });
}

// Start processing
downloadAndProcess(0);
