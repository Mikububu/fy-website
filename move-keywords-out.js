const fs = require('fs');
const path = require('path');

const postsDir = './posts';
console.log('Moving keywords OUTSIDE post-content div...\n');

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));
let fixed = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    // Extract the keywords section (including both opening and closing divs)
    const keywordsRegex = /(<div class="post-keywords">[\s\S]*?<\/div>\s*<\/div>)/;
    const match = html.match(keywordsRegex);

    if (!match) {
        console.log(`  ✗ ${file}: No keywords found`);
        return;
    }

    const keywordsSection = match[1];

    // Remove keywords from current position
    html = html.replace(keywordsSection, '');

    // Find the closing </div> of post-content and insert keywords AFTER it
    // Look for </div> that comes before "Back to all posts"
    const insertPoint = html.indexOf('<a href="/#blog-section" class="back-link">');

    if (insertPoint === -1) {
        console.log(`  ✗ ${file}: Could not find back link`);
        return;
    }

    // Insert keywords before the back link with proper indentation
    html = html.slice(0, insertPoint) +
           '\n        ' + keywordsSection + '\n\n        ' +
           html.slice(insertPoint);

    fs.writeFileSync(filepath, html);
    fixed++;
    console.log(`  ✓ ${file}: Moved keywords outside post-content`);
});

console.log(`\n✓ Fixed ${fixed} blog posts`);
