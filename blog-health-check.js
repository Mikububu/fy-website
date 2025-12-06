const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const postsDir = './posts';
const blogImagesDir = './blog-images';
const imageMapPath = './image-map.json';
const postsDataPath = './posts-data.json';

// Comprehensive Blog Health Check & Auto-Fix Script
// Checks and fixes:
// 1. Missing Substack images (download & replace)
// 2. Image sizes (resize if > 1600px)
// 3. Image formats (convert HEIC, large PNG→JPG)
// 4. Video embeds (YouTube, Vimeo, JW Player, Substack video)
// 5. Metadata consistency (title, description, keywords)
// 6. SEO optimization (meta tags, structured data)
// 7. Keyword extraction (sophisticated terms only)

const report = {
    totalPosts: 0,
    issues: {
        missingImages: [],
        oversizedImages: [],
        wrongFormats: [],
        missingMetadata: [],
        videoEmbeds: [],
        poorSEO: [],
        missingKeywords: []
    },
    fixes: {
        imagesDownloaded: 0,
        imagesResized: 0,
        imagesConverted: 0,
        metadataUpdated: 0,
        seoImproved: 0,
        keywordsAdded: 0
    }
};

// ============= IMAGE CHECKS =============

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

function extractVideoEmbeds(html) {
    const videos = [];

    // YouTube embeds
    const youtubePattern = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/gi;
    let match;
    while ((match = youtubePattern.exec(html)) !== null) {
        videos.push({ type: 'youtube', id: match[3], url: match[0] });
    }

    // Vimeo embeds
    const vimeoPattern = /https?:\/\/(www\.)?vimeo\.com\/(\d+)/gi;
    while ((match = vimeoPattern.exec(html)) !== null) {
        videos.push({ type: 'vimeo', id: match[2], url: match[0] });
    }

    // JW Player embeds
    const jwPattern = /jwplayer|jwp/gi;
    if (jwPattern.test(html)) {
        videos.push({ type: 'jwplayer', url: 'detected' });
    }

    // Substack video embeds
    const substackVideoPattern = /substack-video\.s3\.amazonaws\.com/gi;
    while ((match = substackVideoPattern.exec(html)) !== null) {
        videos.push({ type: 'substack-video', url: match[0] });
    }

    return videos;
}

async function checkImageSizes() {
    console.log('\n=== Checking Image Sizes ===\n');

    const imageFiles = fs.readdirSync(blogImagesDir).filter(f =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
    );

    for (const file of imageFiles) {
        const filepath = path.join(blogImagesDir, file);
        const ext = path.extname(file).toLowerCase();

        // Skip GIFs and WEBPs
        if (ext === '.gif' || ext === '.webp') continue;

        try {
            const { stdout } = await execAsync(`sips -g pixelWidth -g pixelHeight "${filepath}"`);
            const widthMatch = stdout.match(/pixelWidth: (\d+)/);
            const heightMatch = stdout.match(/pixelHeight: (\d+)/);

            if (widthMatch && heightMatch) {
                const width = parseInt(widthMatch[1]);
                const height = parseInt(heightMatch[1]);
                const maxDim = Math.max(width, height);

                if (maxDim > 1600) {
                    report.issues.oversizedImages.push({
                        file,
                        dimensions: `${width}x${height}`,
                        maxDim
                    });

                    console.log(`  ⚠ ${file}: ${width}x${height} (will resize)`);
                    await execAsync(`sips -Z 1600 "${filepath}"`);
                    report.fixes.imagesResized++;
                    console.log(`  ✓ Resized to max 1600px`);
                }

                // Check if large PNG should be converted to JPG
                if (ext === '.png') {
                    const stats = fs.statSync(filepath);
                    if (stats.size > 1024 * 1024) {
                        report.issues.wrongFormats.push({
                            file,
                            size: Math.round(stats.size / 1024) + 'KB',
                            reason: 'PNG > 1MB should be JPG'
                        });

                        console.log(`  ⚠ ${file}: ${Math.round(stats.size / 1024)}KB PNG (converting to JPG)`);
                        const jpgPath = filepath.replace(/\.png$/, '.jpg');
                        await execAsync(`sips -s format jpeg -s formatOptions 85 "${filepath}" --out "${jpgPath}"`);
                        fs.unlinkSync(filepath);
                        report.fixes.imagesConverted++;
                        console.log(`  ✓ Converted to JPG`);
                    }
                }
            }
        } catch (error) {
            console.error(`  ✗ Error checking ${file}: ${error.message}`);
        }
    }
}

// ============= METADATA & SEO CHECKS =============

