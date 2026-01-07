const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

let gameState = "PAUSED"; // PAUSED | RUNNING | GAME_OVER

let score = 0;
let coins = 0;
let best = Number(localStorage.getItem("bestScore") || "0");
let bestCoins = Number(localStorage.getItem("bestCoins") || "0");

let speed = 7.2;
let frame = 0;

// pause grace
let noHandFrames = 0;
const NO_HAND_PAUSE_AFTER = 45;

// ===== 4 lanes =====
const LANE_COUNT = 4;
let laneIndex = 1; // 0..3

// near lane x positions
function laneXNear(lane) {
  const left = W * 0.22;
  const right = W * 0.78;
  const t = lane / (LANE_COUNT - 1);
  return left + (right - left) * t;
}

// perspective road
const horizonY = 120;
const nearY = H - 10;

const roadLeftNear = W * 0.14;
const roadRightNear = W * 0.86;
const roadLeftFar = W * 0.45;
const roadRightFar = W * 0.55;

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

// ✅ FIX: randInt was missing (this caused your crash)
function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function roadXAtY(y, side) {
  const t = clamp01((y - horizonY) / (nearY - horizonY));
  if (side === "L") return lerp(roadLeftFar, roadLeftNear, t);
  return lerp(roadRightFar, roadRightNear, t);
}

function laneXAtY(lane, y) {
  const left = roadXAtY(y, "L");
  const right = roadXAtY(y, "R");
  const p = lane / (LANE_COUNT - 1);
  return lerp(left, right, p);
}

// ===== Player =====
const player = {
  lane: laneIndex,
  w: 34,
  standH: 60,
  duckH: 36,
  h: 60,
  vy: 0,
  onGround: true,
  gravity: 0.95,
  jumpStrength: 16,
  ducking: false
};

function pauseGame() { if (gameState === "RUNNING") gameState = "PAUSED"; }
function resumeGame() { if (gameState === "PAUSED") gameState = "RUNNING"; }

function restart() {
  gameState = "PAUSED";
  score = 0;
  coins = 0;
  speed = 7.2;
  frame = 0;
  noHandFrames = 0;

  laneIndex = 1;
  player.lane = laneIndex;
  player.h = player.standH;
  player.vy = 0;
  player.onGround = true;
  player.ducking = false;

  obstacles.length = 0;
  pickups.length = 0;
  spawnCooldown = 0;
}

// ===== Obstacles & Coins (use depth z: 0 far -> 1 near) =====
const obstacles = [];
const pickups = [];
let spawnCooldown = 0;

function spawnObstacle() {
  const type = Math.random() < 0.7 ? "BARRIER" : "OVERHEAD";
  const lane = Math.floor(Math.random() * LANE_COUNT);

  obstacles.push({
    type,
    lane,
    z: 0,
    wBase: type === "BARRIER" ? 44 : 80,
    hBase: type === "BARRIER" ? 50 : 22
  });

  // coin line sometimes
  if (Math.random() < 0.6) {
    const coinLane = Math.random() < 0.75 ? lane : Math.floor(Math.random() * LANE_COUNT);
    const count = randInt(4, 6);
    for (let i = 0; i < count; i++) {
      pickups.push({
        lane: coinLane,
        z: 0.15 + i * 0.06,
        collected: false
      });
    }
  }
}

function doJump() {
  if (gameState !== "RUNNING") return;
  if (player.onGround) {
    player.vy = -player.jumpStrength;
    player.onGround = false;
  }
}

function setDuck(on) {
  if (gameState !== "RUNNING") return;
  player.ducking = on;
  player.h = on ? player.duckH : player.standH;
}

function moveLane(dir) {
  laneIndex = Math.max(0, Math.min(LANE_COUNT - 1, laneIndex + dir));
  player.lane = laneIndex;
}

