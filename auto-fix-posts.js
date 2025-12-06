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
        substackUI: { action: 'skip' },
        substackImages: { action: 'skip' },
        topBackLink: { action: 'skip' },
        seo: { action: 'skip' },
        imageRefs: { action: 'skip' },
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

// Fix 7: Intelligent keyword analysis across ALL posts
function analyzeGlobalKeywords() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 GLOBAL KEYWORD ANALYSIS');
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
    const smartKeywords = Object.entries(keywordFrequency)
        .filter(([keyword, count]) => {
            // Include if 2+ occurrences
            if (count >= 2) return true;
            // Or if it's a priority keyword (even with 1 occurrence)
            return priorityKeywords.some(pk => pk.toLowerCase() === keyword.toLowerCase());
        })
        .sort((a, b) => b[1] - a[1]);

    console.log(`\n📊 Found ${smartKeywords.length} intelligent keywords (appearing 2+ times):\n`);

    // Categorize keywords
    const categories = {
        'Branded Programs & Offerings': [],
        'Sanskrit/Tantric Terms': [],
        'Names & Teachers': [],
        'Practices & Techniques': [],
        'Philosophical Concepts': []
    };

    smartKeywords.forEach(([keyword, count]) => {
        // Check if it's a priority branded keyword
        if (priorityKeywords.some(pk => pk.toLowerCase() === keyword.toLowerCase())) {
            categories['Branded Programs & Offerings'].push([keyword, count]);
        } else if (/^[A-Z][a-z]+ [A-Z]/.test(keyword)) {
            categories['Names & Teachers'].push([keyword, count]);
        } else if (/puja|sadhana|nyasa|trataka|mudra|asana/i.test(keyword)) {
            categories['Practices & Techniques'].push([keyword, count]);
        } else if (/tantra|yoga|kundalini|shakti|shiva/i.test(keyword)) {
            categories['Philosophical Concepts'].push([keyword, count]);
        } else if (/^[A-Z]/.test(keyword)) {
            categories['Sanskrit/Tantric Terms'].push([keyword, count]);
        }
    });

    // Display categorized results
    Object.entries(categories).forEach(([category, keywords]) => {
        if (keywords.length > 0) {
            console.log(`\n${category}:`);
            keywords.slice(0, 15).forEach(([keyword, count]) => {
                console.log(`  ${keyword.padEnd(30)} (${count}x)`);
            });
        }
    });

    // Now update keyword meta tags in posts
    console.log('\n' + '='.repeat(60));
    console.log('📝 UPDATING KEYWORD META TAGS');
    console.log('='.repeat(60) + '\n');

    let updated = 0;

    files.forEach(file => {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);
        let html = fs.readFileSync(filepath, 'utf8');
        const articleText = allContent[slug];

        // Find which smart keywords appear in THIS post
        const postKeywords = smartKeywords
            .filter(([keyword]) => articleText.toLowerCase().includes(keyword.toLowerCase()))
            .map(([keyword]) => keyword)
            .slice(0, 10); // Top 10 keywords for this post

        if (postKeywords.length >= 3) {
            const keywordsStr = postKeywords.join(', ');
            const keywordsPattern = /<meta name="keywords" content="([^"]*)">/;
            const match = html.match(keywordsPattern);

            if (match) {
                const currentKeywords = match[1];
                // Only update if different
                if (currentKeywords !== keywordsStr) {
                    html = html.replace(keywordsPattern, `<meta name="keywords" content="${keywordsStr}">`);
                    fs.writeFileSync(filepath, html);
                    console.log(`  ✓ ${slug}: Updated with ${postKeywords.length} intelligent keywords`);
                    updated++;
                }
            }
        }
    });

    console.log(`\n✓ Updated ${updated} posts with intelligent keywords`);

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
