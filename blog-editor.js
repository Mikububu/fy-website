// Forbidden Yoga Blog Editor
let allPosts = [];
let currentPost = null;
let uploadedFiles = [];

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    setupSearchFilter();
});

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

function renderPostList(posts) {
    const postList = document.getElementById('postList');

    if (posts.length === 0) {
        postList.innerHTML = '<li class="empty-state">No posts found</li>';
        return;
    }

    postList.innerHTML = posts.map((post, index) => `
        <li class="post-item" data-index="${index}" onclick="selectPost(${index})">
            <div class="post-item-title">${escapeHtml(post.title || 'Untitled')}</div>
            <div class="post-item-meta">${formatDate(post.date)}</div>
        </li>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

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

async function selectPost(index) {
    currentPost = allPosts[index];
    uploadedFiles = [];

    document.querySelectorAll('.post-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-index="${index}"]`).classList.add('active');

    await loadPostContent(currentPost);
}

async function loadPostContent(post) {
    const editorContent = document.getElementById('editorContent');

    try {
        const response = await fetch(post.url);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const contentDiv = doc.querySelector('.post-content');
        const titleElement = doc.querySelector('.post-title');

        const title = titleElement ? titleElement.textContent : post.title;
        const content = contentDiv ? contentDiv.innerText : '';

        editorContent.innerHTML = `
            <div id="statusMessage" class="status-message"></div>

            <h2>Edit: ${escapeHtml(title)}</h2>

            <form id="editForm" onsubmit="savePost(event)">
                <div class="form-group">
                    <label for="postTitle">📝 Post Title</label>
                    <input type="text" id="postTitle" value="${escapeHtml(title)}" required>
                </div>

                <div class="form-group">
                    <label for="postDescription">📄 Short Description</label>
                    <input type="text" id="postDescription" value="${escapeHtml(post.description || '')}"
                           placeholder="Brief description for blog cards" required>
                </div>

                <div class="media-section">
                    <h3>🎬 Add Media</h3>

                    <div class="media-tabs">
                        <button type="button" class="media-tab active" onclick="switchMediaTab(event, 'youtube')">
                            YouTube
                        </button>
                        <button type="button" class="media-tab" onclick="switchMediaTab(event, 'vimeo')">
                            Vimeo
                        </button>
                        <button type="button" class="media-tab" onclick="switchMediaTab(event, 'spotify')">
                            Spotify
                        </button>
                        <button type="button" class="media-tab" onclick="switchMediaTab(event, 'other')">
                            Other Video
                        </button>
                        <button type="button" class="media-tab" onclick="switchMediaTab(event, 'upload')">
                            Upload File
                        </button>
                    </div>

                    <div id="mediaContent">
                        <!-- YouTube tab (default) -->
                        <div class="media-input-group">
                            <input type="text" id="mediaUrl"
                                   placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=xxxxx)"
                                   oninput="updatePreview()">
                            <button type="button" class="btn-insert" onclick="insertMedia()">
                                ➕ Insert
                            </button>
                        </div>

                        <div class="help-text">
                            <strong>YouTube:</strong> https://youtube.com/watch?v=xxxxx or https://youtu.be/xxxxx<br>
                            <strong>Vimeo:</strong> https://vimeo.com/123456789<br>
                            <strong>Spotify:</strong> Copy embed code or playlist/track URL<br>
                            <strong>Other:</strong> Direct video URL (.mp4, .webm) or embed iframe code
                        </div>

                        <div class="upload-area" id="uploadArea" style="display: none;"
                             onclick="document.getElementById('fileInput').click()"
                             ondrop="handleDrop(event)" ondragover="handleDragOver(event)"
                             ondragleave="handleDragLeave(event)">
                            <div class="upload-icon">📤</div>
                            <div class="upload-text">Click to upload or drag & drop</div>
                            <div class="upload-subtext">Support: Video (MP4, WebM), Audio (MP3), Images (JPG, PNG)</div>
                            <input type="file" id="fileInput" style="display: none;"
                                   accept="video/*,audio/*,image/*" onchange="handleFileSelect(event)">
                        </div>

                        <div class="preview-area" id="previewArea">
                            <h4>Preview:</h4>
                            <div id="previewContent"></div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="postContent">✍️ Post Content</label>
                    <textarea id="postContent" required
                              placeholder="Write your post content here. Plain text works great!">${escapeHtml(content)}</textarea>
                    <div class="help-text">
                        Write naturally. Line breaks will be preserved. Media will be inserted where you placed them.
                    </div>
                </div>

                <div class="button-group">
                    <button type="submit" class="btn btn-primary">💾 Save & Download</button>
                    <button type="button" class="btn btn-secondary" onclick="previewPost()">👁️ Preview</button>
                    <button type="button" class="btn btn-secondary" onclick="resetForm()">🔄 Reset</button>
                </div>
            </form>
        `;

    } catch (error) {
        console.error('Error loading post:', error);
        showMessage('Error loading post content', 'error');
    }
}

let currentMediaType = 'jwplayer';

