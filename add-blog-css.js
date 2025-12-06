const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));

let updated = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let content = fs.readFileSync(filepath, 'utf8');

    // Check if blog-post.css is already added
    if (content.includes('blog-post.css')) {
        console.log(`→ Already has CSS: ${file}`);
        return;
    }

    // Add blog-post.css after styles.css
    content = content.replace(
        '<link rel="stylesheet" href="../styles.css">',
        '<link rel="stylesheet" href="../styles.css">\n    <link rel="stylesheet" href="../blog-post.css">'
    );

    fs.writeFileSync(filepath, content);
    updated++;
    console.log(`✓ Updated: ${file}`);
});

console.log(`\n✓ Updated ${updated} posts`);
console.log(`→ Skipped ${files.length - updated} posts`);
