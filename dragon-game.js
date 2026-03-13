// --- Shopping Dragon.io: Mobile & PC Optimized ---

const DragonGame = {
    canvas: null,
    ctx: null,
    gameRunning: false,
    isPaused: false,
    score: 0,
    discount: 5,
    baseSpeed: 4,
    mouse: { x: 0, y: 0 },
    player: { body: [], angle: 0, length: 15, color: '#d4af37' },
    enemies: [],
    foods: [],
    shopItems: [
    // ইলেকট্রনিক্স ও গ্যাজেট
    '👕', '📱', '👟', '👜', '🎧', '⌚', '📺', '💻', '📷', '🖱️', '🔌', '🔋', '🎮', '🔊', '⌨️', 
    '🔊', '🕶️', '👗', '🧥', '👖', '💍', '🎒', '🎁', '💎',
    // ফ্যাশন ও লাইফস্টাইল
    '🕶️', '👗', '🧥', '👖', '👠', '👢', '💄', '💍', '👒', '🧣', '🎒', '🌂', '👞', '👒',
    // কসমেটিকস ও ঘরোয়া পণ্য
    '🧴', '🧼', '🧺', '🪑', '🛋️', '🛏️', '🧸', '🎁', '🎈', '🎨', '🛒', '📦', '🚲', '🛹'
    ],
    highscore: localStorage.getItem('dragonHiScore') || 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // পর্দার সাইজ অনুযায়ী ক্যানভাস অ্যাডজাস্ট
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupControls();
        this.setupDifficulty();
        
        document.getElementById('hiScore').innerText = this.highscore;
        this.mouse.x = this.canvas.width / 2;
        this.mouse.y = this.canvas.height / 2;
    },

    resize() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;

        // ল্যাপটপ নাকি ফোন সেটা চেক করে হাইট সেট করা
        if (window.innerWidth > 800) {
            // ল্যাপটপের জন্য ৮৫% হাইট (বড় স্ক্রিন)
            this.canvas.height = window.innerHeight * 0.85; 
        } else {
            // ফোনের জন্য আগের মতোই ৬০% থাকবে
            this.canvas.height = window.innerHeight * 0.6; 
        }
    },

    setupDifficulty() {
        const buttons = document.querySelectorAll('.diff-btn');
        buttons.forEach(btn => {
            // 'click' এবং 'touchstart' দুইটাই হ্যান্ডেল করা হয়েছে ফোনের জন্য
            const startHandler = (e) => {
                e.preventDefault();
                this.baseSpeed = parseFloat(btn.dataset.speed);
                this.startGame();
            };
            btn.addEventListener('click', startHandler);
            btn.addEventListener('touchstart', startHandler);
        });
    },

    startGame() {
        this.score = 0;
        this.discount = 5;
        this.player.length = 15;
        this.player.body = [];
        for (let i = 0; i < this.player.length; i++) {
            this.player.body.push({ x: this.canvas.width / 2, y: this.canvas.height / 2 });
        }
        
        this.foods = Array(17).fill(0).map(() => this.spawnFood());
        this.enemies = Array(4).fill(0).map(() => this.createEnemy());
        
        document.getElementById('game-menu').style.display = 'none';
        this.gameRunning = true;
        this.isPaused = false;
        this.updateUI();
        this.loop();
    },

    spawnFood() {
        return {
            x: Math.random() * (this.canvas.width - 40) + 20,
            y: Math.random() * (this.canvas.height - 40) + 20,
            icon: this.shopItems[Math.floor(Math.random() * this.shopItems.length)]
        };
    },

    createEnemy() {
        let len = 10 + Math.random() * 10;
        return {
            body: Array(Math.floor(len)).fill({ x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height }),
            angle: Math.random() * Math.PI * 2,
            length: len,
            color: '#ff4d4d',
            turnTimer: 0
        };
    },

    setupControls() {
        const handleMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const cx = e.clientX || (e.touches && e.touches[0].clientX);
            const cy = e.clientY || (e.touches && e.touches[0].clientY);
            this.mouse.x = cx - rect.left;
            this.mouse.y = cy - rect.top;
        };

        this.canvas.addEventListener('mousemove', handleMove);
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.gameRunning) e.preventDefault();
            handleMove(e);
        }, { passive: false });

        document.getElementById('pauseBtn').onclick = () => {
            this.isPaused = !this.isPaused;
            document.getElementById('pauseBtn').innerText = this.isPaused ? "Resume" : "Pause";
            if (!this.isPaused) this.loop();
        };
        document.getElementById('menuBtn').onclick = () => {
            this.gameRunning = false; // গেম থামিয়ে দিবে
            document.getElementById('game-menu').style.display = 'block'; // মেনু ফিরিয়ে আনবে
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // স্ক্রিন পরিষ্কার করবে
        };
    },

    update() {
        if (!this.gameRunning || this.isPaused) return;

        // Player Move
        let head = this.player.body[0];
        let targetAngle = Math.atan2(this.mouse.y - head.y, this.mouse.x - head.x);
        let diff = targetAngle - this.player.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.player.angle += diff * 0.15;

        let newHead = {
            x: head.x + Math.cos(this.player.angle) * this.baseSpeed,
            y: head.y + Math.sin(this.player.angle) * this.baseSpeed
        };

        // Wrap Around Screen
        if (newHead.x < 0) newHead.x = this.canvas.width;
        if (newHead.x > this.canvas.width) newHead.x = 0;
        if (newHead.y < 0) newHead.y = this.canvas.height;
        if (newHead.y > this.canvas.height) newHead.y = 0;

        this.player.body.unshift(newHead);
        if (this.player.body.length > this.player.length) this.player.body.pop();

        // Enemies update
        this.enemies.forEach((en, idx) => {
            en.turnTimer--;
            if (en.turnTimer <= 0) {
                en.angle += (Math.random() - 0.5);
                en.turnTimer = 30;
            }
            let eHead = en.body[0];
            let eNewHead = {
                x: eHead.x + Math.cos(en.angle) * (this.baseSpeed * 0.6),
                y: eHead.y + Math.sin(en.angle) * (this.baseSpeed * 0.6)
            };
            if (eNewHead.x < 0) eNewHead.x = this.canvas.width;
            if (eNewHead.x > this.canvas.width) eNewHead.x = 0;
            if (eNewHead.y < 0) eNewHead.y = this.canvas.height;
            if (eNewHead.y > this.canvas.height) eNewHead.y = 0;
            
            en.body.unshift(eNewHead);
            en.body.pop();

            // Collision with Enemy
            if (Math.hypot(newHead.x - eNewHead.x, newHead.y - eNewHead.y) < 20) {
                this.score += 50;
                this.showBonus(10);
                this.enemies[idx] = this.createEnemy();
                this.updateUI();
            }
        });

        // Food collision
            this.foods.forEach((f, idx) => {
                if (Math.hypot(newHead.x - f.x, newHead.y - f.y) < 25) {
                    if (f.icon === '🎁' || f.icon === '💎') {
                        this.score += 50; // স্পেশাল আইটেমে ৫০ পয়েন্ট!
                        this.player.length += 5; // ড্রাগন একটু বেশি বড় হবে
                        this.showBonus("SUPER"); // স্ক্রিনে স্পেশাল মেসেজ
                    } else {
                        this.score += 10; // সাধারণ আইটেমে ১০ পয়েন্ট
                        this.player.length += 2;
                    }

                    this.foods[idx] = this.spawnFood();
                    this.updateUI();
                }
            });
    },

    updateUI() {
        document.getElementById('curScore').innerText = this.score;
        this.discount = Math.min(95, 5 + Math.floor(this.score / 40));
        document.getElementById('discount-status').innerText = `Discount: ${this.discount}%`;
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('dragonHiScore', this.highscore);
            document.getElementById('hiScore').innerText = this.highscore;
        }
    },

    showBonus(type) {
        const b = document.getElementById('bonus-alert');
        if (type === "SUPER") {
            b.innerText = `🔥 SUPER SCORE! 🔥`;
            b.style.color = "#00ffcc"; // স্পেশাল কালার
        } else {
            b.innerText = `+${type}% BONUS!`;
            b.style.color = "#ffcc00";
        }
        b.style.display = 'block';
        setTimeout(() => b.style.display = 'none', 1000);
    },

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Food
        this.ctx.font = "24px Arial";
        this.foods.forEach(f => this.ctx.fillText(f.icon, f.x - 12, f.y + 12));

        // Draw Player & Enemies
        this.enemies.forEach(en => this.drawDragon(en));
        this.drawDragon(this.player);
    },

    drawDragon(dragon) {
        dragon.body.forEach((p, i) => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(dragon.angle);
            this.ctx.fillStyle = dragon.color;
            if (i === 0) {
                // Head
                this.ctx.beginPath();
                this.ctx.moveTo(15, 0); this.ctx.lineTo(-10, -10); this.ctx.lineTo(-10, 10);
                this.ctx.fill();
            } else {
                // Body Spines
                let s = 10 - (i / dragon.length) * 5;
                if (i % 4 === 0) {
                    this.ctx.fillRect(-2, -12, 4, 24);
                }
                this.ctx.beginPath();
                this.ctx.arc(0, 0, s, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        });
    },

    loop() {
        if (!this.gameRunning || this.isPaused) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
};

// --- Offline Trigger ---
function showOfflineGame() {
    if (document.getElementById('offline-game-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'offline-game-overlay';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:#050505; z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; color:#fff; font-family:sans-serif; overflow-y: auto; padding: 20px 0;touch-action: pan-y; touch-action:none;";
    
    overlay.innerHTML = `
        <div style="text-align:center; color:#fff; width:100%;">
            <h2 style="color:#d4af37; margin:10px 0 5px; font-size:22px;">Dragon Shoppers.io</h2>
            <p id="discount-status" style="color:#ffcc00; font-size:18px; font-weight:bold; margin-bottom:10px;">Discount: 5%</p>
            
            <div id="game-container" style="position:relative; width:95%; max-width: 1200px; display:flex; justify-content:center; margin:0 auto; border:2px solid #d4af37; background:#000;">
                <canvas id="gameCanvas" style="display:block;"></canvas>
                <div id="ui-info" style="position:absolute; top:5px; left:5px; font-size:12px; color:#fff; pointer-events:none;">
                    Score: <span id="curScore">0</span> | High: <span id="hiScore">0</span>
                </div>
                <div id="game-menu" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.9); padding:20px; border-radius:10px; width:70%; border:1px solid #d4af37;">
                    <h4 style="margin:0 0 15px; color:#d4af37;">Difficulty</h4>
                    <button class="diff-btn" data-speed="2" style="width:100%; padding:10px; margin-bottom:10px; background:#333; color:#fff; border:none; border-radius:5px;">Easy</button>
                    <button class="diff-btn" data-speed="4" style="width:100%; padding:10px; margin-bottom:10px; background:#d4af37; color:#000; font-weight:bold; border:none; border-radius:5px;">Normal</button>
                </div>
            </div>

            <div style="margin-top:15px; display:flex; justify-content:center; gap:20px;">
                <button id="pauseBtn" style="background:none; color:#d4af37; border:1px solid #d4af37; padding:8px 20px; border-radius:20px;">Pause</button>
                <button id="menuBtn" style="background:none; color:#ff4d4d; border:1px solid #ff4d4d; padding:8px 15px; border-radius:20px; font-size:14px; cursor:pointer;">Menu</button>
                <button onclick="document.getElementById('offline-game-overlay').remove()" style="background:none; color:#666; border:none;">Close</button>
            </div>
        </div>
        <div id="bonus-alert" style="position:fixed; top:40%; width:100%; text-align:center; color:#ffcc00; font-size:30px; font-weight:bold; display:none; pointer-events:none; z-index:10000000; text-shadow:2px 2px #000;">BONUS!</div>
    `;
    document.body.appendChild(overlay);
    DragonGame.init();
}

window.addEventListener('offline', showOfflineGame);
window.addEventListener('online', () => {
    const el = document.getElementById('offline-game-overlay');
    if (el) el.remove();
});