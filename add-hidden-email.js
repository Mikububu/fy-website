const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

let updated = 0;
let alreadyHas = 0;

files.forEach(file => {
    const filepath = path.join(postsDir, file);
    let content = fs.readFileSync(filepath, 'utf8');

    // Check if email already exists
    if (content.includes('love@forbidden-yoga.com') || content.includes('data-email')) {
        alreadyHas++;
        console.log(`  Already has email: ${file}`);
        return;
    }

    // Add obfuscated email before closing body tag
    // Using data attributes + CSS to hide from bots but show to humans
    const emailHTML = `
    <!-- Contact Email (bot-protected) -->
    <div class="contact-email" style="text-align: center; padding: 40px 20px; margin-top: 60px; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; margin-bottom: 10px;">Questions or ready to begin?</p>
        <a href="#" class="email-link" data-user="love" data-domain="forbidden-yoga.com" style="color: #8fa9aa; font-size: 1.1rem; text-decoration: none; font-weight: 500;">
            <span class="email-text"></span>
        </a>
    </div>
    <script>
    // Reveal email on page load (bot-resistant)
    (function() {
        const links = document.querySelectorAll('.email-link');
        links.forEach(link => {
            const user = link.getAttribute('data-user');
            const domain = link.getAttribute('data-domain');
            const email = user + '@' + domain;
            link.href = 'mailto:' + email;
            link.querySelector('.email-text').textContent = email;
        });
    })();
    </script>
`;

    // Insert before </body>
    content = content.replace('</body>', emailHTML + '\n</body>');

    fs.writeFileSync(filepath, content);
    updated++;
    console.log(`✓ Added email: ${file}`);
});

console.log(`\n✓ Added email to ${updated} posts`);
console.log(`  Skipped ${alreadyHas} posts (already have email)`);
