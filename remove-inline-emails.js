const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Removing inline email addresses from blog posts...\n');

let updated = 0;

// Patterns to remove
const patterns = [
    /Drop a study request to: love@forbidden-yoga\.com/gi,
    /reach out[^<]*love@forbidden-yoga\.com/gi,
    /text him on IG: thehealerstan or write to love@forbidden-yoga\.com/gi,
    /write to love@forbidden-yoga\.com/gi,
    /love@forbidden-yoga\.com/gi
];

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;
    let matchedPatterns = [];

    patterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
            // Remove the matched text and any surrounding paragraph tags if they become empty
            content = content.replace(new RegExp(`<p>${pattern.source}</p>`, 'gi'), '');
            content = content.replace(pattern, '');
            matchedPatterns.push(index);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filepath, content);
        updated++;
        console.log(`✓ Removed email references from: ${file}`);
    }
});

console.log(`\n✓ Updated ${updated} blog posts`);
