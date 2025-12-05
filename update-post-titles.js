const fs = require('fs');
const path = require('path');

const posts = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));
let updated = 0;

posts.forEach(post => {
  const htmlPath = path.join('./posts', post.slug + '.html');
  if (!fs.existsSync(htmlPath)) return;

  let html = fs.readFileSync(htmlPath, 'utf8');
  let changed = false;

  // Update <title> tag
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    const currentTitle = titleMatch[1];
    const expectedTitle = `${post.title} | Forbidden Yoga`;

    if (currentTitle !== expectedTitle) {
      html = html.replace(/<title>[^<]+<\/title>/i, `<title>${expectedTitle}</title>`);
      changed = true;
    }
  }

  // Update og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/i,
    `<meta property="og:title" content="${post.title} | Forbidden Yoga">`
  );

  // Update twitter:title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/i,
    `<meta name="twitter:title" content="${post.title}">`
  );

  // Update structured data headline
  html = html.replace(
    /"headline":\s*"[^"]*"/,
    `"headline": "${post.title}"`
  );

  if (changed || html !== fs.readFileSync(htmlPath, 'utf8')) {
    fs.writeFileSync(htmlPath, html);
    updated++;
    console.log(`Updated: ${post.slug}`);
  }
});

console.log(`\nUpdated ${updated} post files`);
