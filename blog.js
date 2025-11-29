// Load blog posts - automatically fetches from Substack RSS when hosted
async function loadBlogPosts() {
    const blogGrid = document.getElementById('blog-grid');

    try {
        // Check if we're on Netlify or a live server
        const isLocalFile = window.location.protocol === 'file:';

        let posts = [];

        if (!isLocalFile) {
            // On live server - fetch from RSS via Netlify function
            try {
                const response = await fetch('/.netlify/functions/rss-proxy');

                if (response.ok) {
                    const xmlText = await response.text();
                    posts = parseRSSFeed(xmlText);
                }
            } catch (error) {
                console.log('Netlify function not available, using fallback data');
            }
        }

        // Fallback to hardcoded data if RSS fetch failed or viewing locally
        // ALL 43 posts from Forbidden Yoga archive
        if (posts.length === 0) {
            posts = [
    {
        "title": "Run Away From Tantra",
        "description": "Why Real Tantrics Have to Meditate on the Graveyard",
        "link": "https://www.forbidden-yoga.com/p/run-away-from-tantra",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5cbe063b-58e6-4476-856d-4216bba743b2_3584x4800.png",
        "date": "Nov 24, 2025"
    },
    {
        "title": "From Language Modulation To Rolegame Scripts",
        "description": "Real Life Sadhanas in the Forbidden Yoga lineage",
        "link": "https://www.forbidden-yoga.com/p/from-language-modulation-to-rolegame",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1d8b73f9-a213-408a-8ad0-f20442a2f17a_1024x559.jpeg",
        "date": "Nov 22, 2025"
    },
    {
        "title": "The Parallel Self",
        "description": "A look at the teacher behind Forbidden Yoga and the hidden architecture that shapes his work",
        "link": "https://www.forbidden-yoga.com/p/the-parallel-self",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7d4caf15-6f71-4c3f-808e-870f767e873d_1000x667.jpeg",
        "date": "Nov 21, 2025"
    },
    {
        "title": "The Distant God Fallacy",
        "description": "A Blueprint for the Post-Religious Age",
        "link": "https://www.forbidden-yoga.com/p/the-distant-god-fallacy",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F24032ed9-179a-4191-8ca0-012072a171cd_3456x5184.jpeg",
        "date": "Nov 19, 2025"
    },
    {
        "title": "Beyond the Naked Surface",
        "description": "Forbidden Yoga appears chaotic until the ancient structure underneath becomes visible",
        "link": "https://www.forbidden-yoga.com/p/beyond-the-naked-surface",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1beefb9f-04d8-43a3-9090-3b60667e2511_1152x648.gif",
        "date": "Nov 18, 2025"
    },
    {
        "title": "The Breath of God",
        "description": "The Missing Link Between Yoga, Couples Meditation and Breathwork",
        "link": "https://www.forbidden-yoga.com/p/the-breath-of-god",
        "image": "https://substack-post-media.s3.amazonaws.com/public/images/14f84e8a-2470-4f9b-be17-c3a90bd097f9_1318x1016.jpeg",
        "date": "Nov 15, 2025"
    },
    {
        "title": "The Energetic Anatomist",
        "description": "How Stanislav reads the holographic structure of relationships, clears hostile magic, and identifies exactly who drains you",
        "link": "https://www.forbidden-yoga.com/p/the-energetic-anatomist",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb6000ed9-e795-485f-abe8-592365959b6e_8192x5464.jpeg",
        "date": "Nov 15, 2025"
    },
    {
        "title": "4 Paths Into the Forbidden",
        "description": "What you can get from us !",
        "link": "https://www.forbidden-yoga.com/p/4-paths-into-the-forbidden",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F140f3b70-09c8-4371-b03a-d755ae695181_3362x1860.jpeg",
        "date": "Nov 10, 2025"
    },
    {
        "title": "When the Source Becomes the Destroyer",
        "description": "The Asymmetry of Power: Female Initiation in Left-Handed Shakta Traditions",
        "link": "https://www.forbidden-yoga.com/p/why-a-woman-initiated-in-the-left",
        "image": "https://substack-post-media.s3.amazonaws.com/public/images/ba5b960c-5884-41a9-bacb-5d321784f799_1290x959.jpeg",
        "date": "Nov 10, 2025"
    },
    {
        "title": "Indian Tantra - Mahavidyas versus Nityas",
        "description": "Why We Work Through The Body, Not Primarily Mantra Sadhana",
        "link": "https://www.forbidden-yoga.com/p/indian-tantra-mahavidyas-versus-nityas",
        "image": "https://substack-video.s3.amazonaws.com/video_upload/post/178415569/85756739-5835-4af4-9eaa-8a027aa59dce/transcoded-00000.png",
        "date": "Nov 09, 2025"
    },
    {
        "title": "Why our society cannot heal",
        "description": "(but maybe some of us can)",
        "link": "https://www.forbidden-yoga.com/p/why-our-society-cannot-heal",
        "image": "https://substack-video.s3.amazonaws.com/video_upload/post/178404378/0e279d59-fbc1-4487-b2a6-7cdbb30a1ca3/transcoded-00001.png",
        "date": "Nov 09, 2025"
    },
    {
        "title": "What you can expect booking Forbidden Yoga experiences",
        "description": "Welcome to the edge of the forbidden, where practice becomes life and life becomes practice.",
        "link": "https://www.forbidden-yoga.com/p/what-you-can-expect-booking-forbidden",
        "image": "https://substack-video.s3.amazonaws.com/video_upload/post/178395424/39f82b4c-a48f-4e96-9c29-0e3f0b6863a4/transcoded-00001.png",
        "date": "Nov 09, 2025"
    },
    {
        "title": "The Forgotten Gateways of the Human Body",
        "description": "Why Forbidden Yoga is not about nudity or modern Tantra but about remembering the ancient current that awakens the full spectrum of consciousness.",
        "link": "https://www.forbidden-yoga.com/p/the-forgotten-gateways-of-the-human",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd6762721-bcf3-49f7-91f9-df8b68f24473_1950x1300.jpeg",
        "date": "Nov 05, 2025"
    },
    {
        "title": "Forbidden-Yoga: Guardian of India's Vanishing Left-Handed Tantric Heritage",
        "description": "A deep dive - Michael Perin Wogenburg's Forbidden Yoga in the context of lost Indian tantric heritage",
        "link": "https://www.forbidden-yoga.com/p/from-a-shakta-tantra-stream-to-forbidden",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F2efe446c-f7b5-488d-9e06-cfc1a711cef4_2316x3088.jpeg",
        "date": "Nov 04, 2025"
    },
    {
        "title": "The Solace of the Scene",
        "description": "Attachment Styles and the Psychodynamics of BDSM Role Play",
        "link": "https://www.forbidden-yoga.com/p/the-solace-of-the-scene",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff3164de6-5c1a-43e5-bcce-9ad60dd2c373_1638x1080.gif",
        "date": "May 07, 2025"
    },
    {
        "title": "The Animal Pūjā",
        "description": "A Radical (?) Rite of Left-Handed Tantra",
        "link": "https://www.forbidden-yoga.com/p/the-animal-puja",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F17df6cbc-aa26-4e91-a28a-5fe90c119262_1685x1123.gif",
        "date": "May 06, 2025"
    },
    {
        "title": "The Eight Limitations of Man According to the Kularṇava Tantra",
        "description": "Transgression, Bondage, and Liberation in Left-Handed Tantra",
        "link": "https://www.forbidden-yoga.com/p/the-eight-limitations-of-man-according",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd6de18f6-c10d-462a-82e0-c71efaa371c7_1024x1536.png",
        "date": "May 05, 2025"
    },
    {
        "title": "Forbidden Yoga: Embracing the Unconventional Path to Non-Dual Awareness",
        "description": "Exploring the Intersection of Sensuality and Advaita Vedanta",
        "link": "https://www.forbidden-yoga.com/p/forbidden-yoga-embracing-the-unconventional",
        "image": "https://substack-post-media.s3.amazonaws.com/public/images/8c346760-66cd-4239-bdf5-2eea07115ed7_512x279.jpeg",
        "date": "Mar 17, 2025"
    },
    {
        "title": "The Next Generation of Wellness Retreats",
        "description": "Breaking down traditional narratives and returning to the true ancient paths of wisdom…For Spa China Magazine",
        "link": "https://www.forbidden-yoga.com/p/the-next-generation-of-wellness-retreats",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F943af901-8cf7-4a85-afd9-6e46f0ac02f4_2858x1810.png",
        "date": "Mar 01, 2025"
    },
    {
        "title": "From Freud to Taoism and Tantra: Sexual Therapy in Luxury Wellness",
        "description": "A 30-minute video documentary based on a speech by Michael Perin-Wogenburg at the Spa Summit in Nanjing, China, 2024.",
        "link": "https://www.forbidden-yoga.com/p/from-freud-to-taoism-and-tantra-sexual",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa25a91cd-612a-4d39-81c3-4a1602ba58d9_3000x2000.jpeg",
        "date": "Nov 14, 2024"
    },
    {
        "title": "The Sexual Teachings of the White Tigress",
        "description": "An Exploration of an Ancient Taoist Tradition and what you can learn at Forbidden Yoga",
        "link": "https://www.forbidden-yoga.com/p/the-sexual-teachings-of-the-white",
        "image": "https://substack-post-media.s3.amazonaws.com/public/images/1ce4f8e9-be6d-48d1-b65b-ff325e7a4429_1472x832.jpeg",
        "date": "Sep 17, 2024"
    },
    {
        "title": "Sparsha Puja in a Mental Institution called modern society",
        "description": "When life changes profoundly, you might forget it all began with Sparsha Puja.",
        "link": "https://www.forbidden-yoga.com/p/sparsha-puja-in-a-mental-institution",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb239b7d3-7b4d-4a68-a7e0-7f9ee1f965bd_4256x2832.jpeg",
        "date": "Sep 15, 2024"
    },
    {
        "title": "Everything Vibrates",
        "description": "Strings and Shadows: When Ancient Vibration Meets Modern Physics",
        "link": "https://www.forbidden-yoga.com/p/string-theory-tantric-secrets-and",
        "image": "https://substack-post-media.s3.amazonaws.com/public/images/75fd07d7-9045-4830-9e48-798d6363d7ca_4032x3024.jpeg",
        "date": "Sep 04, 2024"
    },
    {
        "title": "Sensual Liberation retreats with the Brazilians",
        "description": "A new approach to therapy with Lura Corazon adult actress and other Rio de Janeiro placeholder actors",
        "link": "https://www.forbidden-yoga.com/p/sensual-liberation-retreats-with",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff47a0703-231a-4b3b-acfb-66dd6c3b1355_1280x720.jpeg",
        "date": "Jul 08, 2024"
    },
    {
        "title": "From Burnout to Ecstasy: My Journey with Forbidden Yoga - a Testimonial",
        "description": "How a Sensual Liberation Retreat Reawakened My Passion and Transformed My Life",
        "link": "https://www.forbidden-yoga.com/p/from-emptiness-to-ecstasy-my-journey",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa4ba9f87-1478-4d28-b69e-0dd29d711133_2976x2976.jpeg",
        "date": "Jun 16, 2024"
    },
    {
        "title": "The Last Thing Money Can Buy",
        "description": "When the calendar is perfect and the soul is starving",
        "link": "https://www.forbidden-yoga.com/p/soulmates-among-the-stars-the-ultimate",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F221b7236-5a57-4c73-bb74-3375653d757c_3072x5504.jpeg",
        "date": "Jun 12, 2024"
    },
    {
        "title": "Reclaiming Your Voice - Working through Trauma",
        "description": "A 1:1 program for women by forbidden yoga",
        "link": "https://www.forbidden-yoga.com/p/reclaiming-your-voice-working-through",
        "image": "https://substack-post-media.s3.amazonaws.com/public/images/053846b2-da06-42e2-a896-301bf8fe3c8e_1280x720.png",
        "date": "Jun 10, 2024"
    },
    {
        "title": "The Joy of Torture?",
        "description": "Rechanneling Human Aggression through experimental sexual roleplay and ritualistic spirituality?",
        "link": "https://www.forbidden-yoga.com/p/the-joy-of-torture",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb1a93611-2e64-4b5c-8a13-a2d42ce95c66_3840x5760.jpeg",
        "date": "Jun 04, 2024"
    },
    {
        "title": "Divorce without Discord?",
        "description": "PRE & POST DIVORCE De-coupling Retreats by Forbidden Yoga",
        "link": "https://www.forbidden-yoga.com/p/a-holistic-approach-to-divorce",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fefa1241b-4071-4693-8626-8ef4d63b6944_5000x3500.jpeg",
        "date": "Jun 03, 2024"
    },
    {
        "title": "Krama Rishi Nyasa with Iya",
        "description": "The fascinating interplay between primary and secondary thought",
        "link": "https://www.forbidden-yoga.com/p/krama-rishi-nyasa-with-iya",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa905396d-1313-40c9-992f-05e10f7b9df7.heic",
        "date": "May 28, 2024"
    },
    {
        "title": "The Five Sub-Chakras of the Heart",
        "description": "From a Sufi Sect to a Worldwide Organization of Love",
        "link": "https://www.forbidden-yoga.com/p/yogic-transmission-in-raja-yoga",
        "image": "https://substack-post-media.s3.amazonaws.com/public/images/d6a01ccd-597b-4637-af75-6c67ce28df6e_1864x942.png",
        "date": "May 28, 2024"
    },
    {
        "title": "Why We Teach Chinese Sensual Massage",
        "description": "Traditional Tantra contains no bodywork. We had to look elsewhere.",
        "link": "https://www.forbidden-yoga.com/p/why-i-teach-taoist-sensual-bodywork",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F56ccce2f-9fdc-41ac-81b0-30af003694d9_3512x6240.jpeg",
        "date": "May 28, 2024"
    },
    {
        "title": "Our Brains' Urge for Mystical Experiences",
        "description": "A snapshot into the true forbidden Yoga: The Uu ऊ sadhana",
        "link": "https://www.forbidden-yoga.com/p/our-brains-urge-for-mystical-experiences",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fabaeaba9-8390-4bef-8196-e0638ff069eb_1600x1200.jpeg",
        "date": "May 25, 2024"
    },
    {
        "title": "Muladhara Chakra Petals",
        "description": "A Journey Through the Muladhara Chakra in Vamachara Shakta Tantra",
        "link": "https://www.forbidden-yoga.com/p/muladhara-chakra-petals",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fac0a7a9e-a372-4c09-ba16-6e6fce4f02ac_1960x1692.png",
        "date": "May 18, 2024"
    },
    {
        "title": "Wogenburg's unconventional approach to therapy",
        "description": "FY guru invented Forbidden Yoga in time of deep loneliness",
        "link": "https://www.forbidden-yoga.com/p/my-new-approach-to-therapy",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1ba1819c-5c3b-4316-a267-e1cbcff203f2_1365x2048.jpeg",
        "date": "May 09, 2024"
    },
    {
        "title": "Movie: A DARK SONG - Not everything can be forgiven",
        "description": "The High Cost of Breaking Rules",
        "link": "https://www.forbidden-yoga.com/p/dark-alchemy",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff7e1eefa-e034-4891-bbb8-0a400f8abf13_1284x2282.jpeg",
        "date": "Apr 25, 2024"
    },
    {
        "title": "On Relationships and Tantra: The Energetic Debt You Carry",
        "description": "Bespoke Tantric experiences that provoke you to the core while transforming your life - by revealing the karmic debt you've been carrying and how to finally release it.",
        "link": "https://www.forbidden-yoga.com/p/how-to-deliver-visionary-idea-in",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F90871007-0f55-4008-8d19-70bffac8fb10_4000x5999.jpeg",
        "date": "Jan 16, 2024"
    },
    {
        "title": "Hermann's FY Yoga retreat in Rio de Janeiro",
        "description": "The first Sensual Liberation Retreat",
        "link": "https://www.forbidden-yoga.com/p/hermanns-story-of-his-sensual-liberation",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F47f45306-71f0-46ea-beee-7f4a97b8e09c_3136x1376.jpeg",
        "date": "Dec 24, 2023"
    },
    {
        "title": "5 Karmendriyas and 5 Jnanendriyas",
        "description": "The Metaphysical Architecture: The 5 senses of experience and the 5 senses of action in Tantra",
        "link": "https://www.forbidden-yoga.com/p/5-karmendriyas-and-5-jnanendriyas",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Feea6585e-0c9a-429d-9b8f-b9659d1b322c_2880x2880.png",
        "date": "Dec 24, 2023"
    },
    {
        "title": "Water Consciousness and the Forbidden Realm",
        "description": "Anais Nin - The House of Incest",
        "link": "https://www.forbidden-yoga.com/p/anais-nin-the-house-of-incest",
        "image": "https://substack-post-media.s3.amazonaws.com/public/images/a8c01898-b059-4319-b856-0e5721b95d6b_1365x2048.jpeg",
        "date": "Dec 20, 2023"
    },
    {
        "title": "Bodhisattva Sexuality: When Sex Becomes Sacred Service",
        "description": "Forbidden Yoga invites you to explore where pleasure and dharma become indistinguishable",
        "link": "https://www.forbidden-yoga.com/p/the-compass-of-zen",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F88567992-150e-4a25-8231-eedf38183790_4000x2498.png",
        "date": "Dec 15, 2023"
    },
    {
        "title": "Yoni Trataka: Gazing at the Source",
        "description": "On the ancient meditation practice related to the female organ of birth and pleasure.",
        "link": "https://www.forbidden-yoga.com/p/not-a-john-baldessari-artwork",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1022f368-c18c-4c97-ab8d-9bae2037ae81_5616x3744.jpeg",
        "date": "Dec 13, 2023"
    },
    {
        "title": "ONLINE STUDY - A Forbidden Yoga Lineage",
        "description": "The Andhakaara Path to Power - An Epic Journey to the Source",
        "link": "https://www.forbidden-yoga.com/p/tantra-online",
        "image": "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F47b50da8-b507-4f27-9637-fa16ecc6b358_572x1024.jpeg",
        "date": "Nov 25, 2023"
    }
];
        }

        if (posts.length === 0) {
            blogGrid.innerHTML = '<p class="error">No blog posts found.</p>';
            return;
        }

        // Sort posts by date (newest first)
        posts.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });

        // Pin the "4 Paths Into the Forbidden" post to first position
        const pinnedPostUrl = 'https://www.forbidden-yoga.com/p/4-paths-into-the-forbidden';
        const pinnedIndex = posts.findIndex(post => post.link === pinnedPostUrl);

        if (pinnedIndex > 0) {
            const [pinnedPost] = posts.splice(pinnedIndex, 1);
            posts.unshift(pinnedPost);
        }

        // Clear loading message
        blogGrid.innerHTML = '';

        // Create blog post cards
        posts.forEach((post) => {
            const card = document.createElement('article');
            card.className = 'blog-card';

            card.innerHTML = `
                <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="blog-card-link">
                    ${post.image ? `
                        <div class="blog-card-image">
                            <img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.parentElement.style.display='none'">
                        </div>
                    ` : ''}
                    <div class="blog-card-content">
                        <h3 class="blog-card-title">${post.title}</h3>
                        <p class="blog-card-description">${post.description}</p>
                        ${post.date ? `<time class="blog-card-date">${post.date}</time>` : ''}
                    </div>
                </a>
            `;

            blogGrid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogGrid.innerHTML = `
            <div class="error">
                <p>Unable to load blog posts.</p>
                <p><a href="https://www.forbidden-yoga.com" target="_blank">Visit the blog directly</a></p>
            </div>
        `;
    }
}

// Parse RSS XML feed into blog post objects
function parseRSSFeed(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const items = xml.querySelectorAll('item');
    const posts = [];

    items.forEach((item) => {
        const title = item.querySelector('title')?.textContent || 'Untitled';
        const description = item.querySelector('description')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '#';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const enclosure = item.querySelector('enclosure');
        const imageUrl = enclosure?.getAttribute('url') || '';

        // Format date
        let formattedDate = '';
        if (pubDate) {
            const date = new Date(pubDate);
            formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        posts.push({
            title,
            description,
            link,
            image: imageUrl,
            date: formattedDate
        });
    });

    return posts;
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadBlogPosts);
