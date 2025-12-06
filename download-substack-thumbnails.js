const { exec } = require('child_process');
const fs = require('fs');

// Posts that need downloading
const downloads = [
    {
        slug: 'tantra-online',
        url: 'https://substackcdn.com/image/fetch/w_1200,h_630,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F409ea9af-80b6-478a-bb95-5ce2d1bcf085_572x1024.jpeg',
        ext: 'jpg'
    },
    {
        slug: 'not-a-john-baldessari-artwork',
        url: 'https://substackcdn.com/image/fetch/w_1200,h_630,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1022f368-c18c-4c97-ab8d-9bae2037ae81_5616x3744.jpeg',
        ext: 'jpg'
    },
    {
        slug: 'the-compass-of-zen',
        url: 'https://substackcdn.com/image/fetch/w_1200,h_630,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F88567992-150e-4a25-8231-eedf38183790_4000x2498.png',
        ext: 'png'
    }
];

let completed = 0;

downloads.forEach((item, index) => {
    const filename = `${item.slug}.${item.ext}`;
    const filepath = `blog-thumbnails/${filename}`;

    const cmd = `curl -L "${item.url}" -o "${filepath}"`;

    console.log(`\nDownloading ${index + 1}/${downloads.length}: ${item.slug}...`);

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`✗ Error downloading ${filename}: ${error.message}`);
        } else {
            // Check if file exists and has size
            if (fs.existsSync(filepath)) {
                const stats = fs.statSync(filepath);
                if (stats.size > 0) {
                    console.log(`✓ Downloaded ${filename} (${Math.round(stats.size / 1024)}KB)`);
                } else {
                    console.log(`✗ Downloaded ${filename} but file is empty`);
                }
            } else {
                console.log(`✗ Failed to download ${filename}`);
            }
        }

        completed++;
        if (completed === downloads.length) {
            console.log(`\n✓ Completed ${completed} downloads`);
        }
    });
});
