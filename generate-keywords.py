#!/usr/bin/env python3
"""
Generate semantic keywords for all Forbidden Yoga blog posts
Based on tantric/spiritual/psychological terms and notable people names
"""

import re
from pathlib import Path

# Keyword mappings for each post based on content analysis
POST_KEYWORDS = {
    "4-paths-into-the-forbidden": [
        "Tantric Initiation",
        "Kriya Yoga",
        "Sensual Liberation Retreats",
        "Shadow Work",
        "Psychosexual Transformation",
        "Somatic Practices",
        "Direct Transmission",
        "Taoist Sensual Massage",
        "Sacred Container",
        "Embodied Healing"
    ],

    "5-karmendriyas-and-5-jnanendriyas": [
        "Karmendriyas",
        "Jnanendriyas",
        "Indriyas",
        "Samkhya",
        "Puruṣa",
        "Tanmātras",
        "Mahābhūtas",
        "Trataka",
        "Nāda Yoga",
        "Mahāvidyā",
        "Prakṛti"
    ],

    "a-holistic-approach-to-divorce": [
        "Chinnamasta",
        "Mahāvidyā",
        "Decoupling Rituals",
        "Matangi Nyasa",
        "Kundalini Rising",
        "Sushumna Nadi",
        "Ida Pingala",
        "Tejas Element",
        "Klaus Bo",
        "Death Meditation"
    ],

    "beyond-the-naked-surface": [
        "Sadhana",
        "Pratyahara",
        "Shodhana",
        "Kriya Traditions",
        "Mahāvidyā",
        "Bija Mantra",
        "Tantric Cosmology",
        "Darkness Meditation",
        "Left-Hand Tantra",
        "Bengal Tantra"
    ],

    "dark-alchemy": [
        "Shadow Integration",
        "Alchemical Transformation",
        "Dark Night",
        "Psycho-Spiritual Crisis",
        "Nigredo",
        "Unconscious Material",
        "Carl Jung",
        "Depth Psychology",
        "Transmutation"
    ],

    "forbidden-yoga-embracing-the-unconventional": [
        "Chit",
        "Chitta",
        "Manas",
        "Vrittis",
        "Mano Nasha",
        "Prathamika",
        "Vaikrita",
        "Indriyas",
        "Mahābhūtas",
        "Kevala Kumbhaka",
        "Advaita Vedanta"
    ],

    "from-a-shakta-tantra-stream-to-forbidden": [
        "Shakta Tantra",
        "Mahāvidyā",
        "Śrī Vidyā",
        "Kaula Tradition",
        "Vamachara",
        "Bengal School",
        "Tantric Lineage",
        "Guru Parampara",
        "Tantric Transmission"
    ],

    "from-emptiness-to-ecstasy-my-journey": [
        "Śūnyatā",
        "Bliss States",
        "Spiritual Bypassing",
        "Embodied Awakening",
        "Non-Dual Realization",
        "Somatic Integration",
        "Mystical Experience",
        "Consciousness Exploration"
    ],

    "from-freud-to-taoism-and-tantra-sexual": [
        "Sigmund Freud",
        "Wilhelm Reich",
        "Taoist Sexual Practice",
        "Psychoanalysis",
        "Orgone Energy",
        "Sexual Repression",
        "Libido Theory",
        "Body Armor",
        "Bioenergetics"
    ],

    "from-language-modulation-to-rolegame": [
        "Psychodrama",
        "Role Play Therapy",
        "Linguistic Patterns",
        "Performative Identity",
        "Therapeutic Theater",
        "Voice Modulation",
        "Embodied Communication",
        "Persona Work"
    ],

    "hermanns-story-of-his-sensual-liberation": [
        "Sensual Awakening",
        "Sexual Healing",
        "Intimate Touch",
        "Trauma Release",
        "Erotic Embodiment",
        "Permission to Feel",
        "Vulnerability Practice",
        "Sacred Intimacy"
    ],

    "how-to-deliver-visionary-idea-in": [
        "Visionary Communication",
        "Archetypal Messaging",
        "Myth Making",
        "Symbolic Language",
        "Cultural Innovation",
        "Narrative Craft",
        "Memetic Design"
    ],

    "indian-tantra-mahavidyas-versus-nityas": [
        "Mahāvidyā",
        "Nitya Devis",
        "Kali",
        "Tara",
        "Tripura Sundari",
        "Bhuvaneshvari",
        "Chinnamasta",
        "Bhairavi",
        "Dhumavati",
        "Bagalamukhi",
        "Matangi",
        "Kamala"
    ],

    "krama-rishi-nyasa-with-iya": [
        "Krama System",
        "Rishi Nyasa",
        "Tantric Ritual",
        "Mantra Placement",
        "Subtle Body",
        "Ritualistic Touch",
        "Sacred Geometry",
        "Invocation Practice"
    ],

    "muladhara-chakra-petals": [
        "Muladhara Chakra",
        "Root Chakra",
        "Bija Mantra",
        "Chakra Petals",
        "Sanskrit Seed Syllables",
        "Kundalini Awakening",
        "Pranic Body",
        "Chakra Meditation"
    ],

    "my-new-approach-to-therapy": [
        "Somatic Therapy",
        "Body-Centered Psychotherapy",
        "Trauma-Informed Practice",
        "Nervous System Regulation",
        "Polyvagal Theory",
        "Embodied Cognition",
        "Therapeutic Presence",
        "Integrative Healing"
    ],

    "not-a-john-baldessari-artwork": [
        "John Baldessari",
        "Conceptual Art",
        "Tantric Art",
        "Sacred Aesthetics",
        "Visual Metaphor",
        "Performance Art",
        "Contemporary Spirituality"
    ],

    "our-brains-urge-for-mystical-experiences": [
        "Neuroscience",
        "Mystical States",
        "Default Mode Network",
        "Ego Dissolution",
        "Transcendent Experience",
        "Neural Correlates",
        "Altered States",
        "Contemplative Neuroscience"
    ],

    "reclaiming-your-voice-working-through": [
        "Vishuddha Chakra",
        "Throat Chakra",
        "Authentic Expression",
        "Voice Liberation",
        "Communication Blocks",
        "Truth Speaking",
        "Vocal Embodiment"
    ],

    "run-away-from-tantra": [
        "Tantric Appropriation",
        "Spiritual Materialism",
        "Neo-Tantra Critique",
        "Authentic Lineage",
        "Cultural Dilution",
        "Traditional Practice",
        "Commercialization"
    ],

    "sensual-liberation-retreats-with": [
        "Sensual Liberation Retreats",
        "Embodied Practice",
        "Conscious Touch",
        "Sacred Intimacy",
        "Shadow Integration",
        "Erotic Intelligence",
        "Somatic Awakening",
        "Transformative Immersion"
    ],

    "soulmates-among-the-stars-the-ultimate": [
        "Twin Flame",
        "Soul Connection",
        "Karmic Relationship",
        "Spiritual Partnership",
        "Sacred Union",
        "Archetypal Romance",
        "Projection Dynamics"
    ],

    "sparsha-puja-in-a-mental-institution": [
        "Sparsha Puja",
        "Touch Ritual",
        "Tantric Healing",
        "Psychiatric Setting",
        "Therapeutic Touch",
        "Ritual Medicine",
        "Boundary Work"
    ],

    "string-theory-tantric-secrets-and": [
        "String Theory",
        "Quantum Physics",
        "Tantric Cosmology",
        "Vibration Theory",
        "Nāda Brahman",
        "Sacred Geometry",
        "Metaphysical Science"
    ],

    "tantra-online": [
        "Virtual Practice",
        "Online Tantra",
        "Digital Transmission",
        "Remote Sadhana",
        "Virtual Sacred Space",
        "Technology and Spirit",
        "Distance Learning"
    ],

    "the-animal-puja": [
        "Animal Puja",
        "Primal Instinct",
        "Shadow Animals",
        "Archetypal Beasts",
        "Animalistic Nature",
        "Instinctual Wisdom",
        "Wild Self"
    ],

    "the-breath-of-god": [
        "Pranayama",
        "Breath Work",
        "Prana",
        "Vital Force",
        "Respiratory Mysticism",
        "Kevala Kumbhaka",
        "Breath Retention",
        "Life Force"
    ],

    "the-compass-of-zen": [
        "Zen Buddhism",
        "Zazen",
        "Koan Practice",
        "Sudden Awakening",
        "Mindfulness",
        "Seung Sahn",
        "Korean Zen",
        "Dharma Transmission"
    ],

    "the-distant-god-fallacy": [
        "Transcendent God",
        "Immanent Divine",
        "Non-Dual Awareness",
        "God Concept Deconstruction",
        "Panentheism",
        "Divine Immanence",
        "Theological Critique"
    ],

    "the-eight-limitations-of-man-according": [
        "Aṣṭa Pāśa",
        "Eight Bondages",
        "Kashmir Shaivism",
        "Māyā",
        "Spiritual Limitations",
        "Tattva Philosophy",
        "Liberation Path"
    ],

    "the-energetic-anatomist": [
        "Subtle Anatomy",
        "Nadi System",
        "Chakra Architecture",
        "Pranic Channels",
        "Energy Body",
        "Kosha Model",
        "Marma Points"
    ],

    "the-forgotten-gateways-of-the-human": [
        "Sensory Gateways",
        "Perception Doors",
        "Indriyas",
        "Embodied Awareness",
        "Phenomenology",
        "Sense Refinement",
        "Contemplative Practice"
    ],

    "the-joy-of-torture": [
        "BDSM",
        "Power Dynamics",
        "Consensual Edge Play",
        "Psychological Catharsis",
        "Shadow Exploration",
        "Taboo Practice",
        "Erotic Intensity"
    ],

    "the-next-generation-of-wellness-retreats": [
        "Wellness Innovation",
        "Transformative Retreats",
        "Holistic Healing",
        "Luxury Wellness",
        "Bespoke Experiences",
        "Psycho-Spiritual Work",
        "Alternative Therapy"
    ],

    "the-parallel-self": [
        "Parallel Lives",
        "Alternate Identity",
        "Quantum Self",
        "Multiverse Theory",
        "Identity Fluidity",
        "Existential Exploration",
        "Self Multiplicity"
    ],

    "the-sexual-teachings-of-the-white": [
        "White Tigress",
        "Taoist Sexual Alchemy",
        "Female Sexual Cultivation",
        "Jing Essence",
        "Yin Practice",
        "Sexual Energetics",
        "Hsi Lai"
    ],

    "the-solace-of-the-scene": [
        "BDSM",
        "Scene Work",
        "Roleplay Therapy",
        "Consensual Power Exchange",
        "Sub Space",
        "Therapeutic Kink",
        "Psychological Release",
        "Safe Container"
    ],

    "what-you-can-expect-booking-forbidden": [
        "Tantric Sessions",
        "Shadow Work",
        "Somatic Trauma Release",
        "Embodied Practice",
        "Conscious Touch",
        "Non-Ordinary States",
        "Edge Work",
        "Kundalini Activation",
        "Surrender Practice",
        "Sacred Container"
    ],

    "why-a-woman-initiated-in-the-left": [
        "Left-Hand Path",
        "Vamachara",
        "Female Initiation",
        "Tantric Empowerment",
        "Shakti Activation",
        "Transgressive Practice",
        "Feminine Authority"
    ],

    "why-i-teach-taoist-sensual-bodywork": [
        "Taoist Bodywork",
        "Sensual Massage",
        "Chi Cultivation",
        "Sexual Healing",
        "Meridian Therapy",
        "Jing Preservation",
        "Erotic Touch"
    ],

    "why-our-society-cannot-heal": [
        "Belief Systems",
        "Societal Structures",
        "Collective Trauma",
        "Non-Dual Practice",
        "Laghu Puja",
        "Naked Ritual",
        "Ego Dissolution",
        "Tribal Practice",
        "Peace Work"
    ],

    "yogic-transmission-in-raja-yoga": [
        "Raja Yoga",
        "Yogic Transmission",
        "Shaktipat",
        "Guru-Disciple",
        "Energy Transfer",
        "Spiritual Initiation",
        "Patanjali",
        "Eight Limbs"
    ]
}


