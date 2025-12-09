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

    // Content is already HTML, use it directly
    const htmlContent = content;

    const escapedTitle = title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    previewPanel.innerHTML = `
        <link rel="stylesheet" href="/blog-post.css">
        <article class="post-container" style="max-width: 800px; margin: 0 auto; padding: 40px 20px; background: white; border-radius: 8px;">
            <h1 class="post-title" contenteditable="true" id="previewTitle" style="outline: 2px dashed transparent; transition: outline 0.2s;" onfocus="this.style.outline='2px dashed #B8D4D4'" onblur="this.style.outline='2px dashed transparent'; syncTitleToEdit()">${escapedTitle}</h1>
            <div class="post-content" contenteditable="true" id="previewContent" style="outline: 2px dashed transparent; transition: outline 0.2s;" onfocus="this.style.outline='2px dashed #B8D4D4'" onblur="this.style.outline='2px dashed transparent'; syncContentToEdit()">
                ${htmlContent}
            </div>
        </article>
    `;
}

// Sync edited preview back to edit mode
function syncTitleToEdit() {
    const previewTitle = document.getElementById('previewTitle');
    const editTitle = document.getElementById('postTitle');
    if (previewTitle && editTitle) {
        editTitle.value = previewTitle.textContent;
    }
}

function syncContentToEdit() {
    const previewContent = document.getElementById('previewContent');
    const editContent = document.getElementById('postContent');
    if (previewContent && editContent) {
        editContent.value = previewContent.innerHTML;
    }
}
