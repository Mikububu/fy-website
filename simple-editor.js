// Simple Blog Post Editor JavaScript
let allPosts = [];
let currentPost = null;
let currentVideoUrl = '';
let videoType = 'youtube'; // youtube, vimeo, direct

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
        const content = contentDiv ? contentDiv.innerText : ''; // Get text only, no HTML

        // Render editor form
        editorContent.innerHTML = `
            <div id="statusMessage" class="status-message"></div>

            <h2>Edit: ${escapeHtml(title)}</h2>

            <form id="editForm" onsubmit="savePost(event)">
                <div class="form-group">
                    <label for="postTitle">📝 Post Title</label>
                    <input type="text" id="postTitle" value="${escapeHtml(title)}" required>
                </div>

                <div class="form-group">
                    <label for="postDescription">📄 Description (for thumbnails)</label>
                    <input type="text" id="postDescription" value="${escapeHtml(post.description || '')}" required>
                </div>

                <div class="video-section">
                    <h3>🎬 Insert Video</h3>

                    <div class="video-type-selector">
                        <button type="button" class="video-type-btn active" onclick="setVideoType('youtube')">YouTube</button>
                        <button type="button" class="video-type-btn" onclick="setVideoType('vimeo')">Vimeo</button>
                        <button type="button" class="video-type-btn" onclick="setVideoType('direct')">Direct URL</button>
                    </div>

                    <div class="video-input-group">
                        <input type="text" id="videoUrl" placeholder="Paste video URL here..."
                               oninput="updateVideoPreview()">
                        <button type="button" class="btn-insert-video" onclick="insertVideo()">
                            ➕ Insert at Top
                        </button>
                    </div>

                    <div class="help-text">
                        <strong>YouTube:</strong> https://youtube.com/watch?v=xxxxx or https://youtu.be/xxxxx<br>
                        <strong>Vimeo:</strong> https://vimeo.com/123456789<br>
                        <strong>Direct:</strong> https://example.com/video.mp4
                    </div>

                    <div class="video-preview" id="videoPreview">
                        <h4>Preview:</h4>
                        <div id="videoPreviewContent"></div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="postContent">✍️ Post Content (Plain Text)</label>
                    <textarea id="postContent" required placeholder="Write your post content here...">${escapeHtml(content)}</textarea>
                    <div class="help-text">
                        💡 Just write plain text. No HTML needed. Line breaks will be preserved.
                    </div>
                </div>

                <div class="button-group">
                    <button type="submit" class="btn btn-primary">💾 Save & Download</button>
                    <button type="button" class="btn btn-secondary" onclick="previewPost()">👁️ Preview</button>
                </div>
            </form>
        `;

        currentVideoUrl = '';

    } catch (error) {
        console.error('Error loading post:', error);
        showMessage('Error loading post content', 'error');
    }
}

// Set video type
function setVideoType(type) {
    videoType = type;
    document.querySelectorAll('.video-type-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    updateVideoPreview();
}

// Update video preview
function updateVideoPreview() {
    const input = document.getElementById('videoUrl').value.trim();
    const preview = document.getElementById('videoPreview');
    const previewContent = document.getElementById('videoPreviewContent');

    currentVideoUrl = input;

    if (!input) {
        preview.style.display = 'none';
        return;
    }

    const embedCode = getVideoEmbedCode(input);

    if (embedCode) {
        preview.style.display = 'block';
        previewContent.innerHTML = embedCode;
    } else {
        preview.style.display = 'none';
    }
}

// Get video embed code
function getVideoEmbedCode(url) {
    if (!url) return '';

    let embedCode = '';

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        embedCode = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 30px 0;">
            <iframe src="https://www.youtube.com/embed/${videoId}"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen></iframe>
        </div>`;
    }
    // Vimeo
    else if (url.includes('vimeo.com/')) {
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            const videoId = vimeoMatch[1];
            embedCode = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 30px 0;">
                <iframe src="https://player.vimeo.com/video/${videoId}"
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        frameborder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowfullscreen></iframe>
            </div>`;
        }
    }
    // Direct video URL
    else if (url.match(/\.(mp4|webm|ogg)$/i)) {
        embedCode = `<div style="margin: 30px 0;">
            <video controls style="width: 100%; max-width: 100%; border-radius: 8px;">
                <source src="${url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>`;
    }

    return embedCode;
}

// Insert video into content
function insertVideo() {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const contentTextarea = document.getElementById('postContent');

    if (!videoUrl) {
        showMessage('Please enter a video URL first', 'error');
        return;
    }

    const embedCode = getVideoEmbedCode(videoUrl);
    if (!embedCode) {
        showMessage('Invalid video URL. Please check the format.', 'error');
        return;
    }

    // Add marker for video in plain text
    const videoMarker = `\n\n[VIDEO: ${videoUrl}]\n\n`;
    contentTextarea.value = videoMarker + contentTextarea.value;

    showMessage('✅ Video will be inserted at the top of your post', 'success');
}

// Convert plain text to HTML
function textToHtml(text) {
    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);

    let html = '';
    for (let para of paragraphs) {
        para = para.trim();
        if (!para) continue;

        // Check if it's a video marker
        const videoMatch = para.match(/\[VIDEO:\s*(.+?)\]/);
        if (videoMatch) {
            const embedCode = getVideoEmbedCode(videoMatch[1]);
            html += embedCode + '\n';
        } else {
            // Regular paragraph - convert single newlines to <br>
            const htmlPara = para.replace(/\n/g, '<br>');
            html += `<p>${htmlPara}</p>\n`;
        }
    }

    return html;
}

// Save post (download since we can't write directly to files from browser)
function savePost(event) {
    event.preventDefault();

    const title = document.getElementById('postTitle').value;
    const description = document.getElementById('postDescription').value;
    const content = document.getElementById('postContent').value;

    // Convert plain text to HTML
    const htmlContent = textToHtml(content);

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

            // Update meta description
            const descMeta = doc.querySelector('meta[name="description"]');
            if (descMeta) descMeta.setAttribute('content', description);

            // Update OG description
            const ogDesc = doc.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', description);

            // Update content
            const contentDiv = doc.querySelector('.post-content');
            if (contentDiv) contentDiv.innerHTML = htmlContent;

            // Download the updated HTML
            const updatedHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
            downloadFile(updatedHtml, currentPost.url.split('/').pop(), 'text/html');

            showMessage('✅ Post saved! Upload the downloaded file to your posts/ folder and push to GitHub.', 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('❌ Error saving post', 'error');
        });
}

// Preview post in new tab
function previewPost() {
    const content = document.getElementById('postContent').value;
    const title = document.getElementById('postTitle').value;
    const htmlContent = textToHtml(content);

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
                    line-height: 1.8;
                }
                h1 { color: #423737; margin-bottom: 30px; }
                p { margin-bottom: 20px; }
                img, video, iframe { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            <h1>${escapeHtml(title)}</h1>
            ${htmlContent}
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