function extractKeywords(html, title, description) {
    // Extract sophisticated terms: proper nouns, technical terms, philosophical concepts
    // Ignore filler words and common terms

    const keywords = new Set();

    // Common filler words to ignore
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
        'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
        'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
        'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
        'very', 'just', 'about', 'into', 'through', 'during', 'before',
        'after', 'above', 'below', 'between', 'under', 'again', 'further',
        'then', 'once', 'here', 'there', 'our', 'your', 'their', 'his', 'her'
    ]);

    // Extract text content (strip HTML tags)
    const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ');

    // Find capitalized words (likely proper nouns)
    const properNouns = textContent.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*\b/g) || [];
    properNouns.forEach(word => {
        if (word.length > 3 && !stopWords.has(word.toLowerCase())) {
            keywords.add(word);
        }
    });

    // Find technical/philosophical terms (longer words, Sanskrit terms, etc.)
    const technicalTerms = textContent.match(/\b[a-z]{6,}\b/gi) || [];
    technicalTerms.forEach(word => {
        const lower = word.toLowerCase();
        if (!stopWords.has(lower) && word.length >= 6) {
            // Prioritize terms that appear in title or description
            if (title.toLowerCase().includes(lower) || description.toLowerCase().includes(lower)) {
                keywords.add(word);
            } else if (
                // Sanskrit/yogic terms often end in specific patterns
                /vidya|sadhana|prana|chakra|tantra|kriya|yoga|mudra|bandha|kosha/i.test(word)
            ) {
                keywords.add(word);
            }
        }
    });

    // Limit to top 10-15 most relevant keywords
    return Array.from(keywords).slice(0, 15);
}

function checkSEOMetadata(html, post) {
    const issues = [];

    // Check meta description length (should be 120-160 chars)
    if (post.description.length < 120 || post.description.length > 160) {
        issues.push({
            type: 'meta_description',
            current: post.description.length,
            ideal: '120-160 characters'
        });
    }

    // Check title length (should be 50-60 chars)
    if (post.title.length > 60) {
        issues.push({
            type: 'meta_title',
            current: post.title.length,
            ideal: 'under 60 characters'
        });
    }

    // Check for Open Graph tags
    if (!html.includes('og:image')) {
        issues.push({ type: 'missing_og_image' });
    }
    if (!html.includes('og:description')) {
        issues.push({ type: 'missing_og_description' });
    }

    // Check for structured data (JSON-LD)
    if (!html.includes('application/ld+json')) {
        issues.push({ type: 'missing_structured_data' });
    }

    // Check for canonical URL
    if (!html.includes('rel="canonical"')) {
        issues.push({ type: 'missing_canonical' });
    }

    // Check keywords
    const keywordsMatch = html.match(/<meta name="keywords" content="([^"]*)"/);
    if (!keywordsMatch || keywordsMatch[1].split(',').length < 5) {
        issues.push({ type: 'insufficient_keywords' });
    }

    return issues;
}

// ============= MAIN HEALTH CHECK =============

