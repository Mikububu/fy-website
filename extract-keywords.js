const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

// Comprehensive stop words to exclude meaningless filler words
const stopWords = new Set([
    // Basic pronouns and articles
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
    'never', 'always', 'every', 'things', 'thing', 'here', 'become', 'becomes', 'became', 'becoming',

    // Additional filler words that are meaningless
    'rather', 'more', 'between', 'someone', 'everything', 'nothing', 'anything', 'everyone',
    'anyone', 'nobody', 'somebody', 'anybody', 'somewhere', 'anywhere', 'everywhere', 'nowhere',
    'maybe', 'perhaps', 'really', 'actually', 'basically', 'literally', 'generally', 'usually',
    'especially', 'particularly', 'probably', 'possibly', 'certainly', 'definitely', 'absolutely',
    'completely', 'totally', 'entirely', 'quite', 'rather', 'somewhat', 'fairly', 'pretty',
    'almost', 'nearly', 'barely', 'hardly', 'scarcely', 'merely', 'simply', 'purely',
    'already', 'yet', 'still', 'again', 'once', 'twice', 'thrice', 'times',
    'too', 'enough', 'less', 'least', 'more', 'most', 'better', 'best', 'worse', 'worst',
    'before', 'since', 'until', 'unless', 'although', 'though', 'whether', 'either', 'neither',
    'nor', 'nor', 'but', 'yet', 'for', 'so', 'because', 'since', 'unless', 'while',
    'whereas', 'wherever', 'whenever', 'whatever', 'whichever', 'whoever', 'whomever',
    'themselves', 'ourselves', 'yourselves', 'myself', 'yourself', 'himself', 'herself', 'itself',
    'another', 'others', 'neither', 'either', 'each', 'few', 'several', 'none', 'some', 'any',
    'lot', 'lots', 'bit', 'bits', 'piece', 'pieces', 'part', 'parts', 'whole', 'half', 'third',
    'various', 'different', 'similar', 'certain', 'specific', 'particular', 'general', 'common',
    'special', 'normal', 'regular', 'usual', 'unusual', 'typical', 'unique', 'rare',
    'kind', 'type', 'sort', 'form', 'style', 'manner', 'mode', 'method', 'means',
    'sense', 'point', 'case', 'fact', 'matter', 'issue', 'question', 'problem', 'solution',
    'idea', 'thought', 'concept', 'notion', 'understanding', 'knowledge', 'information',
    'yes', 'yeah', 'yep', 'yup', 'nope', 'nah', 'okay', 'ok', 'alright', 'fine',
    'thank', 'thanks', 'please', 'sorry', 'excuse', 'pardon', 'hello', 'goodbye', 'bye',
    'going', 'coming', 'doing', 'making', 'getting', 'taking', 'giving', 'looking', 'seeing',
    'found', 'find', 'finding', 'tell', 'told', 'telling', 'ask', 'asked', 'asking',
    'called', 'call', 'calling', 'need', 'needed', 'needing', 'seem', 'seemed', 'seeming',
    'try', 'tried', 'trying', 'keep', 'kept', 'keeping', 'let', 'lets', 'letting',
    'put', 'puts', 'putting', 'set', 'sets', 'setting', 'start', 'started', 'starting',
    'end', 'ended', 'ending', 'stop', 'stopped', 'stopping', 'begin', 'began', 'beginning',
    'continue', 'continued', 'continuing', 'happen', 'happened', 'happening', 'change', 'changed', 'changing',
    'turn', 'turned', 'turning', 'move', 'moved', 'moving', 'bring', 'brought', 'bringing',
    'leave', 'left', 'leaving', 'stay', 'stayed', 'staying', 'remain', 'remained', 'remaining',
    'allow', 'allowed', 'allowing', 'help', 'helped', 'helping', 'seem', 'seems', 'seemed',
    'appear', 'appeared', 'appearing', 'follow', 'followed', 'following', 'provide', 'provided', 'providing',
    'include', 'included', 'including', 'feel', 'felt', 'feeling', 'show', 'showed', 'showing',
    'mean', 'meant', 'meaning', 'add', 'added', 'adding', 'created', 'create', 'creating',
    'cause', 'caused', 'causing', 'live', 'lived', 'living', 'play', 'played', 'playing',
    'run', 'ran', 'running', 'read', 'reading', 'write', 'wrote', 'writing', 'stand', 'stood', 'standing',
    'sit', 'sat', 'sitting', 'walk', 'walked', 'walking', 'talk', 'talked', 'talking',
    'speak', 'spoke', 'speaking', 'hear', 'heard', 'hearing', 'listen', 'listened', 'listening',
    'watch', 'watched', 'watching', 'open', 'opened', 'opening', 'close', 'closed', 'closing',
    'cut', 'cutting', 'break', 'broke', 'breaking', 'build', 'built', 'building',
    'carry', 'carried', 'carrying', 'hold', 'held', 'holding', 'reach', 'reached', 'reaching',
    'send', 'sent', 'sending', 'receive', 'received', 'receiving', 'offer', 'offered', 'offering',
    'pass', 'passed', 'passing', 'pull', 'pulled', 'pulling', 'push', 'pushed', 'pushing',
    'wait', 'waited', 'waiting', 'serve', 'served', 'serving', 'die', 'died', 'dying',
    'grow', 'grew', 'growing', 'fall', 'fell', 'falling', 'rise', 'rose', 'rising',
    'lose', 'lost', 'losing', 'win', 'won', 'winning', 'buy', 'bought', 'buying',
    'sell', 'sold', 'selling', 'pay', 'paid', 'paying', 'spend', 'spent', 'spending',
    'cost', 'costs', 'costing', 'wear', 'wore', 'wearing', 'kill', 'killed', 'killing',
    'meet', 'met', 'meeting', 'visit', 'visited', 'visiting', 'return', 'returned', 'returning',
    'forget', 'forgot', 'forgetting', 'remember', 'remembered', 'remembering', 'decide', 'decided', 'deciding',
    'consider', 'considered', 'considering', 'suppose', 'supposed', 'supposing', 'believe', 'believed', 'believing',
    'hope', 'hoped', 'hoping', 'wish', 'wished', 'wishing', 'expect', 'expected', 'expecting',
    'imagine', 'imagined', 'imagining', 'wonder', 'wondered', 'wondering', 'realize', 'realized', 'realizing',
    'understand', 'understood', 'understanding', 'recognize', 'recognized', 'recognizing', 'notice', 'noticed', 'noticing',

    // Additional meaningless words
    'cannot', 'don', 'next', 'within', 'share', 'years', 'person', 'world', 'life',
    'com', 'nov', 'ready', 'placeholder', 'actors',

    // Footer/UI spam
    'nospam', 'antispam', 'relatespace', 'llc', 'monica', 'usa', 'keywords',
    'privacy', 'policy', 'santa', 'conditions'
]);

