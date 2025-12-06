const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const postsDir = './posts';
const blogImagesDir = './blog-images';
const thumbnailsDir = './blog-thumbnails';

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

// Fix 2: Download missing Substack images (supports multiple formats)
async function downloadSubstackImages(filepath, slug) {
    let html = fs.readFileSync(filepath, 'utf8');

    // Match various Substack image patterns
    const patterns = [
        /src="(https:\/\/substackcdn\.com[^"]+)"/g,
        /src="(https:\/\/substack\.com[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/gi,
        /srcset="[^"]*?(https:\/\/substackcdn\.com[^"\s,]+)/g,
        /url\((https:\/\/substackcdn\.com[^)]+)\)/g
    ];

    let allMatches = [];
    for (const pattern of patterns) {
        const matches = [...html.matchAll(pattern)];
        allMatches.push(...matches);
    }

    // Deduplicate URLs
    const uniqueUrls = [...new Set(allMatches.map(m => m[1]))];

    if (uniqueUrls.length === 0) {
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

    for (const substackUrl of uniqueUrls) {
        const localFilename = `${slug}-img-${imageIndex}.jpg`;
        const localPath = path.join(blogImagesDir, localFilename);
        const localUrl = `/blog-images/${localFilename}`;

        try {
            await downloadImage(substackUrl, localPath);

            // Downscale if image is too large (max 1200px)
            try {
                execSync(`sips -Z 1200 "${localPath}"`, { stdio: 'pipe' });
            } catch (err) {
                console.log(`    ⚠ Failed to downscale: ${err.message}`);
            }

            // Replace all occurrences of this URL
            html = html.replace(new RegExp(substackUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localUrl);
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

// Fix 4: SEO optimization - analyze and improve meta tags, alt text, descriptions
function optimizeSEO(filepath, slug) {
    let html = fs.readFileSync(filepath, 'utf8');
    let changes = [];

    // Extract article content for analysis
    const bodyMatch = html.match(/<div dir="auto" class="body markup">([\s\S]*?)<\/div>/);
    const articleText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

    // 1. Fix missing or poor alt text on images
    const altTextPattern = /<img([^>]*?)alt="([^"]*?)"([^>]*?)>/g;
    let altMatches = [...html.matchAll(altTextPattern)];

    altMatches.forEach(match => {
        const fullTag = match[0];
        const currentAlt = match[2];

        // If alt is just the slug or empty, improve it
        if (!currentAlt || currentAlt === slug || currentAlt.length < 10) {
            // Extract first sentence or use title
            const titleMatch = html.match(/<title>([^<|]+)/);
            const title = titleMatch ? titleMatch[1].trim() : slug.replace(/-/g, ' ');
            const betterAlt = title.substring(0, 100);

            const newTag = fullTag.replace(`alt="${currentAlt}"`, `alt="${betterAlt}"`);
            html = html.replace(fullTag, newTag);
            changes.push(`Improved alt text: "${currentAlt}" → "${betterAlt}"`);
        }
    });

    // 2. Optimize meta description (150-160 chars ideal)
    const metaDescPattern = /<meta name="description" content="([^"]*)">/;
    const metaMatch = html.match(metaDescPattern);

    if (metaMatch) {
        const currentDesc = metaMatch[1];

        if (currentDesc.length < 50 || currentDesc.length > 160) {
            // Extract meaningful first sentences
            const sentences = articleText.match(/[^.!?]+[.!?]+/g) || [];
            let newDesc = sentences.slice(0, 2).join(' ').substring(0, 155);

            if (newDesc.length > 50) {
                html = html.replace(metaDescPattern, `<meta name="description" content="${newDesc}...">`);
                changes.push(`Optimized meta description (${currentDesc.length} → ${newDesc.length + 3} chars)`);
            }
        }
    }

    // 3. Add or improve og:image if missing
    const ogImagePattern = /<meta property="og:image" content="([^"]*)">/;
    const ogMatch = html.match(ogImagePattern);

    if (!ogMatch || ogMatch[1].includes('Bali%20Tantra')) {
        // Use the thumbnail
        const thumbnailPath = `/blog-thumbnails/${slug}.jpg`;
        const fullUrl = `https://forbidden-yoga.com${thumbnailPath}`;

        if (ogMatch) {
            html = html.replace(ogImagePattern, `<meta property="og:image" content="${fullUrl}">`);
            changes.push(`Updated og:image to use post thumbnail`);
        }
    }

    // 4. Ensure keywords meta tag exists and is populated
    const keywordsPattern = /<meta name="keywords" content="([^"]*)">/;
    const keywordsMatch = html.match(keywordsPattern);

    if (!keywordsMatch || keywordsMatch[1].split(',').length < 5) {
        // Extract meaningful keywords from title and content
        const titleMatch = html.match(/<title>([^<|]+)/);
        const title = titleMatch ? titleMatch[1].toLowerCase() : '';

        const coreKeywords = [
            'tantra yoga',
            'kundalini awakening',
            'tantric healing',
            'sacred sexuality',
            'forbidden yoga',
            ...title.split(/\s+/).filter(w => w.length > 4).slice(0, 3)
        ];

        const keywordsStr = [...new Set(coreKeywords)].join(', ');

        if (keywordsMatch) {
            html = html.replace(keywordsPattern, `<meta name="keywords" content="${keywordsStr}">`);
            changes.push(`Enhanced keywords meta tag`);
        }
    }

    if (changes.length > 0) {
        fs.writeFileSync(filepath, html);
        return { action: 'fixed', changes };
    }

    return { action: 'skip', reason: 'SEO already optimized' };
}

