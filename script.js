const canvas = document.getElementById('art-canvas');
const ctx = canvas.getContext('2d');
const finalMessageEl = document.getElementById('final-message');
const instructionOverlay = document.getElementById('instruction-overlay');

let width, height;
let particles = [];
let floatingTexts = [];
let mouse = { x: null, y: null, radius: 150 };
let cursorParticle = null;
let firstInteractionDone = false;

const greetings = [
    "Happy Women's Day", "Feliz Día de la Mujer", "Bonne Journée de la Femme",
    "Alles Gute zum Frauentag", "妇女节快乐", "国際女性デーおめでとう",
    "С Международным женским днём", "يوم مرأة سعيد", "महिला दिवस की शुभकामनाएँ",
    "Feliz Dia da Mulher", "Buona Festa della Donna", "Siku ya Wanawake Njema"
];

const STATE = {
    INTRO: 'intro',
    INTERACTIVE: 'interactive',
    CULMINATION: 'culmination',
    RESET: 'reset'
};
let currentState = STATE.INTRO;
let stateTimer = 0;
const INTRO_DURATION = 300; 
const INTERACTIVE_DURATION = 3600;
const CULMINATION_DURATION = 600;
const RESET_DURATION = 120;

function setCanvasSize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

class Particle {
    constructor(x, y, isBurst = false) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.isBurst = isBurst;
        this.size = Math.random() * 2.5 + 1;
        this.originalSize = this.size;
        this.targetX = null;
        this.targetY = null;
        this.ease = 0.05 + Math.random() * 0.05;

        if (isBurst) {
            this.speedX = (Math.random() - 0.5) * (Math.random() * 15);
            this.speedY = (Math.random() - 0.5) * (Math.random() * 15);
            this.life = Math.random() * 80 + 80;
            this.size = Math.random() * 4 + 2.5;
            this.originalSize = this.size;
            this.color = `hsl(${Math.random() * 25 + 35}, 100%, ${Math.random() * 40 + 60}%)`;
        } else {
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.life = Infinity;
            this.color = `hsl(${Math.random() * 60 + 240}, 100%, ${Math.random() * 40 + 50}%)`;
            if (Math.random() < 0.1) {
                this.color = `hsl(${Math.random() * 15 + 40}, 100%, ${Math.random() * 30 + 60}%)`;
            }
        }
    }

    draw() {
        ctx.beginPath();
        if (mouse.x !== null && !this.isBurst) {
            let dx = this.x - mouse.x;
            let dy = this.y - mouse.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                let force = (mouse.radius - distance) / mouse.radius;
                ctx.shadowColor = `hsla(50, 100%, 85%, ${force * 0.8})`;
                ctx.shadowBlur = 20 * force;
            }
        }
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    update() {
        if (this.isBurst) {
            this.life--;
            this.x += this.speedX;
            this.y += this.speedY;
            this.speedX *= 0.96;
            this.speedY *= 0.96;
            if (this.size > 0.1) this.size *= 0.98;
            return;
        }

        if (currentState === STATE.CULMINATION && this.targetX !== null) {
            let dx = this.targetX - this.x;
            let dy = this.targetY - this.y;
            this.x += dx * this.ease;
            this.y += dy * this.ease;
        } else {
            let dx = this.x - mouse.x;
            let dy = this.y - mouse.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouse.radius && mouse.x !== null) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = (mouse.radius - distance) / mouse.radius;
                this.x += forceDirectionX * force * 3.5;
                this.y += forceDirectionY * force * 3.5;
                this.size = this.originalSize + force * 3.5;
            } else {
                if (this.size > this.originalSize) {
                    this.size -= 0.1;
                }
                if (this.x !== this.originX) {
                    let dx_o = this.x - this.originX;
                    this.x -= dx_o / 20;
                }
                if (this.y !== this.originY) {
                    let dy_o = this.y - this.originY;
                    this.y -= dy_o / 20;
                }
            }
        }
    }
}

class FloatingText {
    constructor() {
        this.text = greetings[Math.floor(Math.random() * greetings.length)];
        this.x = Math.random() * width * 0.8 + width * 0.1;
        this.y = Math.random() * height * 0.5 + height * 0.5;
        this.speedY = -(Math.random() * 0.3 + 0.2);
        this.opacity = 0;
        this.life = 300;
        this.fontSize = Math.random() * 1.5 + 1;
        this.color = `hsla(50, 100%, 85%, ${this.opacity})`;
    }

