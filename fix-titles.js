const fs = require('fs');
const path = require('path');

const posts = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));
let updated = 0;

posts.forEach(post => {
  const htmlPath = path.join('./posts', post.slug + '.html');
  if (!fs.existsSync(htmlPath)) return;

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract title from the actual h1.post-title in the content
  const h1Match = html.match(/<h1[^>]*class="[^"]*post-title[^"]*"[^>]*>([^<]+)<\/h1>/i);

  if (h1Match) {
    const properTitle = h1Match[1].trim();

    // Check if current title is different (lowercase, truncated, or slug-based)
    const currentLower = post.title.toLowerCase() === post.title;
    const titlesDifferent = post.title.toLowerCase() !== properTitle.toLowerCase();

    if (currentLower || titlesDifferent) {
      console.log(`Fixing: "${post.title}"`);
      console.log(`    -> "${properTitle}"`);
      post.title = properTitle;
      updated++;
    }
  }
});

fs.writeFileSync('posts-data.json', JSON.stringify(posts, null, 2));
console.log(`\nUpdated ${updated} post titles`);
