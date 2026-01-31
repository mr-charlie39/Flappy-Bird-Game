
        // Enhanced Game variables
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        const scoreDisplay = document.getElementById('score');
        const levelDisplay = document.getElementById('level');
        const finalScoreDisplay = document.getElementById('finalScore');
        const finalLevelDisplay = document.getElementById('finalLevel');
        const bestScoreDisplay = document.getElementById('bestScore');
        const levelUpDisplay = document.getElementById('levelUp');
        const comboDisplay = document.getElementById('comboDisplay');
        const comboCount = document.getElementById('comboCount');
        
        // Set canvas size
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        
        // Enhanced Game state
        let game = {
            running: false,
            score: 0,
            level: 1,
            bestScore: localStorage.getItem('flappyBestScore') || 0,
            gravity: 0.4, // Reduced gravity for easier gameplay
            speed: 2.5, // Slower starting speed
            pipesPassed: 0,
            pipesToNextLevel: 5,
            combo: 0,
            maxLevel: 6
        };
        
        // Enhanced Bird properties
        let bird = {
            x: 150,
            y: canvas.height / 2,
            width: 35,
            height: 25,
            velocity: 0,
            jump: -9, // Reduced jump for smoother control
            rotation: 0,
            color: '#00ccff',
            trail: []
        };
        
        // Enhanced Pipes array
        let pipes = [];
        
        // Power-ups array
        let powerUps = [];
        
        // Background elements
        let clouds = [];
        let particles = [];
        let stars = [];
        
        // Initialize background elements
        function initBackground() {
            clouds = [];
            for (let i = 0; i < 10; i++) {
                clouds.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 0.7,
                    size: Math.random() * 70 + 50,
                    speed: Math.random() * 0.3 + 0.1,
                    opacity: Math.random() * 0.5 + 0.3
                });
            }
            
            stars = [];
            for (let i = 0; i < 50; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 1,
                    brightness: Math.random() * 0.5 + 0.5,
                    twinkle: Math.random() * Math.PI * 2
                });
            }
            
            particles = [];
            powerUps = [];
        }
        
        // Create a new pipe (easier with larger gaps)
        function createPipe() {
            const baseGap = 180; // Larger gap for easier gameplay
            const levelReduction = (game.level - 1) * 5; // Smaller reduction per level
            const gap = baseGap - levelReduction;
            
            // Ensure minimum gap
            const minGap = 130;
            const finalGap = Math.max(gap, minGap);
            
            const topHeight = Math.random() * (canvas.height - finalGap - 150) + 50;
            
            // Create power-up chance (30% chance)
            if (Math.random() < 0.3 && game.level > 1) {
                powerUps.push({
                    x: canvas.width + 100,
                    y: topHeight + finalGap / 2,
                    size: 20,
                    type: 'star',
                    color: '#FFD700',
                    collected: false
                });
            }
            
            // Vibrant pipe colors based on level
            const hue = (game.level * 30) % 360;
            
            pipes.push({
                x: canvas.width,
                topHeight: topHeight,
                gap: finalGap,
                width: 60, // Narrower pipes
                passed: false,
                color: `hsl(${hue}, 80%, 60%)`,
                highlight: `hsl(${hue}, 90%, 80%)`,
                depth: Math.random() * 15 + 5,
                rotation: 0,
                glow: 0
            });
        }
        
        // Create particles with vibrant colors
        function createParticles(x, y, count, color, size = 3) {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8 - 4,
                    size: Math.random() * size + size/2,
                    color: color,
                    life: Math.random() * 40 + 20,
                    type: 'circle'
                });
            }
        }
        
        // Play sound effects using Web Audio API
        function playSound(frequency, duration, type = 'sine') {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = type;
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            } catch (e) {
                // Sound not critical, continue without it
            }
        }
        
        // Update game state
        function update() {
            if (!game.running) return;
            
            // Update bird with smoother physics
            bird.velocity += game.gravity;
            bird.y += bird.velocity;
            
            // Add position to trail
            bird.trail.push({x: bird.x, y: bird.y});
            if (bird.trail.length > 10) bird.trail.shift();
            
            // Rotate bird based on velocity (smoother)
            bird.rotation = bird.velocity * 2;
            if (bird.rotation > 70) bird.rotation = 70;
            if (bird.rotation < -20) bird.rotation = -20;
            
            // Check floor and ceiling collision (with buffer)
            if (bird.y + bird.height / 2 >= canvas.height - 5 || bird.y - bird.height / 2 <= 5) {
                gameOver();
                return;
            }
            
            // Update pipes
            for (let i = pipes.length - 1; i >= 0; i--) {
                const pipe = pipes[i];
                
                // Move pipe with speed based on level (more gradual increase)
                pipe.x -= game.speed + ((game.level - 1) * 0.3);
                pipe.rotation += 0.3;
                pipe.glow = Math.sin(Date.now() / 200 + i) * 0.5 + 0.5;
                
                // Check if pipe is off screen
                if (pipe.x + pipe.width < 0) {
                    pipes.splice(i, 1);
                    continue;
                }
                
                // Check if bird passed the pipe
                if (!pipe.passed && pipe.x + pipe.width < bird.x) {
                    pipe.passed = true;
                    game.score += 10 + game.level * 2;
                    game.pipesPassed += 1;
                    game.combo += 1;
                    
                    // Update combo display
                    if (game.combo > 1) {
                        comboCount.textContent = game.combo;
                        comboDisplay.classList.add('show');
                        setTimeout(() => comboDisplay.classList.remove('show'), 1000);
                        
                        // Bonus for combos
                        game.score += game.combo * 5;
                    }
                    
                    scoreDisplay.textContent = game.score;
                    
                    // Create celebration particles
                    createParticles(pipe.x + pipe.width / 2, canvas.height / 2, 15, pipe.color, 4);
                    playSound(800 + game.combo * 50, 0.1);
                    
                    // Check if level should increase
                    if (game.pipesPassed >= game.pipesToNextLevel && game.level < game.maxLevel) {
                        levelUp();
                    }
                }
                
                // Check collision with bird (more forgiving hitbox)
                const birdLeft = bird.x - bird.width / 2 + 5;
                const birdRight = bird.x + bird.width / 2 - 5;
                const birdTop = bird.y - bird.height / 2 + 5;
                const birdBottom = bird.y + bird.height / 2 - 5;
                
                const pipeRight = pipe.x + pipe.width;
                const pipeBottom = pipe.topHeight;
                const pipeTop = pipe.topHeight + pipe.gap;
                
                if (
                    birdRight > pipe.x &&
                    birdLeft < pipeRight &&
                    (birdTop < pipeBottom || birdBottom > pipeTop)
                ) {
                    // Small chance to "bounce" off pipe (5% chance)
                    if (Math.random() < 0.05 && game.level < 3) {
                        bird.velocity = -5;
                        createParticles(bird.x, bird.y, 20, '#FF5555', 2);
                        playSound(300, 0.2);
                    } else {
                        gameOver();
                        return;
                    }
                }
            }
            
            // Update power-ups
            for (let i = powerUps.length - 1; i >= 0; i--) {
                const powerUp = powerUps[i];
                powerUp.x -= game.speed + ((game.level - 1) * 0.3);
                
                // Check collection
                if (!powerUp.collected) {
                    const dx = bird.x - powerUp.x;
                    const dy = bird.y - powerUp.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < bird.width / 2 + powerUp.size) {
                        powerUp.collected = true;
                        game.score += 50;
                        scoreDisplay.textContent = game.score;
                        
                        // Create collection effect
                        createParticles(powerUp.x, powerUp.y, 30, powerUp.color, 6);
                        playSound(1200, 0.3, 'sine');
                        
                        // Grant temporary invincibility
                        setTimeout(() => {
                            if (game.running) {
                                createParticles(bird.x, bird.y, 20, '#FFFFFF', 3);
                            }
                        }, 100);
                    }
                }
                
                // Remove if off screen
                if (powerUp.x + powerUp.size < 0) {
                    powerUps.splice(i, 1);
                }
            }
            
            // Add new pipes
            if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300) {
                createPipe();
            }
            
            // Update clouds
            for (let cloud of clouds) {
                cloud.x -= cloud.speed;
                if (cloud.x + cloud.size < 0) {
                    cloud.x = canvas.width + cloud.size;
                    cloud.y = Math.random() * canvas.height * 0.7;
                }
            }
            
            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05;
                p.life--;
                
                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }
            
            // Update stars twinkle
            for (let star of stars) {
                star.twinkle += 0.05;
            }
        }
        
        // Draw everything with enhanced visuals
        function draw() {
            // Clear canvas with beautiful gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#001122');
            gradient.addColorStop(0.5, '#002244');
            gradient.addColorStop(1, '#000811');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw twinkling stars
            for (let star of stars) {
                const brightness = 0.5 + Math.sin(star.twinkle) * 0.5;
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * brightness})`;
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw clouds with enhanced parallax
            for (let cloud of clouds) {
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
                
                // Draw fluffy cloud
                for (let i = 0; i < 7; i++) {
                    const angle = (i / 7) * Math.PI * 2;
                    const offsetX = Math.cos(angle) * (cloud.size / 4);
                    const offsetY = Math.sin(angle) * (cloud.size / 6);
                    ctx.arc(
                        cloud.x + offsetX,
                        cloud.y + offsetY,
                        cloud.size / 3.5,
                        0,
                        Math.PI * 2
                    );
                }
                
                ctx.fill();
            }
            
            // Draw bird trail
            for (let i = 0; i < bird.trail.length; i++) {
                const point = bird.trail[i];
                const alpha = i / bird.trail.length * 0.3;
                
                ctx.beginPath();
                ctx.fillStyle = `rgba(0, 204, 255, ${alpha})`;
                ctx.arc(point.x, point.y, bird.width / 2 * (i / bird.trail.length), 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw pipes with enhanced 3D effect
            for (let pipe of pipes) {
                // Glow effect
                ctx.shadowColor = pipe.color;
                ctx.shadowBlur = 20 * pipe.glow;
                
                // Draw top pipe
                ctx.save();
                ctx.translate(pipe.x + pipe.width / 2, pipe.topHeight / 2);
                ctx.rotate(pipe.rotation * Math.PI / 180);
                
                // Pipe with gradient
                const pipeGradient = ctx.createLinearGradient(-pipe.width / 2, 0, pipe.width / 2, 0);
                pipeGradient.addColorStop(0, pipe.highlight);
                pipeGradient.addColorStop(1, pipe.color);
                
                ctx.fillStyle = pipeGradient;
                ctx.fillRect(-pipe.width / 2, -pipe.topHeight / 2, pipe.width, pipe.topHeight);
                
                // Pipe details
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(-pipe.width / 2, -pipe.topHeight / 2, pipe.width, 5);
                
                ctx.restore();
                ctx.shadowBlur = 0;
                
                // Draw bottom pipe
                ctx.save();
                ctx.shadowColor = pipe.color;
                ctx.shadowBlur = 20 * pipe.glow;
                
                const bottomY = pipe.topHeight + pipe.gap;
                const bottomHeight = canvas.height - bottomY;
                ctx.translate(pipe.x + pipe.width / 2, bottomY + bottomHeight / 2);
                ctx.rotate(-pipe.rotation * Math.PI / 180);
                
                ctx.fillStyle = pipeGradient;
                ctx.fillRect(-pipe.width / 2, -bottomHeight / 2, pipe.width, bottomHeight);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(-pipe.width / 2, bottomHeight / 2 - 5, pipe.width, 5);
                
                ctx.restore();
                ctx.shadowBlur = 0;
            }
            
            // Draw power-ups
            for (let powerUp of powerUps) {
                if (!powerUp.collected) {
                                        ctx.save();
                    ctx.shadowColor = powerUp.color;
                    ctx.shadowBlur = 15;
                    
                    // Animated pulsing
                    const pulse = Math.sin(Date.now() / 200) * 3;
                    
                    ctx.fillStyle = powerUp.color;
                    ctx.beginPath();
                    ctx.arc(powerUp.x, powerUp.y, powerUp.size + pulse, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Star shape
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    for(let i = 0; i < 5; i++) {
                        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                        const x = powerUp.x + Math.cos(angle) * (powerUp.size + pulse) * 0.6;
                        const y = powerUp.y + Math.sin(angle) * (powerUp.size + pulse) * 0.6;
                        if(i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                }
            }
            
            // Draw particles
            for (let p of particles) {
                ctx.globalAlpha = p.life / 50;
                
                if (p.type === 'circle') {
                    ctx.beginPath();
                    ctx.fillStyle = p.color;
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
                }
                
                ctx.globalAlpha = 1;
            }
            
            // Draw bird with enhanced visuals
            ctx.save();
            ctx.translate(bird.x, bird.y);
            ctx.rotate(bird.rotation * Math.PI / 180);
            
            // Bird body gradient
            const birdGradient = ctx.createLinearGradient(
                -bird.width/2, 0,
                bird.width/2, 0
            );
            birdGradient.addColorStop(0, '#00ccff');
            birdGradient.addColorStop(1, '#0066ff');
            
            // Bird body
            ctx.fillStyle = birdGradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird wing (animated flapping)
            ctx.fillStyle = '#0088cc';
            ctx.beginPath();
            const wingFlap = Math.sin(Date.now() / 120) * 8;
            ctx.ellipse(-bird.width / 3, wingFlap, bird.width / 2.5, bird.height / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(bird.width / 3, -bird.height / 5, bird.width / 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(bird.width / 3 + 2, -bird.height / 5, bird.width / 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird beak
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.moveTo(bird.width / 2.5, 0);
            ctx.lineTo(bird.width / 1.8, 0);
            ctx.lineTo(bird.width / 2.5, -bird.height / 4);
            ctx.closePath();
            ctx.fill();
            
            // Bird cheek (cute effect)
            ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(bird.width / 4, bird.height / 6, bird.width / 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            
            // Draw progress bar for next level
            const progressWidth = 250;
            const progress = (game.pipesPassed / game.pipesToNextLevel) * progressWidth;
            const nextLevelProgress = game.level >= game.maxLevel ? 1 : game.pipesPassed / game.pipesToNextLevel;
            
            // Progress bar background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(canvas.width / 2 - progressWidth / 2, 15, progressWidth, 12);
            
            // Progress bar fill with gradient
            const progressGradient = ctx.createLinearGradient(
                canvas.width / 2 - progressWidth / 2,
                0,
                canvas.width / 2 - progressWidth / 2 + progress,
                0
            );
            progressGradient.addColorStop(0, '#00ff88');
            progressGradient.addColorStop(1, '#00aaff');
            
            ctx.fillStyle = progressGradient;
            ctx.fillRect(canvas.width / 2 - progressWidth / 2, 15, progress, 12);
            
            // Progress bar border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width / 2 - progressWidth / 2, 15, progressWidth, 12);
            
            // Level progress text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (game.level < game.maxLevel) {
                ctx.fillText(
                    `Level ${game.level}: ${game.pipesPassed}/${game.pipesToNextLevel} pipes`,
                    canvas.width / 2,
                    40
                );
                ctx.font = '14px Arial';
                ctx.fillStyle = '#a0e7ff';
                ctx.fillText(
                    `Next level: Speed ${(game.speed + game.level * 0.3 + 0.5).toFixed(1)}`,
                    canvas.width / 2,
                    60
                );
            } else {
                ctx.fillText(
                    `MAX LEVEL REACHED! Keep flying for high score!`,
                    canvas.width / 2,
                    40
                );
            }
            
            // Draw current speed
            ctx.font = '14px Arial';
            ctx.fillStyle = '#ffcc00';
            ctx.textAlign = 'left';
            ctx.fillText(`Speed: ${(game.speed + (game.level - 1) * 0.3).toFixed(1)}`, 20, canvas.height - 20);
            
            // Draw combo if active
            if (game.combo > 1) {
                ctx.textAlign = 'right';
                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = '#ff9900';
                ctx.fillText(`COMBO x${game.combo}!`, canvas.width - 20, 80);
            }
        }
        
        // Game loop
        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }
        
        // Start the game
        function startGame() {
            game.running = true;
            game.score = 0;
            game.level = 1;
            game.pipesPassed = 0;
            game.combo = 0;
            game.speed = 2.5;
            
            bird.y = canvas.height / 2;
            bird.velocity = 0;
            bird.rotation = 0;
            bird.trail = [];
            
            pipes = [];
            powerUps = [];
            initBackground();
            
            scoreDisplay.textContent = game.score;
            levelDisplay.textContent = `Level ${game.level}`;
            
            startScreen.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            levelUpDisplay.classList.remove('show');
            levelUpDisplay.classList.add('hidden');
            comboDisplay.classList.remove('show');
            
            // Play start sound
            playSound(600, 0.2);
            playSound(800, 0.2);
            
            // Create first pipe after delay
            setTimeout(() => createPipe(), 1500);
        }
        
        // Game over
        function gameOver() {
            game.running = false;
            
            // Break combo
            game.combo = 0;
            comboDisplay.classList.remove('show');
            
            // Update best score
            if (game.score > game.bestScore) {
                game.bestScore = game.score;
                localStorage.setItem('flappyBestScore', game.bestScore);
            }
            
            // Update final score display
            finalScoreDisplay.textContent = game.score;
            finalLevelDisplay.textContent = game.level;
            bestScoreDisplay.textContent = game.bestScore;
            
            // Create explosion particles
            createParticles(bird.x, bird.y, 40, '#ff5555', 5);
            createParticles(bird.x, bird.y, 30, '#ff9900', 3);
            
            // Play game over sound
            playSound(300, 0.3);
            setTimeout(() => playSound(200, 0.4), 100);
            
            // Show game over screen after delay
            setTimeout(() => {
                gameOverScreen.classList.remove('hidden');
            }, 1000);
        }
        
        // Level up
        function levelUp() {
            if (game.level >= game.maxLevel) return;
            
            game.level++;
            game.pipesPassed = 0;
            game.speed += 0.5;
            
            // Update level display
            levelDisplay.textContent = `Level ${game.level}`;
            
            // Show level up animation
            levelUpDisplay.classList.remove('hidden');
            levelUpDisplay.innerHTML = `
                <div>LEVEL ${game.level} UNLOCKED!</div>
                <div style="font-size: 1.5rem; margin-top: 15px;">
                    Speed: ${game.speed.toFixed(1)}<br>
                    ${game.level === game.maxLevel ? 'MAX LEVEL!' : 'Keep going!'}
                </div>
            `;
            levelUpDisplay.classList.add('show');
            
            // Create celebration particles
            createParticles(canvas.width / 2, canvas.height / 2, 60, '#00ffcc', 6);
            createParticles(canvas.width / 2, canvas.height / 2, 40, '#0088ff', 4);
            
            // Play level up sound
            playSound(1000, 0.3);
            setTimeout(() => playSound(1200, 0.3), 100);
            setTimeout(() => playSound(1400, 0.3), 200);
            
            // Hide level up message after 2.5 seconds
            setTimeout(() => {
                levelUpDisplay.classList.remove('show');
                setTimeout(() => {
                    levelUpDisplay.classList.add('hidden');
                }, 500);
            }, 2500);
        }
        
        // Bird jump
        function birdJump() {
            if (!game.running) {
                if (gameOverScreen.classList.contains('hidden')) {
                    startGame();
                }
                return;
            }
            
            bird.velocity = bird.jump;
            
            // Create jump particles
            createParticles(bird.x, bird.y + bird.height / 2, 8, '#00ffff', 2);
            createParticles(bird.x, bird.y + bird.height / 2, 5, '#ffffff', 1);
            
            // Play jump sound
            playSound(500 + Math.random() * 100, 0.1);
            
            // Reset combo if no recent pipe
            setTimeout(() => {
                if (game.combo > 0) {
                    let hasRecentPipe = false;
                    for (let pipe of pipes) {
                        if (pipe.x > bird.x - 100 && pipe.x < bird.x + 100) {
                            hasRecentPipe = true;
                            break;
                        }
                    }
                    if (!hasRecentPipe) {
                        game.combo = 0;
                        comboDisplay.classList.remove('show');
                    }
                }
            }, 500);
        }
        
        // Event listeners
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                birdJump();
                e.preventDefault();
            }
            
            // Cheat codes for testing (remove in production)
            if (e.code === 'KeyU' && e.ctrlKey) {
                game.score += 100;
                scoreDisplay.textContent = game.score;
            }
            if (e.code === 'KeyL' && e.ctrlKey && game.level < game.maxLevel) {
                levelUp();
            }
        });
        
        canvas.addEventListener('click', birdJump);
        canvas.addEventListener('touchstart', (e) => {
            birdJump();
            e.preventDefault();
        });
        
        // Auto-jump when mouse is held (for easier gameplay)
        let mouseDown = false;
        let autoJumpInterval;
        
        canvas.addEventListener('mousedown', () => {
            mouseDown = true;
            birdJump();
            autoJumpInterval = setInterval(() => {
                if (mouseDown && game.running) {
                    birdJump();
                }
            }, 150);
        });
        
        canvas.addEventListener('mouseup', () => {
            mouseDown = false;
            clearInterval(autoJumpInterval);
        });
        
        canvas.addEventListener('mouseleave', () => {
            mouseDown = false;
            clearInterval(autoJumpInterval);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            initBackground();
        });
        
        // Initialize
        initBackground();
        gameLoop();
        
        // Display best score
        bestScoreDisplay.textContent = game.bestScore;
        
        // Show welcome tip
        setTimeout(() => {
            if (startScreen && !game.running) {
                const tip = document.createElement('div');
                tip.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0, 100, 200, 0.9);
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    max-width: 300px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    z-index: 1000;
                    animation: slideIn 0.5s ease;
                `;
                tip.innerHTML = `
                    <strong>💡 Pro Tip:</strong><br>
                    Hold mouse/tap for continuous flying!<br>
                    Collect stars for bonus points! ✨
                `;
                document.body.appendChild(tip);
                
                setTimeout(() => {
                    tip.style.animation = 'slideOut 0.5s ease forwards';
                    setTimeout(() => tip.remove(), 500);
                }, 5000);
                
                // Add CSS for animations
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
        }, 2000);