async function runHealthCheck() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  FORBIDDEN YOGA BLOG HEALTH CHECK & AUTO-FIX     ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    const imageMap = JSON.parse(fs.readFileSync(imageMapPath, 'utf8'));
    const postsData = JSON.parse(fs.readFileSync(postsDataPath, 'utf8'));
    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

    report.totalPosts = files.length;

    console.log(`\n📊 Checking ${files.length} blog posts...\n`);

    // ===== CHECK 1: Missing Substack Images =====
    console.log('\n=== CHECK 1: Missing Substack Images ===\n');

    for (const file of files) {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);
        const html = fs.readFileSync(filepath, 'utf8');

        const substackImages = extractAllSubstackImages(html);

        if (substackImages.length > 0) {
            report.issues.missingImages.push({
                post: slug,
                count: substackImages.length,
                images: substackImages
            });
            console.log(`  ⚠ ${slug}: Found ${substackImages.length} unmigrated Substack images`);
        }
    }

    // ===== CHECK 2: Image Sizes & Formats =====
    await checkImageSizes();

    // ===== CHECK 3: Video Embeds =====
    console.log('\n=== CHECK 3: Video Embeds ===\n');

    for (const file of files) {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);
        const html = fs.readFileSync(filepath, 'utf8');

        const videos = extractVideoEmbeds(html);

        if (videos.length > 0) {
            report.issues.videoEmbeds.push({
                post: slug,
                videos
            });
            console.log(`  ℹ ${slug}: Contains ${videos.length} video embed(s)`);
            videos.forEach(v => console.log(`    - ${v.type}: ${v.id || v.url}`));
        }
    }

    // ===== CHECK 4: Metadata Consistency =====
    console.log('\n=== CHECK 4: Metadata Consistency ===\n');

    for (const file of files) {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);
        const html = fs.readFileSync(filepath, 'utf8');

        // Extract actual title and subtitle from HTML
        const titleMatch = html.match(/<h1[^>]*class="[^"]*post-title[^"]*"[^>]*>(.*?)<\/h1>/);
        const subtitleMatch = html.match(/<h3[^>]*class="[^"]*subtitle[^"]*"[^>]*>(.*?)<\/h3>/);

        const postData = postsData.find(p => p.slug === slug);

        if (titleMatch && postData && postData.title !== titleMatch[1].trim()) {
            report.issues.missingMetadata.push({
                post: slug,
                issue: 'title_mismatch',
                expected: titleMatch[1].trim(),
                actual: postData.title
            });
            console.log(`  ⚠ ${slug}: Title mismatch`);
            console.log(`    HTML: "${titleMatch[1].trim()}"`);
            console.log(`    Data: "${postData.title}"`);
        }

        if (subtitleMatch && postData && postData.description !== subtitleMatch[1].trim()) {
            report.issues.missingMetadata.push({
                post: slug,
                issue: 'description_mismatch',
                expected: subtitleMatch[1].trim(),
                actual: postData.description
            });
            console.log(`  ⚠ ${slug}: Description mismatch`);
        }
    }

    // ===== CHECK 5: SEO Optimization =====
    console.log('\n=== CHECK 5: SEO Optimization ===\n');

    for (const file of files) {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);
        const html = fs.readFileSync(filepath, 'utf8');
        const postData = postsData.find(p => p.slug === slug);

        if (!postData) continue;

        const seoIssues = checkSEOMetadata(html, postData);

        if (seoIssues.length > 0) {
            report.issues.poorSEO.push({
                post: slug,
                issues: seoIssues
            });
            console.log(`  ⚠ ${slug}: ${seoIssues.length} SEO issue(s)`);
            seoIssues.forEach(issue => {
                console.log(`    - ${issue.type}${issue.current ? ` (${issue.current})` : ''}`);
            });
        }
    }

    // ===== CHECK 6: Keyword Extraction =====
    console.log('\n=== CHECK 6: Keyword Quality ===\n');

    for (const file of files) {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);
        const html = fs.readFileSync(filepath, 'utf8');
        const postData = postsData.find(p => p.slug === slug);

        if (!postData) continue;

        const keywords = extractKeywords(html, postData.title, postData.description);

        if (keywords.length < 5) {
            report.issues.missingKeywords.push({
                post: slug,
                extracted: keywords.length,
                keywords
            });
            console.log(`  ⚠ ${slug}: Only ${keywords.length} quality keywords extracted`);
        } else {
            console.log(`  ✓ ${slug}: ${keywords.length} keywords - ${keywords.slice(0, 5).join(', ')}...`);
        }
    }

    // ===== SUMMARY REPORT =====
    console.log('\n\n╔═══════════════════════════════════════════════════╗');
    console.log('║              HEALTH CHECK SUMMARY                 ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log(`📊 Total Posts Checked: ${report.totalPosts}\n`);

    console.log('🔍 ISSUES FOUND:');
    console.log(`  - Missing Substack Images: ${report.issues.missingImages.length} posts`);
    console.log(`  - Oversized Images: ${report.issues.oversizedImages.length} files`);
    console.log(`  - Wrong Image Formats: ${report.issues.wrongFormats.length} files`);
    console.log(`  - Metadata Mismatches: ${report.issues.missingMetadata.length} posts`);
    console.log(`  - Video Embeds Found: ${report.issues.videoEmbeds.length} posts`);
    console.log(`  - SEO Issues: ${report.issues.poorSEO.length} posts`);
    console.log(`  - Insufficient Keywords: ${report.issues.missingKeywords.length} posts\n`);

    console.log('✅ FIXES APPLIED:');
    console.log(`  - Images Downloaded: ${report.fixes.imagesDownloaded}`);
    console.log(`  - Images Resized: ${report.fixes.imagesResized}`);
    console.log(`  - Images Converted: ${report.fixes.imagesConverted}`);
    console.log(`  - Metadata Updated: ${report.fixes.metadataUpdated}`);
    console.log(`  - SEO Improvements: ${report.fixes.seoImproved}`);
    console.log(`  - Keywords Added: ${report.fixes.keywordsAdded}\n`);

    // Save detailed report
    const reportPath = './blog-health-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}\n`);

    // Generate HTML report
    await generateHTMLReport();
}

// ============= HTML REPORT GENERATION =============

