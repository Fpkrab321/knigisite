/**
 * Animated falling leaves — forest atmosphere
 */
(function () {
    const canvas = document.getElementById('leafCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H;
    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const LEAF_COLORS = [
        '#c8a05a', '#b87a3a', '#d4a050', '#a06030',
        '#8a9c50', '#6a8040', '#c05a30', '#b09040',
        '#e0b870', '#904820'
    ];

    const LEAF_COUNT = 22;
    const leaves = [];

    function randomLeaf() {
        return {
            x: Math.random() * W,
            y: -30 - Math.random() * H * 0.3,
            size: 6 + Math.random() * 9,
            color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
            speed: 0.6 + Math.random() * 1.1,
            drift: (Math.random() - 0.5) * 0.8,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.04,
            sway: Math.random() * Math.PI * 2,
            swaySpeed: 0.012 + Math.random() * 0.018,
            swayAmp: 12 + Math.random() * 22,
            opacity: 0.5 + Math.random() * 0.45,
            type: Math.floor(Math.random() * 3)
        };
    }

    for (let i = 0; i < LEAF_COUNT; i++) {
        const l = randomLeaf();
        l.y = Math.random() * H;
        leaves.push(l);
    }

    function drawLeaf(leaf) {
        ctx.save();
        ctx.globalAlpha = leaf.opacity;
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);

        if (leaf.type === 0) {
            // Simple oval leaf
            ctx.beginPath();
            ctx.ellipse(0, 0, leaf.size * 0.45, leaf.size, 0, 0, Math.PI * 2);
            ctx.fillStyle = leaf.color;
            ctx.fill();
            // Stem
            ctx.beginPath();
            ctx.moveTo(0, leaf.size);
            ctx.lineTo(0, leaf.size + leaf.size * 0.5);
            ctx.strokeStyle = leaf.color;
            ctx.lineWidth = 1;
            ctx.stroke();
            // Vein
            ctx.beginPath();
            ctx.moveTo(0, -leaf.size);
            ctx.lineTo(0, leaf.size);
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        } else if (leaf.type === 1) {
            // Maple-ish leaf
            ctx.beginPath();
            const s = leaf.size;
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.4, -s * 0.3);
            ctx.lineTo(s, -s * 0.5);
            ctx.lineTo(s * 0.6, s * 0.1);
            ctx.lineTo(s * 0.3, s);
            ctx.lineTo(0, s * 0.5);
            ctx.lineTo(-s * 0.3, s);
            ctx.lineTo(-s * 0.6, s * 0.1);
            ctx.lineTo(-s, -s * 0.5);
            ctx.lineTo(-s * 0.4, -s * 0.3);
            ctx.closePath();
            ctx.fillStyle = leaf.color;
            ctx.fill();
        } else {
            // Small pointed leaf
            ctx.beginPath();
            ctx.moveTo(0, -leaf.size);
            ctx.quadraticCurveTo(leaf.size * 0.6, 0, 0, leaf.size * 0.8);
            ctx.quadraticCurveTo(-leaf.size * 0.6, 0, 0, -leaf.size);
            ctx.fillStyle = leaf.color;
            ctx.fill();
        }

        ctx.restore();
    }

    function tick() {
        ctx.clearRect(0, 0, W, H);

        for (const l of leaves) {
            l.sway += l.swaySpeed;
            l.x += Math.sin(l.sway) * l.swayAmp * 0.025 + l.drift;
            l.y += l.speed;
            l.rotation += l.rotSpeed;

            if (l.y > H + 40 || l.x < -60 || l.x > W + 60) {
                Object.assign(l, randomLeaf());
            }

            drawLeaf(l);
        }

        requestAnimationFrame(tick);
    }

    tick();
})();