def add_keywords_to_post(post_path):
    """Add keywords section to a blog post"""
    slug = post_path.stem

    # Skip if not in our keyword mapping
    if slug not in POST_KEYWORDS:
        print(f"  Skipping {slug} - no keywords defined")
        return False

    # Read post
    with open(post_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Check if already has keywords
    if 'class="post-keywords"' in html:
        print(f"  Skipping {slug} - already has keywords")
        return False

    # Generate keyword HTML
    keywords = POST_KEYWORDS[slug]
    keyword_html = '\n        <div class="post-keywords">\n'
    keyword_html += '            <h3>Keywords</h3>\n'
    keyword_html += '            <div class="keyword-cloud">\n'

    for keyword in keywords:
        keyword_html += f'            <span class="keyword-tag clickable-keyword" data-keyword="{keyword}">{keyword}</span>\n'

    keyword_html += '            </div>\n'
    keyword_html += '        </div>'

    # Find insertion point (before the back link)
    back_link_pattern = r'(\s*)<a href="/#blog-section" class="back-link">← Back to all posts</a>'
    match = re.search(back_link_pattern, html)

    if not match:
        print(f"  ERROR: Could not find back link in {slug}")
        return False

    # Insert keywords before back link
    html = html[:match.start()] + keyword_html + '\n' + html[match.start():]

    # Write updated HTML
    with open(post_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"  ✓ Added {len(keywords)} keywords to {slug}")
    return True


def main():
    posts_dir = Path('/Volumes/LaCie/CLAUDE/posts')

    print("Adding keywords to blog posts...\n")

    added = 0
    skipped = 0

    for post_path in sorted(posts_dir.glob('*.html')):
        # Skip index.html
        if post_path.stem == 'index':
            continue

        if add_keywords_to_post(post_path):
            added += 1
        else:
            skipped += 1

    print(f"\n✓ Complete: {added} posts updated, {skipped} skipped")


if __name__ == '__main__':
    main()