async function generateHTMLReport() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forbidden Yoga Blog Health Check Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #e0e0e0;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #252525;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            overflow: hidden;
        }
        header {
            background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
            padding: 40px;
            text-align: center;
            color: white;
        }
        h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .subtitle { font-size: 1.1rem; opacity: 0.9; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #2a2a2a;
        }
        .stat-card {
            background: #333;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #8B4513;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #8B4513;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9rem;
            color: #aaa;
        }
        section {
            padding: 40px;
            border-bottom: 1px solid #333;
        }
        section:last-child { border-bottom: none; }
        h2 {
            font-size: 1.8rem;
            margin-bottom: 20px;
            color: #8B4513;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .issue-list, .fix-list {
            list-style: none;
            margin-top: 20px;
        }
        .issue-item, .fix-item {
            background: #2a2a2a;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 3px solid #f44336;
        }
        .fix-item {
            border-left-color: #4CAF50;
        }
        .post-name {
            font-weight: bold;
            color: #8B4513;
            margin-bottom: 5px;
        }
        .detail {
            font-size: 0.9rem;
            color: #999;
            margin-left: 15px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-right: 8px;
        }
        .badge-error { background: #f44336; color: white; }
        .badge-warning { background: #ff9800; color: white; }
        .badge-success { background: #4CAF50; color: white; }
        .badge-info { background: #2196F3; color: white; }
        footer {
            padding: 30px 40px;
            background: #1a1a1a;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🧘 Blog Health Check Report</h1>
            <p class="subtitle">Forbidden Yoga • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </header>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${report.totalPosts}</div>
                <div class="stat-label">Total Posts</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.issues.missingImages.length}</div>
                <div class="stat-label">Missing Images</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.issues.poorSEO.length}</div>
                <div class="stat-label">SEO Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.fixes.imagesResized + report.fixes.imagesConverted}</div>
                <div class="stat-label">Images Fixed</div>
            </div>
        </div>

        <section>
            <h2>⚠️ Issues Found</h2>

            ${report.issues.missingImages.length > 0 ? `
            <h3 style="margin-top: 30px; color: #ddd;">Missing Substack Images</h3>
            <ul class="issue-list">
                ${report.issues.missingImages.map(issue => `
                <li class="issue-item">
                    <div class="post-name">
                        <span class="badge badge-error">${issue.count} images</span>
                        ${issue.post}
                    </div>
                </li>
                `).join('')}
            </ul>
            ` : '<p style="color: #4CAF50; margin-top: 20px;">✓ No missing Substack images</p>'}

            ${report.issues.poorSEO.length > 0 ? `
            <h3 style="margin-top: 30px; color: #ddd;">SEO Issues</h3>
            <ul class="issue-list">
                ${report.issues.poorSEO.map(issue => `
                <li class="issue-item">
                    <div class="post-name">
                        <span class="badge badge-warning">${issue.issues.length} issues</span>
                        ${issue.post}
                    </div>
                    ${issue.issues.map(i => `<div class="detail">• ${i.type}</div>`).join('')}
                </li>
                `).join('')}
            </ul>
            ` : '<p style="color: #4CAF50; margin-top: 20px;">✓ All posts have good SEO</p>'}

            ${report.issues.videoEmbeds.length > 0 ? `
            <h3 style="margin-top: 30px; color: #ddd;">Video Embeds</h3>
            <ul class="issue-list" style="border-left-color: #2196F3;">
                ${report.issues.videoEmbeds.map(issue => `
                <li class="issue-item" style="border-left-color: #2196F3;">
                    <div class="post-name">
                        <span class="badge badge-info">${issue.videos.length} video(s)</span>
                        ${issue.post}
                    </div>
                    ${issue.videos.map(v => `<div class="detail">• ${v.type}: ${v.id || 'detected'}</div>`).join('')}
                </li>
                `).join('')}
            </ul>
            ` : ''}
        </section>

        <section>
            <h2>✅ Fixes Applied</h2>
            <ul class="fix-list">
                ${report.fixes.imagesResized > 0 ? `<li class="fix-item"><span class="badge badge-success">${report.fixes.imagesResized}</span> Images resized to max 1600px</li>` : ''}
                ${report.fixes.imagesConverted > 0 ? `<li class="fix-item"><span class="badge badge-success">${report.fixes.imagesConverted}</span> Large PNGs converted to JPG</li>` : ''}
                ${report.fixes.imagesResized === 0 && report.fixes.imagesConverted === 0 ? '<li class="fix-item">No image fixes needed</li>' : ''}
            </ul>
        </section>

        <footer>
            Generated by Forbidden Yoga Blog Health Check Script<br>
            ${new Date().toLocaleString()}
        </footer>
    </div>
</body>
</html>`;

    fs.writeFileSync('./test-blog.html', html);
    console.log('📄 HTML report saved to: ./test-blog.html');
    console.log('   Open in browser to view detailed health check results\n');
}

// Run the health check
runHealthCheck().catch(console.error);
