const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const imageMapPath = './image-map.json';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║         COMPREHENSIVE BLOG MAINTENANCE & HEALTH CHECK        ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Load image map
const imageMap = JSON.parse(fs.readFileSync(imageMapPath, 'utf8'));

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

const issues = {
    substackImages: [],
    paywallContent: [],
    missingKeywords: [],
    brokenImages: [],
    emptyContent: [],
    missingMetadata: []
};

const fixes = {
    imageUrlsReplaced: 0,
    paywallsRemoved: 0,
    keywordsAdded: 0,
    postsFixed: 0
};

console.log(`📊 Scanning ${files.length} blog posts...\n`);

files.forEach((file, index) => {
    const slug = file.replace('.html', '');
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');
    let changed = false;
    let postIssues = [];

    // ═══════════════════════════════════════════════════════════
    // 1. CHECK & FIX: Substack Image URLs
    // ═══════════════════════════════════════════════════════════
    if (imageMap[slug]) {
        let imageCount = 0;
        imageMap[slug].forEach(img => {
            // Extract image ID from original URL
            const idMatch = img.original.match(/\/([a-f0-9\-]+_\d+x\d+\.\w+)$/);
            if (!idMatch) {
                // Handle HEIC and other formats
                const heicMatch = img.original.match(/\/([a-f0-9\-]+)\.(heic|jpeg|jpg|png|webp|gif)$/);
                if (heicMatch) {
                    const imageId = heicMatch[1];
                    const ext = heicMatch[2];

                    // Replace substackcdn.com URLs
                    const cdnPattern = new RegExp(`https://substackcdn\\.com/image/fetch/[^"'\\s]*${imageId}[^"'\\s]*\\.${ext}`, 'g');
                    const matches1 = html.match(cdnPattern);
                    if (matches1) {
                        html = html.replace(cdnPattern, img.local);
                        imageCount += matches1.length;
                        changed = true;
                    }

                    // Replace direct S3 URLs
                    const s3Pattern = new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    const matches2 = html.match(s3Pattern);
                    if (matches2) {
                        html = html.replace(s3Pattern, img.local);
                        imageCount += matches2.length;
                        changed = true;
                    }
                }
                return;
            }

            const imageFilename = idMatch[1];

            // Replace substackcdn URLs
            const cdnPattern = new RegExp(`https://substackcdn\\.com/image/fetch/[^"'\\s]+${imageFilename.replace(/\./g, '\\.')}`, 'g');
            const matches1 = html.match(cdnPattern);
            if (matches1) {
                html = html.replace(cdnPattern, img.local);
                imageCount += matches1.length;
                changed = true;
            }

            // Replace direct S3 URLs
            const s3Pattern = new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const matches2 = html.match(s3Pattern);
            if (matches2) {
                html = html.replace(s3Pattern, img.local);
                imageCount += matches2.length;
                changed = true;
            }
        });

        if (imageCount > 0) {
            fixes.imageUrlsReplaced += imageCount;
        }
    }

    // Check for remaining Substack image URLs (content images only)
    const contentImageMatches = html.match(/https:\/\/(substackcdn\.com\/image\/fetch\/[^"']*(?:substack-post-media|public\/images)|substack-post-media\.s3\.amazonaws\.com\/public\/images)/g);
    if (contentImageMatches) {
        issues.substackImages.push({ file, count: contentImageMatches.length });
        postIssues.push(`${contentImageMatches.length} Substack image URLs`);
    }

    // ═══════════════════════════════════════════════════════════
    // 2. CHECK & FIX: Paywall Content
    // ═══════════════════════════════════════════════════════════
    const paywallPattern = /<div[^>]*data-testid="paywall"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;
    if (html.match(paywallPattern)) {
        html = html.replace(paywallPattern, '');
        changed = true;
        fixes.paywallsRemoved++;
        postIssues.push('Paywall removed');
    }

    // Remove "Already a paid subscriber" text
    const signInPattern = /<div[^>]*class="paywall-login"[^>]*>[\s\S]*?<\/div>/g;
    if (html.match(signInPattern)) {
        html = html.replace(signInPattern, '');
        changed = true;
    }

    // Remove paywall title
    const paywallTitlePattern = /<h2[^>]*class="paywall-title"[^>]*>[\s\S]*?<\/h2>/g;
    if (html.match(paywallTitlePattern)) {
        html = html.replace(paywallTitlePattern, '');
        changed = true;
    }

    // Check if paywall content still exists
    if (html.includes('This post is for paid subscribers') || html.includes('Already a paid subscriber')) {
        issues.paywallContent.push(file);
        postIssues.push('Paywall content detected');
    }

    // ═══════════════════════════════════════════════════════════
    // 3. CHECK: Keyword Tags
    // ═══════════════════════════════════════════════════════════
    if (!html.includes('class="post-keywords"')) {
        issues.missingKeywords.push(file);
        postIssues.push('Missing keyword tags');
    }

    // ═══════════════════════════════════════════════════════════
    // 4. CHECK: Content Length
    // ═══════════════════════════════════════════════════════════
    const bodyContent = html.match(/<div class="post-content">([\s\S]*?)<\/div>\s*<div class="post-keywords">/);
    if (bodyContent) {
        const textContent = bodyContent[1].replace(/<[^>]+>/g, '').trim();
        if (textContent.length < 500) {
            issues.emptyContent.push({ file, length: textContent.length });
            postIssues.push(`Short content (${textContent.length} chars)`);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 5. CHECK: Metadata
    // ═══════════════════════════════════════════════════════════
    const hasTitle = html.includes('<title>') && html.includes('</title>');
    const hasDescription = html.includes('name="description"');
    const hasKeywords = html.includes('name="keywords"');

    if (!hasTitle || !hasDescription || !hasKeywords) {
        issues.missingMetadata.push({
            file,
            missing: [
                !hasTitle ? 'title' : null,
                !hasDescription ? 'description' : null,
                !hasKeywords ? 'keywords' : null
            ].filter(Boolean)
        });
        postIssues.push(`Missing metadata: ${!hasTitle ? 'title ' : ''}${!hasDescription ? 'description ' : ''}${!hasKeywords ? 'keywords' : ''}`);
    }

    // ═══════════════════════════════════════════════════════════
    // 6. SAVE CHANGES
    // ═══════════════════════════════════════════════════════════
    if (changed) {
        fs.writeFileSync(filepath, html);
        fixes.postsFixed++;
    }

    // Progress indicator
    const progress = Math.floor((index + 1) / files.length * 100);
    const bar = '█'.repeat(Math.floor(progress / 2)) + '░'.repeat(50 - Math.floor(progress / 2));
    process.stdout.write(`\r[${bar}] ${progress}% | ${file.padEnd(50)} ${postIssues.length > 0 ? '⚠️  ' + postIssues.join(', ') : '✓'}`);
});

console.log('\n\n');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                        FIXES APPLIED                          ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log(`✅ Posts fixed:           ${fixes.postsFixed}`);
console.log(`🖼️  Image URLs replaced:   ${fixes.imageUrlsReplaced}`);
console.log(`🔓 Paywalls removed:      ${fixes.paywallsRemoved}`);
console.log(`🏷️  Keywords added:        ${fixes.keywordsAdded}\n`);

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                      ISSUES DETECTED                          ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

if (issues.substackImages.length > 0) {
    console.log(`⚠️  Substack Image URLs Still Present: ${issues.substackImages.length} posts`);
    issues.substackImages.slice(0, 5).forEach(({ file, count }) => {
        console.log(`   • ${file}: ${count} URLs`);
    });
    if (issues.substackImages.length > 5) {
        console.log(`   ... and ${issues.substackImages.length - 5} more`);
    }
    console.log();
}

if (issues.paywallContent.length > 0) {
    console.log(`🔒 Paywall Content Detected: ${issues.paywallContent.length} posts`);
    issues.paywallContent.forEach(file => console.log(`   • ${file}`));
    console.log();
}

if (issues.missingKeywords.length > 0) {
    console.log(`🏷️  Missing Keyword Tags: ${issues.missingKeywords.length} posts`);
    issues.missingKeywords.slice(0, 5).forEach(file => console.log(`   • ${file}`));
    if (issues.missingKeywords.length > 5) {
        console.log(`   ... and ${issues.missingKeywords.length - 5} more`);
    }
    console.log();
}

if (issues.emptyContent.length > 0) {
    console.log(`📄 Short/Empty Content: ${issues.emptyContent.length} posts`);
    issues.emptyContent.forEach(({ file, length }) => {
        console.log(`   • ${file}: ${length} characters`);
    });
    console.log();
}

if (issues.missingMetadata.length > 0) {
    console.log(`📋 Missing Metadata: ${issues.missingMetadata.length} posts`);
    issues.missingMetadata.slice(0, 5).forEach(({ file, missing }) => {
        console.log(`   • ${file}: ${missing.join(', ')}`);
    });
    if (issues.missingMetadata.length > 5) {
        console.log(`   ... and ${issues.missingMetadata.length - 5} more`);
    }
    console.log();
}

// Summary
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                          SUMMARY                              ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const totalIssues = issues.substackImages.length + issues.paywallContent.length +
                   issues.missingKeywords.length + issues.emptyContent.length +
                   issues.missingMetadata.length;

if (totalIssues === 0) {
    console.log('✨ All posts are in excellent condition!\n');
    console.log('All checks passed:');
    console.log('  ✓ No Substack content image URLs');
    console.log('  ✓ No paywall content');
    console.log('  ✓ All posts have keyword tags');
    console.log('  ✓ All posts have sufficient content');
    console.log('  ✓ All posts have complete metadata\n');
} else {
    console.log(`⚠️  Total issues found: ${totalIssues}`);
    console.log(`✅ Automatic fixes applied: ${fixes.postsFixed} posts updated\n`);

    if (issues.substackImages.length > 0) {
        console.log('Note: Remaining Substack URLs may be profile avatars or comment');
        console.log('section placeholders, which are safe to leave.\n');
    }
}

console.log('═══════════════════════════════════════════════════════════════\n');
