/**
 * Admin Panel JS
 * - Auth guard
 * - Book CRUD
 * - Interactive image editor (crop, rotate, flip)
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
        const resp = await fetch('/api/books');
        const books = await resp.json();
        const tbody = document.getElementById('adminBooksBody');
        if (!books.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:#aaa;">Книги не добавлены</td></tr>';
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
                <td>${escHtml(b.genre)}</td>
                <td>${b.year || '—'}</td>
                <td>${b.isFeatured ? '<span class="badge-featured">⭐ Да</span>' : '<span class="badge-no">Нет</span>'}</td>
                <td>
                    <div class="action-btns">
                        <button class="edit-btn" onclick="editBook(${b.id})">✏ Изменить</button>
                        <button class="del-btn" onclick="deleteBook(${b.id}, '${escHtml(b.title)}')">🗑 Удалить</button>
                    </div>
                </td>
            </tr>
        `).join('');
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
        document.getElementById('fTitle').value = b.title;
        document.getElementById('fAuthor').value = b.author;
        document.getElementById('fGenre').value = b.genre;
        document.getElementById('fYear').value = b.year;
        document.getElementById('fTags').value = b.tags || '';
        document.getElementById('fFeatured').checked = b.isFeatured;
        document.getElementById('fShortDesc').value = b.shortDescription;
        document.getElementById('fDesc').value = b.description;
        if (b.imagePath) {
            loadImageToEditor(b.imagePath);
        }
    };

    // ---- FORM ----
    function resetForm() {
        document.getElementById('formTitle').textContent = 'Добавить книгу';
        document.getElementById('bookForm').reset();
        document.getElementById('editBookId').value = '';
        document.getElementById('formStatus').className = 'form-status';
        document.getElementById('formStatus').textContent = '';
        resetEditor();
    }

    document.getElementById('bookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('formStatus');
        statusEl.className = 'form-status';
        statusEl.textContent = '';

        const id = document.getElementById('editBookId').value;
        const fd = new FormData();
        fd.append('title', document.getElementById('fTitle').value);
        fd.append('author', document.getElementById('fAuthor').value);
        fd.append('genre', document.getElementById('fGenre').value);
        fd.append('year', document.getElementById('fYear').value || 0);
        fd.append('tags', document.getElementById('fTags').value);
        fd.append('isFeatured', document.getElementById('fFeatured').checked);
        fd.append('shortDescription', document.getElementById('fShortDesc').value);
        fd.append('description', document.getElementById('fDesc').value);

        // Attach processed image if any
        const imgBlob = await getEditorBlob();
        if (imgBlob) {
            fd.append('image', imgBlob, 'cover.jpg');
        }

        const url = id ? `/api/books/${id}` : '/api/books';
        const method = id ? 'PUT' : 'POST';

        try {
            const resp = await authFetch(url, { method, body: fd });
            if (resp.ok) {
                statusEl.textContent = id ? 'Книга успешно обновлена!' : 'Книга успешно добавлена!';
                statusEl.className = 'form-status success';
                setTimeout(() => showSection('books'), 1200);
            } else {
                const err = await resp.json().catch(() => ({}));
                statusEl.textContent = err.message || 'Ошибка сохранения';
                statusEl.className = 'form-status error';
            }
        } catch {
            statusEl.textContent = 'Ошибка соединения с сервером';
            statusEl.className = 'form-status error';
        }
    });

    // ---- AUTH FETCH ----
    async function authFetch(url, opts = {}) {
        const headers = opts.headers || {};
        headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { ...opts, headers });
    }

    // ---- IMAGE EDITOR ----
    const imageInput = document.getElementById('imageInput');
    const uploadArea = document.getElementById('imageUploadArea');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imageEditor = document.getElementById('imageEditor');
    const editorCanvas = document.getElementById('editorCanvas');
    const previewCanvas = document.getElementById('previewCanvas');
    const eCtx = editorCanvas.getContext('2d');
    const pCtx = previewCanvas.getContext('2d');
    const cropOverlay = document.getElementById('cropOverlay');
    const cropBox = document.getElementById('cropBox');

    let editorState = {
        originalImage: null,
        currentImage: null,  // HTMLImageElement or ImageData
        rotation: 0,
        flipH: false,
        cropping: false,
        crop: null, // {x, y, w, h} in canvas pixels
        canvasW: 0,
        canvasH: 0
    };

    // Click on upload area
    uploadArea.addEventListener('click', () => imageInput.click());

    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--gold)';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--birch-bark)';
    });
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--birch-bark)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) loadFileToEditor(file);
    });

    imageInput.addEventListener('change', () => {
        if (imageInput.files[0]) loadFileToEditor(imageInput.files[0]);
    });

    function loadFileToEditor(file) {
        const url = URL.createObjectURL(file);
        loadImageToEditor(url);
    }

    function loadImageToEditor(src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            editorState.originalImage = img;
            editorState.rotation = 0;
            editorState.flipH = false;
            editorState.crop = null;
            editorState.cropping = false;
            uploadPlaceholder.style.display = 'none';
            imageEditor.style.display = 'block';
            redrawEditor();
        };
        img.src = src;
    }

    function redrawEditor() {
        const img = editorState.originalImage;
        if (!img) return;

        // Calculate canvas size (fit within 600x500)
        let w = img.naturalWidth, h = img.naturalHeight;
        const maxW = 580, maxH = 480;
        if (w > maxW || h > maxH) {
            const scale = Math.min(maxW / w, maxH / h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
        }

        // Apply rotation
        const rot = ((editorState.rotation % 360) + 360) % 360;
        if (rot === 90 || rot === 270) {
            editorCanvas.width = h;
            editorCanvas.height = w;
        } else {
            editorCanvas.width = w;
            editorCanvas.height = h;
        }

        editorState.canvasW = editorCanvas.width;
        editorState.canvasH = editorCanvas.height;

        eCtx.save();
        eCtx.translate(editorCanvas.width / 2, editorCanvas.height / 2);
        eCtx.rotate(rot * Math.PI / 180);
        if (editorState.flipH) eCtx.scale(-1, 1);
        eCtx.drawImage(img, -w / 2, -h / 2, w, h);
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

    // Rotate buttons
    document.getElementById('btnRotateL').addEventListener('click', () => {
        editorState.rotation -= 90;
        editorState.crop = null;
        redrawEditor();
        stopCrop();
    });
    document.getElementById('btnRotateR').addEventListener('click', () => {
        editorState.rotation += 90;
        editorState.crop = null;
        redrawEditor();
        stopCrop();
    });

    document.getElementById('btnFlipH').addEventListener('click', () => {
        editorState.flipH = !editorState.flipH;
        redrawEditor();
    });

    // Crop toggle
    document.getElementById('btnCrop').addEventListener('click', () => {
        if (editorState.cropping) {
            stopCrop();
        } else {
            startCrop();
        }
    });

    document.getElementById('btnApply').addEventListener('click', () => {
        applyCrop();
    });

    document.getElementById('btnRemoveImg').addEventListener('click', () => {
        resetEditor();
    });

    function startCrop() {
        editorState.cropping = true;
        document.getElementById('btnCrop').textContent = '✕ Отмена обрезки';
        document.getElementById('btnApply').style.display = 'inline-flex';
        cropOverlay.style.display = 'block';

        // Init crop box to 70% of canvas
        const cw = editorCanvas.offsetWidth;
        const ch = editorCanvas.offsetHeight;
        const x = Math.round(cw * 0.15);
        const y = Math.round(ch * 0.15);
        const w = Math.round(cw * 0.7);
        const h = Math.round(ch * 0.7);
        setCropBoxStyle(x, y, w, h);
        initCropDrag();
    }

    function stopCrop() {
        editorState.cropping = false;
        document.getElementById('btnCrop').textContent = '✂ Обрезать';
        document.getElementById('btnApply').style.display = 'none';
        cropOverlay.style.display = 'none';
    }

    function applyCrop() {
        // Map crop box from display pixels to canvas pixels
        const rect = editorCanvas.getBoundingClientRect();
        const scaleX = editorCanvas.width / rect.width;
        const scaleY = editorCanvas.height / rect.height;

        const box = cropBox.getBoundingClientRect();
        const canvasRect = editorCanvas.getBoundingClientRect();

        const x = Math.round((box.left - canvasRect.left) * scaleX);
        const y = Math.round((box.top - canvasRect.top) * scaleY);
        const w = Math.round(box.width * scaleX);
        const h = Math.round(box.height * scaleY);

        editorState.crop = { x, y, w, h };
        stopCrop();
        updatePreview();
    }

    function setCropBoxStyle(x, y, w, h) {
        cropBox.style.left = x + 'px';
        cropBox.style.top = y + 'px';
        cropBox.style.width = w + 'px';
        cropBox.style.height = h + 'px';
    }

    // Drag crop box
    function initCropDrag() {
        let dragging = false, resizing = null;
        let startX, startY, startL, startT, startW, startH;

        cropBox.onmousedown = (e) => {
            const handle = e.target.closest('.crop-handle');
            if (handle) {
                resizing = handle.className.split(' ').find(c => ['tl','tr','bl','br'].includes(c));
                startX = e.clientX; startY = e.clientY;
                startL = cropBox.offsetLeft; startT = cropBox.offsetTop;
                startW = cropBox.offsetWidth; startH = cropBox.offsetHeight;
                e.stopPropagation();
            } else {
                dragging = true;
                startX = e.clientX; startY = e.clientY;
                startL = cropBox.offsetLeft; startT = cropBox.offsetTop;
            }
            e.preventDefault();
        };

        document.onmousemove = (e) => {
            const dx = e.clientX - startX, dy = e.clientY - startY;
            const maxW = cropOverlay.offsetWidth, maxH = cropOverlay.offsetHeight;

            if (dragging) {
                let newL = Math.max(0, Math.min(maxW - cropBox.offsetWidth, startL + dx));
                let newT = Math.max(0, Math.min(maxH - cropBox.offsetHeight, startT + dy));
                cropBox.style.left = newL + 'px';
                cropBox.style.top = newT + 'px';
            } else if (resizing) {
                let l = startL, t = startT, w = startW, h = startH;
                if (resizing === 'br') { w = Math.max(40, startW + dx); h = Math.max(40, startH + dy); }
                if (resizing === 'tl') { l = startL + dx; t = startT + dy; w = Math.max(40, startW - dx); h = Math.max(40, startH - dy); }
                if (resizing === 'tr') { t = startT + dy; w = Math.max(40, startW + dx); h = Math.max(40, startH - dy); }
                if (resizing === 'bl') { l = startL + dx; w = Math.max(40, startW - dx); h = Math.max(40, startH + dy); }
                cropBox.style.left = l + 'px';
                cropBox.style.top = t + 'px';
                cropBox.style.width = w + 'px';
                cropBox.style.height = h + 'px';
            }
        };

        document.onmouseup = () => { dragging = false; resizing = null; };
    }

    function resetEditor() {
        editorState = {
            originalImage: null, currentImage: null,
            rotation: 0, flipH: false,
            cropping: false, crop: null, canvasW: 0, canvasH: 0
        };
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
            const tmpCanvas = document.createElement('canvas');
            const tmpCtx = tmpCanvas.getContext('2d');

            if (editorState.crop) {
                const { x, y, w, h } = editorState.crop;
                tmpCanvas.width = w;
                tmpCanvas.height = h;
                tmpCtx.drawImage(editorCanvas, x, y, w, h, 0, 0, w, h);
            } else {
                tmpCanvas.width = editorCanvas.width;
                tmpCanvas.height = editorCanvas.height;
                tmpCtx.drawImage(editorCanvas, 0, 0);
            }

            tmpCanvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.88);
        });
    }

    // ---- HELPERS ----
    function escHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ---- INIT ----
    loadBooks();
    showSection('books');

})();