// Sophisticated terms that should always be included (domain-specific and intellectual)
const importantTerms = new Set([
    // Core yoga/tantra terminology
    'tantra', 'yoga', 'kundalini', 'chakra', 'meditation', 'spiritual', 'divine', 'consciousness',
    'energy', 'practice', 'sacred', 'healing', 'awakening', 'transformation', 'embodiment',
    'breath', 'sensual', 'liberation', 'devotion', 'enlightenment', 'ritual', 'initiation',
    'goddess', 'shiva', 'shakti', 'puja', 'mantra', 'mudra', 'nadi', 'prana', 'samadhi',
    'dharma', 'karma', 'samsara', 'moksha', 'bhakti', 'jnana', 'raja', 'hatha', 'kriya',
    'somatic', 'embodied', 'intimacy', 'presence', 'mindfulness', 'retreat', 'workshop',

    // Multi-word phrases
    'tantra yoga', 'kundalini yoga', 'sacred sexuality', 'tantric healing', 'spiritual awakening',
    'energy work', 'chakra healing', 'breathwork', 'meditation practice', 'conscious touch',
    'divine feminine', 'divine masculine', 'inner alchemy', 'spiritual practice',

    // Advanced spiritual concepts
    'nonduality', 'advaita', 'vedanta', 'sutra', 'zen', 'buddhism', 'taoism', 'mysticism',
    'transcendence', 'ecstasy', 'bliss', 'emptiness', 'void', 'silence', 'stillness',
    'surrender', 'witnessing', 'awareness', 'perception', 'reality', 'truth', 'wisdom',
    'compassion', 'equanimity', 'detachment', 'non-attachment', 'renunciation',

    // Body/somatic terminology
    'somatic', 'embodiment', 'nervous system', 'trauma', 'integration', 'regulation',
    'polyvagal', 'vagus', 'parasympathetic', 'sympathetic', 'proprioception',

    // Philosophical and psychological terms
    'shadow', 'archetype', 'psyche', 'subconscious', 'unconscious', 'collective',
    'individuation', 'projection', 'transference', 'integration', 'wholeness',
    'authenticity', 'vulnerability', 'boundaries', 'consent', 'agency',

    // Teachers and authors (sophisticated references)
    'sapolsky', 'robert sapolsky', 'jung', 'carl jung', 'watts', 'alan watts',
    'osho', 'rajneesh', 'ramana', 'maharshi', 'nisargadatta', 'maharaj',
    'krishnamurti', 'jiddu krishnamurti', 'eckhart tolle', 'tolle',
    'ram dass', 'dass', 'timothy leary', 'terence mckenna', 'mckenna',
    'rumi', 'hafiz', 'kabir', 'mirabai', 'rilke', 'nin', 'anais nin',
    'campbell', 'joseph campbell', 'eliade', 'mircea eliade',
    'jung', 'freud', 'reich', 'wilhelm reich', 'lowen', 'alexander lowen',
    'grof', 'stanislav grof', 'wilber', 'ken wilber', 'kornfield', 'jack kornfield',

    // Advanced yogic/tantric concepts
    'sushumna', 'ida', 'pingala', 'bandha', 'kumbhaka', 'pranayama', 'asana',
    'dhyana', 'dharana', 'pratyahara', 'yama', 'niyama', 'samyama',
    'bindu', 'ojas', 'tejas', 'sattva', 'rajas', 'tamas', 'guna',
    'kosha', 'atman', 'brahman', 'maya', 'lila', 'leela',

    // Texts and traditions
    'upanishad', 'bhagavad gita', 'gita', 'vedas', 'rigveda', 'patanjali',
    'yoga sutras', 'hatha yoga pradipika', 'shiva samhita', 'vigyan bhairav',
    'tantra sastra', 'tantric buddhism', 'tibetan buddhism', 'dzogchen', 'mahamudra',

    // Forbidden yoga specific
    'forbidden', 'forbidden yoga', 'michael', 'perin', 'wogenburg',

    // Modern spirituality/science
    'neuroscience', 'neuroplasticity', 'psychedelics', 'entheogens', 'ayahuasca',
    'psilocybin', 'mycology', 'mushrooms', 'dmt', 'lsd', 'mdma',
    'phenomenology', 'epistemology', 'ontology', 'metaphysics', 'cosmology',

    // Left-handed tantra and transgressive practices
    'left-handed', 'left handed', 'vama marga', 'transgression', 'transgressive',
    'bondage', 'bdsm', 'kink', 'dominance', 'submission', 'sadomasochism',
    'restraint', 'control', 'power exchange',

    // Deity and text names
    'kali', 'maa kali', 'durga', 'tara', 'chinnamasta', 'dhumavati', 'bagalamukhi',
    'matangi', 'kamala', 'bhuvaneshwari', 'tripura sundari', 'mahavidya', 'mahavidyas',
    'kularnava', 'kularṇava', 'kularnava tantra', 'kularṇava tantra',
    'mahanirvana', 'mahanirvana tantra', 'rudrayamala', 'tantrasara',

    // Psychological and somatic terms
    'samskara', 'samskaras', 'vasana', 'vasanas', 'klesha', 'kleshas',
    'catharsis', 'abreaction', 'integration', 'dissociation', 'embodiment',

    // Bodily substances and transgressive elements
    'menstrual', 'menstrual blood', 'menstruation', 'blood', 'semen', 'sexual fluids',
    'bodily fluids', 'transgressive substances', 'panchamakara', 'five ms',
    'maithuna', 'mudra', 'matsya', 'mamsa', 'madya',

    // Additional tantric technical terms
    'yoni', 'lingam', 'yoni puja', 'linga puja', 'yoni worship',
    'sexual alchemy', 'sexual magic', 'sacred prostitution',
    'cremation ground', 'charnel ground', 'shmashana', 'shamshan'
]);

