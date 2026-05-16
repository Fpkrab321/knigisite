/**
 * Animated falling leaves — optimized high-quality version
 * - Leaf shapes are pre-rendered into cached sprites
 * - Main loop only updates motion and draws sprites
 * - High-DPI canvas support
 * - Detailed gradients, veins, and soft baked shadows
 */
(function () {
    const canvas = document.getElementById('leafCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let DPR = Math.max(1, window.devicePixelRatio || 1);

    const LEAF_PALETTE = [
        ['#f1c36a', '#c98a2f'],
        ['#e7b85b', '#9f5d1f'],
        ['#d9a34c', '#7f431a'],
        ['#c9963f', '#5f3413'],
        ['#bfa85a', '#6d7f37'],
        ['#97a852', '#566a2b'],
        ['#d8773c', '#9a3f1c'],
        ['#c85f2a', '#7c2d12'],
        ['#e2c36f', '#b28b35'],
        ['#a36a2f', '#5f3317']
    ];

    const LEAF_COUNT = 34;
    const leaves = [];

    const rand = (min, max) => min + Math.random() * (max - min);
    const randi = (min, max) => Math.floor(rand(min, max + 1));

    function pick(arr) {
        return arr[(Math.random() * arr.length) | 0];
    }

    function createCanvas(w, h) {
        if (typeof OffscreenCanvas !== 'undefined') {
            return new OffscreenCanvas(w, h);
        }
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    function resize() {
        DPR = Math.max(1, window.devicePixelRatio || 1);
        W = window.innerWidth;
        H = window.innerHeight;

        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);

        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        // Rebuild sprite sizes on DPR change so they stay crisp.
        for (const leaf of leaves) {
            buildSprite(leaf);
        }
    }

    function makeLeaf(resetY = false) {
        const colors = pick(LEAF_PALETTE);
        const depth = rand(0.35, 1.0);
        const size = rand(8, 18) * (0.7 + depth * 0.75);

        return {
            x: rand(-80, W + 80),
            y: resetY ? rand(-H * 0.2, H) : rand(-120, -20),
            size,
            baseSpeed: rand(0.45, 1.35) * (0.55 + depth * 0.9),
            drift: rand(-0.35, 0.35),
            windPhase: rand(0, Math.PI * 2),
            windSpeed: rand(0.008, 0.02),
            windAmp: rand(0.7, 1.9) * (0.5 + depth),
            rotation: rand(0, Math.PI * 2),
            rotSpeed: rand(-0.03, 0.03) * (0.4 + depth),
            tilt: rand(-0.45, 0.45),
            opacity: rand(0.35, 0.95) * (0.5 + depth * 0.55),
            depth,
            type: randi(0, 3),
            colorA: colors[0],
            colorB: colors[1],
            veinTint: 'rgba(255,255,255,0.30)',
            shadow: 'rgba(0,0,0,0.18)',
            wobbleSeed: rand(0, Math.PI * 2),
            wobbleSpeed: rand(0.02, 0.05),
            wobbleAmp: rand(0.04, 0.12),
            sprite: null,
            spriteW: 0,
            spriteH: 0
        };
    }

    function drawVeinLine(g, x1, y1, x2, y2, width, color) {
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokeStyle = color;
        g.lineWidth = width;
        g.lineCap = 'round';
        g.stroke();
    }

    function buildSprite(leaf) {
        const s = leaf.size;
        const pad = Math.max(8, Math.ceil(s * 0.55));
        const cssSize = Math.ceil(s * 2.8 + pad * 2);
        const pxSize = Math.max(16, Math.ceil(cssSize * DPR));

        const sprite = createCanvas(pxSize, pxSize);
        const g = sprite.getContext('2d', { alpha: true });
        if (!g) return;

        g.scale(DPR, DPR);
        g.clearRect(0, 0, cssSize, cssSize);
        g.translate(cssSize / 2, cssSize / 2);
        g.rotate(leaf.tilt * 0.08);

        const grad = g.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, leaf.colorA);
        grad.addColorStop(1, leaf.colorB);

        const highlight = g.createRadialGradient(-s * 0.35, -s * 0.45, 0, 0, 0, s * 1.2);
        highlight.addColorStop(0, 'rgba(255,255,255,0.28)');
        highlight.addColorStop(0.4, 'rgba(255,255,255,0.10)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');

        g.save();
        g.shadowColor = leaf.shadow;
        g.shadowBlur = Math.max(4, s * 0.35);
        g.shadowOffsetY = Math.max(1, s * 0.08);
        g.globalAlpha = leaf.opacity;

        if (leaf.type === 0) {
            // Smooth oval leaf
            g.beginPath();
            g.ellipse(0, 0, s * 0.46, s * 1.05, 0, 0, Math.PI * 2);
            g.fillStyle = grad;
            g.fill();

            g.save();
            g.clip();
            g.fillStyle = highlight;
            g.fillRect(-s, -s, s * 2, s * 2);
            g.restore();

            drawVeinLine(g, 0, -s * 0.85, 0, s * 0.75, 1.05, leaf.veinTint);

            for (let i = -2; i <= 2; i++) {
                const yy = i * s * 0.23;
                drawVeinLine(g, 0, yy, s * (0.18 + Math.abs(i) * 0.03), yy - s * 0.08, 0.55, 'rgba(255,255,255,0.15)');
                drawVeinLine(g, 0, yy, -s * (0.18 + Math.abs(i) * 0.03), yy - s * 0.08, 0.55, 'rgba(255,255,255,0.12)');
            }

            drawVeinLine(g, 0, s * 0.88, 0, s * 1.22, 1.0, leaf.colorB);
        } else if (leaf.type === 1) {
            // Maple-like leaf
            g.beginPath();
            g.moveTo(0, -s * 1.08);
            g.lineTo(s * 0.22, -s * 0.62);
            g.lineTo(s * 0.72, -s * 0.92);
            g.lineTo(s * 0.58, -s * 0.18);
            g.lineTo(s * 1.08, 0);
            g.lineTo(s * 0.58, s * 0.22);
            g.lineTo(s * 0.82, s * 0.82);
            g.lineTo(s * 0.18, s * 0.5);
            g.lineTo(0, s * 1.18);
            g.lineTo(-s * 0.18, s * 0.5);
            g.lineTo(-s * 0.82, s * 0.82);
            g.lineTo(-s * 0.58, s * 0.22);
            g.lineTo(-s * 1.08, 0);
            g.lineTo(-s * 0.58, -s * 0.18);
            g.lineTo(-s * 0.72, -s * 0.92);
            g.lineTo(-s * 0.22, -s * 0.62);
            g.closePath();
            g.fillStyle = grad;
            g.fill();

            g.save();
            g.clip();
            g.fillStyle = highlight;
            g.fillRect(-s, -s, s * 2, s * 2);
            g.restore();

            drawVeinLine(g, 0, -s * 0.85, 0, s * 0.95, 1.1, leaf.veinTint);
            drawVeinLine(g, 0, -s * 0.15, s * 0.32, -s * 0.42, 0.65, 'rgba(255,255,255,0.16)');
            drawVeinLine(g, 0, -s * 0.15, -s * 0.32, -s * 0.42, 0.65, 'rgba(255,255,255,0.16)');
            drawVeinLine(g, 0, s * 0.12, s * 0.45, -s * 0.02, 0.55, 'rgba(255,255,255,0.13)');
            drawVeinLine(g, 0, s * 0.12, -s * 0.45, -s * 0.02, 0.55, 'rgba(255,255,255,0.13)');
            drawVeinLine(g, 0, s * 0.42, s * 0.35, s * 0.32, 0.55, 'rgba(255,255,255,0.12)');
            drawVeinLine(g, 0, s * 0.42, -s * 0.35, s * 0.32, 0.55, 'rgba(255,255,255,0.12)');

            g.beginPath();
            g.moveTo(0, s * 1.18);
            g.lineTo(0, s * 1.42);
            g.strokeStyle = leaf.colorB;
            g.lineWidth = 1.0;
            g.stroke();
        } else if (leaf.type === 2) {
            // Pointed birch-like leaf
            g.beginPath();
            g.moveTo(0, -s * 1.12);
            g.quadraticCurveTo(s * 0.62, -s * 0.42, s * 0.34, s * 0.78);
            g.quadraticCurveTo(0, s * 1.14, -s * 0.34, s * 0.78);
            g.quadraticCurveTo(-s * 0.62, -s * 0.42, 0, -s * 1.12);
            g.fillStyle = grad;
            g.fill();

            g.save();
            g.clip();
            g.fillStyle = highlight;
            g.fillRect(-s, -s, s * 2, s * 2);
            g.restore();

            drawVeinLine(g, 0, -s * 0.88, 0, s * 0.86, 1.0, leaf.veinTint);
            drawVeinLine(g, 0, -s * 0.18, s * 0.18, s * 0.05, 0.5, 'rgba(255,255,255,0.14)');
            drawVeinLine(g, 0, 0.12 * s, -s * 0.16, s * 0.26, 0.5, 'rgba(255,255,255,0.12)');
            drawVeinLine(g, 0, s * 0.38, s * 0.13, s * 0.52, 0.5, 'rgba(255,255,255,0.10)');
            drawVeinLine(g, 0, s * 0.38, -s * 0.13, s * 0.52, 0.5, 'rgba(255,255,255,0.10)');

            g.beginPath();
            g.moveTo(0, s * 1.14);
            g.lineTo(0, s * 1.38);
            g.strokeStyle = leaf.colorB;
            g.lineWidth = 1.0;
            g.stroke();
        } else {
            // Small curled leaf
            g.beginPath();
            g.moveTo(0, -s * 0.95);
            g.quadraticCurveTo(s * 0.85, -s * 0.25, s * 0.26, s * 0.88);
            g.quadraticCurveTo(0, s * 0.62, -s * 0.26, s * 0.88);
            g.quadraticCurveTo(-s * 0.85, -s * 0.25, 0, -s * 0.95);
            g.fillStyle = grad;
            g.fill();

            g.save();
            g.clip();
            g.fillStyle = highlight;
            g.fillRect(-s, -s, s * 2, s * 2);
            g.restore();

            drawVeinLine(g, 0, -s * 0.72, 0, s * 0.72, 0.9, leaf.veinTint);
            drawVeinLine(g, 0, -s * 0.1, s * 0.16, s * 0.12, 0.45, 'rgba(255,255,255,0.12)');
            drawVeinLine(g, 0, -s * 0.1, -s * 0.16, s * 0.12, 0.45, 'rgba(255,255,255,0.12)');
        }

        g.restore();

        leaf.sprite = sprite;
        leaf.spriteW = cssSize;
        leaf.spriteH = cssSize;
    }

    for (let i = 0; i < LEAF_COUNT; i++) {
        const leaf = makeLeaf(true);
        buildSprite(leaf);
        leaves.push(leaf);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    let lastTime = performance.now();

    function respawnLeaf(leaf) {
        const fresh = makeLeaf(false);
        fresh.x = rand(-80, W + 80);
        fresh.y = rand(-140, -20);
        buildSprite(fresh);
        Object.assign(leaf, fresh);
    }

    function tick(now) {
        const dt = Math.min(2.2, (now - lastTime) / 16.6667);
        lastTime = now;

        ctx.clearRect(0, 0, W, H);

        for (const leaf of leaves) {
            leaf.windPhase += leaf.windSpeed * dt;
            leaf.wobbleSeed += leaf.wobbleSpeed * dt;

            const wind = Math.sin(leaf.windPhase) * leaf.windAmp;
            const wobble = Math.sin(leaf.wobbleSeed) * leaf.wobbleAmp;

            leaf.x += (wind * 0.18 + leaf.drift + wobble) * dt;
            leaf.y += leaf.baseSpeed * (0.7 + leaf.depth * 0.8) * dt;
            leaf.rotation += leaf.rotSpeed * dt + Math.sin(leaf.windPhase * 0.8) * 0.003 * dt;

            // small side drift for depth
            leaf.x += Math.cos(leaf.windPhase * 0.6) * 0.08 * leaf.depth * dt;

            if (leaf.y > H + 80 || leaf.x < -120 || leaf.x > W + 120) {
                respawnLeaf(leaf);
                continue;
            }

            const sprite = leaf.sprite;
            if (!sprite) continue;

            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.rotation);
            ctx.globalAlpha = leaf.opacity;

            // tiny scale variation keeps motion alive without extra draw cost
            const scale = 0.98 + Math.sin(leaf.wobbleSeed * 0.7) * 0.02;
            ctx.scale(scale, scale);

            ctx.drawImage(
                sprite,
                -leaf.spriteW / 2,
                -leaf.spriteH / 2,
                leaf.spriteW,
                leaf.spriteH
            );
            ctx.restore();
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();
