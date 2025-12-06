const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Removing outdated Substack paywall messaging from all blog posts...\n');

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;

    // Remove paywall div blocks
    const paywallPattern = /<div[^>]*data-testid="paywall"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;
    if (content.match(paywallPattern)) {
        content = content.replace(paywallPattern, '');
        changed = true;
    }

    // Remove "Already a paid subscriber? Sign in" text
    const signInPattern = /<div[^>]*class="paywall-login"[^>]*>[\s\S]*?<\/div>/g;
    if (content.match(signInPattern)) {
        content = content.replace(signInPattern, '');
        changed = true;
    }

    // Remove "This post is for paid subscribers" heading
    const paywallTitlePattern = /<h2[^>]*class="paywall-title"[^>]*>[\s\S]*?<\/h2>/g;
    if (content.match(paywallTitlePattern)) {
        content = content.replace(paywallTitlePattern, '');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filepath, content);
        updated++;
        console.log(`✓ Removed paywall messaging from: ${file}`);
    }
});

console.log(`\n✓ Updated ${updated} blog posts`);
console.log('\nNote: Posts may still have limited content if full text was not');
console.log('available during migration. This removal only removes Substack UI elements.');
