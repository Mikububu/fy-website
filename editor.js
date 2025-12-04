// Blog Post Editor JavaScript
let allPosts = [];
let currentPost = null;

// Load posts on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    setupSearchFilter();
});

// Load all posts from posts-data.json
async function loadPosts() {
    try {
        const response = await fetch('/posts-data.json?v=' + Date.now());
        allPosts = await response.json();
        renderPostList(allPosts);
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('postList').innerHTML = '<li class="empty-state">Error loading posts</li>';
    }
}

// Render post list in sidebar
function renderPostList(posts) {
    const postList = document.getElementById('postList');

    if (posts.length === 0) {
        postList.innerHTML = '<li class="empty-state">No posts found</li>';
        return;
    }

    postList.innerHTML = posts.map((post, index) => `
        <li class="post-item" data-index="${index}" onclick="selectPost(${index})">
            <div class="post-item-title">${post.title || 'Untitled'}</div>
            <div class="post-item-meta">${formatDate(post.date)}</div>
        </li>
    `).join('');
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Setup search filter
function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allPosts.filter(post =>
            (post.title || '').toLowerCase().includes(query) ||
            (post.description || '').toLowerCase().includes(query)
        );
        renderPostList(filtered);
    });
}

// Select a post to edit
async function selectPost(index) {
    currentPost = allPosts[index];

    // Update active state
    document.querySelectorAll('.post-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-index="${index}"]`).classList.add('active');

    // Load post content
    await loadPostContent(currentPost);
}

// Load full post content from HTML file
async function loadPostContent(post) {
    const editorContent = document.getElementById('editorContent');

    try {
        const response = await fetch(post.url);
        const html = await response.text();

        // Extract content from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const contentDiv = doc.querySelector('.post-content');
        const titleElement = doc.querySelector('.post-title');

        const title = titleElement ? titleElement.textContent : post.title;
        const content = contentDiv ? contentDiv.innerHTML : '';

        // Render editor form
        editorContent.innerHTML = `
            <div id="statusMessage" class="status-message"></div>

            <h2>Edit: ${title}</h2>

            <form id="editForm" onsubmit="savePost(event)">
                <div class="form-group">
                    <label for="postTitle">Post Title</label>
                    <input type="text" id="postTitle" value="${escapeHtml(title)}" required>
                </div>

                <div class="form-group">
                    <label for="postDescription">Description (for thumbnails)</label>
                    <input type="text" id="postDescription" value="${escapeHtml(post.description || '')}" required>
                </div>

                <div class="form-group">
                    <label for="postContent">Post Content (HTML)</label>
                    <textarea id="postContent" required>${escapeHtml(content)}</textarea>
                    <div class="help-text">
                        💡 Tip: To embed videos, paste HTML like:<br>
                        <code>&lt;video controls&gt;&lt;source src="video.mp4"&gt;&lt;/video&gt;</code><br>
                        or use iframe embeds from YouTube/Vimeo
                    </div>
                </div>

                <div class="form-group">
                    <label for="videoEmbed">Quick Video Embed (optional)</label>
                    <input type="text" id="videoEmbed" placeholder="Paste video URL or embed code">
                    <div class="help-text">
                        Paste a YouTube/Vimeo URL or full embed code, and it will be inserted into your content
                    </div>
                </div>

                <div class="button-group">
                    <button type="submit" class="btn btn-primary">💾 Save Changes</button>
                    <button type="button" class="btn btn-secondary" onclick="downloadPost()">⬇️ Download HTML</button>
                    <button type="button" class="btn btn-secondary" onclick="previewPost()">👁️ Preview</button>
                </div>
            </form>

            <div class="video-preview" id="videoPreview" style="display: none;">
                <h4>Video Preview</h4>
                <div id="videoPreviewContent"></div>
            </div>
        `;

        // Setup video embed helper
        document.getElementById('videoEmbed').addEventListener('input', handleVideoEmbed);

    } catch (error) {
        console.error('Error loading post:', error);
        showMessage('Error loading post content', 'error');
    }
}

// Handle video embed input
function handleVideoEmbed(e) {
    const input = e.target.value.trim();
    const preview = document.getElementById('videoPreview');
    const previewContent = document.getElementById('videoPreviewContent');

    if (!input) {
        preview.style.display = 'none';
        return;
    }

    let embedCode = '';

    // Check if it's a YouTube URL
    const youtubeMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        embedCode = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }
    // Check if it's a Vimeo URL
    else if (input.includes('vimeo.com/')) {
        const vimeoMatch = input.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            const videoId = vimeoMatch[1];
            embedCode = `<iframe src="https://player.vimeo.com/video/${videoId}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
        }
    }
    // Check if it's already an iframe or video tag
    else if (input.includes('<iframe') || input.includes('<video')) {
        embedCode = input;
    }
    // Direct video file URL
    else if (input.match(/\.(mp4|webm|ogg)$/i)) {
        embedCode = `<video controls style="max-width: 100%;"><source src="${input}" type="video/mp4">Your browser does not support the video tag.</video>`;
    }

    if (embedCode) {
        preview.style.display = 'block';
        previewContent.innerHTML = embedCode;
    } else {
        preview.style.display = 'none';
    }
}

// Save post (download since we can't write directly to files from browser)
function savePost(event) {
    event.preventDefault();

    const title = document.getElementById('postTitle').value;
    const description = document.getElementById('postDescription').value;
    const content = document.getElementById('postContent').value;
    const videoEmbed = document.getElementById('videoEmbed').value.trim();

    // If video embed provided, insert it at the beginning of content
    let finalContent = content;
    if (videoEmbed) {
        let embedCode = videoEmbed;

        // Convert URL to embed if needed
        const youtubeMatch = videoEmbed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (youtubeMatch) {
            const videoId = youtubeMatch[1];
            embedCode = `<div style="margin: 30px 0;"><iframe width="100%" height="500" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width: 100%;"></iframe></div>`;
        }

        finalContent = embedCode + '\n\n' + content;
    }

    // Load original HTML and update it
    fetch(currentPost.url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Update title
            const titleElement = doc.querySelector('.post-title');
            if (titleElement) titleElement.textContent = title;

            const pageTitle = doc.querySelector('title');
            if (pageTitle) pageTitle.textContent = `${title} | Forbidden Yoga`;

            // Update description
            const descMeta = doc.querySelector('meta[name="description"]');
            if (descMeta) descMeta.setAttribute('content', description);

            // Update content
            const contentDiv = doc.querySelector('.post-content');
            if (contentDiv) contentDiv.innerHTML = finalContent;

            // Download the updated HTML
            const updatedHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
            downloadFile(updatedHtml, currentPost.url.split('/').pop(), 'text/html');

            showMessage('✅ Post saved! Download the file and replace the original.', 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('❌ Error saving post', 'error');
        });
}

// Download post as HTML file
function downloadPost() {
    fetch(currentPost.url)
        .then(response => response.text())
        .then(html => {
            downloadFile(html, currentPost.url.split('/').pop(), 'text/html');
            showMessage('✅ Post downloaded!', 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('❌ Error downloading post', 'error');
        });
}

// Preview post in new tab
function previewPost() {
    const content = document.getElementById('postContent').value;
    const title = document.getElementById('postTitle').value;

    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${escapeHtml(title)} - Preview</title>
            <style>
                body {
                    font-family: 'Roboto', sans-serif;
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 20px;
                    background: #f3f2de;
                    color: #2a2a2a;
                }
                h1 { color: #423737; }
                img, video, iframe { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            <h1>${escapeHtml(title)}</h1>
            <div>${content}</div>
        </body>
        </html>
    `);
}

// Download file helper
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Show status message
function showMessage(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

// Escape HTML helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