// ===== Draw Road (back view) =====
function drawRoad() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#9ad7f5");
  g.addColorStop(1, "#0b0f1a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // distant blocks
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#9fb3c7";
  for (let i = 0; i < 14; i++) {
    const bw = 50 + (i % 4) * 25;
    const bh = 50 + (i % 6) * 18;
    const x = (i * 110 - (frame * 0.6) % W + W) % (W + 220) - 110;
    const y = 80 - (i % 3) * 10;
    ctx.fillRect(x, y, bw, bh);
  }
  ctx.globalAlpha = 1;

  // road polygon
  ctx.fillStyle = "#3a3a3a";
  ctx.beginPath();
  ctx.moveTo(roadLeftFar, horizonY);
  ctx.lineTo(roadRightFar, horizonY);
  ctx.lineTo(roadRightNear, nearY);
  ctx.lineTo(roadLeftNear, nearY);
  ctx.closePath();
  ctx.fill();

  // lane lines
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;

  for (let lane = 1; lane < LANE_COUNT; lane++) {
    ctx.beginPath();
    const xFar = laneXAtY(lane, horizonY);
    const xNear = laneXAtY(lane, nearY);
    ctx.moveTo(xFar, horizonY);
    ctx.lineTo(xNear, nearY);
    ctx.stroke();
  }

  // dashed center markers
  const dashCount = 12;
  for (let i = 0; i < dashCount; i++) {
    const z = ((i / dashCount) + (frame * 0.01)) % 1;
    const y = lerp(horizonY + 20, nearY - 10, z);
    const xMid = laneXAtY((LANE_COUNT - 1) / 2, y);

    const t = clamp01((y - horizonY) / (nearY - horizonY));
    const dashW = lerp(6, 28, t);
    const dashH = lerp(2, 6, t);

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#d6d6d6";
    ctx.fillRect(xMid - dashW / 2, y, dashW, dashH);
    ctx.globalAlpha = 1;
  }
}

// ===== Draw player (back view) =====
function drawPlayer() {
  const yBase = H - 80;
  const x = laneXNear(player.lane);

  // shadow
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(x, yBase + 36, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const w = player.w;
  const h = player.h;

  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(x - w / 2, yBase + 30 - h, w, h);

  // head
  ctx.beginPath();
  ctx.arc(x, yBase + 30 - h - 10, 10, 0, Math.PI * 2);
  ctx.fill();

  // backpack detail
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#000";
  ctx.fillRect(x - w / 2 + 4, yBase + 30 - h + 10, w - 8, 18);
  ctx.globalAlpha = 1;
}

// ===== Draw obstacle / coin =====
function drawObstacle(o) {
  const y = lerp(horizonY + 40, nearY - 20, o.z);
  const t = clamp01((y - horizonY) / (nearY - horizonY));
  const scale = lerp(0.25, 1.0, t);

  const x = laneXAtY(o.lane, y);
  const w = o.wBase * scale;
  const h = o.hBase * scale;

  if (o.type === "BARRIER") {
    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(x - w / 2, y - h, w, h);

    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x - w / 2 + w * 0.18, y - h, w * 0.12, h);
    ctx.fillRect(x - w / 2 + w * 0.46, y - h, w * 0.12, h);
    ctx.fillRect(x - w / 2 + w * 0.74, y - h, w * 0.12, h);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x - w / 2, y - h, w, h);

    ctx.fillStyle = "#333";
    ctx.fillRect(x - w / 2 + 6 * scale, y, 10 * scale, 40 * scale);
    ctx.fillRect(x + w / 2 - 16 * scale, y, 10 * scale, 40 * scale);
  }
}

function drawCoin(c) {
  if (c.collected) return;

  const y = lerp(horizonY + 40, nearY - 40, c.z);
  const t = clamp01((y - horizonY) / (nearY - horizonY));
  const scale = lerp(0.25, 1.0, t);

  const x = laneXAtY(c.lane, y);
  const r = 10 * scale;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#f7d046";
  ctx.fill();
  ctx.strokeStyle = "#8a6b00";
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
}

