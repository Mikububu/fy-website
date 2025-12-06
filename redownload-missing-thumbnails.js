const https = require('https');
const fs = require('fs');
const path = require('path');

// Posts that are missing thumbnails
const postsToCheck = [
    {
        slug: 'tantra-online',
        title: 'tantra online'
    },
    {
        slug: 'not-a-john-baldessari-artwork',
        title: 'not a john baldessari artwork'
    },
    {
        slug: 'the-compass-of-zen',
        title: 'the compass of zen'
    },
    {
        slug: 'anais-nin-the-house-of-incest',
        title: 'anais nin the house of incest'
    }
];

// Read the HTML files to find the actual image URLs
postsToCheck.forEach(post => {
    const htmlPath = path.join('posts', `${post.slug}.html`);

    if (!fs.existsSync(htmlPath)) {
        console.log(`✗ HTML file not found: ${htmlPath}`);
        return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Try to find image in various patterns
    const patterns = [
        /property="og:image"\s+content="([^"]+)"/,
        /name="twitter:image"\s+content="([^"]+)"/,
        /<img[^>]+class="[^"]*post-image[^"]*"[^>]+src="([^"]+)"/,
        /substackcdn\.com\/image\/fetch\/[^"'\s]+/g
    ];

    let imageUrl = null;

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            imageUrl = match[1];
            break;
        }
    }

    if (imageUrl) {
        console.log(`\nFound image for "${post.title}":`);
        console.log(`URL: ${imageUrl}`);

        // Determine extension
        const ext = imageUrl.includes('.png') ? 'png' : 'jpg';
        const filename = `${post.slug}.${ext}`;
        const filepath = path.join('blog-thumbnails', filename);

        // Download the image
        https.get(imageUrl, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`✓ Downloaded: ${filename}`);
                });
            } else {
                console.log(`✗ Failed to download (${response.statusCode}): ${filename}`);
            }
        }).on('error', (err) => {
            console.log(`✗ Error downloading ${filename}: ${err.message}`);
        });
    } else {
        console.log(`\n✗ No image found in HTML for "${post.title}"`);
    }
});

console.log('\nSearching for images in HTML files...');
