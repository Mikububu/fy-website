const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const blogImagesDir = './blog-images';
const blogThumbnailsDir = './blog-thumbnails';
const postsDataPath = './posts-data.json';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║     FORBIDDEN YOGA BLOG - COMPREHENSIVE POST AUDIT           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Load posts data
const postsData = JSON.parse(fs.readFileSync(postsDataPath, 'utf8'));
const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
const existingImages = new Set(fs.readdirSync(blogImagesDir));
const existingThumbnails = new Set(fs.readdirSync(blogThumbnailsDir));

const issues = {
    noText: [],
    lowText: [],
    substackImages: [],
    brokenImages: [],
    noImages: [],
    missingThumbnails: [],
    substackThumbnails: [],
    embeddedMedia: [],
    notInPostsData: []
};

console.log(`📊 Scanning ${postFiles.length} blog posts...\n`);

postFiles.forEach(file => {
    const filepath = path.join(postsDir, file);
    const html = fs.readFileSync(filepath, 'utf8');
    const slug = file.replace('.html', '');

    // Find corresponding entry in posts-data.json
    const postData = postsData.find(p => p.slug === slug);

    // ===== CHECK 1: Text Content =====
    const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const textLength = textContent.length;

    if (textLength < 200) {
        issues.noText.push({ slug, textLength, file });
    } else if (textLength < 500) {
        issues.lowText.push({ slug, textLength, file });
    }

    // ===== CHECK 2: Substack Image URLs (still pointing to Substack) =====
    // Check src attributes for Substack URLs
    const substackSrcPattern = /src=["'](https?:\/\/(?:substackcdn\.com|substack-post-media\.s3\.amazonaws\.com)[^"']+)["']/gi;
    const substackSrcMatches = [...html.matchAll(substackSrcPattern)];

    if (substackSrcMatches.length > 0) {
        issues.substackImages.push({
            slug,
            count: substackSrcMatches.length,
            urls: substackSrcMatches.map(m => m[1].substring(0, 80) + '...')
        });
    }

    // ===== CHECK 3: Broken Local Images =====
    const localImagePattern = /src=["']\/blog-images\/([^"']+)["']/gi;
    const localImageMatches = [...html.matchAll(localImagePattern)];
    const brokenImages = [];

    localImageMatches.forEach(match => {
        const imageName = match[1];
        if (!existingImages.has(imageName)) {
            brokenImages.push(imageName);
        }
    });

    if (brokenImages.length > 0) {
        issues.brokenImages.push({ slug, images: brokenImages });
    }

    // ===== CHECK 4: Posts with no images at all =====
    const hasAnyImages = localImageMatches.length > 0 || substackSrcMatches.length > 0;
    if (!hasAnyImages && textLength > 200) {
        issues.noImages.push({ slug, textLength });
    }

    // ===== CHECK 5: Missing Thumbnails =====
    if (postData) {
        const thumbnailPath = postData.image;
        if (!thumbnailPath) {
            issues.missingThumbnails.push({ slug, reason: 'No thumbnail defined in posts-data.json' });
        } else if (thumbnailPath.includes('substack')) {
            issues.substackThumbnails.push({ slug, url: thumbnailPath });
        } else {
            // Check if local thumbnail file exists
            const thumbnailName = path.basename(thumbnailPath);
            if (!existingThumbnails.has(thumbnailName)) {
                issues.missingThumbnails.push({ slug, reason: `File not found: ${thumbnailName}` });
            }
        }
    } else {
        issues.notInPostsData.push({ slug, file });
    }

    // ===== CHECK 6: Embedded Media (Spotify, YouTube, Videos) =====
    const hasSpotify = html.includes('spotify.com/embed') || html.includes('open.spotify.com');
    const hasYouTube = html.includes('youtube.com') || html.includes('youtu.be');
    const hasSubstackVideo = html.includes('substack-video.s3.amazonaws.com');
    const hasJWPlayer = /jwplayer|jwp/i.test(html);
    const hasVimeo = html.includes('vimeo.com');

    const embeds = [];
    if (hasSpotify) embeds.push('Spotify');
    if (hasYouTube) embeds.push('YouTube');
    if (hasSubstackVideo) embeds.push('Substack Video');
    if (hasJWPlayer) embeds.push('JW Player');
    if (hasVimeo) embeds.push('Vimeo');

    if (embeds.length > 0) {
        // Check if this post has minimal text (might indicate migration issue with embedded media)
        const isProblematic = textLength < 1000 && embeds.length > 0;
        issues.embeddedMedia.push({
            slug,
            embeds,
            textLength,
            possibleIssue: isProblematic
        });
    }
});

// ===== PRINT RESULTS =====

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    CRITICAL ISSUES');
console.log('═══════════════════════════════════════════════════════════════\n');

// NO TEXT
if (issues.noText.length > 0) {
    console.log(`\n🔴 POSTS WITH NO/MINIMAL TEXT (< 200 chars): ${issues.noText.length}`);
    console.log('   These posts failed to migrate content properly:\n');
    issues.noText.forEach(p => {
        console.log(`   • ${p.slug}`);
        console.log(`     Text: ${p.textLength} chars`);
    });
}

// SUBSTACK IMAGES STILL IN SRC
if (issues.substackImages.length > 0) {
    console.log(`\n🔴 POSTS WITH SUBSTACK IMAGE URLs (not migrated): ${issues.substackImages.length}`);
    console.log('   These posts still point to Substack for images:\n');
    issues.substackImages.forEach(p => {
        console.log(`   • ${p.slug} (${p.count} images)`);
    });
}

