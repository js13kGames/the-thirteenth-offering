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
import s from './s.png';

type GameState = 'title' | 'game' | 'over' | 'story';

setGamepadsEnable(true);
setShowWatermark(false);

export let player: Player;
export const objects: Record<number, Enemy | Item> = {};

let overTimeout: NodeJS.Timeout | null;
export let difficultyMultiplier = 1;
export let gameState: GameState = 'title';
export const LEVEL = vec2(30, 30);

export const blink = (a = 1) => new Color(0.65, 0.7, 0.54, a);

setCameraScale(46);
const OVERLAY = new Color(0.5, 0.5, 0.5, 1);

let killCount = 0;
let bossKill = 0;
export let objectIndex = 0;
let spawnInterval = 1.5;
const spawnTimer = new Timer(spawnInterval);

const story = `
 When 13 souls are sacrificed, a demon rises. 
 
 A dark cult is trying revive those demons. 
 
 Knowing this, 
 you set out to end the cult.`;

///////////////////////////////////////////////////////////////////////////////

export function clampPosition(pos: Vector2) {
  return vec2(clamp(pos.x, 0, LEVEL.x - 1), clamp(pos.y, 0, LEVEL.y - 1.25));
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
  overTimeout = null;
  player = new Player(LEVEL.divide(vec2(2)));
  for (const key of Object.keys(objects)) {
    objects[Number(key)].destroy();
    delete objects[Number(key)];
  }
  bossKill = 0;
  killCount = 0;
  spawnInterval = 2;
  objectIndex = 0;
  spawnInitialEnemies();
  music.play(undefined, 0.75, undefined, undefined, true);
  gameState = 'game';
}

///////////////////////////////////////////////////////////////////////////////

function renderTitle() {
  setCameraPos(vec2(0, 0));
  setFontDefault('monospace');
  drawText('THE THIRTEENTH OFFERING', vec2(0, -1), 1.2, lightM, 0.25, darkM);
  drawTile(vec2(-6, 2), vec2(10, 5), tile(3, vec2(32, 18)), OVERLAY.scale(0.7));
  drawTile(vec2(4, 2), vec2(10, 5), tile(3, vec2(32, 18)), OVERLAY);
  drawTile(vec2(0, 2), vec2(12, 6), tile(3, vec2(32, 18)));

  drawText('Start game', vec2(0, -5), 0.7, lightM.mutate(0, wave(1, 1)), 0.1, darkM);
}

///////////////////////////////////////////////////////////////////////////////

function renderStory() {
  setCameraPos(vec2(0));
  drawText(story, vec2(0, 5), 0.8, lightM);
  drawText('Click to start', vec2(0, -5.5), 0.7, lightM.mutate(0, wave(1, 1)), 0.1, darkM);
}

///////////////////////////////////////////////////////////////////////////////

function renderGameOver() {
  player.destroy();
  for (const e of Object.values(objects)) e.destroy();
  setCameraPos(vec2(0, 0));
  const blood = new Color().setHex('#737f52');
  drawRect(vec2(0, 1.25), vec2(1.5, 0.5), blood);
  drawRect(vec2(-1, 1.3), vec2(0.5, 0.2), blood);
  drawRect(vec2(-2, 1.5), vec2(0.2, 0.1), blood);
  drawText('Game Over', vec2(0, -0.5), 2, lightM);
  drawText('Click to try again', vec2(0, -3.5), 0.6, lightM);
  drawTile(vec2(0.5, 2), vec2(2), tile(1), undefined, -1.65);
}

///////////////////////////////////////////////////////////////////////////////

function drawArena() {
  for (let x = 0; x < LEVEL.x; x++) {
    for (let y = 0; y < LEVEL.y; y++) {
      drawTile(
        vec2(x, y),
        vec2(1),
        undefined,
        (x + y) % (x - y + 7) === 0 ? new Color(0.68, 0.72, 0.6) : new Color(0.7, 0.75, 0.6),
      );
    }
  }

  // draw top bottom wall
  for (let x = 0; x < LEVEL.x; x++) {
    drawTile(vec2(x, -1), vec2(1.1), tile(10), OVERLAY);
    drawTile(vec2(x, LEVEL.y + 1), vec2(1.1), tile(10), OVERLAY);
    drawTile(vec2(x, LEVEL.y), vec2(1.1), tile(10), lightM, undefined, true);
    drawTile(vec2(x, LEVEL.y - 1), vec2(1.1), tile(10), lightM, undefined, true);
  }

  // draw left right wall
  for (let y = -1; y < LEVEL.y + 2; y++) {
    drawTile(vec2(-1, y), vec2(1.1), tile(10), OVERLAY);
    drawTile(vec2(LEVEL.x, y), vec2(1.1), tile(10), OVERLAY);
  }

  for (const e of Object.values([player, ...Object.values(objects)])) drawShadow(e.pos, e instanceof BossEnemy);
}

