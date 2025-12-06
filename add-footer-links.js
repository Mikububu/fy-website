const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Adding footer links to all blog posts...\n');

const footerLinksHTML = `        <div class="footer-links">
            <a href="/privacy.html">Privacy Policy</a>
            <span>•</span>
            <a href="/terms.html">Terms & Conditions</a>
        </div>`;

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let html = fs.readFileSync(filepath, 'utf8');

    // Check if footer links already exist
    if (html.includes('footer-links')) {
        console.log(`  ⊘ ${file}: Footer links already added`);
        return;
    }

    // Find the footer email line and add links after it
    const pattern = /(<div class="footer-email">.*?<\/div>)/;

    if (pattern.test(html)) {
        html = html.replace(pattern, `$1\n${footerLinksHTML}`);
        fs.writeFileSync(filepath, html);
        updated++;
        console.log(`  ✓ ${file}: Added footer links`);
    } else {
        console.log(`  ✗ ${file}: Could not find footer email`);
    }
});

console.log(`\n✓ Added footer links to ${updated} blog posts`);
