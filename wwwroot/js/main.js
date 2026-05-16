/**
 * Main site JS: filters, card expand, reader modal
 */
(function () {
    'use strict';

    // ---- FILTER ----
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.book-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const genre = btn.dataset.genre;
            cards.forEach(card => {
                if (genre === 'all' || card.dataset.genre === genre) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ---- CARD EXPAND ----
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.book-card');
            const id = card.dataset.id;
            const expanded = document.getElementById('expanded-' + id);
            if (expanded) expanded.style.display = 'block';
        });
    });
    document.querySelectorAll('.collapse-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.book-expanded').style.display = 'none';
        });
    });

    // ---- READER ----
    const overlay = document.getElementById('readerOverlay');
    const readerTitle = document.getElementById('readerTitle');
    const readerAuthor = document.getElementById('readerAuthor');
    const readerContent = document.getElementById('readerContent');
    const readerLoading = document.getElementById('readerLoading');
    const readerProgress = document.getElementById('readerProgress');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageDots = document.getElementById('pageDots');

    const CHARS_PER_PAGE = 2200;
    let pages = [];
    let currentPage = 0;
    let fontSize = 17;
    let currentTheme = 'sepia';

    function openReader(bookId) {
        overlay.classList.add('open');
        readerLoading.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        fetch('/api/books/' + bookId + '/text')
            .then(r => r.json())
            .then(data => {
                readerTitle.textContent = data.title;
                readerAuthor.textContent = data.author;
                readerLoading.style.display = 'none';

                if (!data.text || data.text.trim().length === 0) {
                    readerContent.innerHTML = `
                        <div class="reader-no-text">
                            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                                <rect width="80" height="80" rx="12" fill="#e8dfd0"/>
                                <rect x="18" y="24" width="44" height="4" rx="2" fill="#c4a882"/>
                                <rect x="18" y="34" width="35" height="3" rx="2" fill="#d4c4b0"/>
                                <rect x="18" y="44" width="40" height="3" rx="2" fill="#d4c4b0"/>
                            </svg>
                            <h3>Текст не добавлен</h3>
                            <p>Администратор ещё не добавил текст этой книги</p>
                        </div>`;
                    pages = [];
                    renderPagination();
                    return;
                }

                // Split into pages
                const text = data.text;
                pages = [];
                for (let i = 0; i < text.length; i += CHARS_PER_PAGE) {
                    pages.push(text.slice(i, i + CHARS_PER_PAGE));
                }
                currentPage = 0;
                renderPage();
                renderPagination();
            })
            .catch(() => {
                readerLoading.style.display = 'none';
                readerContent.textContent = 'Ошибка загрузки книги.';
            });
    }

    function renderPage() {
        if (!pages.length) return;
        const text = pages[currentPage] || '';
        readerContent.style.fontSize = fontSize + 'px';
        readerContent.textContent = text;
        // Apply theme class
        readerContent.className = 'reader-content theme-' + currentTheme;
        readerContent.style.fontSize = fontSize + 'px';

        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = currentPage >= pages.length - 1;
        readerProgress.textContent = `Страница ${currentPage + 1} из ${pages.length}`;

        // Scroll to top
        document.querySelector('.reader-body').scrollTop = 0;

        updateDots();
    }

    function renderPagination() {
        pageDots.innerHTML = '';
        const max = Math.min(pages.length, 20);
        for (let i = 0; i < max; i++) {
            const dot = document.createElement('div');
            dot.className = 'page-dot' + (i === currentPage ? ' active' : '');
            dot.addEventListener('click', () => { currentPage = i; renderPage(); });
            pageDots.appendChild(dot);
        }
        if (pages.length === 0) {
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            readerProgress.textContent = '';
        }
    }

    function updateDots() {
        const dots = pageDots.querySelectorAll('.page-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === currentPage));
    }

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 0) { currentPage--; renderPage(); }
    });
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < pages.length - 1) { currentPage++; renderPage(); }
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        if (!overlay.classList.contains('open')) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            if (currentPage < pages.length - 1) { currentPage++; renderPage(); }
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            if (currentPage > 0) { currentPage--; renderPage(); }
        }
        if (e.key === 'Escape') closeReader();
    });

    // Font size
    document.getElementById('fontMinus').addEventListener('click', () => {
        if (fontSize > 12) { fontSize -= 2; readerContent.style.fontSize = fontSize + 'px'; }
    });
    document.getElementById('fontPlus').addEventListener('click', () => {
        if (fontSize < 26) { fontSize += 2; readerContent.style.fontSize = fontSize + 'px'; }
    });

    // Themes
    document.querySelectorAll('.reader-theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.reader-theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTheme = btn.dataset.theme;
            readerContent.className = 'reader-content theme-' + currentTheme;
            readerContent.style.fontSize = fontSize + 'px';
        });
    });

    // Close
    function closeReader() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        pages = [];
        readerContent.textContent = '';
    }
    document.getElementById('readerClose').addEventListener('click', closeReader);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeReader(); });

    // Open reader from read buttons
    document.querySelectorAll('.read-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            openReader(btn.dataset.id);
        });
    });

})();
