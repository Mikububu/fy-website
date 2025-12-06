const fs = require('fs');
const path = require('path');

const postsToFix = [
    'indian-tantra-mahavidyas-versus-nityas',
    'what-you-can-expect-booking-forbidden',
    'why-our-society-cannot-heal'
];

const postsDir = './posts';

console.log('Stripping all Substack UI from posts...\n');

function stripSubstackUI(slug) {
    const filepath = path.join(postsDir, `${slug}.html`);
    let html = fs.readFileSync(filepath, 'utf8');

    // The actual article text is in: <div dir="auto" class="body markup">...</div>
    // Everything else is Substack UI chrome

    const bodyMarkupPattern = /<div dir="auto" class="body markup">([\s\S]*?)<\/div>/;
    const match = html.match(bodyMarkupPattern);

    if (!match) {
        console.log(`  ✗ ${slug}: Could not find body markup div`);
        return;
    }

    const articleContent = match[1];

    // Replace everything inside post-content with just the clean article content
    const postContentPattern = /(<div class="post-content">[\s\S]*?)([\s\S]*?)(<\/div>\s*<div class="post-keywords">)/;

    if (!postContentPattern.test(html)) {
        console.log(`  ✗ ${slug}: Could not find post-content wrapper`);
        return;
    }

    // Replace the messy Substack embed with clean content
    html = html.replace(postContentPattern, `$1\n            ${articleContent}\n        $3`);

    fs.writeFileSync(filepath, html);
    console.log(`  ✓ ${slug}: Stripped Substack UI, kept only article content\n`);
}

function main() {
    for (const slug of postsToFix) {
        stripSubstackUI(slug);
    }
    console.log('✓ Done stripping Substack UI');
}

main();
