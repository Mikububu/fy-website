const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const blogImagesDir = './blog-images';

console.log('Stripping Substack UI from ALL posts...\n');

function hasSubstackUI(html) {
    return html.includes('class="pencraft') ||
           html.includes('substackcdn') ||
           html.includes('data-component-name');
}

function stripSubstackUIFromPost(filepath, slug) {
    let html = fs.readFileSync(filepath, 'utf8');

    if (!hasSubstackUI(html)) {
        return { processed: false, reason: 'No Substack UI found' };
    }

    // The actual article text is in: <div dir="auto" class="body markup">...</div>
    const bodyMarkupPattern = /<div dir="auto" class="body markup">([\s\S]*?)<\/div>/;
    const match = html.match(bodyMarkupPattern);

    if (!match) {
        return { processed: false, reason: 'Could not find body markup div' };
    }

    const articleContent = match[1];

    // Find all images for this post
    const imageFiles = fs.readdirSync(blogImagesDir)
        .filter(f => f.startsWith(`${slug}-img-`) && (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')))
        .sort();

    // Build image HTML - skip img-0 (thumbnail/avatar), add rest as simple img tags
    let imageHTML = '';
    if (imageFiles.length > 1) {
        imageHTML = imageFiles
            .filter((_, idx) => idx > 0) // Skip first image (img-0)
            .map(img => `            <img src="/blog-images/${img}" alt="${slug}" class="post-image">`)
            .join('\n') + '\n';
    }

    // Replace everything inside post-content with clean images + content
    const postContentPattern = /(<div class="post-content">[\s\S]*?)([\s\S]*?)(<\/div>\s*<div class="post-keywords">)/;

    if (!postContentPattern.test(html)) {
        return { processed: false, reason: 'Could not find post-content wrapper' };
    }

    html = html.replace(postContentPattern, `$1\n${imageHTML}            ${articleContent}\n        $3`);

    fs.writeFileSync(filepath, html);
    return {
        processed: true,
        images: imageFiles.length - 1,
        textLength: articleContent.length
    };
}

function main() {
    const files = fs.readdirSync(postsDir)
        .filter(f => f.endsWith('.html') && !f.startsWith('.'));

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of files) {
        const slug = file.replace('.html', '');
        const filepath = path.join(postsDir, file);

        try {
            const result = stripSubstackUIFromPost(filepath, slug);

            if (result.processed) {
                console.log(`  ✓ ${slug}: Stripped UI, added ${result.images} images, ${result.textLength} chars text`);
                processed++;
            } else {
                console.log(`  ⊘ ${slug}: ${result.reason}`);
                skipped++;
            }
        } catch (err) {
            console.log(`  ✗ ${slug}: Error - ${err.message}`);
            errors++;
        }
    }

    console.log(`\n✓ Processed ${processed} posts`);
    console.log(`⊘ Skipped ${skipped} posts (already clean)`);
    if (errors > 0) console.log(`✗ ${errors} errors`);
}

main();
