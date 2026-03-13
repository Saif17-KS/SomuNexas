window.addEventListener('offline', () => showOfflineGame());
window.addEventListener('online', () => {
    if (document.getElementById('offline-game-overlay')) {
        document.getElementById('offline-game-overlay').remove();
    }
});

function showOfflineGame() {
    if (document.getElementById('offline-game-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'offline-game-overlay';
    
    // CSS-এ কিছু পরিবর্তন এনেছি যাতে মোবাইল স্ক্রিনে পুরোটা দেখা যায়
    overlay.style.cssText = `
        position:fixed; top:0; left:0; width:100vw; height:100vh; 
        background:#050505; z-index:9999999; display:flex; 
        flex-direction:column; align-items:center; justify-content:center; 
        color:#fff; font-family:sans-serif; overflow:hidden; touch-action:none;
    `;
    
    overlay.innerHTML = `
        <div style="text-align:center; margin-bottom:5px; padding:0 10px;">
            <h2 style="color:#d4af37; margin:0; font-size:20px;">Dragon Shoppers.io</h2>
            <p id="discount-status" style="color:#ffcc00; font-size:16px; font-weight:bold; margin:2px 0;">Discount: 5%</p>
        </div>
        
        <div id="game-container" style="position:relative; border:2px solid #d4af37; border-radius:10px; background:#000; width:95%; max-width:800px; display:flex; justify-content:center;">
            <canvas id="gameCanvas" style="display:block; width:100%; height:auto;"></canvas>
            
            <div id="ui-info" style="position:absolute; top:5px; left:5px; font-size:12px; font-weight:bold; color:rgba(255,255,255,0.7); pointer-events:none;">
                Score: <span id="curScore">0</span> | High: <span id="hiScore">0</span>
            </div>

            <div id="game-menu" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; background:rgba(0,0,0,0.95); padding:15px; border-radius:15px; border:1px solid #d4af37; width:80%; max-width:250px;">
                <h3 style="color:#d4af37; margin-top:0; font-size:18px;">Select Difficulty</h3>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button class="diff-btn" data-speed="2.5" style="padding:10px; border-radius:5px; border:none; background:#333; color:#fff;">Easy</button>
                    <button class="diff-btn" data-speed="4" style="padding:10px; border-radius:5px; border:none; background:#333; color:#fff;">Normal</button>
                    <button class="diff-btn" data-speed="6" style="padding:10px; border-radius:5px; border:none; background:#ff4d4d; color:#fff;">Hard</button>
                </div>
            </div>
        </div>

        <div style="margin-top:10px; display:flex; gap:10px;">
             <button id="pauseBtn" style="background:#222; color:#d4af37; border:1px solid #d4af37; padding:8px 15px; cursor:pointer; border-radius:20px; font-size:14px;">Pause</button>
             <button onclick="document.getElementById('offline-game-overlay').remove()" style="color:#777; background:none; border:none; cursor:pointer; font-size:14px;">Close Game</button>
        </div>
        <div id="bonus-alert" style="position:fixed; top:30%; font-size:25px; color:#ffcc00; font-weight:bold; display:none; pointer-events:none; z-index:10000000; text-shadow:2px 2px 5px #000; text-align:center; width:100%;">BONUS!</div>
    `;
    
    document.body.appendChild(overlay);
    DragonGame.init();
}

// DragonGame.init এর ভেতরে Canvas Resize লজিক:
DragonGame.init = function() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // মোবাইলের স্ক্রিন অনুযায়ী ক্যানভাস সাইজ নির্ধারণ
    let screenWidth = window.innerWidth * 0.95;
    this.canvas.width = screenWidth > 800 ? 800 : screenWidth;
    this.canvas.height = window.innerHeight * 0.6; // হাইট স্ক্রিনের ৬০%

    this.setupControls();
    this.setupDifficulty();
    
    // হাইস্কোর লোড
    document.getElementById('hiScore').innerText = this.highscore;
};

function initDragonGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('curScore');
    const hiScoreEl = document.getElementById('hiScore');
    const discountEl = document.getElementById('discount-status');
    const bonusAlert = document.getElementById('bonus-alert');

    canvas.width = window.innerWidth > 800 ? 800 : window.innerWidth - 40;
    canvas.height = 500;

    let highscore = localStorage.getItem('dragonHiScore') || 0;
    hiScoreEl.innerText = highscore;

    let gameRunning = false;
    let isPaused = false;
    let score = 0;
    let discount = 5;
    let baseSpeed = 4;
    let mouse = { x: canvas.width/2, y: canvas.height/2 };

    let player = {
        body: [],
        angle: 0,
        length: 15,
        color: '#d4af37'
    };

    let enemies = [];
    let foods = [];
    const shopItems = ['👕', '📱', '👟', '👜', '🎧', '⌚', '📺', '💻'];

    function resetPlayer() {
        player.body = [];
        for(let i=0; i<player.length; i++) {
            player.body.push({x: canvas.width/2 - i*5, y: canvas.height/2});
        }
    }

    function createEnemy() {
        let len = 10 + Math.random() * 20;
        let startX = Math.random() * canvas.width;
        let startY = Math.random() * canvas.height;
        let enemy = { body: [], angle: Math.random()*Math.PI*2, length: len, color: '#ff4d4d', turnTimer: 0 };
        for(let i=0; i<len; i++) enemy.body.push({x: startX, y: startY});
        return enemy;
    }

    function spawnFood() {
        return {
            x: Math.random() * (canvas.width - 40) + 20,
            y: Math.random() * (canvas.height - 40) + 20,
            icon: shopItems[Math.floor(Math.random() * shopItems.length)]
        };
    }

    // ড্রাগন ডিজাইন ড্রয়িং (মেরুদণ্ড ও ডানা সহ)
    function drawDragon(dragon, isPlayer) {
        dragon.body.forEach((p, i) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            
            // মাথা ড্রয়িং
            if(i === 0) {
                ctx.rotate(dragon.angle);
                ctx.fillStyle = dragon.color;
                // ডাউরা মাথা (ছবি অনুযায়ী)
                ctx.beginPath();
                ctx.moveTo(15, 0); ctx.lineTo(-10, -10); ctx.lineTo(-10, 10); ctx.closePath();
                ctx.fill();
                // চোখ
                ctx.fillStyle = "#fff";
                ctx.fillRect(2, -5, 3, 3); ctx.fillRect(2, 2, 3, 3);
            } else {
                // বডি পার্টস (ছবি অনুযায়ী ডানা/মেরুদণ্ড যোগ করা)
                let size = 10 - (i/dragon.length) * 5;
                ctx.fillStyle = dragon.color;
                ctx.globalAlpha = 1 - (i/dragon.length) * 0.5;
                
                // ডানা/মেরুদণ্ড (Spines)
                if(i % 5 === 0) {
                    ctx.rotate(dragon.angle + Math.PI/2);
                    ctx.fillRect(-15, -1, 30, 2); // দুই পাশে ডানা বা লম্বা মেরুদণ্ড
                }
                
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    function update() {
        if(!gameRunning || isPaused) return;

        // Player Move
        let head = player.body[0];
        let targetAngle = Math.atan2(mouse.y - head.y, mouse.x - head.x);
        let diff = targetAngle - player.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        player.angle += diff * 0.1;

        let newHead = {
            x: head.x + Math.cos(player.angle) * baseSpeed,
            y: head.y + Math.sin(player.angle) * baseSpeed
        };

        // দেয়াল বাউন্স বা লিমিট
        if(newHead.x < 0) newHead.x = canvas.width;
        if(newHead.x > canvas.width) newHead.x = 0;
        if(newHead.y < 0) newHead.y = canvas.height;
        if(newHead.y > canvas.height) newHead.y = 0;

        player.body.unshift(newHead);
        if(player.body.length > player.length) player.body.pop();

        // Enemies AI
        enemies.forEach((en, enIdx) => {
            en.turnTimer--;
            if(en.turnTimer <= 0) {
                en.angle += (Math.random() - 0.5);
                en.turnTimer = 20 + Math.random()*50;
            }
            let enHead = en.body[0];
            let enNewHead = {
                x: enHead.x + Math.cos(en.angle) * (baseSpeed * 0.7),
                y: enHead.y + Math.sin(en.angle) * (baseSpeed * 0.7)
            };
            
            // Screen Wrap for Enemies
            if(enNewHead.x < 0) enNewHead.x = canvas.width;
            if(enNewHead.x > canvas.width) enNewHead.x = 0;
            if(enNewHead.y < 0) enNewHead.y = canvas.height;
            if(enNewHead.y > canvas.height) enNewHead.y = 0;

            en.body.unshift(enNewHead);
            if(en.body.length > en.length) en.body.pop();

            // Collision: Player vs Enemy
            let distToEnemy = Math.hypot(newHead.x - enNewHead.x, newHead.y - enNewHead.y);
            if(distToEnemy < 15) {
                // মরা চেক: যার মাথা অন্যজনের গায়ে লাগবে সে মরবে
                let bonus = Math.floor(en.length);
                showBonus(bonus);
                score += bonus * 10;
                enemies.splice(enIdx, 1);
                enemies.push(createEnemy());
            }
        });

        // Food Collision
        foods.forEach((f, fIdx) => {
            if(Math.hypot(newHead.x - f.x, newHead.y - f.y) < 20) {
                score += 5;
                player.length += 2;
                foods[fIdx] = spawnFood();
                updateUI();
            }
        });
    }

    function updateUI() {
        scoreEl.innerText = score;
        discount = Math.min(95, 5 + Math.floor(score/20));
        discountEl.innerText = `Discount: ${discount}%`;
        if(score > highscore) {
            highscore = score;
            localStorage.setItem('dragonHiScore', highscore);
            hiScoreEl.innerText = highscore;
        }
    }

    function showBonus(amt) {
        bonusAlert.innerText = `+${amt}% EXTRA DISCOUNT!`;
        bonusAlert.style.display = 'block';
        setTimeout(() => bonusAlert.style.display = 'none', 1500);
    }

    function gameOver() {
        gameRunning = false;
        alert("GAME OVER! Final Discount: " + discount + "%");
        document.getElementById('game-menu').style.display = 'block';
    }

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid background
        ctx.strokeStyle = '#111';
        for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
        for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke(); }

        foods.forEach(f => {
            ctx.font = "20px Arial";
            ctx.fillText(f.icon, f.x-10, f.y+10);
        });

        enemies.forEach(en => drawDragon(en, false));
        drawDragon(player, true);
    }

    function gameLoop() {
        if(!isPaused) {
            update();
            draw();
        }
        if(gameRunning) requestAnimationFrame(gameLoop);
    }

    // Difficulty Select & Start
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.onclick = () => {
            baseSpeed = parseFloat(btn.dataset.speed);
            score = 0;
            player.length = 15;
            resetPlayer();
            foods = Array(8).fill(0).map(spawnFood);
            enemies = Array(5).fill(0).map(createEnemy);
            document.getElementById('game-menu').style.display = 'none';
            gameRunning = true;
            updateUI();
            gameLoop();
        };
    });

    // Control
    const handleMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX || (e.touches && e.touches[0].clientX);
        const cy = e.clientY || (e.touches && e.touches[0].clientY);
        mouse.x = cx - rect.left;
        mouse.y = cy - rect.top;
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, {passive: false});

    document.getElementById('pauseBtn').onclick = () => {
        isPaused = !isPaused;
        document.getElementById('pauseBtn').innerText = isPaused ? "Resume" : "Pause";
    };
}