const wordCounts = {};
const phraseCounts = {};

// Function to normalize text (remove diacritics)
function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let content = fs.readFileSync(filepath, 'utf8');

    // Remove HTML tags
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    content = content.replace(/<[^>]+>/g, ' ');
    content = content.replace(/&[a-z]+;/gi, ' ');

    // Convert to lowercase and normalize diacritics
    content = content.toLowerCase();
    const normalizedContent = normalizeText(content);

    // Extract words (from normalized content for better matching)
    const words = normalizedContent.match(/\b[a-z]{3,}\b/g) || [];

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

    // Extract 4-word phrases
    for (let i = 0; i < words.length - 3; i++) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`;
        if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1]) &&
            !stopWords.has(words[i + 2]) && !stopWords.has(words[i + 3])) {
            phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        }
    }

    // Extract 5-word phrases
    for (let i = 0; i < words.length - 4; i++) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]} ${words[i + 4]}`;
        if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1]) &&
            !stopWords.has(words[i + 2]) && !stopWords.has(words[i + 3]) && !stopWords.has(words[i + 4])) {
            phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        }
    }
});

// Sort and filter - LOWERED thresholds and normalize important terms
const normalizedImportantTerms = new Set(
    Array.from(importantTerms).map(term => normalizeText(term))
);

const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([word, count]) => count >= 2 || normalizedImportantTerms.has(word))
    .slice(0, 150);

// Filter out UI/navigation phrases and meaningless phrases
const uiPhrases = new Set([
    'share previous', 'previous next', 'share previous next', 'com share',
    'yoga com share', 'com share previous', 'nov share', 'wogenburg nov share',
    'posts questions', 'questions ready', 'posts questions ready',
    'yoga com', 'forbidden yoga com', 'wogenburg nov', 'perin wogenburg nov',
    'love forbidden', 'love forbidden yoga', 'placeholder actors'
]);

const sortedPhrases = Object.entries(phraseCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([phrase, count]) => {
        // Include if it appears 2+ times OR is in important terms
        return (count >= 2 || normalizedImportantTerms.has(phrase)) && !uiPhrases.has(phrase);
    })
    .slice(0, 100);

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
