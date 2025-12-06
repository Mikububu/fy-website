const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const blogPostsJson = './blog-posts.json';

console.log('Auditing all blog posts for issues...\n');

const blogPosts = JSON.parse(fs.readFileSync(blogPostsJson, 'utf8'));
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

const issues = [];

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const html = fs.readFileSync(filepath, 'utf8');
    const slug = file.replace('.html', '');
    const postIssues = [];

    // Find corresponding entry in blog-posts.json
    const blogPost = blogPosts.find(p => p.slug === slug);

    // Check for actual text content (not just HTML tags)
    const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .trim();

    // Check if post has minimal text
    if (textContent.length < 200) {
        postIssues.push(`NO_TEXT (only ${textContent.length} chars)`);
    }

    // Check for thumbnail in blog-posts.json
    if (blogPost) {
        if (!blogPost.thumbnail || blogPost.thumbnail.includes('substack')) {
            postIssues.push('NO_THUMBNAIL or SUBSTACK_THUMBNAIL');
        }
    } else {
        postIssues.push('NOT_IN_BLOG_POSTS_JSON');
    }

    // Check for images in the post
    const imageMatches = html.match(/<img[^>]+src="([^"]+)"/gi);
    const hasLocalImages = imageMatches && imageMatches.some(img => img.includes('/blog-images/'));

    if (!hasLocalImages && textContent.length > 200) {
        postIssues.push('NO_IMAGES (but has text)');
    }

    if (postIssues.length > 0) {
        issues.push({
            file: file,
            slug: slug,
            issues: postIssues,
            textLength: textContent.length,
            hasImages: hasLocalImages,
            thumbnail: blogPost ? blogPost.thumbnail : 'N/A'
        });
    }
});

// Sort by severity
issues.sort((a, b) => {
    if (a.issues.includes('NO_TEXT') && !b.issues.includes('NO_TEXT')) return -1;
    if (!a.issues.includes('NO_TEXT') && b.issues.includes('NO_TEXT')) return 1;
    return 0;
});

console.log(`Found ${issues.length} posts with issues:\n`);

issues.forEach(issue => {
    console.log(`\n${issue.file}:`);
    console.log(`  URL: https://forbidden-yoga.com/posts/${issue.slug}.html`);
    issue.issues.forEach(i => console.log(`  ⚠️  ${i}`));
    console.log(`  Text length: ${issue.textLength} chars`);
    console.log(`  Has images: ${issue.hasImages ? 'Yes' : 'No'}`);
    console.log(`  Thumbnail: ${issue.thumbnail.substring(0, 60)}...`);
});

console.log(`\n\n=== SUMMARY ===`);
const noText = issues.filter(i => i.issues.some(iss => iss.includes('NO_TEXT')));
const noThumbnail = issues.filter(i => i.issues.some(iss => iss.includes('THUMBNAIL')));
const noImages = issues.filter(i => i.issues.some(iss => iss.includes('NO_IMAGES')));

console.log(`Posts with NO TEXT: ${noText.length}`);
console.log(`Posts with NO/BAD THUMBNAIL: ${noThumbnail.length}`);
console.log(`Posts with NO IMAGES: ${noImages.length}`);
