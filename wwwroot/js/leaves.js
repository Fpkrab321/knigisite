/**
 * Animated falling leaves — enhanced forest atmosphere
 * - High-DPI canvas support
 * - Detailed leaf shapes
 * - Gradients, veins, soft shadow/highlight
 * - Depth/parallax and smoother wind motion
 */
(function () {
    const canvas = document.getElementById('leafCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let DPR = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
        DPR = Math.max(1, window.devicePixelRatio || 1);
        W = window.innerWidth;
        H = window.innerHeight;

        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);

        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

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

    function makeLeaf(resetY = false) {
        const colors = pick(LEAF_PALETTE);
        const depth = rand(0.35, 1.0);

        const leaf = {
            x: rand(-80, W + 80),
            y: resetY ? rand(-H * 0.2, H) : rand(-120, -20),
            size: rand(8, 18) * (0.7 + depth * 0.75),
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
            blur: Math.max(0, 2.2 - depth * 1.8)
        };

        return leaf;
    }

    for (let i = 0; i < LEAF_COUNT; i++) {
        leaves.push(makeLeaf(true));
    }

    function drawVeinLine(x1, y1, x2, y2, width, color) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    function drawLeafShape(leaf) {
        const s = leaf.size;
        const grad = ctx.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, leaf.colorA);
        grad.addColorStop(1, leaf.colorB);

        const highlight = ctx.createRadialGradient(-s * 0.35, -s * 0.45, 0, 0, 0, s * 1.2);
        highlight.addColorStop(0, 'rgba(255,255,255,0.28)');
        highlight.addColorStop(0.4, 'rgba(255,255,255,0.10)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);
        ctx.scale(1, 1 + leaf.tilt * 0.12);

        ctx.globalAlpha = leaf.opacity;
        ctx.shadowColor = leaf.shadow;
        ctx.shadowBlur = 8 * leaf.depth;
        ctx.shadowOffsetY = 2 * leaf.depth;

        if (leaf.type === 0) {
            // Smooth oval leaf
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.46, s * 1.05, 0, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.save();
            ctx.clip();
            ctx.fillStyle = highlight;
            ctx.fillRect(-s, -s, s * 2, s * 2);
            ctx.restore();

            drawVeinLine(0, -s * 0.85, 0, s * 0.75, 1.05, leaf.veinTint);

            for (let i = -2; i <= 2; i++) {
                const yy = i * s * 0.23;
                drawVeinLine(0, yy, s * (0.18 + Math.abs(i) * 0.03), yy - s * 0.08, 0.55, 'rgba(255,255,255,0.15)');
                drawVeinLine(0, yy, -s * (0.18 + Math.abs(i) * 0.03), yy - s * 0.08, 0.55, 'rgba(255,255,255,0.12)');
            }

            drawVeinLine(0, s * 0.88, 0, s * 1.22, 1.0, leaf.colorB);

        } else if (leaf.type === 1) {
            // Maple-like leaf
            ctx.beginPath();
            ctx.moveTo(0, -s * 1.08);
            ctx.lineTo(s * 0.22, -s * 0.62);
            ctx.lineTo(s * 0.72, -s * 0.92);
            ctx.lineTo(s * 0.58, -s * 0.18);
            ctx.lineTo(s * 1.08, 0);
            ctx.lineTo(s * 0.58, s * 0.22);
            ctx.lineTo(s * 0.82, s * 0.82);
            ctx.lineTo(s * 0.18, s * 0.5);
            ctx.lineTo(0, s * 1.18);
            ctx.lineTo(-s * 0.18, s * 0.5);
            ctx.lineTo(-s * 0.82, s * 0.82);
            ctx.lineTo(-s * 0.58, s * 0.22);
            ctx.lineTo(-s * 1.08, 0);
            ctx.lineTo(-s * 0.58, -s * 0.18);
            ctx.lineTo(-s * 0.72, -s * 0.92);
            ctx.lineTo(-s * 0.22, -s * 0.62);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.save();
            ctx.clip();
            ctx.fillStyle = highlight;
            ctx.fillRect(-s, -s, s * 2, s * 2);
            ctx.restore();

            drawVeinLine(0, -s * 0.85, 0, s * 0.95, 1.1, leaf.veinTint);
            drawVeinLine(0, -s * 0.15, s * 0.32, -s * 0.42, 0.65, 'rgba(255,255,255,0.16)');
            drawVeinLine(0, -s * 0.15, -s * 0.32, -s * 0.42, 0.65, 'rgba(255,255,255,0.16)');
            drawVeinLine(0, s * 0.12, s * 0.45, -s * 0.02, 0.55, 'rgba(255,255,255,0.13)');
            drawVeinLine(0, s * 0.12, -s * 0.45, -s * 0.02, 0.55, 'rgba(255,255,255,0.13)');
            drawVeinLine(0, s * 0.42, s * 0.35, s * 0.32, 0.55, 'rgba(255,255,255,0.12)');
            drawVeinLine(0, s * 0.42, -s * 0.35, s * 0.32, 0.55, 'rgba(255,255,255,0.12)');

            ctx.beginPath();
            ctx.moveTo(0, s * 1.18);
            ctx.lineTo(0, s * 1.42);
            ctx.strokeStyle = leaf.colorB;
            ctx.lineWidth = 1.0;
            ctx.stroke();

        } else if (leaf.type === 2) {
            // Pointed birch-like leaf
            ctx.beginPath();
            ctx.moveTo(0, -s * 1.12);
            ctx.quadraticCurveTo(s * 0.62, -s * 0.42, s * 0.34, s * 0.78);
            ctx.quadraticCurveTo(0, s * 1.14, -s * 0.34, s * 0.78);
            ctx.quadraticCurveTo(-s * 0.62, -s * 0.42, 0, -s * 1.12);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.save();
            ctx.clip();
            ctx.fillStyle = highlight;
            ctx.fillRect(-s, -s, s * 2, s * 2);
            ctx.restore();

            drawVeinLine(0, -s * 0.88, 0, s * 0.86, 1.0, leaf.veinTint);
            drawVeinLine(0, -s * 0.18, s * 0.18, s * 0.05, 0.5, 'rgba(255,255,255,0.14)');
            drawVeinLine(0, 0.12 * s, -s * 0.16, s * 0.26, 0.5, 'rgba(255,255,255,0.12)');
            drawVeinLine(0, s * 0.38, s * 0.13, s * 0.52, 0.5, 'rgba(255,255,255,0.10)');
            drawVeinLine(0, s * 0.38, -s * 0.13, s * 0.52, 0.5, 'rgba(255,255,255,0.10)');

            ctx.beginPath();
            ctx.moveTo(0, s * 1.14);
            ctx.lineTo(0, s * 1.38);
            ctx.strokeStyle = leaf.colorB;
            ctx.lineWidth = 1.0;
            ctx.stroke();

        } else {
            // Small curled leaf
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.95);
            ctx.quadraticCurveTo(s * 0.85, -s * 0.25, s * 0.26, s * 0.88);
            ctx.quadraticCurveTo(0, s * 0.62, -s * 0.26, s * 0.88);
            ctx.quadraticCurveTo(-s * 0.85, -s * 0.25, 0, -s * 0.95);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.save();
            ctx.clip();
            ctx.fillStyle = highlight;
            ctx.fillRect(-s, -s, s * 2, s * 2);
            ctx.restore();

            drawVeinLine(0, -s * 0.72, 0, s * 0.72, 0.9, leaf.veinTint);
            drawVeinLine(0, -s * 0.1, s * 0.16, s * 0.12, 0.45, 'rgba(255,255,255,0.12)');
            drawVeinLine(0, -s * 0.1, -s * 0.16, s * 0.12, 0.45, 'rgba(255,255,255,0.12)');
        }

        ctx.restore();
    }

    let lastTime = performance.now();

    function tick(now) {
        const dt = Math.min(2.2, (now - lastTime) / 16.6667);
        lastTime = now;

        ctx.clearRect(0, 0, W, H);

        // subtle atmospheric fade for smoother motion
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        for (const leaf of leaves) {
            leaf.windPhase += leaf.windSpeed * dt;
            leaf.wobbleSeed += leaf.wobbleSpeed * dt;

            const wind = Math.sin(leaf.windPhase) * leaf.windAmp;
            const wobble = Math.sin(leaf.wobbleSeed) * leaf.wobbleAmp;

            leaf.x += (wind * 0.18 + leaf.drift + wobble) * dt;
            leaf.y += leaf.baseSpeed * (0.7 + leaf.depth * 0.8) * dt;
            leaf.rotation += leaf.rotSpeed * dt + Math.sin(leaf.windPhase * 0.8) * 0.003 * dt;

            // gentle curve drift
            leaf.x += Math.cos(leaf.windPhase * 0.6) * 0.08 * leaf.depth * dt;

            if (leaf.y > H + 80 || leaf.x < -120 || leaf.x > W + 120) {
                const fresh = makeLeaf(false);
                fresh.x = rand(-80, W + 80);
                fresh.y = rand(-140, -20);
                Object.assign(leaf, fresh);
            }

            // soft blur for distance
            ctx.filter = leaf.blur > 0.01 ? `blur(${leaf.blur.toFixed(2)}px)` : 'none';
            drawLeafShape(leaf);
        }

        ctx.filter = 'none';
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();
