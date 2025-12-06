const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const postsDir = './posts';
const blogPostsJsonPath = './blog-posts.json';
const imageMapPath = './image-map.json';
const defaultThumb = '/michael-perin-wogenburg-kundalini-teacher.png';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║      INTELLIGENT BLOG SEO & THUMBNAIL OPTIMIZATION           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Load data
const imageMap = JSON.parse(fs.readFileSync(imageMapPath, 'utf8'));
const blogPosts = JSON.parse(fs.readFileSync(blogPostsJsonPath, 'utf8'));

// Content analysis categories
const categories = {
    tantra: ['tantra', 'tantric', 'shakti', 'shiva', 'kundalini', 'sexual', 'sensual', 'forbidden', 'mahavidya', 'nitya', 'puja', 'kriya', 'sparsha'],
    advaita: ['advaita', 'vedanta', 'nondual', 'awareness', 'consciousness', 'self-inquiry', 'ramana', 'nisargadatta', 'atman', 'brahman'],
    yoga: ['yoga', 'asana', 'pranayama', 'meditation', 'sadhana', 'practice', 'yogi', 'hatha', 'raja', 'bhakti'],
    science: ['physics', 'quantum', 'string theory', 'science', 'research', 'study', 'experiment', 'theory', 'scientific'],
    psychology: ['psychology', 'therapy', 'healing', 'trauma', 'mental', 'emotional', 'psyche', 'shadow', 'jung', 'freud'],
    philosophy: ['philosophy', 'philosophical', 'existence', 'reality', 'truth', 'wisdom', 'knowledge', 'sankhya', 'kapila'],
    spirituality: ['spiritual', 'divine', 'sacred', 'enlightenment', 'awakening', 'liberation', 'moksha', 'samadhi'],
    religion: ['religion', 'buddhism', 'hinduism', 'christianity', 'islam', 'faith', 'belief', 'god', 'deity']
};

// Analyze content to determine primary topics
function analyzeContent(html, title, description) {
    const text = (html + ' ' + title + ' ' + description).toLowerCase();
    const scores = {};

    Object.keys(categories).forEach(category => {
        scores[category] = 0;
        categories[category].forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) {
                scores[category] += matches.length;
            }
        });
    });

    // Sort by score
    const sorted = Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1]);

    return sorted.length > 0 ? sorted.map(([cat, _]) => cat) : ['spirituality'];
}

// Generate intelligent SEO metadata
function generateSEO(title, content, topics) {
    const primary = topics[0] || 'spirituality';
    const secondary = topics[1] || topics[0];

    // Smart keyword generation based on topics
    const keywordSets = {
        tantra: 'tantric practices, kundalini awakening, sacred sexuality, tantric yoga, spiritual transformation',
        advaita: 'non-dual awareness, self-inquiry, consciousness, vedanta philosophy, spiritual awakening',
        yoga: 'yoga practice, meditation, pranayama, spiritual discipline, yogic philosophy',
        science: 'scientific understanding, research, quantum physics, theoretical framework, scientific exploration',
        psychology: 'psychological healing, therapy, mental health, emotional wellbeing, shadow work',
        philosophy: 'philosophical inquiry, wisdom traditions, existential questions, spiritual philosophy',
        spirituality: 'spiritual practice, consciousness, awakening, transformation, inner journey',
        religion: 'religious traditions, faith practices, spiritual beliefs, sacred wisdom'
    };

    // Generate description hints based on content
    const descHints = {
        tantra: 'Explore authentic tantric practices and sacred sexuality with Michael Perin Wogenburg.',
        advaita: 'Dive into non-dual awareness and the wisdom of Advaita Vedanta.',
        yoga: 'Ancient yogic practices and meditation techniques for modern practitioners.',
        science: 'Where ancient wisdom meets modern science and theoretical physics.',
        psychology: 'Integrating psychological healing with spiritual transformation.',
        philosophy: 'Philosophical explorations of consciousness, reality, and human experience.',
        spirituality: 'Authentic spiritual practices for transformation and awakening.',
        religion: 'Exploring wisdom from diverse religious and spiritual traditions.'
    };

    return {
        keywords: `${keywordSets[primary]}, ${keywordSets[secondary] || keywordSets[primary]}, Michael Perin Wogenburg, Forbidden Yoga`,
        descriptionHint: descHints[primary],
        topics: topics
    };
}

// Check if post has proper thumbnail
function checkThumbnail(slug, postData) {
    const issues = [];

    if (!postData.image) {
        issues.push('No thumbnail image');
        return { hasIssues: true, issues, suggestion: defaultThumb };
    }

    // Check if thumbnail is still Substack URL
    if (postData.image.includes('substack')) {
        issues.push('Thumbnail still points to Substack');

        // Try to find local image from image map
        if (imageMap[slug] && imageMap[slug].length > 0) {
            return {
                hasIssues: true,
                issues,
                suggestion: imageMap[slug][0].local
            };
        } else {
            return {
                hasIssues: true,
                issues,
                suggestion: defaultThumb
            };
        }
    }

    return { hasIssues: false, issues: [] };
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));
const seoReport = [];
const thumbnailIssues = [];

console.log(`📊 Analyzing ${files.length} blog posts for intelligent SEO...\n`);