///////////////////////////////////////////////////////////////////////////////

export function spawnItem(pos: Vector2, type?: Type) {
  objects[objectIndex] = new Item(objectIndex++, pos, type);
}

function spawnEnemy(position?: Vector2) {
  let pos = position || vec2(0);
  if (!position) {
    if (randSign() === 1) {
      // spawn from left right
      pos = vec2(randSign() === 1 ? -4 : LEVEL.x + 4, randInt(-2, LEVEL.y + 2));
    } else {
      // spawn from bottom
      pos = vec2(randInt(0, LEVEL.x), -4);
    }
  }
  objects[objectIndex] = new SmallEnemy(objectIndex++, pos);
  spawnTimer.set(Math.max(spawnInterval - 0.2 * bossKill, 0.5));
}

function spawnInitialEnemies() {
  for (let i = 0; i < 3; i++) {
    spawnEnemy(player.pos.add(vec2(randSign() * randInt(5, 12), randSign() * randInt(5, 12))));
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
        if (!overTimeout) {
          overTimeout = setTimeout(() => {
            console.log('go to game over');
            setCameraScale(46);
            gameState = 'over';
            player.destroy();
          }, 2000);
        }
      }
      break;
    case 'title':
      if (mouseWasPressed(0)) gameState = 'story';
      break;
    case 'story':
    case 'over':
      if (mouseWasPressed(0)) {
        initGame();
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
      player.hp > 0 && setCameraPos(vec2(clamp(player?.pos.x, 12, LEVEL.x - 12), clamp(player?.pos.y, 5, LEVEL.y - 5)));
      if (spawnTimer.elapsed()) spawnEnemy();
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
  const healthPos = player ? vec2(player.pos.x - 1, player.pos.y + 1) : vec2(0);
  switch (gameState) {
    case 'game':
      drawLine(healthPos, vec2(player.pos.x + 1, player.pos.y + 1), 0.1, new Color(0.2, 0.2, 0.2));

      drawLine(
        healthPos,
        vec2(player.pos.x - 1 + 2 * (player.hp / 100), player.pos.y + 1),
        0.1,
        new Color().setHex('#737f52'),
      );

      drawText(player.hp + '/' + String(100), vec2(player.pos.x, player.pos.y + 1), 0.35, new Color(1, 1, 1));

      drawRect(vec2(-4.6, 0), vec2(-6, 100), new Color(0, 0, 0));
      drawRect(vec2(LEVEL.x + 3.5, 0), vec2(6, 100), new Color(0, 0, 0));
      drawRect(vec2(0, -4.5), vec2(100, 6), new Color(0, 0, 0));

      drawRect(vec2(cameraPos.x, cameraPos.y - 7), vec2(80, 2), new Color().setHex('#262a1b'));

      drawTile(vec2(cameraPos.x - 12, cameraPos.y - 7), vec2(1), tile(3));
      drawText(`${player.hp}/100`, vec2(cameraPos.x - 10.3, cameraPos.y - 7), 0.5, new Color(1, 1, 1));

      drawTile(vec2(cameraPos.x - 8, cameraPos.y - 6.9), vec2(0.75), tile(11));
      drawText(`Lv. ${player.swordLvl}`, vec2(cameraPos.x - 6.8, cameraPos.y - 7), 0.5, new Color(1, 1, 1));

      drawTile(vec2(cameraPos.x + 7, cameraPos.y - 6.9), vec2(0.75), tile(9));
      drawText(`x ${killCount}`, vec2(cameraPos.x + 8, cameraPos.y - 7), 0.5, new Color(1, 1, 1));

      drawTile(vec2(cameraPos.x + 10, cameraPos.y - 6.85), vec2(1.5, 0.75), tile(3, vec2(32, 16)));
      drawText(`x ${bossKill}`, vec2(cameraPos.x + 11, cameraPos.y - 7), 0.5, new Color(1, 1, 1));

      break;
  }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [s]);
