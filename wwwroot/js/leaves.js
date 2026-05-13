/**
 * Detailed falling autumn leaves — birch, oak, maple, linden, willow
 * Each leaf has: gradient fill, midrib, lateral veins, serrated edge, shadow, stem
 */
(function () {
    'use strict';

    const canvas = document.getElementById('leafCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }

    // Colour palettes per leaf type  [base, shadow, vein, stem]
    const PALETTES = {
        birch:  [['#e8b040','#c47820','#a85010','#8b4010'],
                 ['#d4943a','#b06818','#8a4808','#6a3206'],
                 ['#f0c060','#d09030','#b06020','#904010'],
                 ['#c07028','#904010','#702000','#501800']],
        oak:    [['#c86820','#a04010','#803000','#602000'],
                 ['#d4843a','#b05818','#883808','#682806'],
                 ['#b85018','#903010','#701800','#501000']],
        maple:  [['#d03010','#a81808','#880000','#680000'],
                 ['#e04818','#c02808','#a01000','#800000'],
                 ['#c84010','#a02008','#801000','#600800'],
                 ['#d85820','#b03010','#901800','#701000']],
        linden: [['#c8a030','#a07818','#806000','#604800'],
                 ['#d4b040','#b08820','#907010','#705808'],
                 ['#e0c050','#c09828','#a07818','#806008']],
        willow: [['#8aaa28','#608018','#486010','#304808'],
                 ['#a0b830','#788820','#587010','#385808']]
    };

    const LEAF_TYPES = ['birch','oak','maple','linden','willow'];
    const LEAF_COUNT = 36;

    class Leaf {
        constructor(fromTop) { this.reset(fromTop); }

        reset(fromTop = false) {
            this.x     = rnd(0, W);
            this.y     = fromTop ? rnd(-120, -10) : rnd(-120, H);
            this.size  = rnd(18, 36);
            this.vy    = rnd(0.55, 1.6);
            this.vx    = rnd(-0.4, 0.4);
            this.rot   = rnd(0, Math.PI * 2);
            this.rotV  = rnd(-0.022, 0.022);
            this.tilt  = rnd(0, Math.PI);        // 3-D tilt angle (scaleY)
            this.tiltV = rnd(-0.012, 0.012);
            this.swayA = rnd(20, 55);
            this.swayF = rnd(0.006, 0.018);
            this.swayO = rnd(0, Math.PI * 2);
            this.opacity = rnd(0.62, 0.92);
            this.t     = rnd(0, 200);
            this.type  = LEAF_TYPES[rndInt(0, LEAF_TYPES.length - 1)];
            const pal  = PALETTES[this.type];
            this.palette = pal[rndInt(0, pal.length - 1)];
            // curling wobble
            this.curlA = rnd(0, 0.18);
            this.curlF = rnd(0.03, 0.08);
        }

        update() {
            this.t++;
            this.y   += this.vy;
            this.x   += this.vx + Math.sin(this.t * this.swayF + this.swayO) * 0.45;
            this.rot  += this.rotV;
            this.tilt += this.tiltV;
            if (this.y > H + 80)  this.reset(true);
            if (this.x < -80)     this.x = W + 50;
            if (this.x > W + 80)  this.x = -50;
        }

        draw() {
            const s  = this.size;
            const sx = 1.0;
            // simulate 3-D flip with scaleY based on tilt
            const sy = Math.cos(this.tilt) * (1 - this.curlA * Math.abs(Math.sin(this.t * this.curlF)));

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.scale(sx, sy);
            ctx.globalAlpha = this.opacity;

            switch (this.type) {
                case 'birch':  this._drawBirch(s);  break;
                case 'oak':    this._drawOak(s);    break;
                case 'maple':  this._drawMaple(s);  break;
                case 'linden': this._drawLinden(s); break;
                case 'willow': this._drawWillow(s); break;
            }

            ctx.restore();
        }

        /* ── Birch — serrated diamond ── */
        _drawBirch(s) {
            const [base, shadow, vein, stemCol] = this.palette;
            const h = s * 0.55, w = s * 0.38;

            // Subtle shadow
            ctx.shadowColor = 'rgba(60,30,0,0.18)';
            ctx.shadowBlur  = 4;
            ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;

            // Gradient fill
            const g = ctx.createLinearGradient(-w, -h, w * 0.3, h);
            g.addColorStop(0, base);
            g.addColorStop(0.55, base);
            g.addColorStop(1, shadow);
            ctx.fillStyle = g;

            // Serrated edge — many bezier teeth
            ctx.beginPath();
            const teeth = 9;
            for (let i = 0; i <= teeth; i++) {
                const t = (i / teeth) * 2 - 1;    // -1..1
                const py = t * h;
                const toothW = w * Math.sqrt(1 - t * t) * (1 + 0.12 * Math.sin(i * 2.3));
                const toothOut = w * 0.08;
                if (i === 0) ctx.moveTo(0, -h);
                else {
                    const prevT = ((i - 1) / teeth) * 2 - 1;
                    const midY  = ((prevT + t) / 2) * h;
                    const prevW = w * Math.sqrt(1 - prevT * prevT);
                    ctx.bezierCurveTo(
                        prevW + toothOut, midY - h * 0.04,
                        toothW + toothOut, py - h * 0.04,
                        toothW, py
                    );
                }
            }
            for (let i = teeth; i >= 0; i--) {
                const t = (i / teeth) * 2 - 1;
                const py = t * h;
                const toothW = w * Math.sqrt(1 - t * t);
                const toothOut = w * 0.08;
                if (i === teeth) { /* already at bottom-right */ }
                else {
                    const nextT = ((i + 1) / teeth) * 2 - 1;
                    const midY  = ((nextT + t) / 2) * h;
                    ctx.bezierCurveTo(
                        -toothW - toothOut, midY - h * 0.04,
                        -toothW - toothOut, py - h * 0.04,
                        -toothW, py
                    );
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

            // Midrib
            ctx.beginPath();
            ctx.moveTo(0, -h * 0.92);
            ctx.quadraticCurveTo(w * 0.1, 0, 0, h * 0.9);
            ctx.strokeStyle = vein; ctx.lineWidth = s * 0.028;
            ctx.stroke();

            // 5 lateral veins
            for (let i = 1; i <= 5; i++) {
                const fy = -h * 0.65 + i * h * 0.26;
                const vw = w * (1 - Math.abs(fy) / h) * 0.85;
                ctx.beginPath();
                ctx.moveTo(0, fy);
                ctx.quadraticCurveTo(vw * 0.5, fy - h * 0.04, vw * 0.88, fy - h * 0.12);
                ctx.strokeStyle = vein; ctx.lineWidth = s * 0.016; ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, fy);
                ctx.quadraticCurveTo(-vw * 0.5, fy - h * 0.04, -vw * 0.88, fy - h * 0.12);
                ctx.strokeStyle = vein; ctx.lineWidth = s * 0.016; ctx.stroke();
            }

            // Stem
            ctx.beginPath();
            ctx.moveTo(0, h * 0.88);
            ctx.lineTo(0, h * 1.22);
            ctx.strokeStyle = stemCol; ctx.lineWidth = s * 0.045; ctx.stroke();
        }

        /* ── Oak — lobed ── */
        _drawOak(s) {
            const [base, shadow, vein, stemCol] = this.palette;
            const h = s * 0.58, w = s * 0.36;
            const lobes = 4;

            ctx.shadowColor = 'rgba(50,20,0,0.18)';
            ctx.shadowBlur  = 5; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;

            const g = ctx.createLinearGradient(-w, -h, w * 0.4, h);
            g.addColorStop(0, base); g.addColorStop(1, shadow);
            ctx.fillStyle = g;

            ctx.beginPath();
            ctx.moveTo(0, -h);
            // right lobes going down
            for (let i = 0; i < lobes; i++) {
                const ty = -h + (i + 0.5) * (2 * h) / lobes;
                const lw = w * (0.6 + 0.4 * Math.sin(Math.PI * i / lobes));
                ctx.bezierCurveTo(lw * 0.8, ty - h / lobes * 0.3, lw + w * 0.12, ty, lw, ty + h / lobes * 0.2);
                ctx.bezierCurveTo(lw * 0.6, ty + h / lobes * 0.55, lw * 0.3, ty + h / lobes * 0.8,
                    0, ty + h / lobes * 1.0);
            }
            // left lobes going up
            for (let i = lobes - 1; i >= 0; i--) {
                const ty = -h + (i + 0.5) * (2 * h) / lobes;
                const lw = w * (0.6 + 0.4 * Math.sin(Math.PI * i / lobes));
                ctx.bezierCurveTo(-lw * 0.3, ty + h / lobes * 0.8, -lw * 0.6, ty + h / lobes * 0.55,
                    -lw, ty + h / lobes * 0.2);
                ctx.bezierCurveTo(-lw - w * 0.12, ty, -lw * 0.8, ty - h / lobes * 0.3, 0, ty - h / lobes * 0.4);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

            // Midrib
            ctx.beginPath();
            ctx.moveTo(0, -h * 0.95); ctx.lineTo(0, h * 0.92);
            ctx.strokeStyle = vein; ctx.lineWidth = s * 0.03; ctx.stroke();
            // Veins to each lobe
            for (let i = 0; i < lobes; i++) {
                const ty = -h * 0.75 + i * h * 0.48;
                const lw = w * (0.55 + 0.35 * Math.sin(Math.PI * i / lobes));
                [1, -1].forEach(side => {
                    ctx.beginPath();
                    ctx.moveTo(0, ty);
                    ctx.quadraticCurveTo(side * lw * 0.4, ty - h * 0.03, side * lw * 0.8, ty - h * 0.1);
                    ctx.strokeStyle = vein; ctx.lineWidth = s * 0.017; ctx.stroke();
                });
            }

            ctx.beginPath(); ctx.moveTo(0, h * 0.9); ctx.lineTo(0, h * 1.28);
            ctx.strokeStyle = stemCol; ctx.lineWidth = s * 0.048; ctx.stroke();
        }

        /* ── Maple — 5-lobed star ── */
        _drawMaple(s) {
            const [base, shadow, vein, stemCol] = this.palette;
            const h = s * 0.6;

            ctx.shadowColor = 'rgba(80,0,0,0.2)';
            ctx.shadowBlur  = 5; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 4;

            const g = ctx.createRadialGradient(0, 0, h * 0.05, 0, 0, h);
            g.addColorStop(0, base); g.addColorStop(1, shadow);
            ctx.fillStyle = g;

            // 5-lobe maple
            const points = 5;
            ctx.beginPath();
            for (let i = 0; i < points; i++) {
                const a0 = (i / points) * Math.PI * 2 - Math.PI / 2;
                const a1 = ((i + 0.5) / points) * Math.PI * 2 - Math.PI / 2;
                const a2 = ((i + 1) / points) * Math.PI * 2 - Math.PI / 2;
                const rx = h * 0.95, ry = h * 0.95;
                const irx = h * 0.32, iry = h * 0.32;
                const px = Math.cos(a0) * rx, py = Math.sin(a0) * ry;
                const nx = Math.cos(a2) * rx, ny = Math.sin(a2) * ry;
                const tipX = Math.cos(a1) * rx * 1.08, tipY = Math.sin(a1) * ry * 1.08;
                const inX  = Math.cos(a1) * irx, inY = Math.sin(a1) * iry;
                if (i === 0) ctx.moveTo(px, py);
                ctx.bezierCurveTo(px + (inX - px) * 0.6, py + (inY - py) * 0.6,
                    inX - (tipX - inX) * 0.3, inY - (tipY - inY) * 0.3, tipX, tipY);
                ctx.bezierCurveTo(inX + (tipX - inX) * 0.3, inY + (tipY - inY) * 0.3,
                    nx + (inX - nx) * 0.6, ny + (inY - ny) * 0.6, nx, ny);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

            // 5 midribs radiating out
            for (let i = 0; i < points; i++) {
                const a = (i / points) * Math.PI * 2 - Math.PI / 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * h * 0.88, Math.sin(a) * h * 0.88);
                ctx.strokeStyle = vein;
                ctx.lineWidth = s * (i === 0 ? 0.034 : 0.022);
                ctx.stroke();
                // sub-veins
                const mx = Math.cos(a) * h * 0.5, my = Math.sin(a) * h * 0.5;
                [-0.35, 0.35].forEach(ang => {
                    ctx.beginPath();
                    ctx.moveTo(mx, my);
                    ctx.lineTo(mx + Math.cos(a + ang) * h * 0.3, my + Math.sin(a + ang) * h * 0.3);
                    ctx.lineWidth = s * 0.013; ctx.stroke();
                });
            }

            ctx.beginPath(); ctx.moveTo(0, h * 0.22); ctx.lineTo(0, h * 1.18);
            ctx.strokeStyle = stemCol; ctx.lineWidth = s * 0.05; ctx.stroke();
        }

        /* ── Linden — heart-shaped ── */
        _drawLinden(s) {
            const [base, shadow, vein, stemCol] = this.palette;
            const h = s * 0.52, w = s * 0.48;

            ctx.shadowColor = 'rgba(40,30,0,0.15)';
            ctx.shadowBlur  = 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;

            const g = ctx.createLinearGradient(-w * 0.5, -h, w * 0.3, h);
            g.addColorStop(0, base); g.addColorStop(1, shadow);
            ctx.fillStyle = g;

            // Heart / cordate leaf
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.bezierCurveTo(-w * 0.15, h * 0.65, -w * 1.1, h * 0.35, -w * 0.85, -h * 0.1);
            ctx.bezierCurveTo(-w * 0.6, -h * 0.55, -w * 0.05, -h * 0.7, 0, -h * 0.42);
            ctx.bezierCurveTo(w * 0.05, -h * 0.7, w * 0.6, -h * 0.55, w * 0.85, -h * 0.1);
            ctx.bezierCurveTo(w * 1.1, h * 0.35, w * 0.15, h * 0.65, 0, h);
            ctx.closePath();
            ctx.fill();
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

            // Midrib
            ctx.beginPath();
            ctx.moveTo(0, -h * 0.38); ctx.lineTo(0, h * 0.92);
            ctx.strokeStyle = vein; ctx.lineWidth = s * 0.03; ctx.stroke();

            // 4 pairs of veins
            for (let i = 1; i <= 4; i++) {
                const fy = -h * 0.2 + i * h * 0.26;
                const vw = w * (1 - i * 0.18) * 0.8;
                [1, -1].forEach(side => {
                    ctx.beginPath();
                    ctx.moveTo(0, fy);
                    ctx.quadraticCurveTo(side * vw * 0.45, fy - h * 0.03, side * vw * 0.9, fy - h * 0.1);
                    ctx.strokeStyle = vein; ctx.lineWidth = s * 0.016; ctx.stroke();
                });
            }

            ctx.beginPath(); ctx.moveTo(0, h * 0.9); ctx.lineTo(0, h * 1.22);
            ctx.strokeStyle = stemCol; ctx.lineWidth = s * 0.044; ctx.stroke();
        }

        /* ── Willow — long narrow lance ── */
        _drawWillow(s) {
            const [base, shadow, vein, stemCol] = this.palette;
            const h = s * 0.8, w = s * 0.15;

            ctx.shadowColor = 'rgba(20,30,10,0.16)';
            ctx.shadowBlur  = 3; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 3;

            const g = ctx.createLinearGradient(-w, -h, w, h);
            g.addColorStop(0, base); g.addColorStop(1, shadow);
            ctx.fillStyle = g;

            // Lanceolate shape with slight curve
            ctx.beginPath();
            ctx.moveTo(0, -h);
            ctx.bezierCurveTo(w * 0.5, -h * 0.5, w * 1.1, 0, w * 0.8, h * 0.6);
            ctx.quadraticCurveTo(w * 0.4, h * 0.92, 0, h);
            ctx.quadraticCurveTo(-w * 0.4, h * 0.92, -w * 0.8, h * 0.6);
            ctx.bezierCurveTo(-w * 1.1, 0, -w * 0.5, -h * 0.5, 0, -h);
            ctx.closePath();
            ctx.fill();
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

            // Midrib
            ctx.beginPath();
            ctx.moveTo(0, -h * 0.95); ctx.lineTo(0, h * 0.92);
            ctx.strokeStyle = vein; ctx.lineWidth = s * 0.025; ctx.stroke();

            // Fine parallel veins
            for (let i = 1; i <= 7; i++) {
                const fy = -h * 0.75 + i * h * 0.22;
                const vw = w * (1 - Math.abs((fy / h)) * 0.6) * 0.82;
                [1, -1].forEach(side => {
                    ctx.beginPath();
                    ctx.moveTo(side * s * 0.012, fy);
                    ctx.lineTo(side * vw * 0.85, fy - h * 0.06);
                    ctx.strokeStyle = vein; ctx.lineWidth = s * 0.012; ctx.stroke();
                });
            }

            ctx.beginPath(); ctx.moveTo(0, h * 0.88); ctx.lineTo(0, h * 1.15);
            ctx.strokeStyle = stemCol; ctx.lineWidth = s * 0.038; ctx.stroke();
        }
    }

    const leaves = Array.from({ length: LEAF_COUNT }, () => new Leaf(false));

    function animate() {
        ctx.clearRect(0, 0, W, H);
        leaves.forEach(l => { l.update(); l.draw(); });
        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W; canvas.height = H;
    });
})();
