const fs = require('fs');
const path = require('path');

const postsDir = './posts';

console.log('Optimizing image SEO for all blog posts...\n');

// Extract images and their context from HTML
function extractImagesWithContext(html, filename) {
    const images = [];

    // Match image tags and their surrounding context
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
        const imgTag = match[0];
        const src = match[1];

        // Get the position of this image in the HTML
        const position = match.index;

        // Look for caption text after the image (within 500 characters)
        const afterImg = html.substring(position, position + 500);
        const captionMatch = afterImg.match(/<p><em>([^<]+)<\/em><\/p>/);
        const caption = captionMatch ? captionMatch[1] : '';

        // Extract current alt text
        const altMatch = imgTag.match(/alt="([^"]*)"/);
        const currentAlt = altMatch ? altMatch[1] : '';

        // Check if alt is empty or null in data-attrs
        const hasEmptyAlt = currentAlt === '' || imgTag.includes('"alt":null');

        images.push({
            src,
            imgTag,
            caption,
            currentAlt,
            hasEmptyAlt,
            filename
        });
    }

    return images;
}

// Generate meaningful alt text based on context
function generateAltText(image, postTitle) {
    // If there's a caption, use it as the base for alt text
    if (image.caption) {
        let alt = image.caption.trim();

        // Clean up the caption for alt text
        alt = alt.replace(/\.\.\.$/, ''); // Remove trailing ellipsis
        alt = alt.replace(/^3D rendering - /, 'Tantric artwork: ');
        alt = alt.replace(/^A traditional one looks like that:/, 'Traditional tantric art');

        // Add context if it's a Forbidden Yoga related image
        if (!alt.toLowerCase().includes('tantra') &&
            !alt.toLowerCase().includes('yoga') &&
            !alt.toLowerCase().includes('retreat')) {
            alt = `${alt} - Forbidden Yoga`;
        }

        return alt;
    }

    // If no caption, generate based on post title and image filename
    const imgFilename = path.basename(image.src);

    // Extract meaningful parts from filename
    if (imgFilename.includes('img-0')) {
        return `${postTitle} - Featured image for Forbidden Yoga tantric practice`;
    } else if (imgFilename.includes('avatar')) {
        return 'Michael Perin Wogenburg\'s avatar';
    } else {
        return `Illustration for ${postTitle} - Tantric yoga and spiritual practice`;
    }
}

// Update HTML with new alt tags
function updateImageAltTags(html, images, postTitle) {
    let updatedHtml = html;

    images.forEach(image => {
        if (image.hasEmptyAlt) {
            const newAlt = generateAltText(image, postTitle);

            // Replace the image tag with updated alt text
            let newImgTag = image.imgTag;

            // If alt="" or alt attribute exists
            if (newImgTag.includes('alt="')) {
                newImgTag = newImgTag.replace(/alt="[^"]*"/, `alt="${newAlt}"`);
            } else {
                // Add alt attribute before the closing >
                newImgTag = newImgTag.replace(/>$/, ` alt="${newAlt}">`);
            }

            updatedHtml = updatedHtml.replace(image.imgTag, newImgTag);
        }
    });

    return updatedHtml;
}

// Extract post title from HTML
function extractPostTitle(html) {
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (titleMatch) {
        return titleMatch[1].trim();
    }

    const metaTitleMatch = html.match(/<title>([^<|]+)/);
    if (metaTitleMatch) {
        return metaTitleMatch[1].trim();
    }

    return 'Forbidden Yoga';
}

// Process all blog posts
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
let updatedCount = 0;
let totalImages = 0;
let updatedImages = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    const html = fs.readFileSync(filepath, 'utf8');

    const postTitle = extractPostTitle(html);
    const images = extractImagesWithContext(html, file);

    totalImages += images.length;
    const emptyAltImages = images.filter(img => img.hasEmptyAlt);

    if (emptyAltImages.length > 0) {
        console.log(`\n📄 ${file}`);
        console.log(`   Title: ${postTitle}`);
        console.log(`   Found ${emptyAltImages.length} images with empty alt tags`);

        emptyAltImages.forEach(img => {
            const newAlt = generateAltText(img, postTitle);
            console.log(`   • "${img.src}"`);
            console.log(`     Caption: "${img.caption}"`);
            console.log(`     New alt: "${newAlt}"`);
        });

        const updatedHtml = updateImageAltTags(html, images, postTitle);

        if (updatedHtml !== html) {
            fs.writeFileSync(filepath, updatedHtml);
            updatedCount++;
            updatedImages += emptyAltImages.length;
            console.log(`   ✓ Updated ${emptyAltImages.length} image alt tags`);
        }
    }
});

console.log(`\n\n✅ Summary:`);
console.log(`   Total blog posts: ${files.length}`);
console.log(`   Total images found: ${totalImages}`);
console.log(`   Images updated: ${updatedImages}`);
console.log(`   Posts updated: ${updatedCount}`);
