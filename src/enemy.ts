import { Color, EngineObject, randInt, setCameraPos, tile, TileInfo, vec2, Vector2, wave } from 'littlejsengine';

import {
  blink,
  clampPosition,
  difficultyMultiplier,
  incBossKill,
  increaseDifficulty,
  objects,
  player,
  shouldSpawnBoss,
  spawnBoss,
  spawnItem,
} from './main';
import { damageParticle, fountainParticle } from './particles';
import { soundBossSummon, soundEnemyDie } from './sound';

const BASE_VELOCITY = 0.025;
const ENEMY_BASE_HP = 20;
const BOSS_BASE_HP = 50;
const ENEMY_BASE_DAMAGE = 10;
const BOSS_BASE_DAMAGE = 20;

class Enemy extends EngineObject {
  takingDamage: boolean;
  hp: number;
  damage: number;
  index: number;
  constructor(index: number, pos: Vector2, size: Vector2, tileInfo: TileInfo, hp: number, damage: number) {
    super(pos, size, tileInfo);
    this.index = index;
    this.setCollision();
    this.mass = 0;
    this.hp = Math.floor(hp);
    this.damage = Math.floor(damage);
    this.takingDamage = false;
  }

  update(): void {
    super.update();
    this.approach();
    this.pos = clampPosition(this.pos);
    this.color = this.takingDamage ? blink() : new Color();

    if (this.hp <= 0) {
      soundEnemyDie.play();
      damageParticle(this.pos, false);
      delete objects[this.index];
      this.destroy();
    }
  }

  approach() {
    if (player.hp <= 0) return;
    const directionY = Math.sign(player.pos.y - this.pos.y);
    const directionX = Math.sign(player.pos.x - this.pos.x);
    this.pos.y = this.pos.y + BASE_VELOCITY * directionY * randInt(0, 3);
    this.pos.x = this.pos.x + BASE_VELOCITY * directionX * randInt(0, 3);
  }
}

export class SmallEnemy extends Enemy {
  constructor(index: number, pos: Vector2) {
    super(index, pos, vec2(1), tile(9), ENEMY_BASE_HP * difficultyMultiplier, ENEMY_BASE_DAMAGE * difficultyMultiplier);
  }

  update(): void {
    super.update();
    this.tileInfo = tile([9, 10, 11, 10][Math.floor(wave(4, 3.9))]);
    if (this.hp <= 0) {
      if (randInt(1, 100) > 90) spawnItem(this.pos, 'heart');
      const bossAppear = shouldSpawnBoss();
      if (bossAppear) {
        soundBossSummon.play();
        const particle = fountainParticle(this.pos, true);

        setTimeout(() => {
          setCameraPos(player.pos);
          spawnBoss(this.pos);
          particle.destroy();
          increaseDifficulty();
        }, 1000);
      }
    }
  }
}

export class BossEnemy extends Enemy {
  constructor(index: number, pos: Vector2) {
    super(
      index,
      pos,
      vec2(2),
      tile(2, 32),
      BOSS_BASE_HP * difficultyMultiplier,
      BOSS_BASE_DAMAGE * difficultyMultiplier,
    );
  }

  update(): void {
    super.update();
    this.tileInfo = tile([2, 2, 3, 3][Math.floor(wave(4, 3.9))], 32);

    if (this.hp <= 0) {
      spawnItem(this.pos);
      incBossKill();
    }
  }
}

export default Enemy;
