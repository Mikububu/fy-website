const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Moving keywords section outside post-content div...\n');

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let fixed = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    // Check if keywords section exists
    if (!html.includes('class="post-keywords"')) {
        console.log(`  ⊘ ${file}: No keywords section found`);
        return;
    }

    // Extract the keywords section
    const keywordsMatch = html.match(/(\s*<div class="post-keywords">[\s\S]*?<\/div>\s*<\/div>)/);

    if (!keywordsMatch) {
        console.log(`  ✗ ${file}: Could not extract keywords section`);
        return;
    }

    const keywordsSection = keywordsMatch[1];

    // Remove keywords from current position
    html = html.replace(keywordsSection, '');

    // Find the closing </div> of post-content and insert keywords AFTER it but BEFORE </article>
    const articleClosePattern = /(<\/div>\s*<\/article>)/;

    if (articleClosePattern.test(html)) {
        html = html.replace(articleClosePattern, `\n        ${keywordsSection.trim()}\n    $1`);
        fs.writeFileSync(filepath, html);
        fixed++;
        console.log(`  ✓ ${file}: Keywords moved outside post-content`);
    } else {
        console.log(`  ✗ ${file}: Could not find article close tag`);
    }
});

console.log(`\n✓ Fixed keyword positioning in ${fixed} blog posts`);
