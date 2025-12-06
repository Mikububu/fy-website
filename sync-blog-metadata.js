const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const postsDataPath = './posts-data.json';

// Load existing posts data
const postsData = JSON.parse(fs.readFileSync(postsDataPath, 'utf8'));

console.log('Syncing blog post metadata with actual content...\n');

let updated = 0;

postsData.forEach((post, index) => {
    const htmlPath = path.join(postsDir, `${post.slug}.html`);

    if (!fs.existsSync(htmlPath)) {
        console.log(`⚠ File not found: ${post.slug}.html`);
        return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Extract title from <h1 class="post-title published title-X77sOw">
    const titleMatch = html.match(/<h1[^>]*class="post-title published title-[^"]*"[^>]*>(.*?)<\/h1>/);

    // Extract subtitle from <h3 class="subtitle subtitle-...">
    const subtitleMatch = html.match(/<h3[^>]*class="subtitle subtitle-[^"]*"[^>]*>(.*?)<\/h3>/);

    let changed = false;

    if (titleMatch) {
        const newTitle = titleMatch[1].trim();
        if (post.title !== newTitle) {
            console.log(`\n${post.slug}:`);
            console.log(`  Old title: "${post.title}"`);
            console.log(`  New title: "${newTitle}"`);
            postsData[index].title = newTitle;
            changed = true;
        }
    }

    if (subtitleMatch) {
        const newDescription = subtitleMatch[1].trim();
        if (post.description !== newDescription) {
            if (!changed) {
                console.log(`\n${post.slug}:`);
            }
            console.log(`  Old description: "${post.description}"`);
            console.log(`  New description: "${newDescription}"`);
            postsData[index].description = newDescription;
            changed = true;
        }
    }

    if (changed) {
        updated++;
    }
});

// Save updated posts data
fs.writeFileSync(postsDataPath, JSON.stringify(postsData, null, 2));

console.log(`\n✓ Updated ${updated} blog post metadata entries`);
console.log('✓ Saved to posts-data.json');