// BROKEN LOCAL IMAGES
if (issues.brokenImages.length > 0) {
    console.log(`\n🔴 POSTS WITH BROKEN LOCAL IMAGES: ${issues.brokenImages.length}`);
    console.log('   These posts reference images that don\'t exist:\n');
    issues.brokenImages.forEach(p => {
        console.log(`   • ${p.slug}`);
        p.images.forEach(img => console.log(`     - Missing: ${img}`));
    });
}

// MISSING THUMBNAILS
if (issues.missingThumbnails.length > 0) {
    console.log(`\n🔴 POSTS WITH MISSING THUMBNAILS: ${issues.missingThumbnails.length}`);
    issues.missingThumbnails.forEach(p => {
        console.log(`   • ${p.slug}`);
        console.log(`     Reason: ${p.reason}`);
    });
}

// SUBSTACK THUMBNAILS
if (issues.substackThumbnails.length > 0) {
    console.log(`\n🟠 POSTS WITH SUBSTACK THUMBNAIL URLs: ${issues.substackThumbnails.length}`);
    issues.substackThumbnails.forEach(p => {
        console.log(`   • ${p.slug}`);
    });
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    WARNINGS');
console.log('═══════════════════════════════════════════════════════════════\n');

// LOW TEXT
if (issues.lowText.length > 0) {
    console.log(`\n🟡 POSTS WITH LOW TEXT (200-500 chars): ${issues.lowText.length}`);
    console.log('   These might have partial content:\n');
    issues.lowText.forEach(p => {
        console.log(`   • ${p.slug} (${p.textLength} chars)`);
    });
}

// NO IMAGES
if (issues.noImages.length > 0) {
    console.log(`\n🟡 POSTS WITH NO IMAGES: ${issues.noImages.length}`);
    issues.noImages.forEach(p => {
        console.log(`   • ${p.slug}`);
    });
}

// NOT IN POSTS DATA
if (issues.notInPostsData.length > 0) {
    console.log(`\n🟡 POSTS NOT IN posts-data.json: ${issues.notInPostsData.length}`);
    issues.notInPostsData.forEach(p => {
        console.log(`   • ${p.slug}`);
    });
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    EMBEDDED MEDIA INFO');
console.log('═══════════════════════════════════════════════════════════════\n');

// EMBEDDED MEDIA
if (issues.embeddedMedia.length > 0) {
    console.log(`ℹ️  POSTS WITH EMBEDDED MEDIA: ${issues.embeddedMedia.length}`);
    console.log('   Posts with Spotify, YouTube, etc. (check for migration issues):\n');

    const problematic = issues.embeddedMedia.filter(p => p.possibleIssue);
    const ok = issues.embeddedMedia.filter(p => !p.possibleIssue);

    if (problematic.length > 0) {
        console.log('   ⚠️  Possibly problematic (low text + media):');
        problematic.forEach(p => {
            console.log(`   • ${p.slug}`);
            console.log(`     Media: ${p.embeds.join(', ')}`);
            console.log(`     Text: ${p.textLength} chars`);
        });
    }

    if (ok.length > 0) {
        console.log('\n   ✓ OK (has enough text):');
        ok.forEach(p => {
            console.log(`   • ${p.slug} [${p.embeds.join(', ')}]`);
        });
    }
}

// ===== SUMMARY =====
console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                         SUMMARY                               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log(`   Total Posts Scanned:           ${postFiles.length}`);
console.log(`   Posts in posts-data.json:      ${postsData.length}`);
console.log(`   Images in blog-images/:        ${existingImages.size}`);
console.log(`   Thumbnails in blog-thumbnails/: ${existingThumbnails.size}`);
console.log('');
console.log('   CRITICAL:');
console.log(`   🔴 No/minimal text:            ${issues.noText.length}`);
console.log(`   🔴 Substack image URLs:        ${issues.substackImages.length}`);
console.log(`   🔴 Broken local images:        ${issues.brokenImages.length}`);
console.log(`   🔴 Missing thumbnails:         ${issues.missingThumbnails.length}`);
console.log(`   🟠 Substack thumbnail URLs:    ${issues.substackThumbnails.length}`);
console.log('');
console.log('   WARNINGS:');
console.log(`   🟡 Low text (200-500):         ${issues.lowText.length}`);
console.log(`   🟡 No images at all:           ${issues.noImages.length}`);
console.log(`   🟡 Not in posts-data.json:     ${issues.notInPostsData.length}`);
console.log('');
console.log('   INFO:');
console.log(`   ℹ️  Posts with embedded media:  ${issues.embeddedMedia.length}`);

// Calculate health score
const criticalIssues = issues.noText.length + issues.substackImages.length +
                       issues.brokenImages.length + issues.missingThumbnails.length;
const totalPossibleIssues = postFiles.length * 4; // 4 critical checks per post
const healthScore = Math.round(((totalPossibleIssues - criticalIssues) / totalPossibleIssues) * 100);

console.log('\n   ─────────────────────────────────────');
console.log(`   BLOG HEALTH SCORE: ${healthScore}%`);
console.log('   ─────────────────────────────────────\n');

// Save JSON report
const report = {
    timestamp: new Date().toISOString(),
    totalPosts: postFiles.length,
    healthScore,
    issues
};

fs.writeFileSync('./audit-report.json', JSON.stringify(report, null, 2));
console.log('📄 Detailed report saved to: ./audit-report.json\n');