// Fix 5: Generate thumbnail from first blog image (or use Michael's photo fallback)
function generateThumbnail(slug) {
    // Check if thumbnail already exists
    const possibleThumbnails = [
        path.join(thumbnailsDir, `${slug}.jpg`),
        path.join(thumbnailsDir, `${slug}.png`),
        path.join(thumbnailsDir, `${slug}.jpeg`)
    ];

    for (const thumb of possibleThumbnails) {
        if (fs.existsSync(thumb)) {
            return { action: 'skip', reason: 'Thumbnail exists' };
        }
    }

    // Find first blog image (img-0)
    const possibleImages = [
        `${slug}-img-0.jpg`,
        `${slug}-img-0.png`,
        `${slug}-img-0.jpeg`,
        `${slug}-img-0.webp`
    ];

    let sourceImage = null;
    for (const img of possibleImages) {
        const imgPath = path.join(blogImagesDir, img);
        if (fs.existsSync(imgPath)) {
            sourceImage = imgPath;
            break;
        }
    }

    // Fallback: Use Michael's photo for video-only posts or posts without images
    if (!sourceImage) {
        const fallbackImage = './images/Wogenburg.webp';
        if (fs.existsSync(fallbackImage)) {
            sourceImage = fallbackImage;
            console.log(`    ℹ Using Michael's photo as fallback thumbnail`);
        } else {
            return { action: 'skip', reason: 'No source image and no fallback' };
        }
    }

    // Determine output format
    const ext = sourceImage.includes('Wogenburg') ? '.jpg' : path.extname(sourceImage);
    const thumbnailPath = path.join(thumbnailsDir, `${slug}${ext}`);

    try {
        // Create thumbnail with max 600px width/height
        execSync(`sips -Z 600 "${sourceImage}" --out "${thumbnailPath}"`, { stdio: 'pipe' });

        // If we used the fallback, also note it was from fallback
        if (sourceImage.includes('Wogenburg')) {
            return { action: 'fixed', path: thumbnailPath, fallback: true };
        }

        return { action: 'fixed', path: thumbnailPath };
    } catch (err) {
        return { action: 'error', reason: err.message };
    }
}

// Main auto-fix function
async function autoFixPost(file) {
    const slug = file.replace('.html', '');
    const filepath = path.join(postsDir, file);

    console.log(`\n📝 ${slug}`);

    const results = {
        substackUI: { action: 'skip' },
        substackImages: { action: 'skip' },
        topBackLink: { action: 'skip' },
        seo: { action: 'skip' },
        thumbnail: { action: 'skip' }
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

        // Fix 4: SEO optimization
        results.seo = optimizeSEO(filepath, slug);
        if (results.seo.action === 'fixed') {
            console.log(`  ✓ SEO optimized (${results.seo.changes.length} improvements):`);
            results.seo.changes.forEach(change => {
                console.log(`    - ${change}`);
            });
        }

        // Fix 5: Generate thumbnail
        results.thumbnail = generateThumbnail(slug);
        if (results.thumbnail.action === 'fixed') {
            if (results.thumbnail.fallback) {
                console.log(`  ✓ Generated thumbnail using Michael's photo (no img-0 found)`);
            } else {
                console.log(`  ✓ Generated thumbnail from img-0`);
            }
        }

        const totalFixes = [results.substackUI, results.substackImages, results.topBackLink, results.seo, results.thumbnail]
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
