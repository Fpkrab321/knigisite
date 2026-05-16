/**
 * Admin Panel JS — полная версия
 * - Auth guard
 * - Загрузка и отображение книг (FIXED)
 * - CRUD с текстом книги
 * - Редактор изображений
 */
(function () {
    'use strict';

    const TOKEN_KEY = 'adminToken';

    // ---- AUTH GUARD ----
    const token = localStorage.getItem(TOKEN_KEY);
    const authGate = document.getElementById('authGate');
    const adminWrapper = document.getElementById('adminWrapper');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    authGate.style.display = 'none';
    adminWrapper.style.display = 'flex';

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
    });

    // ---- NAVIGATION ----
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            showSection(item.dataset.section);
        });
    });

    window.showSection = function (name) {
        document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const sec = document.getElementById('section-' + name);
        if (sec) sec.style.display = 'block';
        const nav = document.querySelector(`.nav-item[data-section="${name}"]`);
        if (nav) nav.classList.add('active');
        if (name === 'books') loadBooks();
        if (name === 'add') resetForm();
    };

    // ---- LOAD BOOKS ----
    async function loadBooks() {
        const tbody = document.getElementById('adminBooksBody');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#aaa;">Загрузка...</td></tr>';
        try {
            const resp = await fetch('/api/books');
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const books = await resp.json();
            if (!books || books.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#aaa;">Книги не добавлены</td></tr>';
                return;
            }
            tbody.innerHTML = books.map(b => `
                <tr>
                    <td>
                        ${b.imagePath
                            ? `<img src="${b.imagePath}" class="table-thumb" alt="${escHtml(b.title)}"/>`
                            : `<div class="thumb-placeholder">📖</div>`}
                    </td>
                    <td>
                        <div class="table-title">${escHtml(b.title)}</div>
                        <div class="table-author">${escHtml(b.author)}</div>
                    </td>
                    <td>${escHtml(b.genre || '—')}</td>
                    <td>${b.year || '—'}</td>
                    <td>${b.isFeatured ? '<span class="badge-featured">⭐ Да</span>' : '<span class="badge-no">Нет</span>'}</td>
                    <td>${b.hasText ? '<span class="badge-text">✓ Есть</span>' : '<span class="badge-no">Нет</span>'}</td>
                    <td>
                        <div class="action-btns">
                            <button class="edit-btn" onclick="editBook(${b.id})">✏ Изменить</button>
                            <button class="del-btn" onclick="deleteBook(${b.id}, '${escHtml(b.title)}')">🗑 Удалить</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#c0392b;">Ошибка загрузки: ${err.message}</td></tr>`;
        }
    }

    window.deleteBook = async function (id, title) {
        if (!confirm(`Удалить книгу «${title}»?`)) return;
        const resp = await authFetch(`/api/books/${id}`, { method: 'DELETE' });
        if (resp.ok) {
            loadBooks();
        } else {
            alert('Ошибка при удалении');
        }
    };

    window.editBook = async function (id) {
        const resp = await fetch(`/api/books/${id}`);
        const b = await resp.json();
        resetForm();
        showSection('add');
        document.getElementById('formTitle').textContent = 'Редактировать книгу';
        document.getElementById('editBookId').value = b.id;
        document.getElementById('fTitle').value = b.title || '';
        document.getElementById('fAuthor').value = b.author || '';
        document.getElementById('fGenre').value = b.genre || '';
        document.getElementById('fYear').value = b.year || '';
        document.getElementById('fTags').value = b.tags || '';
        document.getElementById('fShortDesc').value = b.shortDescription || '';
        document.getElementById('fDesc').value = b.description || '';
        document.getElementById('fFeatured').checked = !!b.isFeatured;
        const bookText = b.bookText || '';
        document.getElementById('fBookText').value = bookText;
        updateTextCount(bookText.length);
    };

    // ---- TEXT COUNT ----
    const fBookText = document.getElementById('fBookText');
    const textCount = document.getElementById('textCount');

    function updateTextCount(len) {
        textCount.textContent = len.toLocaleString('ru-RU') + ' символов';
    }

    fBookText.addEventListener('input', () => updateTextCount(fBookText.value.length));

    // ---- SAVE BOOK ----
    document.getElementById('bookForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const statusEl = document.getElementById('formStatus');
        const saveBtn = document.getElementById('saveBookBtn');
        saveBtn.disabled = true;
        statusEl.className = 'form-status';
        statusEl.style.display = 'none';

        const formData = new FormData();
        formData.append('title', document.getElementById('fTitle').value.trim());
        formData.append('author', document.getElementById('fAuthor').value.trim());
        formData.append('genre', document.getElementById('fGenre').value.trim());
        formData.append('year', document.getElementById('fYear').value || '0');
        formData.append('tags', document.getElementById('fTags').value.trim());
        formData.append('shortDescription', document.getElementById('fShortDesc').value.trim());
        formData.append('description', document.getElementById('fDesc').value.trim());
        formData.append('isFeatured', document.getElementById('fFeatured').checked);
        formData.append('bookText', document.getElementById('fBookText').value);

        // Image
        const imgBlob = await getEditorBlob();
        if (imgBlob) formData.append('image', imgBlob, 'cover.jpg');

        const editId = document.getElementById('editBookId').value;
        const url = editId ? `/api/books/${editId}` : '/api/books';
        const method = editId ? 'PUT' : 'POST';

        try {
            const resp = await authFetch(url, { method, body: formData });
            if (resp.ok) {
                statusEl.textContent = editId ? '✓ Книга обновлена' : '✓ Книга добавлена';
                statusEl.className = 'form-status success';
                statusEl.style.display = 'block';
                setTimeout(() => showSection('books'), 1200);
            } else {
                const text = await resp.text();
                throw new Error(text || resp.status);
            }
        } catch (err) {
            statusEl.textContent = 'Ошибка: ' + err.message;
            statusEl.className = 'form-status error';
            statusEl.style.display = 'block';
        } finally {
            saveBtn.disabled = false;
        }
    });

    function resetForm() {
        document.getElementById('bookForm').reset();
        document.getElementById('editBookId').value = '';
        document.getElementById('formTitle').textContent = 'Добавить книгу';
        document.getElementById('formStatus').style.display = 'none';
        updateTextCount(0);
        resetEditor();
    }

    // ---- AUTH FETCH ----
    function authFetch(url, opts = {}) {
        const t = localStorage.getItem(TOKEN_KEY);
        opts.headers = opts.headers || {};
        opts.headers['Authorization'] = 'Bearer ' + t;
        return fetch(url, opts);
    }

    // ============================================================
    // IMAGE EDITOR
    // ============================================================
    let editorState = {
        originalImage: null,
        rotation: 0,
        flipH: false,
        cropping: false,
        crop: null,
        canvasW: 0,
        canvasH: 0
    };

    const imageUploadArea = document.getElementById('imageUploadArea');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imageInput = document.getElementById('imageInput');
    const imageEditor = document.getElementById('imageEditor');
    const editorCanvas = document.getElementById('editorCanvas');
    const eCtx = editorCanvas.getContext('2d');
    const previewCanvas = document.getElementById('previewCanvas');
    const pCtx = previewCanvas.getContext('2d');
    const cropOverlay = document.getElementById('cropOverlay');
    const cropBox = document.getElementById('cropBox');

    imageUploadArea.addEventListener('click', () => imageInput.click());
    imageUploadArea.addEventListener('dragover', e => { e.preventDefault(); imageUploadArea.style.borderColor = '#c4913a'; });
    imageUploadArea.addEventListener('dragleave', () => { imageUploadArea.style.borderColor = ''; });
    imageUploadArea.addEventListener('drop', e => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) loadImageFile(file);
    });
    imageInput.addEventListener('change', () => {
        if (imageInput.files[0]) loadImageFile(imageInput.files[0]);
    });

    function loadImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                editorState.originalImage = img;
                editorState.rotation = 0;
                editorState.flipH = false;
                editorState.crop = null;
                uploadPlaceholder.style.display = 'none';
                imageEditor.style.display = 'block';
                redrawEditor();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function redrawEditor() {
        const img = editorState.originalImage;
        if (!img) return;
        const rot = editorState.rotation;
        const absRot = Math.abs(rot) % 180;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (absRot === 90) { [w, h] = [h, w]; }

        // Scale to fit max 480px wide
        const maxW = Math.min(480, window.innerWidth - 100);
        const scale = maxW / w;
        editorCanvas.width = Math.round(w * scale);
        editorCanvas.height = Math.round(h * scale);
        editorState.canvasW = editorCanvas.width;
        editorState.canvasH = editorCanvas.height;

        eCtx.save();
        eCtx.translate(editorCanvas.width / 2, editorCanvas.height / 2);
        eCtx.rotate(rot * Math.PI / 180);
        if (editorState.flipH) eCtx.scale(-1, 1);
        const drawW = Math.round(img.naturalWidth * scale);
        const drawH = Math.round(img.naturalHeight * scale);
        const dx = absRot === 90 ? -drawH / 2 : -drawW / 2;
        const dy = absRot === 90 ? -drawW / 2 : -drawH / 2;
        eCtx.drawImage(img, dx, dy, absRot === 90 ? drawH : drawW, absRot === 90 ? drawW : drawH);
        eCtx.restore();
        updatePreview();
    }

    function updatePreview() {
        pCtx.clearRect(0, 0, 120, 160);
        if (editorState.crop) {
            const { x, y, w, h } = editorState.crop;
            pCtx.drawImage(editorCanvas, x, y, w, h, 0, 0, 120, 160);
        } else {
            pCtx.drawImage(editorCanvas, 0, 0, editorCanvas.width, editorCanvas.height, 0, 0, 120, 160);
        }
    }

    document.getElementById('btnRotateL').addEventListener('click', () => {
        editorState.rotation -= 90; editorState.crop = null; redrawEditor(); stopCrop();
    });
    document.getElementById('btnRotateR').addEventListener('click', () => {
        editorState.rotation += 90; editorState.crop = null; redrawEditor(); stopCrop();
    });
    document.getElementById('btnFlipH').addEventListener('click', () => {
        editorState.flipH = !editorState.flipH; redrawEditor();
    });
    document.getElementById('btnCrop').addEventListener('click', () => {
        editorState.cropping ? stopCrop() : startCrop();
    });
    document.getElementById('btnApply').addEventListener('click', applyCrop);
    document.getElementById('btnRemoveImg').addEventListener('click', resetEditor);

    function startCrop() {
        editorState.cropping = true;
        document.getElementById('btnCrop').textContent = '✕ Отмена';
        document.getElementById('btnApply').style.display = 'inline-flex';
        cropOverlay.style.display = 'block';
        const cw = editorCanvas.offsetWidth, ch = editorCanvas.offsetHeight;
        setCropBoxStyle(Math.round(cw * 0.15), Math.round(ch * 0.15), Math.round(cw * 0.7), Math.round(ch * 0.7));
        initCropDrag();
    }
    function stopCrop() {
        editorState.cropping = false;
        document.getElementById('btnCrop').textContent = '✂ Обрезать';
        document.getElementById('btnApply').style.display = 'none';
        cropOverlay.style.display = 'none';
    }
    function applyCrop() {
        const rect = editorCanvas.getBoundingClientRect();
        const scaleX = editorCanvas.width / rect.width;
        const scaleY = editorCanvas.height / rect.height;
        const box = cropBox.getBoundingClientRect();
        const canvasRect = editorCanvas.getBoundingClientRect();
        editorState.crop = {
            x: Math.round((box.left - canvasRect.left) * scaleX),
            y: Math.round((box.top - canvasRect.top) * scaleY),
            w: Math.round(box.width * scaleX),
            h: Math.round(box.height * scaleY)
        };
        stopCrop();
        updatePreview();
    }
    function setCropBoxStyle(x, y, w, h) {
        cropBox.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
    }
    function initCropDrag() {
        let dragging = false, resizing = null, startX, startY, startL, startT, startW, startH;
        cropBox.onmousedown = (e) => {
            const handle = e.target.closest('.crop-handle');
            if (handle) {
                resizing = ['tl','tr','bl','br'].find(c => handle.classList.contains(c));
                startX = e.clientX; startY = e.clientY;
                startL = cropBox.offsetLeft; startT = cropBox.offsetTop;
                startW = cropBox.offsetWidth; startH = cropBox.offsetHeight;
                e.stopPropagation();
            } else { dragging = true; startX = e.clientX; startY = e.clientY; startL = cropBox.offsetLeft; startT = cropBox.offsetTop; }
            e.preventDefault();
        };
        document.onmousemove = (e) => {
            const dx = e.clientX - startX, dy = e.clientY - startY;
            const maxW = cropOverlay.offsetWidth, maxH = cropOverlay.offsetHeight;
            if (dragging) {
                cropBox.style.left = Math.max(0, Math.min(maxW - cropBox.offsetWidth, startL + dx)) + 'px';
                cropBox.style.top = Math.max(0, Math.min(maxH - cropBox.offsetHeight, startT + dy)) + 'px';
            } else if (resizing) {
                let l = startL, t = startT, w = startW, h = startH;
                if (resizing === 'br') { w = Math.max(40, startW + dx); h = Math.max(40, startH + dy); }
                if (resizing === 'tl') { l = startL + dx; t = startT + dy; w = Math.max(40, startW - dx); h = Math.max(40, startH - dy); }
                if (resizing === 'tr') { t = startT + dy; w = Math.max(40, startW + dx); h = Math.max(40, startH - dy); }
                if (resizing === 'bl') { l = startL + dx; w = Math.max(40, startW - dx); h = Math.max(40, startH + dy); }
                setCropBoxStyle(l, t, w, h);
            }
        };
        document.onmouseup = () => { dragging = false; resizing = null; };
    }
    function resetEditor() {
        editorState = { originalImage: null, rotation: 0, flipH: false, cropping: false, crop: null, canvasW: 0, canvasH: 0 };
        uploadPlaceholder.style.display = 'flex';
        imageEditor.style.display = 'none';
        stopCrop();
        eCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
        pCtx.clearRect(0, 0, 120, 160);
        imageInput.value = '';
    }
    async function getEditorBlob() {
        if (!editorState.originalImage) return null;
        return new Promise(resolve => {
            const tmp = document.createElement('canvas');
            const tCtx = tmp.getContext('2d');
            if (editorState.crop) {
                const { x, y, w, h } = editorState.crop;
                tmp.width = w; tmp.height = h;
                tCtx.drawImage(editorCanvas, x, y, w, h, 0, 0, w, h);
            } else {
                tmp.width = editorCanvas.width; tmp.height = editorCanvas.height;
                tCtx.drawImage(editorCanvas, 0, 0);
            }
            tmp.toBlob(blob => resolve(blob), 'image/jpeg', 0.88);
        });
    }

    // ---- HELPERS ----
    function escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ---- INIT ----
    loadBooks();
    showSection('books');

})();
