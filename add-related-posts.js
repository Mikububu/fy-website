const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'posts');

// Get all HTML files in posts directory
const htmlFiles = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html');

console.log(`Found ${htmlFiles.length} blog posts to update`);

let updatedCount = 0;
let alreadyHasCount = 0;
let errorCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(postsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already has related posts section
    if (content.includes('related-posts-container') || content.includes('related-posts-grid')) {
        console.log(`  ✓ ${file} - already has related posts section`);
        alreadyHasCount++;
        return;
    }

    // Add related posts section before the back-link
    const backLinkPattern = /(\s*)<a href="\/#blog-section" class="back-link">/;
    const relatedPostsHTML = `$1<section class="related-posts-grid">
$1    <h3>Explore More</h3>
$1    <div id="related-posts-container" class="posts-grid"></div>
$1</section>

$1<a href="/#blog-section" class="back-link">`;

    if (!backLinkPattern.test(content)) {
        console.log(`  ✗ ${file} - could not find back-link`);
        errorCount++;
        return;
    }

    content = content.replace(backLinkPattern, relatedPostsHTML);

    // Add related-posts.js script before </body>
    if (!content.includes('related-posts.js')) {
        content = content.replace(
            '</body>',
            '    <script src="/related-posts.js"></script>\n</body>'
        );
    }

    fs.writeFileSync(filePath, content);
    console.log(`  ✓ ${file} - updated`);
    updatedCount++;
});

console.log(`\nSummary:`);
console.log(`  Updated: ${updatedCount}`);
console.log(`  Already had related posts: ${alreadyHasCount}`);
console.log(`  Errors: ${errorCount}`);
