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

// Helper: Normalize title to expected slug format
function titleToSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-')          // Replace spaces with hyphens
        .replace(/-+/g, '-')           // Replace multiple hyphens with single
        .replace(/^-|-$/g, '')         // Trim hyphens from start/end
        .substring(0, 50);             // Limit length to 50 chars (like Substack does)
}

// Helper: Calculate similarity between two strings (0-1 score) using Levenshtein distance
function stringSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    // Levenshtein distance algorithm
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    const maxLength = Math.max(str1.length, str2.length);
    const distance = matrix[str2.length][str1.length];
    return 1 - (distance / maxLength);
}

// Fix 0: Detect title/slug mismatch and flag for manual review
function detectTitleSlugMismatch(filepath, slug) {
    const html = fs.readFileSync(filepath, 'utf8');

    // Extract title from <h1> tag
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (!h1Match) {
        return { action: 'skip', reason: 'No title found' };
    }

    const h1Title = h1Match[1].trim();

    // Also extract meta title for comparison
    const metaTitleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const metaTitle = metaTitleMatch ? metaTitleMatch[1].replace(/\s*\|\s*Forbidden Yoga\s*$/i, '').trim() : '';

    // Check if H1 and meta title are very different (content mismatch)
    if (metaTitle && h1Title.toLowerCase() !== metaTitle.toLowerCase()) {
        const h1Slug = titleToSlug(h1Title);
        const metaSlug = titleToSlug(metaTitle);

        // If meta title would create a very different slug, warn about content mismatch
        const metaSimilarity = stringSimilarity(h1Slug, metaSlug);
        if (metaSimilarity < 0.5) {
            return {
                action: 'warning',
                type: 'content_mismatch',
                h1Title: h1Title,
                metaTitle: metaTitle,
                currentSlug: slug,
                expectedFromH1: h1Slug,
                expectedFromMeta: metaSlug,
                h1Similarity: Math.round(stringSimilarity(slug, h1Slug) * 100),
                metaSimilarity: Math.round(stringSimilarity(slug, metaSlug) * 100)
            };
        }
    }

    const expectedSlug = titleToSlug(h1Title);

    // Check if slug matches expected slug from H1 title
    const similarity = stringSimilarity(slug, expectedSlug);

    // If similarity is < 0.5, it's likely a mismatch
    if (similarity < 0.5) {
        return {
            action: 'warning',
            type: 'slug_mismatch',
            title: h1Title,
            currentSlug: slug,
            expectedSlug: expectedSlug,
            similarity: Math.round(similarity * 100)
        };
    }

    return { action: 'skip', reason: 'Title/slug match' };
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

// Fix 5: Correct broken image references (extension mismatches + tiny file detection)
function fixBrokenImageReferences(filepath, slug) {
    let html = fs.readFileSync(filepath, 'utf8');
    let fixed = 0;

    // Find all blog-images references
    const imageRefs = html.match(/\/blog-images\/[^"'\s]+\.(jpg|jpeg|png|webp|gif)/gi) || [];

    imageRefs.forEach(imgRef => {
        const filename = imgRef.replace('/blog-images/', '');
        const imgPath = path.join(blogImagesDir, filename);

        let needsFix = false;

        // Check if this exact file exists
        if (!fs.existsSync(imgPath)) {
            needsFix = true;
        } else {
            // File exists, but check if it's suspiciously small (< 10KB)
            const stats = fs.statSync(imgPath);
            if (stats.size < 10000) {
                // Check if there's a larger version with different extension
                const baseName = filename.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
                const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

                for (const ext of possibleExtensions) {
                    if (ext.toLowerCase() === path.extname(filename).toLowerCase()) continue; // Skip same extension
                    const alternatePath = path.join(blogImagesDir, baseName + ext);
                    if (fs.existsSync(alternatePath)) {
                        const altStats = fs.statSync(alternatePath);
                        // If alternate is significantly larger (>10x), prefer it
                        if (altStats.size > stats.size * 10) {
                            needsFix = true;
                            break;
                        }
                    }
                }
            }
        }

        if (needsFix) {
            // Try to find the best extension (largest file)
            const baseName = filename.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
            const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            let bestPath = null;
            let bestSize = 0;

            for (const ext of possibleExtensions) {
                const candidatePath = path.join(blogImagesDir, baseName + ext);
                if (fs.existsSync(candidatePath)) {
                    const stats = fs.statSync(candidatePath);
                    if (stats.size > bestSize) {
                        bestSize = stats.size;
                        bestPath = candidatePath;
                    }
                }
            }

            if (bestPath) {
                const correctExt = path.extname(bestPath);
                const correctRef = `/blog-images/${baseName}${correctExt}`;
                html = html.replace(new RegExp(imgRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correctRef);
                fixed++;
            }
        }
    });

    if (fixed > 0) {
        fs.writeFileSync(filepath, html);
        return { action: 'fixed', count: fixed };
    }

    return { action: 'skip', reason: 'No broken references' };
}

// Fix 6: Generate thumbnail from first blog image (or use Michael's photo fallback)
function generateThumbnail(slug) {
    // Check if thumbnail already exists
    const possibleThumbnails = [
        path.join(thumbnailsDir, `${slug}.jpg`),
        path.join(thumbnailsDir, `${slug}.png`),
        path.join(thumbnailsDir, `${slug}.jpeg`),
        path.join(thumbnailsDir, `${slug}.gif`)
    ];

    for (const thumb of possibleThumbnails) {
        if (fs.existsSync(thumb)) {
            return { action: 'skip', reason: 'Thumbnail exists' };
        }
    }

    // Find first blog image (img-0) - now including GIF
    const possibleImages = [
        `${slug}-img-0.jpg`,
        `${slug}-img-0.png`,
        `${slug}-img-0.jpeg`,
        `${slug}-img-0.webp`,
        `${slug}-img-0.gif`
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

    // Determine output format - keep GIF as GIF, convert others to JPG
    const ext = sourceImage.includes('Wogenburg') ? '.jpg' :
                sourceImage.endsWith('.gif') ? '.gif' : '.jpg';
    const thumbnailPath = path.join(thumbnailsDir, `${slug}${ext}`);

    try {
        if (sourceImage.endsWith('.gif')) {
            // For GIFs, use first frame and resize
            execSync(`sips -Z 600 "${sourceImage}" --out "${thumbnailPath}"`, { stdio: 'pipe' });
            console.log(`    ℹ Created thumbnail from GIF (first frame)`);
        } else {
            // For other formats, standard resize
            execSync(`sips -Z 600 "${sourceImage}" --out "${thumbnailPath}"`, { stdio: 'pipe' });
        }

        // If we used the fallback, also note it was from fallback
        if (sourceImage.includes('Wogenburg')) {
            return { action: 'fixed', path: thumbnailPath, fallback: true };
        }

        return { action: 'fixed', path: thumbnailPath, isGif: sourceImage.endsWith('.gif') };
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
        titleSlugMismatch: { action: 'skip' },
        substackUI: { action: 'skip' },
        substackImages: { action: 'skip' },
        topBackLink: { action: 'skip' },
        seo: { action: 'skip' },
        imageRefs: { action: 'skip' },
        thumbnail: { action: 'skip' }
    };

    try {
        // Fix 0: Detect title/slug mismatch
        results.titleSlugMismatch = detectTitleSlugMismatch(filepath, slug);
        if (results.titleSlugMismatch.action === 'warning') {
            if (results.titleSlugMismatch.type === 'content_mismatch') {
                console.log(`  ⚠️  CONTENT MISMATCH DETECTED:`);
                console.log(`      H1 title: "${results.titleSlugMismatch.h1Title}"`);
                console.log(`      Meta title: "${results.titleSlugMismatch.metaTitle}"`);
                console.log(`      Current slug: ${results.titleSlugMismatch.currentSlug}`);
                console.log(`      → H1 and meta title don't match - likely wrong content!`);
            } else {
                console.log(`  ⚠️  TITLE/SLUG MISMATCH DETECTED:`);
                console.log(`      Title: "${results.titleSlugMismatch.title}"`);
                console.log(`      Current slug: ${results.titleSlugMismatch.currentSlug}`);
                console.log(`      Expected slug: ${results.titleSlugMismatch.expectedSlug}`);
                console.log(`      Similarity: ${results.titleSlugMismatch.similarity}%`);
                console.log(`      → This post may have wrong content or needs renaming`);
            }
        }

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

        // Fix 5: Correct broken image references
        results.imageRefs = fixBrokenImageReferences(filepath, slug);
        if (results.imageRefs.action === 'fixed') {
            console.log(`  ✓ Fixed ${results.imageRefs.count} broken image reference(s)`);
        }

        // Fix 6: Generate thumbnail
        results.thumbnail = generateThumbnail(slug);
        if (results.thumbnail.action === 'fixed') {
            if (results.thumbnail.fallback) {
                console.log(`  ✓ Generated thumbnail using Michael's photo (no img-0 found)`);
            } else if (results.thumbnail.isGif) {
                console.log(`  ✓ Generated thumbnail from GIF (first frame extracted)`);
            } else {
                console.log(`  ✓ Generated thumbnail from img-0`);
            }
        }

        const totalFixes = [results.substackUI, results.substackImages, results.topBackLink, results.seo, results.imageRefs, results.thumbnail]
            .filter(r => r.action === 'fixed').length;

        if (totalFixes === 0) {
            console.log(`  ⊘ No fixes needed`);
        }

    } catch (err) {
        console.log(`  ✗ Error: ${err.message}`);
    }

    return results;
}

// Semantic Knowledge Graph - relationships between tantric/yogic concepts
const semanticRelationships = {
    // Tantric Goddesses & Deities
    'Kali': ['Mahakali', 'Shakti', 'Mahavidya', 'Chinnamasta', 'Dhumavati', 'Shiva', 'tantra', 'goddess'],
    'Tara': ['Mahavidya', 'Shakti', 'goddess', 'tantra', 'Kali'],
    'Tripura Sundari': ['Mahavidya', 'Shakti', 'Lalita', 'Shodashi', 'goddess', 'tantra'],
    'Bhuvaneshwari': ['Mahavidya', 'Shakti', 'goddess', 'tantra', 'cosmos'],
    'Chinnamasta': ['Mahavidya', 'Shakti', 'Kali', 'goddess', 'tantra'],
    'Bhairavi': ['Mahavidya', 'Shakti', 'goddess', 'tantra', 'Kali'],
    'Dhumavati': ['Mahavidya', 'Shakti', 'goddess', 'tantra', 'Kali'],
    'Bagalamukhi': ['Mahavidya', 'Shakti', 'goddess', 'tantra'],
    'Matangi': ['Mahavidya', 'Shakti', 'goddess', 'tantra'],
    'Kamala': ['Mahavidya', 'Shakti', 'Lakshmi', 'goddess', 'tantra'],
    'Mahavidya': ['Kali', 'Tara', 'Tripura Sundari', 'Shakti', 'tantra', 'goddess', 'Nitya'],
    'Nitya': ['Mahavidya', 'Shakti', 'tantra', 'goddess', 'Kali'],
    'Shakti': ['Shiva', 'Kali', 'Kundalini', 'tantra', 'yoga', 'goddess', 'Mahavidya'],
    'Shiva': ['Shakti', 'tantra', 'yoga', 'Kali', 'consciousness'],

    // Tantric Traditions & Paths
    'tantra': ['Shakti', 'Shiva', 'Kundalini', 'yoga', 'Kaula', 'Kashmir Shaivism', 'puja', 'sadhana'],
    'Kaula': ['tantra', 'Kashmir Shaivism', 'Shakti', 'left-hand path', 'sadhana'],
    'Kashmir Shaivism': ['tantra', 'Kaula', 'Shiva', 'Shakti', 'Abhinavagupta'],
    'left-hand path': ['Kaula', 'tantra', 'Vama Marga', 'transgressive'],
    'Vama Marga': ['left-hand path', 'Kaula', 'tantra'],

    // Energy & Consciousness
    'Kundalini': ['Shakti', 'chakra', 'tantra', 'yoga', 'kriya', 'pranayama', 'energy'],
    'chakra': ['Kundalini', 'Muladhara', 'Swadhisthana', 'Manipura', 'Anahata', 'Vishuddha', 'Ajna', 'Sahasrara', 'yoga', 'energy'],
    'Muladhara': ['chakra', 'Kundalini', 'root chakra', 'tantra'],
    'Swadhisthana': ['chakra', 'Kundalini', 'sacral chakra', 'tantra'],
    'Manipura': ['chakra', 'Kundalini', 'solar plexus', 'tantra'],
    'Anahata': ['chakra', 'Kundalini', 'heart chakra', 'tantra'],
    'Vishuddha': ['chakra', 'Kundalini', 'throat chakra', 'tantra'],
    'Ajna': ['chakra', 'Kundalini', 'third eye', 'tantra'],
    'Sahasrara': ['chakra', 'Kundalini', 'crown chakra', 'tantra'],
    'prana': ['pranayama', 'energy', 'yoga', 'breath', 'tantra'],

    // Practices & Techniques
    'yoga': ['tantra', 'asana', 'pranayama', 'meditation', 'mudra', 'Kundalini', 'Shakti'],
    'puja': ['tantra', 'ritual', 'sadhana', 'worship', 'Shakti'],
    'sadhana': ['tantra', 'yoga', 'practice', 'puja', 'kriya', 'spiritual practice'],
    'kriya': ['Kundalini', 'yoga', 'tantra', 'pranayama', 'technique'],
    'mudra': ['yoga', 'tantra', 'gesture', 'asana', 'practice'],
    'mantra': ['tantra', 'yoga', 'sound', 'meditation', 'Sanskrit'],
    'pranayama': ['yoga', 'breath', 'prana', 'Kundalini', 'kriya'],
    'asana': ['yoga', 'posture', 'mudra', 'practice'],
    'meditation': ['yoga', 'tantra', 'consciousness', 'mindfulness', 'awareness'],
    'nyasa': ['tantra', 'ritual', 'puja', 'placement', 'practice'],
    'trataka': ['yoga', 'tantra', 'meditation', 'gazing', 'technique'],

    // Philosophical Concepts
    'consciousness': ['Shiva', 'awareness', 'tantra', 'yoga', 'meditation'],
    'awareness': ['consciousness', 'mindfulness', 'meditation', 'presence'],
    'enlightenment': ['consciousness', 'awakening', 'tantra', 'yoga', 'liberation'],
    'liberation': ['moksha', 'enlightenment', 'tantra', 'yoga'],
    'moksha': ['liberation', 'enlightenment', 'yoga'],

    // Subtle Body Elements
    'nadi': ['Ida', 'Pingala', 'Sushumna', 'energy channel', 'prana', 'yoga'],
    'Ida': ['nadi', 'Pingala', 'Sushumna', 'lunar', 'energy'],
    'Pingala': ['nadi', 'Ida', 'Sushumna', 'solar', 'energy'],
    'Sushumna': ['nadi', 'Ida', 'Pingala', 'Kundalini', 'central channel'],

    // Sensory & Perception
    'tanmatra': ['sense', 'perception', 'subtle element', 'philosophy'],

    // Shadow & Transformation
    'shadow': ['psychology', 'transformation', 'integration', 'darkness'],
    'trauma': ['healing', 'psychology', 'body', 'integration'],

    // Branded Programs (user's offerings)
    'Andhakaara Path to Power': ['tantra', 'shadow', 'darkness', 'power', 'Forbidden Yoga'],
    'Forbidden Yoga': ['tantra', 'yoga', 'transgressive', 'left-hand path', 'Kaula']
};

// Semantic domain classification
const semanticDomains = {
    'Deities & Goddesses': ['Kali', 'Tara', 'Tripura Sundari', 'Bhuvaneshwari', 'Chinnamasta', 'Bhairavi', 'Dhumavati', 'Bagalamukhi', 'Matangi', 'Kamala', 'Mahavidya', 'Nitya', 'Shakti', 'Shiva'],
    'Tantric Traditions': ['tantra', 'Kaula', 'Kashmir Shaivism', 'left-hand path', 'Vama Marga'],
    'Energy Systems': ['Kundalini', 'chakra', 'prana', 'nadi', 'Ida', 'Pingala', 'Sushumna', 'Muladhara', 'Swadhisthana', 'Manipura', 'Anahata', 'Vishuddha', 'Ajna', 'Sahasrara'],
    'Practices & Techniques': ['yoga', 'puja', 'sadhana', 'kriya', 'mudra', 'mantra', 'pranayama', 'asana', 'meditation', 'nyasa', 'trataka'],
    'Philosophical Concepts': ['consciousness', 'awareness', 'enlightenment', 'liberation', 'moksha', 'tanmatra'],
    'Transformation & Shadow': ['shadow', 'trauma', 'healing', 'integration', 'transformation'],
    'Branded Programs': ['Andhakaara Path to Power', 'Forbidden Yoga']
};

// Semantic scoring: calculate semantic richness of a keyword
function getSemanticScore(keyword, allKeywords) {
    const keywordLower = keyword.toLowerCase();
    let score = 0;

    // Score based on direct relationships
    if (semanticRelationships[keyword] || semanticRelationships[keywordLower]) {
        const relationships = semanticRelationships[keyword] || semanticRelationships[keywordLower] || [];
        // How many of this keyword's related terms also appear in the corpus?
        const relatedTermsInCorpus = relationships.filter(relTerm =>
            allKeywords.some(kw => kw.toLowerCase() === relTerm.toLowerCase())
        );
        score += relatedTermsInCorpus.length * 10; // Each related term adds 10 points
    }

    // Score based on domain membership
    for (const [domain, terms] of Object.entries(semanticDomains)) {
        if (terms.some(t => t.toLowerCase() === keywordLower)) {
            score += 5; // Domain membership adds 5 points

            // Bonus: how many other terms from same domain appear in corpus?
            const domainPeersInCorpus = terms.filter(t =>
                t.toLowerCase() !== keywordLower &&
                allKeywords.some(kw => kw.toLowerCase() === t.toLowerCase())
            );
            score += domainPeersInCorpus.length * 3; // Each domain peer adds 3 points
        }
    }

    return score;
}

// Find semantically related keywords that co-occur with a given keyword
function findSemanticCluster(keyword, postText, allSmartKeywords) {
    const keywordLower = keyword.toLowerCase();
    const cluster = new Set([keyword]);

    // Add direct relationships that appear in this post
    const directRelations = semanticRelationships[keyword] || semanticRelationships[keywordLower] || [];
    directRelations.forEach(relTerm => {
        if (postText.toLowerCase().includes(relTerm.toLowerCase())) {
            // Find the exact casing from smart keywords
            const exactMatch = allSmartKeywords.find(([kw]) => kw.toLowerCase() === relTerm.toLowerCase());
            if (exactMatch) {
                cluster.add(exactMatch[0]);
            }
        }
    });

    // Add domain peers that appear in this post
    for (const [domain, terms] of Object.entries(semanticDomains)) {
        if (terms.some(t => t.toLowerCase() === keywordLower)) {
            terms.forEach(domainTerm => {
                if (domainTerm.toLowerCase() !== keywordLower && postText.toLowerCase().includes(domainTerm.toLowerCase())) {
                    const exactMatch = allSmartKeywords.find(([kw]) => kw.toLowerCase() === domainTerm.toLowerCase());
                    if (exactMatch) {
                        cluster.add(exactMatch[0]);
                    }
                }
            });
        }
    }

    return Array.from(cluster);
}

// Fix 7: Intelligent keyword analysis across ALL posts
function analyzeGlobalKeywords() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 GLOBAL KEYWORD ANALYSIS WITH SEMANTIC INTELLIGENCE');
    console.log('='.repeat(60));

    const files = fs.readdirSync(postsDir)
        .filter(f => f.endsWith('.html') && !f.startsWith('.'));

    // Collect all text content from all posts
    const allContent = {};
    const keywordFrequency = {};

    files.forEach(file => {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);
        const html = fs.readFileSync(filepath, 'utf8');

        // Extract article content - try both patterns (cleaned and uncleaned posts)
        let articleText = '';

        // Pattern 1: Already cleaned posts with <div class="post-content">
        const postContentMatch = html.match(/<div class="post-content">([\s\S]*?)<\/div>\s*<div class="post-keywords">/);
        if (postContentMatch) {
            articleText = postContentMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        } else {
            // Pattern 2: Uncleaned posts with Substack UI
            const bodyMatch = html.match(/<div dir="auto" class="body markup">([\s\S]*?)<\/div>/);
            articleText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
        }

        allContent[slug] = articleText;
    });

    // Smart keyword extraction patterns
    const smartPatterns = [
        // Multi-word branded phrases (3-4 words starting with capital)
        /\b[A-Z][a-zāīūṛṝḷḹṃḥñśṣ]+ [A-Z][a-z]+ (?:to|of|for|the|and) [A-Z][a-z]+\b/g,
        // Sanskrit/Tantric terms (capitalized, unique spellings)
        /\b[A-Z][a-zāīūṛṝḷḹṃḥñśṣ]{4,}\b/g,
        // Names (two capitalized words)
        /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
        // Compound terms with hyphens
        /\b[a-z]+-[a-z]+(?:-[a-z]+)?\b/gi,
        // Special tantric/yoga terms
        /\b(?:tantra|yoga|puja|sadhana|kundalini|chakra|mudra|mantra|asana|pranayama|shakti|shiva|tanmatra|nyasa|trataka|mahavidya|nitya|andhakaara)\b/gi
    ];

    // Priority branded keywords (always include even if only 1 occurrence)
    const priorityKeywords = [
        'Andhakaara Path to Power'
    ];

    // Extract all potential keywords
    const genericWords = [
        'that', 'this', 'with', 'from', 'have', 'been', 'were', 'what', 'when', 'where', 'there',
        'they', 'their', 'these', 'those', 'then', 'than', 'them', 'some', 'such', 'much', 'very',
        'will', 'would', 'could', 'should', 'about', 'which', 'through', 'before', 'after', 'other',
        'because', 'maybe', 'also', 'only', 'just', 'more', 'most', 'many', 'each', 'every', 'both',
        'either', 'neither', 'enough', 'often', 'western', 'eastern', 'modern', 'traditional',
        'people', 'person', 'thing', 'things', 'something', 'anything', 'everything', 'nothing',
        'someone', 'anyone', 'everyone', 'nobody', 'russell', 'paradise', 'forbidden', 'esalen',
        'indian', 'american', 'european'
    ];

    Object.values(allContent).forEach(text => {
        // First, check for priority keywords
        priorityKeywords.forEach(priorityKeyword => {
            const regex = new RegExp(priorityKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const matches = text.match(regex) || [];
            if (matches.length > 0) {
                keywordFrequency[priorityKeyword] = (keywordFrequency[priorityKeyword] || 0) + matches.length;
            }
        });

        // Then extract smart pattern keywords
        smartPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(keyword => {
                const normalized = keyword.toLowerCase().trim();
                // Filter out generic words
                if (normalized.length > 3 && !genericWords.includes(normalized)) {
                    keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
                }
            });
        });
    });

    // Filter: Keywords appearing 2+ times OR priority keywords (even if 1x)
    let smartKeywords = Object.entries(keywordFrequency)
        .filter(([keyword, count]) => {
            // Include if 2+ occurrences
            if (count >= 2) return true;
            // Or if it's a priority keyword (even with 1 occurrence)
            return priorityKeywords.some(pk => pk.toLowerCase() === keyword.toLowerCase());
        });

    // Calculate semantic scores for all keywords
    const keywordsWithSemantics = smartKeywords.map(([keyword, count]) => {
        const semanticScore = getSemanticScore(keyword, smartKeywords.map(([kw]) => kw));
        return [keyword, count, semanticScore];
    });

    // Sort by semantic score first, then frequency
    keywordsWithSemantics.sort((a, b) => {
        // Prioritize keywords with high semantic connections
        if (b[2] !== a[2]) return b[2] - a[2]; // Semantic score descending
        return b[1] - a[1]; // Frequency descending
    });

    smartKeywords = keywordsWithSemantics.map(([keyword, count]) => [keyword, count]);

    console.log(`\n📊 Found ${smartKeywords.length} intelligent keywords (appearing 2+ times):\n`);
    console.log('🧠 Keywords ranked by semantic richness and frequency\n');

    // Categorize keywords using semantic domains
    const categories = {};

    // Initialize categories from semantic domains
    Object.keys(semanticDomains).forEach(domain => {
        categories[domain] = [];
    });
    categories['Other Keywords'] = [];

    // Categorize each keyword using semantic domain matching
    keywordsWithSemantics.forEach(([keyword, count, semanticScore]) => {
        let categorized = false;

        // Try to match keyword to semantic domains
        for (const [domain, terms] of Object.entries(semanticDomains)) {
            if (terms.some(t => t.toLowerCase() === keyword.toLowerCase())) {
                categories[domain].push([keyword, count, semanticScore]);
                categorized = true;
                break;
            }
        }

        if (!categorized) {
            categories['Other Keywords'].push([keyword, count, semanticScore]);
        }
    });

    // Display categorized results with semantic scores
    Object.entries(categories).forEach(([category, keywords]) => {
        if (keywords.length > 0) {
            console.log(`\n${category}:`);
            keywords.slice(0, 15).forEach(([keyword, count, semanticScore]) => {
                const scoreIndicator = semanticScore > 20 ? '🔥' : semanticScore > 10 ? '⭐' : '•';
                console.log(`  ${scoreIndicator} ${keyword.padEnd(28)} (${count}x, semantic: ${semanticScore})`);
            });
        }
    });

    // Display semantic relationship insights
    console.log('\n' + '='.repeat(60));
    console.log('🔗 SEMANTIC RELATIONSHIP INSIGHTS');
    console.log('='.repeat(60) + '\n');

    // Show top 5 most semantically connected keywords
    const topSemantic = keywordsWithSemantics
        .filter(([_, __, score]) => score > 0)
        .slice(0, 5);

    topSemantic.forEach(([keyword, count, semanticScore]) => {
        console.log(`\n${keyword} (semantic score: ${semanticScore}):`);

        // Show direct relationships present in corpus
        const keywordLower = keyword.toLowerCase();
        const relations = semanticRelationships[keyword] || semanticRelationships[keywordLower] || [];
        const presentRelations = relations.filter(rel =>
            smartKeywords.some(([kw]) => kw.toLowerCase() === rel.toLowerCase())
        );

        if (presentRelations.length > 0) {
            console.log(`  Related terms in corpus: ${presentRelations.slice(0, 8).join(', ')}`);
        }

        // Show domain membership
        for (const [domain, terms] of Object.entries(semanticDomains)) {
            if (terms.some(t => t.toLowerCase() === keywordLower)) {
                console.log(`  Domain: ${domain}`);
                break;
            }
        }
    });

    // Now update keyword meta tags in posts using semantic clustering
    console.log('\n' + '='.repeat(60));
    console.log('📝 UPDATING KEYWORD META TAGS WITH SEMANTIC CLUSTERING');
    console.log('='.repeat(60) + '\n');

    let updated = 0;

    files.forEach(file => {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);
        let html = fs.readFileSync(filepath, 'utf8');
        const articleText = allContent[slug];

        // Find which smart keywords appear in THIS post
        const presentKeywords = keywordsWithSemantics
            .filter(([keyword]) => articleText.toLowerCase().includes(keyword.toLowerCase()));

        if (presentKeywords.length === 0) return;

        // Build semantic clusters - group related keywords that co-occur
        const clusters = new Map();

        presentKeywords.forEach(([keyword, count, semanticScore]) => {
            if (!clusters.has(keyword)) {
                const cluster = findSemanticCluster(keyword, articleText, keywordsWithSemantics);
                cluster.forEach(relatedKeyword => {
                    if (!clusters.has(relatedKeyword)) {
                        clusters.set(relatedKeyword, {
                            keyword: relatedKeyword,
                            clusterSize: cluster.length,
                            semanticScore: keywordsWithSemantics.find(([kw]) => kw === relatedKeyword)?.[2] || 0
                        });
                    }
                });
            }
        });

        // Select keywords: prefer those with large semantic clusters and high scores
        const selectedKeywords = Array.from(clusters.values())
            .sort((a, b) => {
                // Sort by cluster size first (more connections = more important)
                if (b.clusterSize !== a.clusterSize) return b.clusterSize - a.clusterSize;
                // Then by semantic score
                if (b.semanticScore !== a.semanticScore) return b.semanticScore - a.semanticScore;
                // Finally by frequency
                const aFreq = keywordsWithSemantics.find(([kw]) => kw === a.keyword)?.[1] || 0;
                const bFreq = keywordsWithSemantics.find(([kw]) => kw === b.keyword)?.[1] || 0;
                return bFreq - aFreq;
            })
            .map(item => item.keyword)
            .slice(0, 10); // Top 10 semantically clustered keywords

        if (selectedKeywords.length >= 3) {
            const keywordsStr = selectedKeywords.join(', ');
            const keywordsPattern = /<meta name="keywords" content="([^"]*)">/;
            const match = html.match(keywordsPattern);

            if (match) {
                const currentKeywords = match[1];
                // Only update if different
                if (currentKeywords !== keywordsStr) {
                    html = html.replace(keywordsPattern, `<meta name="keywords" content="${keywordsStr}">`);
                    fs.writeFileSync(filepath, html);

                    // Show semantic cluster info
                    const topCluster = clusters.get(selectedKeywords[0]);
                    console.log(`  ✓ ${slug}: Updated with ${selectedKeywords.length} semantically clustered keywords`);
                    console.log(`    Primary cluster: ${selectedKeywords.slice(0, 3).join(' → ')}`);
                    updated++;
                }
            }
        }
    });

    console.log(`\n✓ Updated ${updated} posts with semantically intelligent keywords`);

    return {
        totalKeywords: smartKeywords.length,
        updatedPosts: updated,
        topKeywords: smartKeywords.slice(0, 20)
    };
}

