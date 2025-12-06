const fs = require('fs');
const path = require('path');
const postsData = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));

// SEO keywords based on site focus
const baseSEO = {
    siteName: 'Forbidden Yoga',
    author: 'Michael Perin Wogenburg',
    authorTitle: 'Kundalini Yoga Teacher & Tantric Healing Practitioner',
    siteUrl: 'https://forbidden-yoga.com',
    keywords: [
        'tantra yoga',
        'kundalini awakening',
        'tantric healing',
        'sacred sexuality',
        'spiritual awakening',
        'energy healing',
        'chakra healing',
        'breathwork',
        'conscious touch',
        'embodied spirituality',
        'somatic healing',
        'sensual liberation'
    ]
};

let updated = 0;

postsData.forEach(post => {
    const filepath = path.join('posts', `${post.slug}.html`);

    if (!fs.existsSync(filepath)) {
        console.log(`✗ File not found: ${filepath}`);
        return;
    }

    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;

    // Enhanced description
    const description = post.description || `Explore ${post.title} - insights on tantra yoga, kundalini awakening, and spiritual transformation from Michael Perin Wogenburg.`;

    // Update meta description
    if (content.includes('<meta name="description"')) {
        content = content.replace(
            /<meta name="description" content="[^"]*">/,
            `<meta name="description" content="${description}">`
        );
        changed = true;
    }

    // Update og:description
    if (content.includes('property="og:description"')) {
        content = content.replace(
            /<meta property="og:description" content="[^"]*">/,
            `<meta property="og:description" content="${description}">`
        );
        changed = true;
    }

    // Update twitter:description
    if (content.includes('name="twitter:description"')) {
        content = content.replace(
            /<meta name="twitter:description" content="[^"]*">/,
            `<meta name="twitter:description" content="${description}">`
        );
        changed = true;
    }

    // Add/update keywords meta tag
    const keywords = [...baseSEO.keywords, post.title.toLowerCase(), 'forbidden yoga'].join(', ');
    if (content.includes('<meta name="keywords"')) {
        content = content.replace(
            /<met name="keywords" content="[^"]*">/,
            `<meta name="keywords" content="${keywords}">`
        );
    } else {
        // Add after description meta tag
        content = content.replace(
            /(<meta name="description"[^>]*>)/,
            `$1\n    <meta name="keywords" content="${keywords}">`
        );
    }
    changed = true;

    // Update structured data description
    if (content.includes('"description":')) {
        content = content.replace(
            /"description":\s*"[^"]*"/,
            `"description": "${description}"`
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filepath, content);
        updated++;
        console.log(`✓ Updated SEO: ${post.slug}.html`);
    }
});

console.log(`\n✓ Updated SEO for ${updated} posts`);
