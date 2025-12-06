const fs = require('fs');
const path = require('path');

const postsToFix = [
    'indian-tantra-mahavidyas-versus-nityas',
    'what-you-can-expect-booking-forbidden',
    'why-our-society-cannot-heal'
];

const postsDir = './posts';

console.log('Removing Substack video player embeds from posts...\n');

function removeSubstackVideoEmbed(slug) {
    const filepath = path.join(postsDir, `${slug}.html`);
    let html = fs.readFileSync(filepath, 'utf8');

    // Find the massive Substack video player embed
    // It starts with <div class="container-dlhqPD"> and ends before the actual article content

    // Pattern: everything from the opening of the post-content div until the actual markup/body content
    const embedPattern = /(<div class="post-content">[\s\S]*?<div class="visibility-check"><\/div><div>)([\s\S]*?)(<div class="main-content-and-sidebar-fw1PHW">|<div class="pencraft pc-display-contents pc-reset pubTheme-yiXxQA">)/;

    const match = html.match(embedPattern);

    if (!match) {
        console.log(`  ⊘ ${slug}: No Substack video embed found with expected pattern`);

        // Try alternative pattern - look for the container-dlhqPD div
        const altPattern = /(<div class="post-content">[\s\S]*?)(<div><div class="container-dlhqPD">[\s\S]*?<\/div><\/div><\/div>[\s\S]*?<div class="main-content-and-sidebar)/;
        const altMatch = html.match(altPattern);

        if (!altMatch) {
            console.log(`  ✗ ${slug}: Could not find video embed to remove`);
            return;
        }

        // Remove the embed
        html = html.replace(altPattern, '$1<div class="main-content-and-sidebar');
        fs.writeFileSync(filepath, html);
        console.log(`  ✓ ${slug}: Removed Substack video embed (alt pattern)\n`);
        return;
    }

    // Check if there's actually a massive embed there
    const embedContent = match[2];

    if (embedContent.includes('container-dlhqPD') || embedContent.includes('video-player-wrapper')) {
        // This is a Substack video player - remove it
        html = html.replace(embedPattern, '$1$3');
        fs.writeFileSync(filepath, html);
        console.log(`  ✓ ${slug}: Removed Substack video player embed\n`);
    } else {
        console.log(`  ⊘ ${slug}: No video player embed detected\n`);
    }
}

function main() {
    for (const slug of postsToFix) {
        removeSubstackVideoEmbed(slug);
    }
    console.log('✓ Done removing Substack video embeds');
}

main();
