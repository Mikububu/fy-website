const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Adding keyword navigation script to all blog posts...\n');

const scriptTag = `    <script src="/keyword-navigation.js"></script>`;

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    // Check if script already added
    if (html.includes('keyword-navigation.js')) {
        console.log(`  ⊘ ${file}: Script already added`);
        return;
    }

    // Add script before closing </body> tag
    html = html.replace('</body>', `${scriptTag}\n</body>`);

    fs.writeFileSync(filepath, html);
    updated++;
    console.log(`  ✓ ${file}: Added keyword navigation script`);
});

console.log(`\n✓ Added script to ${updated} blog posts`);
