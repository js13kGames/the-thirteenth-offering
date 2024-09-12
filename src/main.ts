import {
  cameraPos,
  cameraScale,
  clamp,
  Color,
  drawLine,
  drawRect,
  drawText,
  drawTile,
  engineInit,
  gamepadWasPressed,
  mouseWasPressed,
  randInt,
  randSign,
  setCameraPos,
  setCameraScale,
  setCanvasFixedSize,
  setFontDefault,
  tile,
  Timer,
  vec2,
  Vector2,
  wave,
  setGamepadsEnable,
  setShowWatermark,
} from 'littlejsengine';
import Player from './player';
import Enemy, { BossEnemy, SmallEnemy } from './enemy';
import { music, soundBossRoar } from './sound';
import Item, { Type } from './item';
import { darkM, lightM } from './particles';
import s3 from './s3.png';

type GameState = 'title' | 'game' | 'over' | 'story';

setGamepadsEnable(true);
setShowWatermark(false);

export let player: Player;
export const objects: Record<number, Enemy | Item> = {};

export let difficultyMultiplier = 1;
export let gameState: GameState = 'title';
export const LEVEL_SIZE = vec2(30, 30);

export const blink = (a = 1) => new Color(0.65, 0.7, 0.54, a);

setCameraScale(46);
const BLACK_OVERLAY = new Color(0.5, 0.5, 0.5, 1);

let killCount = 0;
let bossKill = 0;
export let objectIndex = 0;
let spawnInterval = 1.5;
const spawnTimer = new Timer(spawnInterval);

const story = `
 When thirteen souls are sacrificed, a demon rises. 
 
 A dark cult is trying revive those demons, 
 using the kidnapped villagers as sacrifices.
 
 With courage in your heart, 
 you set out to put an end to the cult's darkness.`;

///////////////////////////////////////////////////////////////////////////////

export function clampPosition(pos: Vector2) {
  return vec2(clamp(pos.x, 0, LEVEL_SIZE.x - 1), clamp(pos.y, 0, LEVEL_SIZE.y - 1.25));
}

function drawShadow(pos: Vector2, isBoss?: boolean) {
  if (isBoss) {
    drawRect(vec2(pos.x, pos.y - 1), vec2(1.4, 0.2), new Color(0.1, 0.1, 0.1, 0.3));
  } else {
    drawRect(vec2(pos.x, pos.y - 0.5), vec2(1.1, 0.2), new Color(0.1, 0.1, 0.1, 0.3));
  }
}

///////////////////////////////////////////////////////////////////////////////

export function increaseDifficulty() {
  difficultyMultiplier += 0.2;
}

function initGame() {
  setCameraScale(46);
  player?.destroy();
  player = new Player(LEVEL_SIZE.divide(vec2(2)));
  for (const key of Object.keys(objects)) {
    objects[Number(key)].destroy();
    delete objects[Number(key)];
  }
  bossKill = 0;
  killCount = 0;
  spawnInterval = 2;
  objectIndex = 0;
  spawnInitialEnemies();
}

///////////////////////////////////////////////////////////////////////////////

function renderTitle() {
  setCameraPos(vec2(0, 0));
  setFontDefault('monospace');
  drawText("I DON'T KNOW", vec2(0, -1), 2, lightM);
  drawText('WHAT THE TITLE SHOULD BE', vec2(0, -2.2), 1, lightM);
  drawTile(vec2(-6, 2), vec2(10, 5), tile(3, vec2(32, 18)), BLACK_OVERLAY.scale(0.7));
  drawTile(vec2(4, 2), vec2(10, 5), tile(3, vec2(32, 18)), BLACK_OVERLAY);
  drawTile(vec2(0, 2), vec2(12, 6), tile(3, vec2(32, 18)));

  drawText('Start game', vec2(0, -5), 1, lightM.mutate(0, wave(1, 1)), 0.1, darkM);
}

///////////////////////////////////////////////////////////////////////////////

