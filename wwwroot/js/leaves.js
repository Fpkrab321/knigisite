/**
 * Falling autumn leaves canvas animation
 * Birch/autumn theme with realistic leaf shapes
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
        '#8a4020', '#d96030', '#f5c060'
    ];

    const LEAF_COUNT = 28;

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
            this.size = randomBetween(14, 26);
            this.speedY = randomBetween(0.6, 1.8);
            this.speedX = randomBetween(-0.5, 0.5);
            this.rotation = randomBetween(0, Math.PI * 2);
            this.rotationSpeed = randomBetween(-0.025, 0.025);
            this.swayAmplitude = randomBetween(18, 50);
            this.swayFrequency = randomBetween(0.008, 0.02);
            this.swayOffset = randomBetween(0, Math.PI * 2);
            this.opacity = randomBetween(0.55, 0.85);
            this.colorIndex = Math.floor(Math.random() * LEAF_COLORS.length);
            this.leafType = Math.floor(Math.random() * 3); // 0: birch, 1: oval, 2: maple-ish
            this.time = Math.random() * 100;
        }

        drawBirchLeaf(ctx) {
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 0.5);
            ctx.bezierCurveTo(
                this.size * 0.4, -this.size * 0.45,
                this.size * 0.5, this.size * 0.05,
                0, this.size * 0.5
            );
            ctx.bezierCurveTo(
                -this.size * 0.5, this.size * 0.05,
                -this.size * 0.4, -this.size * 0.45,
                0, -this.size * 0.5
            );
            ctx.fill();
            // Veins
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 0.45);
            ctx.lineTo(0, this.size * 0.45);
            ctx.stroke();
        }

        drawOvalLeaf(ctx) {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 0.35, this.size * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 0.5);
            ctx.lineTo(0, this.size * 0.5);
            ctx.stroke();
        }

        drawMapleLeaf(ctx) {
            const s = this.size * 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.3, -s * 0.4);
            ctx.lineTo(s * 0.8, -s * 0.5);
            ctx.lineTo(s * 0.55, 0);
            ctx.lineTo(s * 0.9, s * 0.5);
            ctx.lineTo(s * 0.2, s * 0.3);
            ctx.lineTo(0, s);
            ctx.lineTo(-s * 0.2, s * 0.3);
            ctx.lineTo(-s * 0.9, s * 0.5);
            ctx.lineTo(-s * 0.55, 0);
            ctx.lineTo(-s * 0.8, -s * 0.5);
            ctx.lineTo(-s * 0.3, -s * 0.4);
            ctx.closePath();
            ctx.fill();
        }

        update() {
            this.time += 1;
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.time * this.swayFrequency + this.swayOffset) * 0.5;
            this.rotation += this.rotationSpeed;

            if (this.y > H + 60) this.reset(true);
            if (this.x < -60) this.x = W + 40;
            if (this.x > W + 60) this.x = -40;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = LEAF_COLORS[this.colorIndex];

            if (this.leafType === 0) this.drawBirchLeaf(ctx);
            else if (this.leafType === 1) this.drawOvalLeaf(ctx);
            else this.drawMapleLeaf(ctx);

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
