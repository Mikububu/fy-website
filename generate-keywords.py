#!/usr/bin/env python3
"""
Generate semantic keywords for all Forbidden Yoga blog posts
Based on tantric/spiritual/psychological terms and notable people names
"""

import re
from pathlib import Path

# Keyword mappings for each post based on deep semantic analysis
# Keywords include: specific texts, scholars, Sanskrit terms, practices, and people mentioned
POST_KEYWORDS = {
    "4-paths-into-the-forbidden": [
        "Sensual Liberation Retreats",
        "Private Initiations",
        "Kriya Yoga",
        "Direct Transmission",
        "Taoist Sensual Massage",
        "Shadow Gazing",
        "Placeholder Actors",
        "Online Coaching"
    ],

    "5-karmendriyas-and-5-jnanendriyas": [
        "Karmendriyas",
        "Jñānendriyas",
        "Indriyas",
        "Samkhya",
        "Puruṣa",
        "Prakṛti",
        "Tanmātras",
        "Mahābhūtas",
        "Manas",
        "Trataka",
        "Nāda Yoga",
        "Mātaṅgī"
    ],

    "a-holistic-approach-to-divorce": [
        "Chinnamasta",
        "Mahāvidyā",
        "Matangi Nyasa",
        "Sushumna Nadi",
        "Ida Pingala",
        "Tejas",
        "Klaus Bo",
        "Death and Alive Project",
        "DAZ 3D",
        "Decoupling Rituals"
    ],

    "anais-nin-the-house-of-incest": [
        "Anaïs Nin",
        "House of Incest",
        "Svadhisthana",
        "Vishuddha",
        "Atlantis",
        "Tanmātra",
        "Rasa",
        "Prakṛti",
        "Water Consciousness"
    ],

    "beyond-the-naked-surface": [
        "Sadhana",
        "Pratyahara",
        "Shodhana",
        "Kriya Traditions",
        "Mahāvidyā",
        "Bija Mantra",
        "Darkness Meditation",
        "Left-Hand Tantra",
        "Bengal Tantra",
        "Laya Yoga"
    ],

    "dark-alchemy": [
        "A Dark Song",
        "Liam Gavin",
        "Abramelin Operation",
        "Holy Guardian Angel",
        "Carl Jung",
        "Shadow Integration",
        "Nigredo",
        "Individuation",
        "Wales",
        "Jungian Psychology"
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
        "Arthur Avalon",
        "John Woodroffe",
        "David Gordon White",
        "Alexis Sanderson",
        "Abhinavagupta",
        "Pratyayasarga Sādhana",
        "Sandhyā Bhāṣā",
        "Śakti Pīṭha Nyāsa",
        "Vāma Mārga",
        "Kaula",
        "Kashmir Shaivism"
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
        "Vienna",
        "Berggasse 19",
        "Gustav Klimt",
        "Totem and Taboo",
        "The Game (film)",
        "Hayao Miyazaki",
        "Stephen Russell",
        "Mantak Chia",
        "Chi Nei Tsang",
        "Advaita Vedanta"
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
        "Śrī Vidyā",
        "Kriya Sādhana",
        "Kali",
        "Tara",
        "Tripura Sundari",
        "Kameshvari",
        "Nityaklinna",
        "Lunar Tithis"
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
        "Muladhara",
        "Beeja Mantra",
        "Chakra Petals",
        "Kundalini",
        "Vamachara",
        "Shakta Tantra",
        "Nadas",
        "Shakti"
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
        "Sadhri",
        "Laya Yoga",
        "Sthula Sharira",
        "Sukshma Sharira",
        "Karana Sharira",
        "Homa Kriya",
        "Agnisara",
        "Ashvini Mudra",
        "Couples Pranayama"
    ],

    "the-compass-of-zen": [
        "Avatamsaka-sutra",
        "Pass-a-Million",
        "Bodhisattva",
        "Seung Sahn",
        "Do ban",
        "Dharma",
        "Korean Zen",
        "Compassion of Zen"
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
        "Kularṇava Tantra",
        "Aṣṭa Pāśa",
        "Dveṣa",
        "Saṁśaya",
        "Bhaya",
        "Lajjā",
        "Ghṛṇā",
        "Śmaśāna-sādhana",
        "Cakrapūjā",
        "Kaula"
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
        "Hsi Lai",
        "Jade Dragon",
        "Green Dragon",
        "Jing",
        "Ching",
        "Qi",
        "Shen",
        "Three Treasures",
        "Taoist Sexual Alchemy"
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
        "Brahmayāmala",
        "Netra Tantra",
        "David Gordon White",
        "Kulāmṛta",
        "Yoni-tattva",
        "Yoginī",
        "Melāpa",
        "Vīrya",
        "Kaula",
        "Vāma Mārga"
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
        "Sahaj Marg",
        "Heartfulness",
        "Lalaji",
        "Babuji",
        "Naqshbandi Sufism",
        "Pranahuti",
        "Tawajjuh",
        "Pind Pradesh",
        "Kanha Shanti Vanam",
        "SRCM"
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
    posts_dir = Path('./posts')

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
