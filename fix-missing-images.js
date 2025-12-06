const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const postsDir = './posts';
const blogImagesDir = './blog-images';
const imageMapPath = './image-map.json';

// Posts missing from image map
const missingPosts = [
    'anais-nin-the-house-of-incest',
    'indian-tantra-mahavidyas-versus-nityas',
    'krama-rishi-nyasa-with-iya',
    'string-theory-tantric-secrets-and',
    'the-animal-puja',
    'what-you-can-expect-booking-forbidden',
    'why-a-woman-initiated-in-the-left',
    'why-our-society-cannot-heal'
];

// Load existing image map
const imageMap = JSON.parse(fs.readFileSync(imageMapPath, 'utf8'));

// Extract all unique Substack image IDs from HTML
function extractSubstackImages(html) {
    const images = [];

    // Pattern 1: substackcdn.com/image/fetch/...substack-post-media.s3.amazonaws.com/.../IMAGE_ID_DIMSxDIMS.EXT
    const cdnPattern = /https:\/\/substackcdn\.com\/image\/fetch\/[^"'\s]+https%3A%2F%2Fsubstack-post-media\.s3\.amazonaws\.com%2Fpublic%2Fimages%2F([a-f0-9\-]+_\d+x\d+)\.(jpeg|jpg|png|webp)/g;

    // Pattern 2: Direct S3 URLs
    const s3Pattern = /https:\/\/substack-post-media\.s3\.amazonaws\.com\/public\/images\/([a-f0-9\-]+_\d+x\d+)\.(jpeg|jpg|png|webp)/g;

    let match;
    while ((match = cdnPattern.exec(html)) !== null) {
        images.push({
            imageId: match[1],
            ext: match[2],
            original: `https://substack-post-media.s3.amazonaws.com/public/images/${match[1]}.${match[2]}`
        });
    }

    while ((match = s3Pattern.exec(html)) !== null) {
        const alreadyExists = images.find(img => img.imageId === match[1]);
        if (!alreadyExists) {
            images.push({
                imageId: match[1],
                ext: match[2],
                original: `https://substack-post-media.s3.amazonaws.com/public/images/${match[1]}.${match[2]}`
            });
        }
    }

    // Deduplicate by imageId
    const uniqueImages = [];
    const seen = new Set();
    for (const img of images) {
        if (!seen.has(img.imageId)) {
            seen.add(img.imageId);
            uniqueImages.push(img);
        }
    }

    return uniqueImages;
}

// Download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Process images with sips (resize and optimize)
async function processImage(filepath) {
    const ext = path.extname(filepath).toLowerCase();

    // Skip webp files - they're already optimized
    if (ext === '.webp') {
        console.log(`  Skipping webp file: ${path.basename(filepath)}`);
        return;
    }

    try {
        // Get image dimensions
        const { stdout: sizeOutput } = await execAsync(`sips -g pixelWidth -g pixelHeight "${filepath}"`);
        const widthMatch = sizeOutput.match(/pixelWidth: (\d+)/);
        const heightMatch = sizeOutput.match(/pixelHeight: (\d+)/);

        if (!widthMatch || !heightMatch) {
            console.log(`  Could not get dimensions for ${path.basename(filepath)}`);
            return;
        }

        const width = parseInt(widthMatch[1]);
        const height = parseInt(heightMatch[1]);
        const maxDimension = Math.max(width, height);

        // Only resize if larger than 1600px
        if (maxDimension > 1600) {
            const scale = 1600 / maxDimension;
            const newWidth = Math.round(width * scale);
            const newHeight = Math.round(height * scale);

            await execAsync(`sips -Z 1600 "${filepath}"`);
            console.log(`  Resized ${path.basename(filepath)} from ${width}x${height} to ~${newWidth}x${newHeight}`);
        }

        // Convert PNG to JPG if larger than 1MB
        if (ext === '.png') {
            const stats = fs.statSync(filepath);
            if (stats.size > 1024 * 1024) {
                const jpgPath = filepath.replace(/\.png$/, '.jpg');
                await execAsync(`sips -s format jpeg -s formatOptions 85 "${filepath}" --out "${jpgPath}"`);
                fs.unlinkSync(filepath);
                console.log(`  Converted ${path.basename(filepath)} to JPG`);
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
    console.log('Processing blog posts with missing images...\n');

    let totalDownloaded = 0;
    let totalErrors = 0;

    for (const slug of missingPosts) {
        const htmlPath = path.join(postsDir, `${slug}.html`);

        if (!fs.existsSync(htmlPath)) {
            console.log(`⚠ File not found: ${slug}.html`);
            continue;
        }

        console.log(`\nProcessing: ${slug}`);

        const html = fs.readFileSync(htmlPath, 'utf8');
        const images = extractSubstackImages(html);

        if (images.length === 0) {
            console.log(`  No Substack images found`);
            continue;
        }

        console.log(`  Found ${images.length} unique images`);

        const mappedImages = [];

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const localFilename = `${slug}-img-${i}.${img.ext}`;
            const localPath = path.join(blogImagesDir, localFilename);
            const localUrl = `/blog-images/${localFilename}`;

            try {
                console.log(`  Downloading image ${i + 1}/${images.length}...`);
                await downloadImage(img.original, localPath);

                // Process (resize/optimize)
                const processedPath = await processImage(localPath);

                // Update local URL if file was converted
                const finalLocalUrl = processedPath ? `/blog-images/${path.basename(processedPath)}` : localUrl;

                mappedImages.push({
                    original: img.original,
                    local: finalLocalUrl,
                    index: i
                });

                totalDownloaded++;
            } catch (error) {
                console.error(`  ✗ Error downloading image ${i}: ${error.message}`);
                totalErrors++;
            }
        }

        // Add to image map
        if (mappedImages.length > 0) {
            imageMap[slug] = mappedImages;
            console.log(`  ✓ Added ${mappedImages.length} images to map`);
        }
    }

    // Save updated image map
    fs.writeFileSync(imageMapPath, JSON.stringify(imageMap, null, 2));
    console.log(`\n✓ Updated image-map.json`);
    console.log(`\nSummary:`);
    console.log(`  Downloaded: ${totalDownloaded} images`);
    console.log(`  Errors: ${totalErrors} images`);

    // Now replace URLs in HTML files
    console.log(`\nReplacing URLs in HTML files...`);

    let updatedPosts = 0;
    let totalReplaced = 0;

    for (const slug of missingPosts) {
        const htmlPath = path.join(postsDir, `${slug}.html`);

        if (!fs.existsSync(htmlPath) || !imageMap[slug]) {
            continue;
        }

        let html = fs.readFileSync(htmlPath, 'utf8');
        let changed = false;
        let replacedCount = 0;

        imageMap[slug].forEach(img => {
            const imageId = img.original.match(/\/([a-f0-9\-]+_\d+x\d+\.(jpeg|jpg|png|webp))$/)[1];

            // Replace substackcdn URLs
            const cdnPattern = new RegExp(`https://substackcdn\\.com/image/fetch/[^"'\\s]+${imageId.replace(/\./g, '\\.')}`, 'g');
            const cdnMatches = html.match(cdnPattern);
            if (cdnMatches) {
                html = html.replace(cdnPattern, img.local);
                replacedCount += cdnMatches.length;
                changed = true;
            }

            // Replace direct S3 URLs
            const s3Pattern = new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const s3Matches = html.match(s3Pattern);
            if (s3Matches) {
                html = html.replace(s3Pattern, img.local);
                replacedCount += s3Matches.length;
                changed = true;
            }
        });

        if (changed) {
            fs.writeFileSync(htmlPath, html);
            updatedPosts++;
            totalReplaced += replacedCount;
            console.log(`  ✓ Updated ${replacedCount} references in ${slug}.html`);
        }
    }

    console.log(`\n✓ Updated ${updatedPosts} posts (${totalReplaced} total references replaced)`);

    // Verify no Substack URLs remain in these posts
    console.log(`\nVerifying...`);
    let remainingCount = 0;
    for (const slug of missingPosts) {
        const htmlPath = path.join(postsDir, `${slug}.html`);
        if (!fs.existsSync(htmlPath)) continue;

        const html = fs.readFileSync(htmlPath, 'utf8');
        const matches = html.match(/substack-post-media/g);
        if (matches) {
            remainingCount += matches.length;
            console.log(`  ⚠ ${slug}.html still has ${matches.length} Substack references`);
        }
    }

    if (remainingCount === 0) {
        console.log('  ✓ All Substack image URLs successfully replaced!');
    } else {
        console.log(`  ⚠ ${remainingCount} Substack references still remain`);
    }
}

main().catch(console.error);
