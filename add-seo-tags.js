const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://forbidden-yoga.com';
const AUTHOR_NAME = 'Michael Perin Wogenburg';

// Load posts data for metadata
const postsData = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));

// Create a map of slug to post data for quick lookup
const postsMap = {};
postsData.forEach(post => {
  postsMap[post.slug] = post;
});

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].replace(' | Forbidden Yoga', '').trim() : '';
}

function extractDescription(html) {
  const match = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  return match ? match[1] : '';
}

function extractDate(html) {
  // Try to extract date from <time> tag
  const timeMatch = html.match(/<time>([^<]+)<\/time>/i);
  if (timeMatch) {
    return parseDate(timeMatch[1]);
  }
  return new Date().toISOString();
}

function parseDate(dateStr) {
  // Parse dates like "March 17, 2025" or "Nov 24, 2024"
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'June': '06', 'July': '07', 'August': '08', 'September': '09',
    'October': '10', 'November': '11', 'December': '12'
  };

  // Try "Month DD, YYYY" format
  const match = dateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
  if (match) {
    const month = months[match[1]] || '01';
    const day = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  return new Date().toISOString();
}

function extractFirstImage(html) {
  // Look for image in the content
  const imgMatch = html.match(/src="(https:\/\/substackcdn\.com\/image\/fetch\/[^"]+)"/i);
  if (imgMatch) {
    // Clean up the URL and get a larger version
    let imgUrl = imgMatch[1];
    // Replace small sizes with larger ones for OG image
    imgUrl = imgUrl.replace(/w_\d+,h_\d+,c_fill/, 'w_1200,h_630,c_fill');
    imgUrl = imgUrl.replace(/w_\d+,c_limit/, 'w_1200,c_limit');
    return imgUrl;
  }
  // Default fallback image
  return `${SITE_URL}/forbidden-yoga-logo-white.png`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateSeoTags(slug, title, description, date, image, url) {
  const cleanTitle = title.replace(/ \| Forbidden Yoga$/, '').trim();
  const cleanDescription = description.replace(/&#\d+;/g, '').trim();
  const isoDate = date;

  return `
    <!-- Canonical URL -->
    <link rel="canonical" href="${url}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${escapeHtml(cleanTitle)} | Forbidden Yoga">
    <meta property="og:description" content="${escapeHtml(cleanDescription)}">
    <meta property="og:image" content="${image}">
    <meta property="og:site_name" content="Forbidden Yoga">
    <meta property="article:published_time" content="${isoDate}">
    <meta property="article:author" content="${AUTHOR_NAME}">
    <meta property="article:section" content="Tantra Yoga">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${escapeHtml(cleanTitle)}">
    <meta name="twitter:description" content="${escapeHtml(cleanDescription)}">
    <meta name="twitter:image" content="${image}">`;
}

function generateStructuredData(slug, title, description, date, image, url) {
  const cleanTitle = title.replace(/ \| Forbidden Yoga$/, '').trim();
  const cleanDescription = description.replace(/&#\d+;/g, '').trim();

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": cleanTitle,
    "description": cleanDescription,
    "image": image,
    "author": {
      "@type": "Person",
      "name": AUTHOR_NAME,
      "url": SITE_URL,
      "jobTitle": "Kundalini Yoga Teacher & Tantric Healing Practitioner"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Forbidden Yoga",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/forbidden-yoga-logo-white.png`
      }
    },
    "datePublished": date,
    "dateModified": date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "keywords": "tantra yoga, kundalini, spiritual practice, forbidden yoga, tantric healing"
  };

  return `
    <!-- Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
    </script>`;
}

function hasSeoTags(html) {
  return html.includes('og:type') || html.includes('application/ld+json');
}

function addSeoToPost(filePath) {
  const fileName = path.basename(filePath, '.html');
  const html = fs.readFileSync(filePath, 'utf8');

  // Skip if already has SEO tags
  if (hasSeoTags(html)) {
    console.log(`Skipping ${fileName} - already has SEO tags`);
    return false;
  }

  // Get metadata from posts-data.json if available
  const postData = postsMap[fileName];

  // Extract or use existing data
  const title = postData?.title || extractTitle(html);
  const description = postData?.description || extractDescription(html);
  const date = postData?.date || extractDate(html);
  const image = postData?.image || extractFirstImage(html);
  const url = `${SITE_URL}/posts/${fileName}.html`;

  // Generate SEO tags
  const seoTags = generateSeoTags(fileName, title, description, date, image, url);
  const structuredData = generateStructuredData(fileName, title, description, date, image, url);

  // Insert SEO tags before </head>
  let updatedHtml = html.replace(
    /<\/head>/i,
    `${seoTags}${structuredData}
</head>`
  );

  // Also add favicon if not present
  if (!updatedHtml.includes('rel="icon"')) {
    updatedHtml = updatedHtml.replace(
      /<\/head>/i,
      `    <link rel="icon" type="image/png" href="../favicon.png">
</head>`
    );
  }

  fs.writeFileSync(filePath, updatedHtml);
  console.log(`Updated ${fileName} with SEO tags`);
  return true;
}

// Process all posts
const postsDir = './posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));

let updated = 0;
let skipped = 0;

files.forEach(file => {
  const filePath = path.join(postsDir, file);
  if (addSeoToPost(filePath)) {
    updated++;
  } else {
    skipped++;
  }
});

console.log(`\nSEO Update Complete!`);
console.log(`Updated: ${updated} posts`);
console.log(`Skipped: ${skipped} posts (already had SEO tags)`);