function renderStory() {
  setCameraPos(vec2(0));
  drawText(story, vec2(0, 5), 0.8, lightM);
  drawText('Click to start', vec2(0, -5.5), 0.9, lightM.mutate(0, wave(1, 1)), 0.1, darkM);
}

///////////////////////////////////////////////////////////////////////////////

function renderGameOver() {
  player.destroy();
  for (const e of Object.values(objects)) e.destroy();
  setCameraPos(vec2(0, 0));
  drawRect(vec2(0.5, 1.25), vec2(1.5, 0.5), new Color(0.5, 0.1, 0.2));
  drawRect(vec2(-0.5, 1.5), vec2(1, 0.5), new Color(0.5, 0.1, 0.2));
  drawRect(vec2(-1.5, 1.3), vec2(0.5, 0.2), new Color(0.5, 0.1, 0.2));
  drawRect(vec2(-2, 1.5), vec2(0.2, 0.1), new Color(0.5, 0.1, 0.2));
  drawText('Game Over', vec2(0, -0.5), 2, lightM);
  drawText('Click to try again', vec2(0, -3.5), 0.6, lightM);
  drawTile(vec2(1, 2), vec2(2), tile(1), undefined, -1.65);
}

///////////////////////////////////////////////////////////////////////////////

function drawArena() {
  for (let x = 0; x < LEVEL_SIZE.x; x++) {
    for (let y = 0; y < LEVEL_SIZE.y; y++) {
      drawTile(vec2(x, y), vec2(1), tile(8, 16));
    }
  }

  // draw top bottom wall
  for (let x = 0; x < LEVEL_SIZE.x; x++) {
    drawTile(vec2(x, -1), vec2(1.1), tile(17), BLACK_OVERLAY);
    drawTile(vec2(x, LEVEL_SIZE.y + 1), vec2(1.1), tile(17), BLACK_OVERLAY);
    drawTile(vec2(x, LEVEL_SIZE.y), vec2(1.1), tile(17), lightM, undefined, true);
    drawTile(vec2(x, LEVEL_SIZE.y - 1), vec2(1.1), tile(17), lightM, undefined, true);
  }

  // draw left right wall
  for (let y = -1; y < LEVEL_SIZE.y + 2; y++) {
    drawTile(vec2(-1, y), vec2(1.1), tile(17), BLACK_OVERLAY);
    drawTile(vec2(LEVEL_SIZE.x, y), vec2(1.1), tile(17), BLACK_OVERLAY);
  }

  for (const e of Object.values([player, ...Object.values(objects)])) drawShadow(e.pos, e instanceof BossEnemy);
}

///////////////////////////////////////////////////////////////////////////////

export function spawnItem(pos: Vector2, type?: Type) {
  objects[objectIndex] = new Item(objectIndex++, pos, type);
}

function spawnEnemy(position?: Vector2) {
  const spawnPosition = position || vec2(0);
  if (!position) {
    if (randSign() === 1) {
      // spawn from left right
      spawnPosition.y = randInt(-2, LEVEL_SIZE.y + 2);
      spawnPosition.x = randSign() === 1 ? -4 : LEVEL_SIZE.x + 4;
    } else {
      // spawn from bottom
      spawnPosition.y = -4;
      spawnPosition.x = randInt(0, LEVEL_SIZE.x);
    }
  }
  objects[objectIndex] = new SmallEnemy(objectIndex++, spawnPosition);
}

function spawnInitialEnemies() {
  for (let i = 0; i < 3; i++) {
    const offset = randInt(5, 12);
    const p = player.pos.add(vec2(randSign() * offset, randSign() * offset));
    spawnEnemy(p);
  }
}

export function shouldSpawnBoss() {
  return ++killCount % 13 === 0;
}

export function incBossKill() {
  bossKill += 1;
}