    update() {
        this.y += this.speedY;
        this.life--;
        if (this.life > 240) {
            this.opacity = Math.min(1, this.opacity + 0.05);
        } else if (this.life < 60) {
            this.opacity = Math.max(0, this.opacity - 0.05);
        }
        this.color = `hsla(50, 100%, 85%, ${this.opacity})`;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.font = `${this.fontSize}vw 'Times New Roman', Times, serif`;
        ctx.shadowColor = 'rgba(255, 221, 119, 0.7)';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.shadowBlur = 0;
    }
}

class CursorParticle {
    constructor() {
        this.x = -100;
        this.y = -100;
        this.size = 2;
        this.color = 'rgba(255, 235, 179, 0.8)';
    }
    draw() {
        if(mouse.x !== null) {
            this.x = mouse.x;
            this.y = mouse.y;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

function init() {
    setCanvasSize();
    particles = [];
    floatingTexts = [];
    cursorParticle = new CursorParticle();
    const numberOfParticles = Math.floor(width * height / 9000);
    for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * width;
        let y = Math.random() * height;
        particles.push(new Particle(x, y));
    }
}

function handleParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].isBurst && particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function handleFloatingTexts() {
    if (currentState === STATE.INTERACTIVE && Math.random() < 0.01 && floatingTexts.length < 5) {
        floatingTexts.push(new FloatingText());
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        floatingTexts[i].draw();
        if (floatingTexts[i].life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function getVenusSymbolPoints(centerX, centerY, scale) {
    const points = [];
    const radius = scale;
    for (let i = 0; i < 360; i += 5) {
        let angle = i * Math.PI / 180;
        points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius - (radius * 0.7)
        });
    }
    for (let i = 0; i < radius * 1.5; i += 5) {
        points.push({x: centerX, y: centerY + i - (radius*0.7) + radius});
    }
    for (let i = -radius * 0.7; i < radius * 0.7; i += 5) {
        points.push({x: centerX + i, y: centerY + radius});
    }
    return points;
}

function stateMachine() {
    stateTimer++;
    switch (currentState) {
        case STATE.INTRO:
            ctx.globalAlpha = Math.min(1, stateTimer / (INTRO_DURATION * 0.8));
            if (stateTimer > INTRO_DURATION) {
                currentState = STATE.INTERACTIVE;
                stateTimer = 0;
            }
            break;
        case STATE.INTERACTIVE:
            if (stateTimer > INTERACTIVE_DURATION) {
                currentState = STATE.CULMINATION;
                stateTimer = 0;
                floatingTexts = [];
                const venusPoints = getVenusSymbolPoints(width / 2, height / 2, Math.min(width, height) / 6);
                particles.forEach((p, i) => {
                    const target = venusPoints[i % venusPoints.length];
                    p.targetX = target.x;
                    p.targetY = target.y;
                });
                finalMessageEl.innerText = "Empowered Women, Empower the World";
                finalMessageEl.style.opacity = '1';
            }
            break;
        case STATE.CULMINATION:
             if (stateTimer > CULMINATION_DURATION) {
                currentState = STATE.RESET;
                stateTimer = 0;
                finalMessageEl.style.opacity = '0';
            }
            break;
        case STATE.RESET:
            ctx.globalAlpha = Math.max(0, 1 - stateTimer / RESET_DURATION);
            if(stateTimer > RESET_DURATION) {
                currentState = STATE.INTRO;
                stateTimer = 0;
                init();
            }
            break;
    }
}

function handleFirstInteraction() {
    if (firstInteractionDone) return;
    firstInteractionDone = true;
    instructionOverlay.style.opacity = '0';
    setTimeout(() => {
        instructionOverlay.style.pointerEvents = 'none';
    }, 1500);
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    if(currentState !== STATE.RESET) {
        ctx.globalAlpha = 1;
    }
    stateMachine();
    handleParticles();
    handleFloatingTexts();
    cursorParticle.draw();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    init();
});

window.addEventListener('mousemove', (event) => {
    handleFirstInteraction();
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

window.addEventListener('click', (event) => {
    handleFirstInteraction();
    if (currentState === STATE.INTERACTIVE) {
        for (let i = 0; i < 60; i++) {
            particles.push(new Particle(event.x, event.y, true));
        }
    }
});

init();
animate();