function switchMediaTab(event, type) {
    event.preventDefault();
    currentMediaType = type;

    document.querySelectorAll('.media-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    const uploadArea = document.getElementById('uploadArea');
    const mediaInput = document.getElementById('mediaUrl');
    const inputGroup = mediaInput.parentElement;

    if (type === 'upload') {
        uploadArea.style.display = 'block';
        inputGroup.style.display = 'none';
    } else {
        uploadArea.style.display = 'none';
        inputGroup.style.display = 'flex';

        // Update placeholder
        const placeholders = {
            jwplayer: 'Paste JW Player embed code or iframe URL (from JW Player dashboard)',
            youtube: 'Paste YouTube URL (e.g., https://youtube.com/watch?v=xxxxx)',
            vimeo: 'Paste Vimeo URL (e.g., https://vimeo.com/123456789)',
            spotify: 'Paste Spotify embed code or URL',
            other: 'Paste video URL (.mp4) or iframe embed code'
        };
        mediaInput.placeholder = placeholders[type] || '';
        mediaInput.value = '';
        document.getElementById('previewArea').style.display = 'none';
    }
}

function updatePreview() {
    const url = document.getElementById('mediaUrl').value.trim();
    const previewArea = document.getElementById('previewArea');
    const previewContent = document.getElementById('previewContent');

    if (!url) {
        previewArea.style.display = 'none';
        return;
    }

    const embedCode = getEmbedCode(url, currentMediaType);

    if (embedCode) {
        previewArea.style.display = 'block';
        previewContent.innerHTML = embedCode;
    } else {
        previewArea.style.display = 'none';
    }
}

function getEmbedCode(url, type) {
    if (!url) return '';

    let embedCode = '';

    if (type === 'jwplayer') {
        // JW Player supports both iframe embeds and script embeds
        if (url.includes('<iframe') && url.includes('jwplatform')) {
            // Already an iframe embed - use as is
            embedCode = `<div style="margin: 30px 0;">${url}</div>`;
        } else if (url.includes('<script') && url.includes('jwplayer')) {
            // Script embed from JW Player
            embedCode = `<div style="margin: 30px 0;">${url}</div>`;
        } else if (url.includes('jwplatform.com') || url.includes('cdn.jwplayer.com')) {
            // Direct iframe URL
            embedCode = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 30px 0;">
                <iframe src="${url}"
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        frameborder="0" scrolling="auto" allowfullscreen></iframe>
            </div>`;
        }
    } else if (type === 'youtube') {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (match) {
            const videoId = match[1];
            embedCode = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 30px 0;">
                <iframe src="https://www.youtube.com/embed/${videoId}"
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen></iframe>
            </div>`;
        }
    } else if (type === 'vimeo') {
        const match = url.match(/vimeo\.com\/(\d+)/);
        if (match) {
            const videoId = match[1];
            embedCode = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 30px 0;">
                <iframe src="https://player.vimeo.com/video/${videoId}"
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
            </div>`;
        }
    } else if (type === 'spotify') {
        // Check if it's an embed code
        if (url.includes('<iframe') && url.includes('spotify')) {
            embedCode = url;
        } else {
            // Try to convert Spotify URL to embed
            const trackMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
            const playlistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
            const albumMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);

            if (trackMatch) {
                embedCode = `<iframe style="border-radius:12px; margin: 30px 0;" src="https://open.spotify.com/embed/track/${trackMatch[1]}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
            } else if (playlistMatch) {
                embedCode = `<iframe style="border-radius:12px; margin: 30px 0;" src="https://open.spotify.com/embed/playlist/${playlistMatch[1]}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
            } else if (albumMatch) {
                embedCode = `<iframe style="border-radius:12px; margin: 30px 0;" src="https://open.spotify.com/embed/album/${albumMatch[1]}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
            }
        }
    } else if (type === 'other') {
        // Check if it's already an iframe
        if (url.includes('<iframe')) {
            embedCode = url;
        } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
            embedCode = `<div style="margin: 30px 0;">
                <video controls style="width: 100%; max-width: 100%; border-radius: 8px;">
                    <source src="${url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>`;
        }
    }

    return embedCode;
}

function insertMedia() {
    const url = document.getElementById('mediaUrl').value.trim();
    const contentTextarea = document.getElementById('postContent');

    if (!url) {
        showMessage('Please enter a URL first', 'error');
        return;
    }

    const embedCode = getEmbedCode(url, currentMediaType);
    if (!embedCode) {
        showMessage('Invalid URL or format. Please check and try again.', 'error');
        return;
    }

    // Add marker for media in plain text
    const mediaMarker = `\n\n[MEDIA:${currentMediaType}:${url}]\n\n`;
    contentTextarea.value = mediaMarker + contentTextarea.value;

    showMessage('✅ Media inserted at the top of your post', 'success');
    document.getElementById('mediaUrl').value = '';
    document.getElementById('previewArea').style.display = 'none';
}

