const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const postsDir = './posts';
const blogImagesDir = './blog-images';

console.log('AUTO-FIX: Starting comprehensive blog post repair...\n');

// Helper: Download image
async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadImage(response.headers.location, outputPath)
                    .then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed: ${response.statusCode}`));
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

// Fix 1: Strip Substack UI and extract clean content
function stripSubstackUI(filepath, slug) {
    let html = fs.readFileSync(filepath, 'utf8');

    const hasSubstack = html.includes('class="pencraft') ||
                       html.includes('substackcdn') ||
                       html.includes('data-component-name');

    if (!hasSubstack) {
        return { action: 'skip', reason: 'Already clean' };
    }

    // Extract article content
    const bodyMarkupPattern = /<div dir="auto" class="body markup">([\s\S]*?)<\/div>/;
    const match = html.match(bodyMarkupPattern);

    if (!match) {
        return { action: 'error', reason: 'No body markup found' };
    }

    const articleContent = match[1];

    // Find images for this post
    const imageFiles = fs.readdirSync(blogImagesDir)
        .filter(f => f.startsWith(`${slug}-img-`) &&
                    (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')))
        .sort();

    // Build image HTML (skip img-0 which is thumbnail)
    let imageHTML = '';
    if (imageFiles.length > 1) {
        imageHTML = imageFiles
            .filter((_, idx) => idx > 0)
            .map(img => `            <img src="/blog-images/${img}" alt="${slug}" class="post-image">`)
            .join('\n') + '\n';
    }

    // Replace post-content
    const postContentPattern = /(<div class="post-content">[\s\S]*?)([\s\S]*?)(<\/div>\s*<div class="post-keywords">)/;

    if (!postContentPattern.test(html)) {
        return { action: 'error', reason: 'No post-content div' };
    }

    html = html.replace(postContentPattern, `$1\n${imageHTML}            ${articleContent}\n        $3`);
    fs.writeFileSync(filepath, html);

    return {
        action: 'fixed',
        images: imageFiles.length - 1,
        textLength: articleContent.length
    };
}

// Fix 2: Download missing Substack images
async function downloadSubstackImages(filepath, slug) {
    let html = fs.readFileSync(filepath, 'utf8');

    const substackRegex = /src="(https:\/\/substackcdn\.com[^"]+)"/g;
    const matches = [...html.matchAll(substackRegex)];

    if (matches.length === 0) {
        return { action: 'skip', reason: 'No Substack images' };
    }

    let downloaded = 0;
    let imageIndex = 0;

    // Find the highest existing image index
    const existingImages = fs.readdirSync(blogImagesDir)
        .filter(f => f.startsWith(`${slug}-img-`))
        .map(f => {
            const match = f.match(/-img-(\d+)\./);
            return match ? parseInt(match[1]) : -1;
        });

    imageIndex = existingImages.length > 0 ? Math.max(...existingImages) + 1 : 0;

    for (const match of matches) {
        const substackUrl = match[1];
        const localFilename = `${slug}-img-${imageIndex}.jpg`;
        const localPath = path.join(blogImagesDir, localFilename);
        const localUrl = `/blog-images/${localFilename}`;

        try {
            await downloadImage(substackUrl, localPath);
            html = html.replace(substackUrl, localUrl);
            downloaded++;
            imageIndex++;
        } catch (err) {
            console.log(`    ⚠ Failed to download image: ${err.message}`);
        }
    }

    if (downloaded > 0) {
        fs.writeFileSync(filepath, html);
    }

    return { action: 'fixed', downloaded };
}

// Fix 3: Add top back link if missing
function addTopBackLink(filepath, slug) {
    let html = fs.readFileSync(filepath, 'utf8');

    if (html.includes('class="top-back-link"')) {
        return { action: 'skip', reason: 'Already has back link' };
    }

    const insertRegex = /(<article class="post-container">)/;
    if (!insertRegex.test(html)) {
        return { action: 'error', reason: 'No post-container' };
    }

    const backLink = `\n        <a href="/#blog-section" class="top-back-link">← Back to all posts</a>\n`;
    html = html.replace(insertRegex, `$1${backLink}`);
    fs.writeFileSync(filepath, html);

    return { action: 'fixed' };
}

// Main auto-fix function
async function autoFixPost(file) {
    const slug = file.replace('.html', '');
    const filepath = path.join(postsDir, file);

    console.log(`\n📝 ${slug}`);

    const results = {
        substackUI: { action: 'skip' },
        substackImages: { action: 'skip' },
        topBackLink: { action: 'skip' }
    };

    try {
        // Fix 1: Strip Substack UI
        results.substackUI = stripSubstackUI(filepath, slug);
        if (results.substackUI.action === 'fixed') {
            console.log(`  ✓ Stripped Substack UI (${results.substackUI.images} images, ${results.substackUI.textLength} chars)`);
        }

        // Fix 2: Download missing Substack images
        results.substackImages = await downloadSubstackImages(filepath, slug);
        if (results.substackImages.action === 'fixed') {
            console.log(`  ✓ Downloaded ${results.substackImages.downloaded} Substack images`);
        }

        // Fix 3: Add top back link
        results.topBackLink = addTopBackLink(filepath, slug);
        if (results.topBackLink.action === 'fixed') {
            console.log(`  ✓ Added top back link`);
        }

        const totalFixes = [results.substackUI, results.substackImages, results.topBackLink]
            .filter(r => r.action === 'fixed').length;

        if (totalFixes === 0) {
            console.log(`  ⊘ No fixes needed`);
        }

    } catch (err) {
        console.log(`  ✗ Error: ${err.message}`);
    }

    return results;
}

// Main execution
async function main() {
    const files = fs.readdirSync(postsDir)
        .filter(f => f.endsWith('.html') && !f.startsWith('.'))
        .sort();

    let totalFixed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const file of files) {
        const results = await autoFixPost(file);

        const fixes = Object.values(results).filter(r => r.action === 'fixed').length;
        const errors = Object.values(results).filter(r => r.action === 'error').length;

        if (fixes > 0) totalFixed++;
        if (errors > 0) totalErrors++;
        if (fixes === 0 && errors === 0) totalSkipped++;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✓ AUTO-FIX COMPLETE`);
    console.log(`  Fixed: ${totalFixed} posts`);
    console.log(`  Clean: ${totalSkipped} posts`);
    console.log(`  Errors: ${totalErrors} posts`);
    console.log(`${'='.repeat(60)}\n`);
}

main().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
