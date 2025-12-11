const fs = require('fs');
const path = require('path');

const postsDir = './posts';

function extractDescription(content) {
    // Get first meaningful paragraph from post content
    const contentMatch = content.match(/<div class="post-content">([\s\S]*?)<\/div>\s*<div class="post-keywords">/);
    if (contentMatch) {
        const paragraphs = contentMatch[1].match(/<p>([^<]+)<\/p>/g);
        if (paragraphs) {
            for (const p of paragraphs) {
                const text = p.replace(/<[^>]+>/g, '').trim();
                if (text.length > 50 && !text.startsWith('google') && !text.startsWith('0:')) {
                    return text.substring(0, 160).replace(/"/g, "'");
                }
            }
        }
    }
    return '';
}

function extractTitle(content) {
    const match = content.match(/<title>([^|]+)/);
    return match ? match[1].trim() : '';
}

function extractSubtitle(content) {
    const match = content.match(/<h3 class="post-subtitle">([^<]+)<\/h3>/);
    return match ? match[1].trim() : '';
}

function extractDate(content) {
    const match = content.match(/<time>([^<]+)<\/time>/);
    if (match) {
        const dateStr = match[1].trim();
        const date = new Date(dateStr);
        if (!isNaN(date)) {
            return date.toISOString();
        }
    }
    return new Date().toISOString();
}

function extractKeywords(content) {
    const keywords = [];
    const matches = content.matchAll(/data-keyword="([^"]+)"/g);
    for (const match of matches) {
        if (!keywords.includes(match[1])) {
            keywords.push(match[1]);
        }
    }
    return keywords;
}

function extractImage(content, filename) {
    // Check for og:image first
    const ogMatch = content.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogMatch) return ogMatch[1];

    // Check for first image in content
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) {
        const src = imgMatch[1];
        if (src.startsWith('/')) {
            return 'https://forbidden-yoga.com' + src;
        }
        return src;
    }

    return 'https://forbidden-yoga.com/images/' + filename.replace('.html', '-featured.jpg');
}

function hasFullSEO(content) {
    return content.includes('og:description') &&
           content.includes('twitter:card') &&
           content.includes('application/ld+json') &&
           content.includes('"@type": "BlogPosting"');
}

function addFullSEO(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const filename = path.basename(filepath);

    if (hasFullSEO(content)) {
        console.log(`  [SKIP] ${filename} - already has full SEO`);
        return false;
    }

    const title = extractTitle(content);
    const subtitle = extractSubtitle(content);
    const description = extractDescription(content) || subtitle || title;
    const datePublished = extractDate(content);
    const keywords = extractKeywords(content);
    const imageUrl = extractImage(content, filename);
    const postUrl = `https://forbidden-yoga.com/posts/${filename}`;

    // Build SEO tags
    const seoTags = `
    <!-- SEO Meta Tags -->
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords.join(', ')}">
    <meta name="author" content="Michael Perin Wogenburg">
    <meta name="robots" content="index, follow">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${postUrl}">
    <meta property="og:title" content="${title} | Forbidden Yoga">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:site_name" content="Forbidden Yoga">
    <meta property="article:published_time" content="${datePublished}">
    <meta property="article:author" content="Michael Perin Wogenburg">
    <meta property="article:section" content="Tantra Yoga">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${postUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">

    <!-- Structured Data -->
    <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${title}",
  "description": "${description}",
  "image": "${imageUrl}",
  "author": {
    "@type": "Person",
    "name": "Michael Perin Wogenburg",
    "url": "https://forbidden-yoga.com",
    "jobTitle": "Tantra Master & Lineage Holder"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Forbidden Yoga",
    "logo": {
      "@type": "ImageObject",
      "url": "https://forbidden-yoga.com/forbidden-yoga-logo-white.png"
    }
  },
  "datePublished": "${datePublished}",
  "dateModified": "${datePublished}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "${postUrl}"
  },
  "keywords": ${JSON.stringify(keywords.slice(0, 10))},
  "about": [
    ${keywords.slice(0, 5).map(k => `{
      "@type": "Thing",
      "name": "${k}"
    }`).join(',\n    ')}
  ]
}
    </script>`;

    // Remove existing partial SEO tags
    content = content.replace(/<meta name="description" content="[^"]*">\n?/g, '');
    content = content.replace(/<meta name="keywords" content="[^"]*">\n?/g, '');
    content = content.replace(/<meta property="og:image" content="[^"]*"[^>]*>\n?/g, '');
    content = content.replace(/<meta property="og:[^"]*" content="[^"]*"[^>]*>\n?/g, '');
    content = content.replace(/<meta name="twitter:[^"]*" content="[^"]*"[^>]*>\n?/g, '');
    content = content.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '');

    // Insert SEO tags after canonical URL or before </head>
    if (content.includes('<link rel="canonical"')) {
        content = content.replace(
            /(<link rel="canonical"[^>]+>)/,
            `$1\n${seoTags}`
        );
    } else if (content.includes('<link rel="icon"')) {
        content = content.replace(
            /(<link rel="icon"[^>]+>)/,
            `${seoTags}\n    $1`
        );
    } else {
        content = content.replace('</head>', `${seoTags}\n</head>`);
    }

    fs.writeFileSync(filepath, content);
    console.log(`  [DONE] ${filename} - added full SEO`);
    return true;
}

// Process all posts
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));
console.log(`\nAdding Full SEO to ${files.length} blog posts...\n`);

let updated = 0;
let skipped = 0;

for (const file of files) {
    const filepath = path.join(postsDir, file);
    if (addFullSEO(filepath)) {
        updated++;
    } else {
        skipped++;
    }
}

console.log(`\n✓ Updated: ${updated} posts`);
console.log(`✓ Skipped: ${skipped} posts (already had full SEO)`);
console.log(`✓ Total: ${files.length} posts processed`);