// File upload handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        const dataUrl = e.target.result;
        const previewArea = document.getElementById('previewArea');
        const previewContent = document.getElementById('previewContent');

        let preview = '';
        const fileName = file.name;

        if (file.type.startsWith('video/')) {
            preview = `<video controls style="max-width: 100%; border-radius: 8px;"><source src="${dataUrl}"></video>`;
        } else if (file.type.startsWith('audio/')) {
            preview = `<audio controls style="width: 100%;"><source src="${dataUrl}"></audio>`;
        } else if (file.type.startsWith('image/')) {
            preview = `<img src="${dataUrl}" style="max-width: 100%; border-radius: 8px;">`;
        }

        if (preview) {
            previewArea.style.display = 'block';
            previewContent.innerHTML = preview;

            // Store file data
            uploadedFiles.push({
                name: fileName,
                type: file.type,
                dataUrl: dataUrl
            });

            // Insert into content
            const contentTextarea = document.getElementById('postContent');
            const mediaMarker = `\n\n[FILE:${fileName}]\n\n`;
            contentTextarea.value = mediaMarker + contentTextarea.value;

            showMessage(`✅ File "${fileName}" uploaded and inserted`, 'success');
        }
    };

    reader.readAsDataURL(file);
}

// Convert content with media markers to HTML
function contentToHtml(text) {
    const lines = text.split(/\n\n+/);
    let html = '';

    for (let block of lines) {
        block = block.trim();
        if (!block) continue;

        // Check for media marker
        const mediaMatch = block.match(/\[MEDIA:([^:]+):(.+?)\]/);
        if (mediaMatch) {
            const type = mediaMatch[1];
            const url = mediaMatch[2];
            const embedCode = getEmbedCode(url, type);
            html += embedCode + '\n';
            continue;
        }

        // Check for file marker
        const fileMatch = block.match(/\[FILE:(.+?)\]/);
        if (fileMatch) {
            const fileName = fileMatch[1];
            const file = uploadedFiles.find(f => f.name === fileName);
            if (file) {
                if (file.type.startsWith('video/')) {
                    html += `<div style="margin: 30px 0;"><video controls style="width: 100%; border-radius: 8px;"><source src="${file.dataUrl}"></video></div>\n`;
                } else if (file.type.startsWith('audio/')) {
                    html += `<div style="margin: 30px 0;"><audio controls style="width: 100%;"><source src="${file.dataUrl}"></audio></div>\n`;
                } else if (file.type.startsWith('image/')) {
                    html += `<div style="margin: 30px 0;"><img src="${file.dataUrl}" style="max-width: 100%; border-radius: 8px; height: auto;"></div>\n`;
                }
            }
            continue;
        }

        // Regular paragraph
        const htmlPara = block.replace(/\n/g, '<br>');
        html += `<p>${htmlPara}</p>\n`;
    }

    return html;
}

function savePost(event) {
    event.preventDefault();

    const title = document.getElementById('postTitle').value;
    const description = document.getElementById('postDescription').value;
    const content = document.getElementById('postContent').value;

    const htmlContent = contentToHtml(content);

    fetch(currentPost.url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Update all elements
            const titleElement = doc.querySelector('.post-title');
            if (titleElement) titleElement.textContent = title;

            const pageTitle = doc.querySelector('title');
            if (pageTitle) pageTitle.textContent = `${title} | Forbidden Yoga`;

            const descMeta = doc.querySelector('meta[name="description"]');
            if (descMeta) descMeta.setAttribute('content', description);

            const ogDesc = doc.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', description);

            const twitterDesc = doc.querySelector('meta[property="twitter:description"]');
            if (twitterDesc) twitterDesc.setAttribute('content', description);

            const contentDiv = doc.querySelector('.post-content');
            if (contentDiv) contentDiv.innerHTML = htmlContent;

            const updatedHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
            downloadFile(updatedHtml, currentPost.url.split('/').pop(), 'text/html');

            showMessage('✅ Post saved! Upload the file to posts/ folder and push to GitHub.', 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('❌ Error saving post', 'error');
        });
}

function previewPost() {
    const content = document.getElementById('postContent').value;
    const title = document.getElementById('postTitle').value;
    const htmlContent = contentToHtml(content);

    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${escapeHtml(title)} - Preview</title>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@400&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Roboto', sans-serif;
                    max-width: 900px;
                    margin: 40px auto;
                    padding: 40px;
                    background: #f3f2de;
                    color: #2a2a2a;
                    line-height: 1.8;
                }
                h1 {
                    font-family: 'Playfair Display', serif;
                    color: #423737;
                    margin-bottom: 30px;
                    font-size: 2.5rem;
                }
                p {
                    margin-bottom: 20px;
                    font-size: 1.05rem;
                }
                img, video, iframe, audio {
                    max-width: 100%;
                    height: auto;
                    display: block;
                }
            </style>
        </head>
        <body>
            <h1>${escapeHtml(title)}</h1>
            ${htmlContent}
        </body>
        </html>
    `);
}

function resetForm() {
    if (confirm('Reset form and reload original content?')) {
        selectPost(allPosts.indexOf(currentPost));
    }
}

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

function showMessage(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 6000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
