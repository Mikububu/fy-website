// Editor tab switching for preview mode
function switchEditorTab(event, mode) {
    event.preventDefault();
    document.querySelectorAll('.editor-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    const editForm = document.getElementById('editForm');
    let previewPanel = document.getElementById('previewPanel');

    if (mode === 'preview') {
        if (editForm) editForm.style.display = 'none';

        if (!previewPanel) {
            previewPanel = document.createElement('div');
            previewPanel.id = 'previewPanel';
            previewPanel.className = 'preview-panel';
            editForm.parentNode.insertBefore(previewPanel, editForm.nextSibling);
        } else {
            previewPanel.style.display = 'block';
        }
        updateLivePreview();
    } else {
        if (editForm) editForm.style.display = 'block';
        if (previewPanel) previewPanel.style.display = 'none';
    }
}

// Update live preview with current content
async function updateLivePreview() {
    const previewPanel = document.getElementById('previewPanel');
    if (!previewPanel) return;

    const title = document.getElementById('postTitle')?.value || '';
    const content = document.getElementById('postContent')?.value || '';

    // Convert plain text to HTML paragraphs
    const htmlContent = content
        .split('\n\n')
        .filter(p => p.trim())
        .map(p => {
            const escaped = p.trim()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            return `<p>${escaped}</p>`;
        })
        .join('\n');

    const escapedTitle = title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    previewPanel.innerHTML = `
        <link rel="stylesheet" href="/blog-post.css">
        <article class="post-container" style="max-width: 800px; margin: 0 auto; padding: 40px 20px; background: white; border-radius: 8px;">
            <h1 class="post-title">${escapedTitle}</h1>
            <div class="post-content">
                ${htmlContent}
            </div>
        </article>
    `;
}
