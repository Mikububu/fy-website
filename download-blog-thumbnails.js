const fs = require('fs');
const https = require('https');
const path = require('path');

// Read posts-data.json
const postsData = JSON.parse(fs.readFileSync('posts-data.json', 'utf8'));

// Create thumbnails directory if it doesn't exist
const thumbnailsDir = './blog-thumbnails';
if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Function to download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`✓ Downloaded: ${path.basename(filepath)}`);
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Download all thumbnails
async function downloadAllThumbnails() {
    let downloaded = 0;
    let skipped = 0;

    for (const post of postsData) {
        if (!post.image) {
            console.log(`⊘ No image for: ${post.title}`);
            skipped++;
            continue;
        }

        const ext = post.image.includes('.png') ? 'png' : 'jpg';
        const filename = `${post.slug}.${ext}`;
        const filepath = path.join(thumbnailsDir, filename);

        // Skip if already exists
        if (fs.existsSync(filepath)) {
            console.log(`→ Already exists: ${filename}`);
            skipped++;
            continue;
        }

        try {
            await downloadImage(post.image, filepath);
            downloaded++;
        } catch (error) {
            console.error(`✗ Error downloading ${post.title}:`, error.message);
        }
    }

    console.log(`\n✓ Downloaded: ${downloaded}`);
    console.log(`→ Skipped: ${skipped}`);
    console.log(`Total posts: ${postsData.length}`);
}

downloadAllThumbnails();