export function spawnBoss(pos: Vector2) {
  setTimeout(() => {
    soundBossRoar.play();
  }, 200);
  objects[objectIndex] = new BossEnemy(objectIndex++, pos);
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // called once after the engine starts up
  // setup the game
  setCanvasFixedSize(vec2(1280, 720)); // use a 720p fixed size canvas
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // setup camera and prepare for render
  switch (gameState) {
    case 'game':
      if (player.hp <= 0) {
        music.stop();
        setCameraScale(Math.min(cameraScale + 2, 88));
        setTimeout(() => {
          setCameraScale(46);
          gameState = 'over';
          player.destroy();
        }, 2000);
      }
      break;
    case 'title':
      if (mouseWasPressed(0) || gamepadWasPressed(0)) {
        gameState = 'story';
      }
      break;
    case 'story':
    case 'over':
      if (mouseWasPressed(0) || gamepadWasPressed(0)) {
        initGame();
        music.play(undefined, 0.6, undefined, undefined, true);
        gameState = 'game';
      }
      break;
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
  switch (gameState) {
    case 'game':
      player.hp > 0 &&
        setCameraPos(vec2(clamp(player?.pos.x, 12, LEVEL_SIZE.x - 12), clamp(player?.pos.y, 5, LEVEL_SIZE.y - 5)));
      if (spawnTimer.elapsed()) {
        spawnEnemy();
        spawnTimer.set(Math.max(spawnInterval - 0.2 * bossKill, 0.5));
      }
      break;
    case 'title':
    case 'over':
      setCameraPos(vec2(0));
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // called before objects are rendered
  // draw any background effects that appear behind objects
  drawRect(cameraPos, vec2(100), darkM);
  switch (gameState) {
    case 'title':
      renderTitle();
      break;
    case 'game':
      drawArena();
      break;
    case 'over':
      renderGameOver();
      break;
    case 'story':
      renderStory();
      break;
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  switch (gameState) {
    case 'game':
      drawLine(
        vec2(player.pos.x - 1, player.pos.y + 1),
        vec2(player.pos.x + 1, player.pos.y + 1),
        0.1,
        new Color(0.4, 0.4, 0.4),
      );

      drawLine(
        vec2(player.pos.x - 1, player.pos.y + 1),
        vec2(player.pos.x - 1 + 2 * (player.hp / 100), player.pos.y + 1),
        0.1,
        new Color(1, 0.4, 0.4),
      );

      drawText(player.hp + '/' + String(100), vec2(player.pos.x, player.pos.y + 1), 0.35, new Color(1, 1, 1));

      drawRect(vec2(-4.6, 0), vec2(-6, 100), new Color(0, 0, 0));
      drawRect(vec2(LEVEL_SIZE.x + 3.5, 0), vec2(6, 100), new Color(0, 0, 0));
      drawRect(vec2(0, -4.5), vec2(100, 6), new Color(0, 0, 0));

      drawRect(vec2(cameraPos.x, cameraPos.y - 7), vec2(80, 2), new Color().setHex('#262a1b'));

      drawTile(vec2(cameraPos.x - 12, cameraPos.y - 7), vec2(1), tile(3));
      drawText(`${player.hp}/100`, vec2(cameraPos.x - 10.3, cameraPos.y - 7), 0.5, new Color(1, 1, 1));

      drawTile(vec2(cameraPos.x - 8, cameraPos.y - 6.9), vec2(0.75), tile(12));
      drawText(`Lv. ${player.swordLvl}`, vec2(cameraPos.x - 6.8, cameraPos.y - 7), 0.5, new Color(1, 1, 1));

      drawTile(vec2(cameraPos.x + 7, cameraPos.y - 6.9), vec2(0.75), tile(10));
      drawText(`x ${killCount}`, vec2(cameraPos.x + 8, cameraPos.y - 7), 0.5, new Color(1, 1, 1));

      drawTile(vec2(cameraPos.x + 10, cameraPos.y - 6.85), vec2(1.5, 0.75), tile(3, vec2(32, 16)));
      drawText(`x ${bossKill}`, vec2(cameraPos.x + 11, cameraPos.y - 7), 0.5, new Color(1, 1, 1));

      break;
  }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [s3]);
