// --- Shopping Dragon.io: Ultimate Version ---

const DragonGame = {
    canvas: null,
    ctx: null,
    gameRunning: false,
    isPaused: false,
    score: 0,
    coins: 0, // নতুন কয়েন কাউন্টার
    discount: 5,
    baseSpeed: 3,
    boostSpeed: 6,
    isBoosting: false,
    world: { width: 3000, height: 2000 },
    camera: { x: 0, y: 0 },
    mouse: { x: 0, y: 0 },
    player: { body: [], angle: 0, length: 20, color: '#d4af37', hasMagnet: false },
    enemies: [],
    foods: [],
    shopItems: ['👕', '📱', '👟', '👜', '🎧', '⌚', '📺', '💻', '📷', '🖱️', '🎮', '🔊', '🕶️', '👗', '🧥', '👖', '🎁', '💎'],
    highscore: localStorage.getItem('dragonHiScore') || 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.setupControls();
        this.setupDifficulty();
        document.getElementById('hiScore').innerText = this.highscore;
    },

    resize() {
        const container = document.getElementById('game-container');
        if (!container) return;
        this.canvas.width = container.clientWidth;
        this.canvas.height = (window.innerWidth > 800) ? window.innerHeight * 0.85 : window.innerHeight * 0.6;
    },

    setupDifficulty() {
        const buttons = document.querySelectorAll('.diff-btn');
        buttons.forEach(btn => {
            btn.onclick = (e) => {
                this.baseSpeed = parseFloat(btn.dataset.speed);
                this.boostSpeed = this.baseSpeed * 2;
                this.startGame();
            };
        });
    },

    startGame() {
        this.score = 0;
        this.coins = 0; // রিসেট কয়েন
        this.player.length = 20;
        this.player.body = [];
        this.player.angle = 0;
        this.player.hasMagnet = false;
        
        const startX = this.world.width / 2;
        const startY = this.world.height / 2;
        for (let i = 0; i < this.player.length; i++) {
            this.player.body.push({ x: startX, y: startY });
        }
        
        this.foods = Array(400).fill(0).map(() => this.spawnFood());
        this.enemies = Array(25).fill(0).map(() => this.createEnemy()); // এনিমি বাড়ালাম
        
        document.getElementById('game-menu').style.display = 'none';
        this.gameRunning = true;
        this.isPaused = false;
        this.updateUI();
        this.loop();
    },

    spawnFood(x, y) {
        const isCoin = Math.random() > 0.85; // ১৫% চান্স কয়েন পাওয়ার
        const icons = isCoin ? ['💰', '🪙'] : this.shopItems;
        return {
            x: x || Math.random() * this.world.width,
            y: y || Math.random() * this.world.height,
            icon: icons[Math.floor(Math.random() * icons.length)],
            type: isCoin ? 'coin' : 'item'
        };
    },

    createEnemy() {
        let len = 15 + Math.random() * 25;
        let ex = Math.random() * this.world.width;
        let ey = Math.random() * this.world.height;
        return {
            body: Array(Math.floor(len)).fill({ x: ex, y: ey }),
            angle: Math.random() * Math.PI * 2,
            length: len,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        };
    },

    setupControls() {
        const updateMouse = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const cx = e.clientX || (e.touches && e.touches[0].clientX);
            const cy = e.clientY || (e.touches && e.touches[0].clientY);
            this.mouse.x = cx - rect.left;
            this.mouse.y = cy - rect.top;
        };

        this.canvas.addEventListener('mousedown', () => this.isBoosting = true);
        this.canvas.addEventListener('mouseup', () => this.isBoosting = false);
        this.canvas.addEventListener('touchstart', () => this.isBoosting = true);
        this.canvas.addEventListener('touchend', () => this.isBoosting = false);
        this.canvas.addEventListener('mousemove', updateMouse);
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.gameRunning) e.preventDefault();
            updateMouse(e);
        }, { passive: false });

        document.getElementById('pauseBtn').onclick = () => {
            this.isPaused = !this.isPaused;
            document.getElementById('pauseBtn').innerText = this.isPaused ? "Resume" : "Pause";
            if (!this.isPaused) this.loop();
        };
        document.getElementById('menuBtn').onclick = () => this.gameOver(false);
    },

    update() {
        if (!this.gameRunning || this.isPaused) return;

        let head = { ...this.player.body[0] };
        let dx = this.mouse.x - (this.canvas.width / 2);
        let dy = this.mouse.y - (this.canvas.height / 2);
        let targetAngle = Math.atan2(dy, dx);
        
        let diff = targetAngle - this.player.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.player.angle += diff * 0.15;

        let currentSpeed = this.isBoosting ? this.boostSpeed : this.baseSpeed;
        head.x += Math.cos(this.player.angle) * currentSpeed;
        head.y += Math.sin(this.player.angle) * currentSpeed;

        if (head.x < 0 || head.x > this.world.width || head.y < 0 || head.y > this.world.height) {
            this.gameOver(true);
            return;
        }

        this.camera.x = head.x - this.canvas.width / 2;
        this.camera.y = head.y - this.canvas.height / 2;

        this.enemies.forEach(en => {
            en.body.forEach((seg, i) => {
                if (i > 3 && Math.hypot(head.x - seg.x, head.y - seg.y) < 15) this.gameOver(true);
            });
        });

        this.player.body.unshift(head);
        if (this.player.body.length > this.player.length) this.player.body.pop();

        this.enemies.forEach((en, idx) => {
            let eHead = { ...en.body[0] };
            if (Math.random() > 0.98) en.angle += (Math.random() - 0.5) * 2;

            eHead.x += Math.cos(en.angle) * (this.baseSpeed * 0.8);
            eHead.y += Math.sin(en.angle) * (this.baseSpeed * 0.8);

            this.player.body.forEach((pS, i) => {
                if (i > 3 && Math.hypot(eHead.x - pS.x, eHead.y - pS.y) < 15) this.killEnemy(idx);
            });

            en.body.unshift(eHead);
            en.body.pop();
        });

        this.foods.forEach((f, idx) => {
            let d = Math.hypot(head.x - f.x, head.y - f.y);
            if (this.player.hasMagnet && d < 200) {
                f.x += (head.x - f.x) * 0.2;
                f.y += (head.y - f.y) * 0.2;
            }

            if (d < 25) {
                if (f.type === 'coin') {
                    this.coins += 1; // কয়েন জমা হওয়া
                    this.activateMagnet();
                }
                this.score += 10;
                this.player.length += 1.5;
                this.foods[idx] = this.spawnFood();
                this.updateUI();
            }
        });
    },

    killEnemy(idx) {
        let dead = this.enemies[idx];
        for (let i = 0; i < dead.body.length; i += 4) {
            this.foods.push(this.spawnFood(dead.body[i].x, dead.body[i].y));
        }
        this.enemies[idx] = this.createEnemy();
        this.score += 100;
    },

    activateMagnet() {
        this.player.hasMagnet = true;
        setTimeout(() => this.player.hasMagnet = false, 5000);
    },
    showBonus(msg) {
        const el = document.getElementById('bonus-alert');
        if (el) {
            el.innerText = msg;
            el.style.display = 'block';
            setTimeout(() => {
                el.style.display = 'none';
            }, 2000);
        }
    },
    gameOver(isDead) {
        this.gameRunning = false;
        if (isDead) alert("CRASHED!");
        document.getElementById('game-menu').style.display = 'block';
    },

    updateUI() {
        document.getElementById('curScore').innerText = Math.floor(this.score);
        document.getElementById('discount-status').innerText = `Wallet: 💰 ${this.coins} | Discount: ${Math.min(95, 5 + Math.floor(this.score/100))}%`;
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.world.width, this.world.height);
        
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 15;
        this.ctx.strokeRect(0, 0, this.world.width, this.world.height);

        this.foods.forEach(f => {
            this.ctx.font = "22px Arial";
            this.ctx.fillText(f.icon, f.x - 12, f.y + 12);
        });

        this.enemies.forEach(en => this.drawDragon(en, false));
        this.drawDragon(this.player, true);

        this.ctx.restore();
    },

    drawDragon(dragon, isPlayer) {
        dragon.body.forEach((p, i) => {
            this.ctx.fillStyle = isPlayer && dragon.hasMagnet ? '#fff700' : dragon.color;
            this.ctx.beginPath();
            let size = (i === 0) ? 15 : Math.max(5, 12 - (i / dragon.length) * 7);
            this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            this.ctx.fill();

            if (i === 0) {
                // সুন্দর মুখ (Eyes and Smile)
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath(); this.ctx.arc(p.x - 5, p.y - 4, 4, 0, 6.28); this.ctx.fill();
                this.ctx.beginPath(); this.ctx.arc(p.x + 5, p.y - 4, 4, 0, 6.28); this.ctx.fill();
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath(); this.ctx.arc(p.x - 5, p.y - 4, 2, 0, 6.28); this.ctx.fill();
                this.ctx.beginPath(); this.ctx.arc(p.x + 5, p.y - 4, 2, 0, 6.28); this.ctx.fill();
                
                // Smile
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y + 2, 5, 0.2 * Math.PI, 0.8 * Math.PI);
                this.ctx.stroke();
            }
        });
    },

    loop() {
        if (!this.gameRunning || this.isPaused) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
};

