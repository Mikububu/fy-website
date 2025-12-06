const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const postsDir = './posts';
const blogImagesDir = './blog-images';
const imageMapPath = './image-map.json';

// Posts with missing image FILES (from audit)
// These posts have HTML referencing /blog-images/*.png but the files don't exist
const postsWithMissingImages = {
    '5-karmendriyas-and-5-jnanendriyas': ['5-karmendriyas-and-5-jnanendriyas-img-0.png'],
    'a-holistic-approach-to-divorce': ['a-holistic-approach-to-divorce-img-2.png', 'a-holistic-approach-to-divorce-img-3.png'],
    'beyond-the-naked-surface': ['beyond-the-naked-surface-img-0.png'],
    'how-to-deliver-visionary-idea-in': ['how-to-deliver-visionary-idea-in-img-1.png'],
    'muladhara-chakra-petals': ['muladhara-chakra-petals-img-0.png'],
    'run-away-from-tantra': ['run-away-from-tantra-img-0.png', 'run-away-from-tantra-img-1.png'],
    'the-breath-of-god': ['the-breath-of-god-img-2.png', 'the-breath-of-god-img-3.png'],
    'the-compass-of-zen': ['the-compass-of-zen-img-0.png'],
    'the-eight-limitations-of-man-according': ['the-eight-limitations-of-man-according-img-0.png', 'the-eight-limitations-of-man-according-img-1.png', 'the-eight-limitations-of-man-according-img-2.png', 'the-eight-limitations-of-man-according-img-3.png', 'the-eight-limitations-of-man-according-img-4.png'],
    'the-next-generation-of-wellness-retreats': ['the-next-generation-of-wellness-retreats-img-0.png'],
    'the-parallel-self': ['the-parallel-self-img-0.png', 'the-parallel-self-img-2.png'],
    'the-solace-of-the-scene': ['the-solace-of-the-scene-img-0.png'],
    'yogic-transmission-in-raja-yoga': ['yogic-transmission-in-raja-yoga-img-0.png']
};

// Extract Substack URLs from encoded internalRedirect parameters in HTML
function extractSubstackUrlsFromPost(html) {
    const urls = [];

    // Find encoded URLs in internalRedirect parameters
    const encodedPattern = /img=https%3A%2F%2Fsubstack-post-media\.s3\.amazonaws\.com%2Fpublic%2Fimages%2F([a-f0-9\-]+_\d+x\d+)\.(jpeg|jpg|png|webp|gif)/gi;

    let match;
    while ((match = encodedPattern.exec(html)) !== null) {
        const imageId = match[1];
        const ext = match[2];
        const url = `https://substack-post-media.s3.amazonaws.com/public/images/${imageId}.${ext}`;
        if (!urls.includes(url)) {
            urls.push(url);
        }
    }

    return urls;
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
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     DOWNLOADING MISSING IMAGES FROM SUBSTACK                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    let totalDownloaded = 0;
    let totalErrors = 0;
    const failedImages = [];

    for (const [slug, missingFiles] of Object.entries(postsWithMissingImages)) {
        const htmlPath = path.join(postsDir, `${slug}.html`);

        if (!fs.existsSync(htmlPath)) {
            console.log(`⚠ File not found: ${slug}.html`);
            continue;
        }

        console.log(`\n📄 ${slug}`);
        console.log(`   Missing: ${missingFiles.length} image(s)`);

        const html = fs.readFileSync(htmlPath, 'utf8');
        const substackUrls = extractSubstackUrlsFromPost(html);

        console.log(`   Found ${substackUrls.length} Substack URL(s) in HTML`);

        for (const missingFile of missingFiles) {
            // Extract the image index from filename (e.g., img-0, img-1)
            const indexMatch = missingFile.match(/img-(\d+)/);
            if (!indexMatch) {
                console.log(`   ✗ ${missingFile}: Cannot parse index`);
                totalErrors++;
                failedImages.push({ slug, file: missingFile, reason: 'Cannot parse index' });
                continue;
            }

            const imageIndex = parseInt(indexMatch[1]);
            const substackUrl = substackUrls[imageIndex];

            if (!substackUrl) {
                console.log(`   ✗ ${missingFile}: No Substack URL at index ${imageIndex}`);
                totalErrors++;
                failedImages.push({ slug, file: missingFile, reason: `No URL at index ${imageIndex}` });
                continue;
            }

            const localPath = path.join(blogImagesDir, missingFile);

            console.log(`   ⬇ Downloading ${missingFile}...`);
            console.log(`     From: ${substackUrl.substring(0, 60)}...`);

            try {
                await downloadImage(substackUrl, localPath);

                // Get file size
                const stats = fs.statSync(localPath);
                const sizeKB = Math.round(stats.size / 1024);
                console.log(`   ✓ Downloaded (${sizeKB} KB)`);

                // Resize if needed (but be careful with large images!)
                if (stats.size > 500000) { // > 500KB
                    console.log(`   ⚙ Processing large image...`);
                    await processImage(localPath);
                }

                totalDownloaded++;
            } catch (error) {
                console.log(`   ✗ Failed: ${error.message}`);
                totalErrors++;
                failedImages.push({ slug, file: missingFile, reason: error.message });
            }

            // Small delay between downloads to be nice to Substack
            await new Promise(r => setTimeout(r, 300));
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                         SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`   ✓ Successfully downloaded: ${totalDownloaded} images`);
    console.log(`   ✗ Failed: ${totalErrors} images`);

    if (failedImages.length > 0) {
        console.log('\n   Failed images:');
        failedImages.forEach(f => {
            console.log(`   • ${f.slug}/${f.file}: ${f.reason}`);
        });
    }

    console.log('\n   Run "node audit-posts.js" to verify fixes.\n');
}

main().catch(console.error);