// Main execution
async function main() {
    const files = fs.readdirSync(postsDir)
        .filter(f => f.endsWith('.html') && !f.startsWith('.'))
        .sort();

    let totalFixed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const mismatchedPosts = [];

    for (const file of files) {
        const results = await autoFixPost(file);

        const fixes = Object.values(results).filter(r => r.action === 'fixed').length;
        const errors = Object.values(results).filter(r => r.action === 'error').length;
        const warnings = Object.values(results).filter(r => r.action === 'warning').length;

        if (results.titleSlugMismatch && results.titleSlugMismatch.action === 'warning') {
            mismatchedPosts.push({
                slug: file.replace('.html', ''),
                ...results.titleSlugMismatch
            });
        }

        if (fixes > 0) totalFixed++;
        if (errors > 0) totalErrors++;
        if (fixes === 0 && errors === 0 && warnings === 0) totalSkipped++;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✓ AUTO-FIX COMPLETE`);
    console.log(`  Fixed: ${totalFixed} posts`);
    console.log(`  Clean: ${totalSkipped} posts`);
    console.log(`  Errors: ${totalErrors} posts`);
    if (mismatchedPosts.length > 0) {
        console.log(`  ⚠️  Title/Slug Mismatches: ${mismatchedPosts.length} posts`);
    }
    console.log(`${'='.repeat(60)}\n`);

    // Show all mismatched posts in a summary
    if (mismatchedPosts.length > 0) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`⚠️  TITLE/SLUG MISMATCH SUMMARY`);
        console.log(`${'='.repeat(60)}\n`);
        console.log(`Found ${mismatchedPosts.length} post(s) with title/slug mismatches:\n`);

        mismatchedPosts.forEach(post => {
            console.log(`📄 ${post.currentSlug}`);
            if (post.type === 'content_mismatch') {
                console.log(`   H1 title: "${post.h1Title}"`);
                console.log(`   Meta title: "${post.metaTitle}"`);
                console.log(`   → CONTENT MISMATCH: H1 and meta title completely different!`);
                console.log(`   → Action needed: Download correct Substack post for this slug\n`);
            } else {
                console.log(`   Title: "${post.title}"`);
                console.log(`   Expected slug: ${post.expectedSlug}`);
                console.log(`   Similarity: ${post.similarity}%`);
                console.log(`   → Action needed: Verify content or rename file\n`);
            }
        });

        console.log(`${'='.repeat(60)}\n`);
    }

    // Run global keyword analysis AFTER all fixes
    const keywordResults = analyzeGlobalKeywords();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✓ FINAL SUMMARY`);
    console.log(`  Posts processed: ${files.length}`);
    console.log(`  Intelligent keywords found: ${keywordResults.totalKeywords}`);
    console.log(`  Posts updated with keywords: ${keywordResults.updatedPosts}`);
    console.log(`${'='.repeat(60)}\n`);
}

main().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
