const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Removing unnecessary gaps from blog posts...\n');

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    // Remove the extra blank lines between </div> and the post-keywords section
    // Pattern: </div>\n        \n\n        \n        <div class="post-keywords">
    // Replace with: </div>\n\n        <div class="post-keywords">

    const before = html;

    // Remove multiple consecutive blank/whitespace lines
    html = html.replace(/(<\/div>)\s*\n\s*\n+\s*\n+\s*(<div class="post-keywords">)/g, '$1\n\n        $2');

    if (html !== before) {
        fs.writeFileSync(filepath, html);
        updated++;
        console.log(`✓ ${file}: Removed extra blank lines`);
    } else {
        console.log(`  ${file}: No gaps found`);
    }
});

console.log(`\n✅ Updated ${updated} of ${files.length} blog posts`);
