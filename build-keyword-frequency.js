#!/usr/bin/env node

// Scans all blog posts and builds a keyword frequency map
// Keywords appearing in 2+ posts are "shared", those in only 1 post are "unique"

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, 'posts');
const OUTPUT_FILE = path.join(__dirname, 'keyword-frequency.json');

function extractKeywordsFromHTML(html) {
    const keywords = [];
    const regex = /<span[^>]*data-keyword="([^"]+)"[^>]*>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
        keywords.push(match[1]);
    }

    return keywords;
}

function buildKeywordFrequencyMap() {
    const files = fs.readdirSync(POSTS_DIR)
        .filter(f => f.endsWith('.html') && !f.startsWith('._'));

    const keywordMap = {}; // keyword -> array of post filenames

    files.forEach(file => {
        const filePath = path.join(POSTS_DIR, file);
        const html = fs.readFileSync(filePath, 'utf8');
        const keywords = extractKeywordsFromHTML(html);

        keywords.forEach(keyword => {
            if (!keywordMap[keyword]) {
                keywordMap[keyword] = [];
            }
            if (!keywordMap[keyword].includes(file)) {
                keywordMap[keyword].push(file);
            }
        });
    });

    // Build frequency data
    const frequencyData = {
        shared: [], // keywords appearing in 2+ posts
        unique: [], // keywords appearing in only 1 post
        map: keywordMap,
        totalPosts: files.length,
        generatedAt: new Date().toISOString()
    };

    Object.keys(keywordMap).forEach(keyword => {
        const postCount = keywordMap[keyword].length;
        if (postCount >= 2) {
            frequencyData.shared.push({
                keyword: keyword,
                count: postCount,
                posts: keywordMap[keyword]
            });
        } else {
            frequencyData.unique.push({
                keyword: keyword,
                posts: keywordMap[keyword]
            });
        }
    });

    // Sort shared keywords by frequency (descending)
    frequencyData.shared.sort((a, b) => b.count - a.count);

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(frequencyData, null, 2));

    console.log('Keyword Frequency Analysis Complete');
    console.log('===================================');
    console.log(`Total posts scanned: ${files.length}`);
    console.log(`Total unique keywords: ${Object.keys(keywordMap).length}`);
    console.log(`Shared keywords (2+ posts): ${frequencyData.shared.length}`);
    console.log(`Unique keywords (1 post only): ${frequencyData.unique.length}`);
    console.log('');
    console.log('Top 10 most shared keywords:');
    frequencyData.shared.slice(0, 10).forEach((item, i) => {
        console.log(`  ${i + 1}. "${item.keyword}" - ${item.count} posts`);
    });
    console.log('');
    console.log(`Output written to: ${OUTPUT_FILE}`);
}

buildKeywordFrequencyMap();