files.forEach((file, index) => {
    const slug = file.replace('.html', '');
    const filepath = path.join(postsDir, file);
    const html = fs.readFileSync(filepath, 'utf8');

    // Extract metadata
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const keywordsMatch = html.match(/<meta name="keywords" content="([^"]+)"/);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);

    const title = titleMatch ? titleMatch[1] : '';
    const description = descMatch ? descMatch[1] : '';
    const currentKeywords = keywordsMatch ? keywordsMatch[1] : '';
    const h1 = h1Match ? h1Match[1] : '';

    // Extract post content for analysis
    const contentMatch = html.match(/<div class="post-content">([\s\S]*?)<\/div>/);
    const content = contentMatch ? contentMatch[1] : '';

    // Analyze topics
    const topics = analyzeContent(content, title, description);
    const seo = generateSEO(title, content, topics);

    // Check headline consistency
    const headlineIssues = [];
    if (title.toLowerCase() !== h1.toLowerCase() && !title.includes(h1) && !h1.includes(title.split('|')[0].trim())) {
        headlineIssues.push(`Title/H1 mismatch: "${title}" vs "${h1}"`);
    }

    // Check description length (120-160 optimal for SEO)
    if (description.length < 120) {
        headlineIssues.push(`Description too short (${description.length} chars, optimal: 120-160)`);
    } else if (description.length > 160) {
        headlineIssues.push(`Description too long (${description.length} chars, optimal: 120-160)`);
    }

    // Check keywords quality
    const hasTopicKeywords = topics.some(topic =>
        currentKeywords.toLowerCase().includes(topic)
    );
    if (!hasTopicKeywords) {
        headlineIssues.push(`Keywords don't match content topics: ${topics.join(', ')}`);
    }

    // Find corresponding blog-posts.json entry
    const postData = blogPosts.find(p =>
        p.link && (p.link.includes(slug) || p.url === `/posts/${slug}.html`)
    );

    // Check thumbnail
    if (postData) {
        const thumbCheck = checkThumbnail(slug, postData);
        if (thumbCheck.hasIssues) {
            thumbnailIssues.push({
                slug,
                issues: thumbCheck.issues,
                suggestion: thumbCheck.suggestion
            });
        }
    }

    if (headlineIssues.length > 0 || topics.length > 0) {
        seoReport.push({
            file,
            title,
            h1,
            description: description.substring(0, 80) + '...',
            currentKeywords: currentKeywords.substring(0, 60) + '...',
            topics: topics.slice(0, 3),
            suggestedKeywords: seo.keywords,
            descriptionHint: seo.descriptionHint,
            issues: headlineIssues
        });
    }

    // Progress
    const progress = Math.floor((index + 1) / files.length * 100);
    const bar = '█'.repeat(Math.floor(progress / 2)) + '░'.repeat(50 - Math.floor(progress / 2));
    process.stdout.write(`\r[${bar}] ${progress}% | ${file.padEnd(50)}`);
});

console.log('\n\n');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                    SEO ANALYSIS RESULTS                       ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Group by topic
const byTopic = {};
seoReport.forEach(post => {
    const topic = post.topics[0];
    if (!byTopic[topic]) byTopic[topic] = [];
    byTopic[topic].push(post);
});

console.log('📊 Content Distribution:\n');
Object.entries(byTopic).forEach(([topic, posts]) => {
    console.log(`  ${topic.toUpperCase()}: ${posts.length} posts`);
});

console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                    SEO ISSUES DETECTED                        ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const postsWithIssues = seoReport.filter(p => p.issues.length > 0);
if (postsWithIssues.length > 0) {
    postsWithIssues.slice(0, 10).forEach(post => {
        console.log(`📄 ${post.file}`);
        console.log(`   Topics: ${post.topics.join(', ')}`);
        post.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
        console.log(`   💡 Suggested keywords: ${post.suggestedKeywords}`);
        console.log();
    });
    if (postsWithIssues.length > 10) {
        console.log(`   ... and ${postsWithIssues.length - 10} more posts with SEO issues\n`);
    }
} else {
    console.log('✅ All posts have good SEO!\n');
}

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                  THUMBNAIL ISSUES                             ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

if (thumbnailIssues.length > 0) {
    thumbnailIssues.forEach(({ slug, issues, suggestion }) => {
        console.log(`🖼️  ${slug}`);
        issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
        console.log(`   💡 Suggested: ${suggestion}`);
        console.log();
    });
} else {
    console.log('✅ All thumbnails are properly configured!\n');
}

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                          SUMMARY                              ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log(`Total posts analyzed: ${files.length}`);
console.log(`Posts with SEO issues: ${postsWithIssues.length}`);
console.log(`Posts with thumbnail issues: ${thumbnailIssues.length}`);
console.log(`\nContent categories found: ${Object.keys(byTopic).length}`);
console.log(`Primary topics: ${Object.keys(byTopic).join(', ')}\n`);

// Save detailed report
fs.writeFileSync('seo-analysis-report.json', JSON.stringify({
    posts: seoReport,
    thumbnailIssues,
    summary: {
        total: files.length,
        seoIssues: postsWithIssues.length,
        thumbnailIssues: thumbnailIssues.length,
        categories: byTopic
    }
}, null, 2));

console.log('📄 Detailed report saved to: seo-analysis-report.json\n');
console.log('═══════════════════════════════════════════════════════════════\n');
