/**
 * Falling autumn leaves canvas animation
 * Highly detailed birch/autumn theme with realistic leaf shapes, veins, shadows
 */
(function() {
    const canvas = document.getElementById('leafCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const LEAF_COLORS = [
        '#d4843e', '#c96b2a', '#e8a040', '#b85520',
        '#f0b848', '#a84830', '#cc7a3a', '#e09045',
        '#8a4020', '#d96030', '#f5c060', '#c47a2e',
        '#da8e42', '#b54e1a', '#edb25a'
    ];

    const LEAF_COUNT = 45; // больше листьев

    function randomBetween(a, b) {
        return a + Math.random() * (b - a);
    }

    class Leaf {
        constructor(init) {
            this.reset(init);
        }

        reset(fromTop = false) {
            this.x = randomBetween(0, W);
            this.y = fromTop ? randomBetween(-80, -10) : randomBetween(-80, H);
            this.size = randomBetween(18, 34); // чуть крупнее
            this.speedY = randomBetween(0.5, 1.6);
            this.speedX = randomBetween(-0.6, 0.6);
            this.rotation = randomBetween(0, Math.PI * 2);
            this.rotationSpeed = randomBetween(-0.03, 0.03);
            this.swayAmplitude = randomBetween(25, 70);
            this.swayFrequency = randomBetween(0.006, 0.018);
            this.swayOffset = randomBetween(0, Math.PI * 2);
            this.opacity = randomBetween(0.65, 0.95);
            this.colorIndex = Math.floor(Math.random() * LEAF_COLORS.length);
            // 0: берёзовая, 1: дубовая, 2: кленовая, 3: осиновая
            this.leafType = Math.floor(Math.random() * 4);
            this.time = Math.random() * 100;
            // для теней
            this.shadowBlur = randomBetween(2, 6);
        }

        // Берёзовый лист (ромбовидный с прожилками)
        drawBirchLeaf(ctx) {
            const s = this.size;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.5);
            ctx.quadraticCurveTo(s * 0.4, -s * 0.3, s * 0.45, 0);
            ctx.quadraticCurveTo(s * 0.4, s * 0.3, 0, s * 0.5);
            ctx.quadraticCurveTo(-s * 0.4, s * 0.3, -s * 0.45, 0);
            ctx.quadraticCurveTo(-s * 0.4, -s * 0.3, 0, -s * 0.5);
            ctx.fill();
            // Прожилки
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.45);
            ctx.lineTo(0, s * 0.45);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.2);
            ctx.lineTo(s * 0.3, 0);
            ctx.lineTo(0, s * 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.2);
            ctx.lineTo(-s * 0.3, 0);
            ctx.lineTo(0, s * 0.2);
            ctx.stroke();
            ctx.restore();
        }

        // Дубовый лист (волнистый)
        drawOakLeaf(ctx) {
            const s = this.size;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.45);
            ctx.bezierCurveTo(s * 0.3, -s * 0.5, s * 0.5, -s * 0.2, s * 0.4, 0);
            ctx.bezierCurveTo(s * 0.55, s * 0.2, s * 0.35, s * 0.5, 0, s * 0.55);
            ctx.bezierCurveTo(-s * 0.35, s * 0.5, -s * 0.55, s * 0.2, -s * 0.4, 0);
            ctx.bezierCurveTo(-s * 0.5, -s * 0.2, -s * 0.3, -s * 0.5, 0, -s * 0.45);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.4);
            ctx.lineTo(0, s * 0.5);
            ctx.stroke();
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(i * s * 0.25, s * 0.3);
                ctx.stroke();
            }
        }

        // Кленовый лист (пальчатый)
        drawMapleLeaf(ctx) {
            const s = this.size * 0.55;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.35, -s * 0.4);
            ctx.lineTo(s * 0.9, -s * 0.5);
            ctx.lineTo(s * 0.6, 0);
            ctx.lineTo(s * 1.0, s * 0.55);
            ctx.lineTo(s * 0.3, s * 0.35);
            ctx.lineTo(0, s);
            ctx.lineTo(-s * 0.3, s * 0.35);
            ctx.lineTo(-s * 1.0, s * 0.55);
            ctx.lineTo(-s * 0.6, 0);
            ctx.lineTo(-s * 0.9, -s * 0.5);
            ctx.lineTo(-s * 0.35, -s * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(0, s * 0.8);
            ctx.stroke();
            for (let ang = -1; ang <= 1; ang++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(ang * s * 0.8, s * 0.4);
                ctx.stroke();
            }
        }

        // Осиновый лист (круглый с мелкими зубцами)
        drawAspenLeaf(ctx) {
            const s = this.size;
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.4, s * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.5);
            ctx.lineTo(0, s * 0.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.2);
            ctx.lineTo(s * 0.25, 0);
            ctx.lineTo(0, s * 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.2);
            ctx.lineTo(-s * 0.25, 0);
            ctx.lineTo(0, s * 0.2);
            ctx.stroke();
        }

        update() {
            this.time += 1;
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.time * this.swayFrequency + this.swayOffset) * 0.7;
            this.rotation += this.rotationSpeed;

            if (this.y > H + 80) this.reset(true);
            if (this.x < -80) this.x = W + 60;
            if (this.x > W + 80) this.x = -60;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = LEAF_COLORS[this.colorIndex];
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            switch (this.leafType) {
                case 0: this.drawBirchLeaf(ctx); break;
                case 1: this.drawOakLeaf(ctx); break;
                case 2: this.drawMapleLeaf(ctx); break;
                default: this.drawAspenLeaf(ctx); break;
            }

            ctx.restore();
        }
    }

    const leaves = Array.from({ length: LEAF_COUNT }, () => new Leaf(false));

    function animate() {
        ctx.clearRect(0, 0, W, H);
        leaves.forEach(leaf => {
            leaf.update();
            leaf.draw(ctx);
        });
        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
    });
})();
