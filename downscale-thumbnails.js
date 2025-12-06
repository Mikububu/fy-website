const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const thumbnailsDir = './blog-thumbnails';
const maxWidth = 600; // Max width for thumbnails
const maxHeight = 600; // Max height for thumbnails

console.log('Downscaling blog thumbnails to optimize file sizes...\n');

const files = fs.readdirSync(thumbnailsDir).filter(f =>
    f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
);

let processed = 0;
let skipped = 0;

files.forEach(file => {
    const filepath = path.join(thumbnailsDir, file);

    try {
        // Get current dimensions
        const output = execSync(`sips -g pixelWidth -g pixelHeight "${filepath}"`).toString();
        const widthMatch = output.match(/pixelWidth:\s*(\d+)/);
        const heightMatch = output.match(/pixelHeight:\s*(\d+)/);

        if (!widthMatch || !heightMatch) {
            console.log(`  ⊘ ${file}: Could not read dimensions`);
            skipped++;
            return;
        }

        const width = parseInt(widthMatch[1]);
        const height = parseInt(heightMatch[1]);

        // Check if image needs downscaling
        if (width <= maxWidth && height <= maxHeight) {
            console.log(`  ⊘ ${file}: Already optimized (${width}x${height})`);
            skipped++;
            return;
        }

        // Calculate new dimensions maintaining aspect ratio
        let newWidth = width;
        let newHeight = height;

        if (width > maxWidth) {
            newWidth = maxWidth;
            newHeight = Math.round((height * maxWidth) / width);
        }

        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = Math.round((width * maxHeight) / height);
        }

        // Downscale the image
        execSync(`sips -z ${newHeight} ${newWidth} "${filepath}"`, { stdio: 'pipe' });

        console.log(`  ✓ ${file}: ${width}x${height} → ${newWidth}x${newHeight}`);
        processed++;

    } catch (err) {
        console.log(`  ✗ ${file}: Error - ${err.message}`);
        skipped++;
    }
});

console.log(`\n✓ Downscaled ${processed} thumbnails`);
console.log(`⊘ Skipped ${skipped} thumbnails (already optimized)`);
