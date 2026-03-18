import { GameState, Platform, Player } from "./types";

const GRAVITY = 0.5;
const FRICTION = 0.8;
const BASE_PLATFORM_GAP = 200;
const MAX_JUMP_HEIGHT = 140;
const MAX_JUMP_DIST = 320; 

export const initGame = (): GameState => {
  const firstPlatform: Platform = { x: 0, y: 500, width: 800, height: 100, color: "#4ade80" };
  const platforms: Platform[] = [firstPlatform];

  // Load high score from local storage
  const savedHighScore = localStorage.getItem("jumpy_jace_highscore");
  const highScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;

  // Generate initial platforms
  for (let i = 1; i < 10; i++) {
    const last = platforms[platforms.length - 1];
    platforms.push({
      x: last.x + BASE_PLATFORM_GAP + Math.random() * 50,
      y: Math.max(150, Math.min(550, last.y + (Math.random() - 0.5) * 150)),
      width: 200,
      height: 20,
      color: "#60a5fa",
    });
  }

  return {
    player: {
      pos: { x: 100, y: 500 - 48 }, // Spawn on the first platform
      vel: { x: 0, y: 0 },
      width: 32,
      height: 48,
      color: "#f87171",
      isGrounded: true,
      jumpForce: 14, // Increased for more height/forgiveness
      speed: 7,      // Increased for better horizontal reach
    },
    platforms,
    camera: { x: 0, y: 0 },
    isGameOver: false,
    score: 0,
    highScore,
  };
};

export const updateGame = (
  state: GameState,
  keys: Record<string, boolean>,
  width: number,
  height: number
): GameState => {
  const { player, platforms } = state;

  if (state.isGameOver) return state;

  // Horizontal movement
  if (keys["ArrowLeft"] || keys["a"]) {
    player.vel.x = -player.speed;
  } else if (keys["ArrowRight"] || keys["d"]) {
    player.vel.x = player.speed;
  } else {
    player.vel.x *= FRICTION;
  }

  // Jumping
  if ((keys["ArrowUp"] || keys["w"] || keys[" "]) && player.isGrounded) {
    player.vel.y = -player.jumpForce;
    player.isGrounded = false;
  }

  // Apply gravity
  player.vel.y += GRAVITY;

  // Update position
  player.pos.x += player.vel.x;
  player.pos.y += player.vel.y;

  // Collision detection
  player.isGrounded = false;
  for (const platform of platforms) {
    if (
      player.pos.x < platform.x + platform.width &&
      player.pos.x + player.width > platform.x &&
      player.pos.y < platform.y + platform.height &&
      player.pos.y + player.height > platform.y
    ) {
      // Check if falling onto platform
      if (player.vel.y > 0 && player.pos.y + player.height - player.vel.y <= platform.y) {
        player.pos.y = platform.y - player.height;
        player.vel.y = 0;
        player.isGrounded = true;
      }
      // Check if hitting head
      else if (player.vel.y < 0 && player.pos.y - player.vel.y >= platform.y + platform.height) {
        player.pos.y = platform.y + platform.height;
        player.vel.y = 0;
      }
    }
  }

  // Procedural platform generation
  const lastPlatform = platforms[platforms.length - 1];
  if (lastPlatform.x < player.pos.x + width) {
    // Calculate difficulty scaling
    const difficulty = Math.min(1, player.pos.x / 20000);
    const minWidth = 60; // Slightly wider minimum
    const maxWidth = 200;
    const currentWidth = maxWidth - (maxWidth - minWidth) * difficulty;

    // Vertical gap: slightly less extreme variation
    let nextY = lastPlatform.y + (Math.random() - 0.5) * (MAX_JUMP_HEIGHT * 1.5);
    nextY = Math.max(150, Math.min(550, nextY));

    // Calculate max horizontal distance based on vertical difference
    const dy = lastPlatform.y - nextY; 
    
    // Physics calculation for air time
    const airTime = (player.jumpForce + Math.sqrt(Math.pow(player.jumpForce, 2) + dy)) / 0.5;
    const maxPossibleDist = player.speed * airTime;
    const safetyFactor = 0.95; // More forgiving safety factor
    const maxDist = maxPossibleDist * safetyFactor;
    const minDist = 120; // Lower minimum distance for variety

    const gapX = minDist + Math.random() * (Math.max(minDist, maxDist) - minDist);

    platforms.push({
      x: lastPlatform.x + lastPlatform.width + gapX,
      y: nextY,
      width: currentWidth,
      height: 20,
      color: "#60a5fa",
    });
    
    // Remove old platforms to save memory
    if (platforms.length > 20) {
      platforms.shift();
    }
  }

  // Camera follow
  const targetCamX = player.pos.x - width / 3;
  state.camera.x += (targetCamX - state.camera.x) * 0.1;

  // Score based on distance
  state.score = Math.max(state.score, Math.floor(player.pos.x / 10));
  
  // Update high score
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem("jumpy_jace_highscore", state.highScore.toString());
  }

  // Death
  if (player.pos.y > 800) {
    state.isGameOver = true;
  }

  return { ...state };
};

export const drawGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number
) => {
  ctx.clearRect(0, 0, width, height);

  // Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, "#0f172a");
  skyGrad.addColorStop(1, "#1e293b");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);

  // Draw background elements (parallax clouds)
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  for (let i = 0; i < 20; i++) {
    const cloudX = (i * 600) + (state.camera.x * 0.5);
    ctx.beginPath();
    ctx.arc(cloudX % (width * 10), 200 + Math.sin(i) * 100, 80, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw platforms
  for (const platform of state.platforms) {
    // Platform shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(platform.x + 5, platform.y + 5, platform.width, platform.height);

    ctx.fillStyle = platform.color;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(platform.x, platform.y, platform.width, 4);
  }

  // Draw player
  const { player } = state;
  
  // Player shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(player.pos.x + 4, player.pos.y + 4, player.width, player.height);

  ctx.fillStyle = player.color;
  ctx.fillRect(player.pos.x, player.pos.y, player.width, player.height);
  
  // Player eyes
  ctx.fillStyle = "white";
  const eyeOffset = player.vel.x >= 0 ? 20 : 5;
  ctx.fillRect(player.pos.x + eyeOffset, player.pos.y + 10, 8, 8);
  ctx.fillStyle = "black";
  ctx.fillRect(player.pos.x + eyeOffset + (player.vel.x >= 0 ? 4 : 0), player.pos.y + 12, 4, 4);

  ctx.restore();
};