// --- Offline Functionality (HTML Update) ---
function showOfflineGame() {
    if (document.getElementById('offline-game-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'offline-game-overlay';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:#050505; z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; color:#fff; font-family:sans-serif; overflow-y: auto; padding: 20px 0;";
    
    overlay.innerHTML = `
        <div style="text-align:center; width:100%;">
            <h2 style="color:#d4af37; margin:10px 0;">Dragon Shoppers.io</h2>
            <p id="discount-status" style="color:#ffcc00; font-size:18px; font-weight:bold; margin-bottom:10px;">Wallet: 💰 0 | Discount: 5%</p>
            <div id="game-container" style="position:relative; width:95%; max-width: 1200px; margin:0 auto; border:2px solid #d4af37; background:#000;">
                <canvas id="gameCanvas"></canvas>
                <div id="ui-info" style="position:absolute; top:5px; left:5px; font-size:12px;">Score: <span id="curScore">0</span> | High: <span id="hiScore">0</span></div>
                <div id="game-menu" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.9); padding:20px; border-radius:10px; width:70%; border:1px solid #d4af37; z-index:10;">
                    <h4 style="color:#d4af37;">Select Difficulty</h4>
                    <button class="diff-btn" data-speed="3" style="width:100%; padding:12px; margin-bottom:10px; background:#333; color:#fff; border:none; border-radius:5px;">Easy</button>
                    <button class="diff-btn" data-speed="5" style="width:100%; padding:12px; background:#d4af37; color:#000; font-weight:bold; border:none; border-radius:5px;">Normal</button>
                </div>
            </div>
            <div style="margin-top:15px; display:flex; justify-content:center; gap:20px;">
                <button id="pauseBtn" style="background:none; color:#d4af37; border:1px solid #d4af37; padding:8px 20px; border-radius:20px;">Pause</button>
                <button id="menuBtn" style="background:none; color:#ff4d4d; border:1px solid #ff4d4d; padding:8px 15px; border-radius:20px;">Restart</button>
                <button onclick="document.getElementById('offline-game-overlay').remove()" style="color:#666; border:none; background:none;">Close</button>
            </div>
        </div>
        <div id="bonus-alert" style="position:fixed; top:40%; width:100%; text-align:center; color:#ffcc00; font-size:30px; font-weight:bold; display:none; z-index:100; text-shadow:2px 2px #000;">BONUS!</div>
    `;
    document.body.appendChild(overlay);
    DragonGame.init();
}

// ১. ইন্টারনেট চলে গেলে গেম চালু হবে
window.addEventListener('offline', () => {
    console.log("Internet is off! Starting Dragon Game...");
    showOfflineGame();
});

// ২. ইন্টারনেট ফিরে আসলে গেম বন্ধ হবে (ঐচ্ছিক)
window.addEventListener('online', () => {
    const el = document.getElementById('offline-game-overlay');
    if (el) {
        // তুমি চাইলে এখানে এলার্ট দিতে পারো যে ইন্টারনেট এসেছে
        el.remove();
    }
});
