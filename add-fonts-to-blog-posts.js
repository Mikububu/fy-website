const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Adding Google Fonts to all blog posts...\n');

// Font link to inject
const fontLinks = `    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@100;400&display=swap" rel="stylesheet">
`;

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    // Check if fonts are already added
    if (html.includes('fonts.googleapis.com')) {
        console.log(`  ⊘ ${file}: Fonts already added`);
        return;
    }

    // Find the <link rel="stylesheet" href="../blog-post.css"> line and add fonts before it
    const cssLinkPattern = /(<link rel="stylesheet" href="\.\.\/blog-post\.css">)/;

    if (cssLinkPattern.test(html)) {
        html = html.replace(cssLinkPattern, fontLinks + '\n$1');
        fs.writeFileSync(filepath, html);
        updated++;
        console.log(`  ✓ ${file}: Added Google Fonts`);
    } else {
        console.log(`  ✗ ${file}: Could not find CSS link`);
    }
});

console.log(`\n✓ Added Google Fonts to ${updated} blog posts`);
