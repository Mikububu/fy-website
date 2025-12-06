const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

const footer = `
    <footer class="footer">
        <div class="footer-email">love<span style="display:none">nospam</span>@<span style="display:none">antispam</span>forbidden-yoga.com</div>
        <div class="footer-copyright">Relatespace LLC Santa Monica USA</div>
    </footer>
`;

let updated = 0;
let emailsRemoved = 0;
let footersAdded = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;

    // Remove the inline email section with JavaScript obfuscation
    const emailPattern = /<div class="contact-email"[^>]*>[\s\S]*?<\/script>/g;
    const emailMatches = content.match(emailPattern);
    if (emailMatches) {
        content = content.replace(emailPattern, '');
        emailsRemoved += emailMatches.length;
        changed = true;
    }

    // Check if footer already exists
    if (!content.includes('<footer class="footer">')) {
        // Add footer before closing body tag
        content = content.replace('</body>', footer + '\n</body>');
        footersAdded++;
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filepath, content);
        updated++;
        console.log(`✓ Updated: ${file}`);
    }
});

console.log(`\n✓ Updated ${updated} posts`);
console.log(`  - Removed ${emailsRemoved} inline email sections`);
console.log(`  - Added ${footersAdded} footers`);
