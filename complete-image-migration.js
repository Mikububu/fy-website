const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const postsDir = './posts';
const blogImagesDir = './blog-images';
const imageMapPath = './image-map.json';

// Load existing image map
let imageMap = JSON.parse(fs.readFileSync(imageMapPath, 'utf8'));

// Extract ALL Substack image URLs from a file (comprehensive patterns)
function extractAllSubstackImages(html) {
    const images = new Set();

    // Pattern 1: substackcdn.com URLs with embedded S3 URLs
    const cdnPattern = /https:\/\/substackcdn\.com\/image\/fetch\/[^"'\s]+https%3A%2F%2Fsubstack-post-media\.s3\.amazonaws\.com%2Fpublic%2Fimages%2F([a-f0-9\-]+)_(\d+x\d+)\.(jpeg|jpg|png|webp|gif|heic)/gi;

    // Pattern 2: Direct S3 URLs
    const s3Pattern = /https:\/\/substack-post-media\.s3\.amazonaws\.com\/public\/images\/([a-f0-9\-]+)_(\d+x\d+)\.(jpeg|jpg|png|webp|gif|heic)/gi;

    let match;
    while ((match = cdnPattern.exec(html)) !== null) {
        const imageId = match[1];
        const dimensions = match[2];
        const ext = match[3];
        const s3Url = `https://substack-post-media.s3.amazonaws.com/public/images/${imageId}_${dimensions}.${ext}`;
        images.add(JSON.stringify({ imageId, dimensions, ext, s3Url }));
    }

    while ((match = s3Pattern.exec(html)) !== null) {
        const imageId = match[1];
        const dimensions = match[2];
        const ext = match[3];
        const s3Url = `https://substack-post-media.s3.amazonaws.com/public/images/${imageId}_${dimensions}.${ext}`;
        images.add(JSON.stringify({ imageId, dimensions, ext, s3Url }));
    }

    return Array.from(images).map(s => JSON.parse(s));
}

// Download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlinkSync(filepath);
                reject(new Error(`Failed: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlinkSync(filepath);
            reject(err);
        });
    });
}

// Process image (resize/optimize/convert)
async function processImage(filepath) {
    const ext = path.extname(filepath).toLowerCase();

    // Skip webp and gif files
    if (ext === '.webp' || ext === '.gif') {
        return filepath;
    }

    try {
        // Convert HEIC to JPG
        if (ext === '.heic') {
            const jpgPath = filepath.replace(/\.heic$/, '.jpg');
            await execAsync(`sips -s format jpeg -s formatOptions 85 "${filepath}" --out "${jpgPath}"`);
            fs.unlinkSync(filepath);
            return jpgPath;
        }

        // Get dimensions
        const { stdout } = await execAsync(`sips -g pixelWidth -g pixelHeight "${filepath}"`);
        const widthMatch = stdout.match(/pixelWidth: (\d+)/);
        const heightMatch = stdout.match(/pixelHeight: (\d+)/);

        if (!widthMatch || !heightMatch) return filepath;

        const width = parseInt(widthMatch[1]);
        const height = parseInt(heightMatch[1]);
        const maxDim = Math.max(width, height);

        // Resize if larger than 1600px
        if (maxDim > 1600) {
            await execAsync(`sips -Z 1600 "${filepath}"`);
        }

        // Convert large PNG to JPG
        if (ext === '.png') {
            const stats = fs.statSync(filepath);
            if (stats.size > 1024 * 1024) {
                const jpgPath = filepath.replace(/\.png$/, '.jpg');
                await execAsync(`sips -s format jpeg -s formatOptions 85 "${filepath}" --out "${jpgPath}"`);
                fs.unlinkSync(filepath);
                return jpgPath;
            }
        }

        return filepath;
    } catch (error) {
        console.error(`  Error processing ${path.basename(filepath)}: ${error.message}`);
        return filepath;
    }
}

async function main() {
    console.log('Complete Blog Image Migration\n');
    console.log('==============================\n');

    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

    let totalDownloaded = 0;
    let totalErrors = 0;
    let updatedPosts = 0;

    for (const file of files) {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);
        const html = fs.readFileSync(filepath, 'utf8');

        const images = extractAllSubstackImages(html);

        if (images.length === 0) continue;

        console.log(`\n${slug}: Found ${images.length} Substack images`);

        // Get existing images for this slug or create new array
        const existingImages = imageMap[slug] || [];
        const existingUrls = new Set(existingImages.map(img => img.original));

        const newImages = [];
        let startIndex = existingImages.length;

        for (const img of images) {
            // Skip if already downloaded
            if (existingUrls.has(img.s3Url)) {
                continue;
            }

            const localFilename = `${slug}-img-${startIndex}.${img.ext}`;
            const localPath = path.join(blogImagesDir, localFilename);

            try {
                console.log(`  Downloading ${img.imageId}_${img.dimensions}.${img.ext}...`);
                await downloadImage(img.s3Url, localPath);

                const processedPath = await processImage(localPath);
                const finalLocalUrl = `/blog-images/${path.basename(processedPath)}`;

                newImages.push({
                    original: img.s3Url,
                    local: finalLocalUrl,
                    index: startIndex
                });

                startIndex++;
                totalDownloaded++;
            } catch (error) {
                console.error(`  ✗ Error: ${error.message}`);
                totalErrors++;
            }
        }

        if (newImages.length > 0) {
            imageMap[slug] = [...existingImages, ...newImages];
            updatedPosts++;
        }
    }

    // Save updated image map
    fs.writeFileSync(imageMapPath, JSON.stringify(imageMap, null, 2));

    console.log(`\n\nSummary:`);
    console.log(`  Posts updated: ${updatedPosts}`);
    console.log(`  Images downloaded: ${totalDownloaded}`);
    console.log(`  Errors: ${totalErrors}`);

    // Now replace URLs in ALL HTML files
    console.log(`\n\nReplacing URLs in HTML files...`);

    let replacedPosts = 0;
    let totalReplacements = 0;

    for (const slug of Object.keys(imageMap)) {
        const filepath = path.join(postsDir, `${slug}.html`);
        if (!fs.existsSync(filepath)) continue;

        let html = fs.readFileSync(filepath, 'utf8');
        let changed = false;
        let count = 0;

        for (const img of imageMap[slug]) {
            // Extract image ID from original URL
            const match = img.original.match(/\/([a-f0-9\-]+_\d+x\d+\.(jpeg|jpg|png|webp|gif|heic))$/);
            if (!match) continue;

            const imageFilename = match[1];

            // Replace substackcdn URLs
            const cdnPattern = new RegExp(`https://substackcdn\\.com/image/fetch/[^"'\\s]+${imageFilename.replace(/\./g, '\\.')}`, 'g');
            const cdnMatches = html.match(cdnPattern);
            if (cdnMatches) {
                html = html.replace(cdnPattern, img.local);
                count += cdnMatches.length;
                changed = true;
            }

            // Replace direct S3 URLs
            const s3Pattern = new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const s3Matches = html.match(s3Pattern);
            if (s3Matches) {
                html = html.replace(s3Pattern, img.local);
                count += s3Matches.length;
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(filepath, html);
            replacedPosts++;
            totalReplacements += count;
            console.log(`  ✓ ${slug}.html: ${count} replacements`);
        }
    }

    console.log(`\n✓ Replaced ${totalReplacements} references in ${replacedPosts} posts`);

    // Final verification
    console.log(`\n\nFinal Verification:`);
    let remainingTotal = 0;
    const postsWithRemaining = [];

    for (const file of files) {
        const filepath = path.join(postsDir, file);
        const html = fs.readFileSync(filepath, 'utf8');
        const matches = html.match(/substack-post-media|substackcdn\.com/g);
        if (matches) {
            remainingTotal += matches.length;
            postsWithRemaining.push(`${file}: ${matches.length}`);
        }
    }

    if (remainingTotal === 0) {
        console.log('  ✓ All Substack image URLs successfully replaced!');
    } else {
        console.log(`  ⚠ ${remainingTotal} Substack references still remain in ${postsWithRemaining.length} posts:`);
        postsWithRemaining.slice(0, 10).forEach(p => console.log(`    ${p}`));
    }
}

main().catch(console.error);