// ===== Update =====
function update() {
  frame++;

  const input = updateInput();

  // no hand -> pause after grace
  if (!input.hasHand) {
    noHandFrames++;
    if (noHandFrames >= NO_HAND_PAUSE_AFTER) pauseGame();
  } else {
    noHandFrames = 0;
  }

  // Controls
  if (input.hasHand && input.action === "RUN") resumeGame();

  if (gameState === "RUNNING") {
    if (input.action === "JUMP") doJump();
    if (input.action === "LEFT") moveLane(-1);
    if (input.action === "RIGHT") moveLane(+1);
    setDuck(input.action === "DUCK");
  } else {
    player.ducking = false;
    player.h = player.standH;
  }

  if (gameState !== "RUNNING") return;

  // jump physics
  player.vy += player.gravity;
  if (player.vy > 18) player.vy = 18;

  if (!player.onGround) {
    if (player.vy > 12) {
      player.onGround = true;
      player.vy = 0;
    }
  }

  // spawn
  spawnCooldown--;
  if (spawnCooldown <= 0) {
    spawnObstacle();
    spawnCooldown = Math.max(35, randInt(55, 90) - Math.floor(speed));
  }

  // move forward
  const dz = 0.012 + speed * 0.0006;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].z += dz;
    if (obstacles[i].z > 1.05) obstacles.splice(i, 1);
  }
  for (let i = pickups.length - 1; i >= 0; i--) {
    pickups[i].z += dz;
    if (pickups[i].z > 1.05) pickups.splice(i, 1);
  }

  // collision zone near player
  const hitZone = 0.92;

  for (const o of obstacles) {
    if (o.z > hitZone && o.z < 1.02 && o.lane === player.lane) {
      if (o.type === "BARRIER") {
        if (player.onGround) gameState = "GAME_OVER";
      } else {
        if (!player.ducking) gameState = "GAME_OVER";
      }

      if (gameState === "GAME_OVER") {
        best = Math.max(best, Math.floor(score));
        localStorage.setItem("bestScore", String(best));
        bestCoins = Math.max(bestCoins, coins);
        localStorage.setItem("bestCoins", String(bestCoins));
      }
    }
  }

  for (const c of pickups) {
    if (c.collected) continue;
    if (c.z > 0.90 && c.z < 1.00 && c.lane === player.lane) {
      c.collected = true;
      coins++;
      score += 25;
      bestCoins = Math.max(bestCoins, coins);
      localStorage.setItem("bestCoins", String(bestCoins));
    }
  }

  score += 0.6 + speed * 0.06;
}

// ===== HUD =====
function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`Score: ${Math.floor(score)}`, 18, 28);
  ctx.fillText(`Coins: ${coins} (Best: ${bestCoins})`, 18, 50);
  ctx.fillText(`Best Score: ${best}`, 18, 72);
  ctx.fillText(`Lane: ${player.lane + 1}/${LANE_COUNT}`, 18, 94);

  ctx.font = "12px Arial";
  ctx.globalAlpha = 0.85;
  ctx.fillText(
    "Controls: 5=RUN  2=JUMP  1=DUCK  3=LEFT  4=RIGHT  (no hand = pause)",
    18, H - 12
  );
  ctx.globalAlpha = 1;
}

function drawOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#fff";
  if (gameState === "PAUSED") {
    ctx.font = "34px Arial";
    ctx.fillText("PAUSED", 360, 170);
    ctx.font = "18px Arial";
    ctx.fillText("Show 5 fingers to RUN", 330, 205);
    ctx.fillText("2 = JUMP   1 = DUCK   3 = LEFT   4 = RIGHT", 270, 235);
  } else if (gameState === "GAME_OVER") {
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", 310, 170);
    ctx.font = "18px Arial";
    ctx.fillText("Show 5 fingers to restart", 330, 210);
  }
}

// ===== Main loop =====
function draw() {
  drawRoad();

  for (const c of pickups) drawCoin(c);
  for (const o of obstacles) drawObstacle(o);

  drawPlayer();
  drawHUD();

  if (gameState !== "RUNNING") drawOverlay();
}

function loop() {
  if (gameState === "GAME_OVER") {
    const input = updateInput();
    if (input.hasHand && input.action === "RUN") restart();
  } else {
    update();
  }

  draw();
  requestAnimationFrame(loop);
}

restart();
loop();
