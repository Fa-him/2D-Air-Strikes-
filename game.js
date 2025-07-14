import { getIndexFingerTip } from './handcontrol.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImg = new Image(); playerImg.src = "assets/player.jpeg";
const enemyImg  = new Image(); enemyImg.src  = "assets/enemy.jpeg";
const bulletImg = new Image(); bulletImg.src = "assets/bullet.png";
const heartImg  = new Image(); heartImg.src  = "assets/heart.png";

const bgMusic = new Audio("assets/bg.mp3"); bgMusic.loop = false; bgMusic.volume = 0.3;
const explodeSound = new Audio("assets/explode.mp3"); explodeSound.volume = 0.6;
const heartSound = new Audio("assets/heart.mp3"); heartSound.volume = 0.7;

const video = document.getElementById("bgVideo");
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.play();
    video.addEventListener("loadeddata", () => gameLoop());
  })
  .catch(err => {
    alert("Camera access denied.");
    console.error(err);
  });

const player = { x: 0, y: 0, width: 40, height: 40, speed: 7, bullets: [], lives: 3, score: 0 };

function resizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - 100;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const enemies = [], hearts = [];
let enemyBullets = [];
const keys = {};

addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup",   e => keys[e.key] = false);

setInterval(() => {
  if (player.bullets.length < 5)
    player.bullets.push({ x: player.x + player.width / 2 - 5, y: player.y });
}, 500);

setInterval(() => {
  if (Math.random() < 0.5)
    enemies.push({ x: Math.random() * (canvas.width - 40), y: -40, width: 40, height: 40 });
}, 800);

setInterval(() => {
  if (Math.random() < 0.3)
    hearts.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30 });
}, 5000);

let musicStarted = false;
function tryStartMusic() {
  if (!musicStarted && !sessionStorage.getItem("musicPlayed")) {
    bgMusic.play().then(() => {
      musicStarted = true;
      sessionStorage.setItem("musicPlayed", "true");
    }).catch(() => {});
  }
}

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

function update() {
  const finger = getIndexFingerTip();
  let moved = false;

  if (finger) {
    const fx = (1 - finger.x) * canvas.width - player.width / 2;
    const fy = finger.y * canvas.height - player.height / 2;
    if (Math.abs(player.x - fx) > 2 || Math.abs(player.y - fy) > 2) moved = true;
    player.x = lerp(player.x, Math.min(Math.max(fx, 0), canvas.width - player.width), 0.15);
    player.y = lerp(player.y, Math.min(Math.max(fy, 0), canvas.height - player.height), 0.15);
  } else {
    if (keys["ArrowLeft"])  { player.x -= player.speed; moved = true; }
    if (keys["ArrowRight"]) { player.x += player.speed; moved = true; }
    if (keys["ArrowUp"])    { player.y -= player.speed; moved = true; }
    if (keys["ArrowDown"])  { player.y += player.speed; moved = true; }
  }

  if (moved) tryStartMusic();

  player.bullets.forEach(b => b.y -= 8);
  player.bullets = player.bullets.filter(b => b.y > -20);

  enemyBullets.forEach(b => b.y += 5);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);

  enemies.forEach(e => {
    e.y += 2;
    if (Math.random() < 0.01)
      enemyBullets.push({ x: e.x + e.width / 2 - 2.5, y: e.y + e.height });
  });

  hearts.forEach(h => h.y += 2);

  enemies.forEach((en, ei) => {
    player.bullets.forEach((bu, bi) => {
      if (bu.x < en.x + en.width && bu.x + 10 > en.x &&
          bu.y < en.y + en.height && bu.y + 20 > en.y) {
        enemies.splice(ei, 1);
        player.bullets.splice(bi, 1);
        player.score += 10;
        explodeSound.currentTime = 0; explodeSound.play();
      }
    });

    if (player.x < en.x + en.width && player.x + player.width > en.x &&
        player.y < en.y + en.height && player.y + player.height > en.y) {
      enemies.splice(ei, 1);
      player.lives--;
      explodeSound.currentTime = 0; explodeSound.play();
      if (player.lives <= 0) endGame();
    }
  });

  enemyBullets.forEach((b, i) => {
    if (b.x < player.x + player.width && b.x + 5 > player.x &&
        b.y < player.y + player.height && b.y + 10 > player.y) {
      enemyBullets.splice(i, 1);
      player.lives--;
      explodeSound.currentTime = 0; explodeSound.play();
      if (player.lives <= 0) endGame();
    }
  });

  hearts.forEach((h, i) => {
    if (player.x < h.x + h.width && player.x + player.width > h.x &&
        player.y < h.y + h.height && player.y + player.height > h.y) {
      hearts.splice(i, 1);
      player.lives++;
      heartSound.currentTime = 0; heartSound.play();
    }
  });
}

function draw() {
  const va = video.videoWidth / video.videoHeight;
  const ca = canvas.width / canvas.height;
  let dw, dh, ox, oy;

  if (va > ca) {
    dh = canvas.height;
    dw = va * dh;
    ox = (canvas.width - dw) / 2;
    oy = 0;
  } else {
    dw = canvas.width;
    dh = dw / va;
    ox = 0;
    oy = (canvas.height - dh) / 2;
  }

  
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -ox - dw, oy, dw, dh);
  ctx.restore();

  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  // Draw green circle around player (plane)
ctx.strokeStyle = 'lime';  
ctx.lineWidth = 3;
ctx.beginPath();
ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 1.5, 0, Math.PI * 2);
ctx.stroke();

  player.bullets.forEach(b => ctx.drawImage(bulletImg, b.x, b.y, 10, 20));
  enemies.forEach(e => ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height));
  hearts.forEach(h => ctx.drawImage(heartImg, h.x, h.y, h.width, h.height));

  ctx.fillStyle = "red";
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, 5, 10));

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText(`Score: ${player.score}`, 10, 20);
  ctx.fillText(`Lives: ${player.lives}`, canvas.width - 80, 20);
}

function endGame() {
  const box = document.createElement("div");
  box.style.position = "fixed";
  box.style.top = "50%";
  box.style.left = "50%";
  box.style.transform = "translate(-50%, -50%)";
  box.style.padding = "30px";
  box.style.background = "#222";
  box.style.color = "white";
  box.style.borderRadius = "10px";
  box.style.boxShadow = "0 0 20px black";
  box.style.fontSize = "18px";
  box.innerHTML = `Game Over!<br>Score: ${player.score}<br><button id="restartBtn">Restart</button>`;
setTimeout(() => {
  const btn = document.getElementById("restartBtn");
  if (btn) {
    btn.onclick = () => {
      sessionStorage.removeItem("musicPlayed");
      location.reload();
    };
  }
}, 0);


  document.body.appendChild(box);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
