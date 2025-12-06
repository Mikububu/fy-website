const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Adding "Back to all posts" link to top of each post...\n');

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    // Check if top back link already exists
    if (html.includes('class="top-back-link"')) {
        console.log(`  ⊘ ${file}: Top back link already exists`);
        return;
    }

    // Find the opening of the article or post-container
    const insertRegex = /(<article class="post-container">)/;

    if (!insertRegex.test(html)) {
        console.log(`  ✗ ${file}: Could not find post-container`);
        return;
    }

    // Add the back link right after <article> opens
    const backLink = `\n        <a href="/#blog-section" class="top-back-link">← Back to all posts</a>\n`;

    html = html.replace(insertRegex, `$1${backLink}`);

    fs.writeFileSync(filepath, html);
    updated++;
    console.log(`  ✓ ${file}: Added top back link`);
});

console.log(`\n✓ Added top back link to ${updated} posts`);
