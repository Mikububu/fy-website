const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const blogImagesDir = './blog-images';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║     FIXING ALL IMAGE EXTENSION MISMATCHES                     ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Get all existing images and their extensions
const existingImages = new Map();
fs.readdirSync(blogImagesDir).forEach(file => {
    const match = file.match(/^(.+)\.(jpg|jpeg|png|gif|webp)$/i);
    if (match) {
        const baseName = match[1];
        const ext = match[2].toLowerCase();
        if (!existingImages.has(baseName)) {
            existingImages.set(baseName, []);
        }
        existingImages.get(baseName).push(ext);
    }
});

// Scan all posts for broken image references
const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.html'));

let totalFixed = 0;
const unfixable = [];

postFiles.forEach(postFile => {
    const htmlPath = path.join(postsDir, postFile);
    let html = fs.readFileSync(htmlPath, 'utf8');
    let changed = false;
    const slug = postFile.replace('.html', '');

    // Find all /blog-images/ references
    const imageRefs = html.match(/\/blog-images\/([^"'\s]+\.(jpg|jpeg|png|gif|webp))/gi) || [];
    const uniqueRefs = [...new Set(imageRefs)];

    uniqueRefs.forEach(ref => {
        const fileName = ref.replace('/blog-images/', '');
        const match = fileName.match(/^(.+)\.(jpg|jpeg|png|gif|webp)$/i);
        if (!match) return;

        const baseName = match[1];
        const refExt = match[2].toLowerCase();
        const filePath = path.join(blogImagesDir, fileName);

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            // File doesn't exist - check if there's a version with different extension
            const available = existingImages.get(baseName);
            if (available && available.length > 0) {
                // Found alternative extension
                const newExt = available[0]; // Use the first available
                const newRef = `/blog-images/${baseName}.${newExt}`;

                // Replace in HTML
                const regex = new RegExp(ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                html = html.replace(regex, newRef);
                console.log(`✓ ${slug}: ${baseName}.${refExt} → .${newExt}`);
                changed = true;
                totalFixed++;
            } else {
                // No alternative found
                unfixable.push({ post: slug, image: fileName });
            }
        }
    });

    if (changed) {
        fs.writeFileSync(htmlPath, html);
    }
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                         SUMMARY');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`✓ Fixed ${totalFixed} image references\n`);

if (unfixable.length > 0) {
    console.log(`✗ ${unfixable.length} images could not be fixed (no alternative found):`);
    unfixable.forEach(u => {
        console.log(`   • ${u.post}: ${u.image}`);
    });
}

console.log('\nRun "node audit-posts.js" to verify.\n');
