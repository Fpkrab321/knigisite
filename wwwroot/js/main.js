/**
 * Main JS for public book catalog page
 */
(function () {
    'use strict';

    // ---- FILTER ----
    const filterBtns = document.querySelectorAll('.filter-btn');
    const grid = document.getElementById('booksGrid');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const genre = btn.dataset.genre;
            const cards = grid.querySelectorAll('.book-card');
            cards.forEach(card => {
                if (genre === 'all' || card.dataset.genre === genre) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                    // If this card was expanded, collapse it
                    collapseCard(card);
                }
            });
        });
    });

    // ---- EXPAND / COLLAPSE ----
    grid.addEventListener('click', e => {
        // Expand
        const expandBtn = e.target.closest('.expand-btn');
        if (expandBtn) {
            const card = expandBtn.closest('.book-card');
            expandCard(card);
            return;
        }
        // Collapse
        const collapseBtn = e.target.closest('.collapse-btn');
        if (collapseBtn) {
            const card = collapseBtn.closest('.book-card');
            collapseCard(card);
        }
    });

    function expandCard(card) {
        // Collapse any other open card first
        grid.querySelectorAll('.book-card.expanded-card').forEach(c => {
            if (c !== card) collapseCard(c);
        });

        const id = card.dataset.id;
        const front = card.querySelector('.book-front');
        const expanded = card.querySelector('.book-expanded');

        card.classList.add('expanded-card');
        front.style.display = 'none';
        expanded.style.display = 'block';

        // Scroll card into view
        setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    function collapseCard(card) {
        const front = card.querySelector('.book-front');
        const expanded = card.querySelector('.book-expanded');
        if (!expanded || expanded.style.display === 'none') return;

        card.classList.remove('expanded-card');
        front.style.display = '';
        expanded.style.display = 'none';
    }

    // ---- STAGGER ENTRANCE ANIMATION ----
    const cards = grid.querySelectorAll('.book-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 80 + i * 70);
    });
})();
