const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

// Stop words to exclude
const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
    'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
    'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
    'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
    'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
    'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
    'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
    'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are',
    'been', 'has', 'had', 'were', 'said', 'did', 'having', 'may', 'such', 'being', 'through',
    'where', 'much', 'should', 'very', 'each', 'those', 'both', 'during', 'without', 'however',
    'while', 'why', 'does', 'many', 'still', 'might', 'must', 'something', 'own', 'same', 'often',
    'never', 'always', 'every', 'things', 'thing', 'here', 'become', 'becomes', 'became', 'becoming'
]);

// Tantra/yoga specific terms that should always be included
const importantTerms = new Set([
    'tantra', 'yoga', 'kundalini', 'chakra', 'meditation', 'spiritual', 'divine', 'consciousness',
    'energy', 'practice', 'sacred', 'healing', 'awakening', 'transformation', 'embodiment',
    'breath', 'sensual', 'liberation', 'devotion', 'enlightenment', 'ritual', 'initiation',
    'goddess', 'shiva', 'shakti', 'puja', 'mantra', 'mudra', 'nadi', 'prana', 'samadhi',
    'dharma', 'karma', 'samsara', 'moksha', 'bhakti', 'jnana', 'raja', 'hatha', 'kriya',
    'tantra yoga', 'kundalini yoga', 'sacred sexuality', 'tantric healing', 'spiritual awakening',
    'energy work', 'chakra healing', 'breathwork', 'meditation practice', 'conscious touch',
    'somatic', 'embodied', 'intimacy', 'presence', 'mindfulness', 'retreat', 'workshop'
]);

const wordCounts = {};
const phraseCounts = {};

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let content = fs.readFileSync(filepath, 'utf8');

    // Remove HTML tags
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    content = content.replace(/<[^>]+>/g, ' ');
    content = content.replace(/&[a-z]+;/gi, ' ');

    // Convert to lowercase
    content = content.toLowerCase();

    // Extract words
    const words = content.match(/\b[a-z]{3,}\b/g) || [];

    words.forEach(word => {
        if (!stopWords.has(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    });

    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
            phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        }
    }

    // Extract 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1]) && !stopWords.has(words[i + 2])) {
            phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        }
    }
});

// Sort and filter
const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([word, count]) => count >= 5 || importantTerms.has(word))
    .slice(0, 100);

const sortedPhrases = Object.entries(phraseCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([phrase, count]) => count >= 3)
    .slice(0, 50);

console.log('\n=== TOP 50 KEYWORDS ===\n');
sortedWords.slice(0, 50).forEach(([word, count], i) => {
    console.log(`${i + 1}. ${word} (${count})`);
});

console.log('\n=== TOP 30 PHRASES ===\n');
sortedPhrases.slice(0, 30).forEach(([phrase, count], i) => {
    console.log(`${i + 1}. ${phrase} (${count})`);
});

// Save for tag cloud
const keywordsData = {
    words: sortedWords.map(([word, count]) => ({ text: word, count })),
    phrases: sortedPhrases.map(([phrase, count]) => ({ text: phrase, count }))
};

fs.writeFileSync('keywords-data.json', JSON.stringify(keywordsData, null, 2));
console.log('\n✓ Saved keywords-data.json');
