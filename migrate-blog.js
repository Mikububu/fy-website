// Blog Migration Script - Migrate Substack posts to local pages
// Run with: node migrate-blog.js

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Blog posts data (from blog.js)
const posts = require('./blog-posts-data.json');

// Create directories
const BLOG_DIR = './blog';
const IMAGES_DIR = './blog/images';

if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

// Download image helper
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Follow redirect
                return downloadImage(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve(filepath);
            });

            fileStream.on('error', (err) => {
                fs.unlink(filepath, () => {});
                reject(err);
            });
        }).on('error', reject);
    });
}

// Fetch HTML content from Substack
function fetchPostContent(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                resolve(data);
            });
        }).on('error', reject);
    });
}

// Extract main content from Substack HTML
function extractContent(html) {
    // Find the main article content
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (!articleMatch) return null;

    let content = articleMatch[1];

    // Remove Substack-specific elements
    content = content.replace(/<div class="subscription-widget[^>]*>[\s\S]*?<\/div>/gi, '');
    content = content.replace(/<div class="subscribe[^>]*>[\s\S]*?<\/div>/gi, '');
    content = content.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '');
    content = content.replace(/class="[^"]*substack[^"]*"/gi, '');

    // Find all images
    const images = [];
    content = content.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
        images.push(src);
        return match;
    });

    return { content, images };
}

// Create slug from title
function createSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Generate blog post HTML template
function generateBlogPostHTML(post, content, localImages) {
    // Replace Substack image URLs with local paths
    let processedContent = content;
    localImages.forEach((imageData) => {
        processedContent = processedContent.replace(imageData.original, imageData.local);
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - Forbidden Yoga</title>
    <meta name="description" content="${post.description}">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@100;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../styles.css">
    <style>
        .blog-post-page {
            background-color: #f3f2de;
            min-height: 100vh;
            padding: 80px 20px;
        }

        .blog-post-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: rgba(255, 255, 255, 0.5);
            padding: 60px 40px;
            border-radius: 12px;
        }

        .blog-post-header {
            margin-bottom: 40px;
            border-bottom: 2px solid #4a4a4a;
            padding-bottom: 30px;
        }

        .blog-post-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            font-weight: 700;
            color: #4a4a4a;
            margin: 0 0 20px 0;
            line-height: 1.2;
        }

        .blog-post-meta {
            font-family: 'Roboto', sans-serif;
            font-size: 1rem;
            font-weight: 100;
            color: #666;
        }

        .blog-post-content {
            font-family: 'Roboto', sans-serif;
            font-size: 1.1rem;
            font-weight: 100;
            color: #1a1a1a;
            line-height: 1.8;
        }

        .blog-post-content h1,
        .blog-post-content h2,
        .blog-post-content h3 {
            font-family: 'Playfair Display', serif;
            color: #4a4a4a;
            margin: 40px 0 20px 0;
        }

        .blog-post-content h1 {
            font-size: 2.5rem;
        }

        .blog-post-content h2 {
            font-size: 2rem;
        }

        .blog-post-content h3 {
            font-size: 1.5rem;
        }

        .blog-post-content p {
            margin: 20px 0;
        }

        .blog-post-content img {
            max-width: 100%;
            height: auto;
            margin: 30px 0;
            border-radius: 8px;
        }

        .blog-post-content a {
            color: #7a9999;
            text-decoration: underline;
        }

        .blog-post-content a:hover {
            color: #4a4a4a;
        }

        .blog-post-footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #4a4a4a;
        }

        .back-link {
            font-family: 'Roboto', sans-serif;
            font-size: 1rem;
            font-weight: 400;
            color: #4a4a4a;
            text-decoration: none;
            display: inline-block;
            padding: 12px 24px;
            background-color: #b8d4d4;
            border-radius: 25px;
            transition: all 0.3s ease;
        }

        .back-link:hover {
            background-color: #7a9999;
            color: #fff;
        }

        @media (max-width: 768px) {
            .blog-post-container {
                padding: 40px 30px;
            }

            .blog-post-title {
                font-size: 2rem;
            }

            .blog-post-content {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="blog-post-page">
        <div class="blog-post-container">
            <div class="blog-post-header">
                <h1 class="blog-post-title">${post.title}</h1>
                <div class="blog-post-meta">
                    <span>${post.date}</span>
                </div>
            </div>

            <div class="blog-post-content">
                ${processedContent}
            </div>

            <div class="blog-post-footer">
                <a href="../index.html#blog-section" class="back-link">← Back to all posts</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Main migration function
async function migratePost(post, index) {
    console.log(`\n[${index + 1}/43] Migrating: ${post.title}`);

    try {
        // Skip if video is detected (we'll handle manually)
        console.log(`  Fetching content from ${post.link}...`);
        const html = await fetchPostContent(post.link);

        // Check for videos
        if (html.includes('<video') || html.includes('youtube.com') || html.includes('vimeo.com')) {
            console.log(`  ⚠️  VIDEO DETECTED - Skipping for manual review`);
            return { status: 'video', post: post };
        }

        const extracted = extractContent(html);
        if (!extracted) {
            console.log(`  ❌ Failed to extract content`);
            return { status: 'failed', post: post };
        }

        // Download images
        console.log(`  Downloading ${extracted.images.length} images...`);
        const localImages = [];

        for (let i = 0; i < extracted.images.length; i++) {
            const imageUrl = extracted.images[i];
            const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
            const filename = `${createSlug(post.title)}-${i}${ext}`;
            const filepath = path.join(IMAGES_DIR, filename);

            try {
                await downloadImage(imageUrl, filepath);
                localImages.push({
                    original: imageUrl,
                    local: `./images/${filename}`
                });
                console.log(`    ✓ Downloaded image ${i + 1}/${extracted.images.length}`);
            } catch (err) {
                console.log(`    ⚠️  Failed to download image: ${err.message}`);
            }
        }

        // Generate HTML file
        const slug = createSlug(post.title);
        const htmlContent = generateBlogPostHTML(post, extracted.content, localImages);
        const htmlPath = path.join(BLOG_DIR, `${slug}.html`);

        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        console.log(`  ✓ Created blog/`${slug}.html}`);

        return { status: 'success', post: post, slug: slug };

    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        return { status: 'error', post: post, error: error.message };
    }
}

// Run migration
async function runMigration() {
    console.log('🚀 Starting blog migration from Substack...\n');
    console.log(`Total posts: ${posts.length}`);

    const results = {
        success: [],
        video: [],
        failed: [],
        errors: []
    };

    for (let i = 0; i < posts.length; i++) {
        const result = await migratePost(posts[i], i);
        results[result.status].push(result);

        // Add delay to be nice to Substack's servers
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Print summary
    console.log('\n\n📊 Migration Summary:\n');
    console.log(`✓ Success: ${results.success.length}`);
    console.log(`⚠️  Videos (manual review needed): ${results.video.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);

    if (results.video.length > 0) {
        console.log('\n\n📹 Posts with videos (need manual review):');
        results.video.forEach(r => console.log(`  - ${r.post.title}`));
    }

    // Save results to file
    fs.writeFileSync(
        './migration-results.json',
        JSON.stringify(results, null, 2),
        'utf8'
    );

    console.log('\n\n✓ Results saved to migration-results.json');
    console.log('\n✨ Migration complete!\n');
}

// Export posts data first
console.log('📝 Exporting blog posts data...');
fs.writeFileSync(
    './blog-posts-data.json',
    JSON.stringify(posts, null, 2),
    'utf8'
);

runMigration().catch(console.error);
