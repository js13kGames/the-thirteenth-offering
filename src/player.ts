import { clamp, Color, EngineObject, keyIsDown, tile, Timer, vec2, Vector2, wave } from 'littlejsengine';
import Enemy from './enemy';
import { blink, clampPosition } from './main';
import Attack from './attack';
import { damageParticle } from './particles';
import { soundBossRoar, soundDamaged } from './sound';

const BASE_VELOCITY = 0.1;
const MOVEMENT_KEY = { RIGHT: 'ArrowRight', LEFT: 'ArrowLeft', UP: 'ArrowUp', DOWN: 'ArrowDown' };

const attackTimer = new Timer(0.2);

const ANGLES: Record<string, number> = {
  '10': 0,
  '11': -45,
  '01': 4.75,
  '-11': 4,
  '-10': 3.15,
  '1-1': 45,
  '0-1': -4.75,
  '-1-1': 2.5,
};

class Player extends EngineObject {
  isInvulnerable: boolean;
  hp: number;
  faceAngle: number;
  velocityAngle: Vector2;
  damage: number;
  swordLvl: number;

  constructor(pos: Vector2) {
    super(pos, vec2(1), tile(1));
    this.setCollision(); // make object collide
    this.velocity = vec2(0);
    this.isInvulnerable = false;
    this.hp = 100;
    this.faceAngle = 0;
    this.velocityAngle = vec2(1, 0);
    this.damage = 10;
    this.swordLvl = 1;
  }

  spawnAttack() {
    if (!this.isDead()) {
      new Attack(
        this.pos,
        vec2(1 + this.swordLvl * 0.1, 1 + this.swordLvl * 0.2),
        this.faceAngle,
        this.velocityAngle,
        this.damage + this.swordLvl * 5,
        this.swordLvl,
      );
    }
  }

  checkIsMoving() {
    return Object.values(MOVEMENT_KEY).some((key) => keyIsDown(key));
  }

  isDead() {
    return this.hp <= 0;
  }

  updateHp(newHp: number) {
    this.hp = clamp(newHp, 0, 100);
  }

  move() {
    if (this.isDead()) return;
    const direction = vec2(0);
    if (keyIsDown('ArrowRight')) direction.x = 1;
    if (keyIsDown('ArrowLeft')) direction.x = -1;
    if (keyIsDown('ArrowUp')) direction.y = 1;
    if (keyIsDown('ArrowDown')) direction.y = -1;
    this.pos = this.pos.add(vec2(direction.x * BASE_VELOCITY, direction.y * BASE_VELOCITY));
    if (direction.length()) {
      const angleKey = `${direction.x}${direction.y}`;
      this.faceAngle = ANGLES[angleKey];
    }
    if (direction.length()) {
      this.velocityAngle = direction;
      this.faceAngle = ANGLES[`${direction.x}${direction.y}`];
    }
    this.pos = clampPosition(this.pos);
  }

  update(): void {
    this.move();
    this.checkIsMoving();
    this.invulnerable();

    if (attackTimer.elapsed()) {
      this.spawnAttack();
      attackTimer.unset();
      attackTimer.set(1 - (this.swordLvl - 1) * 0.05);
    }

    if (this.isDead()) {
      this.velocity = vec2(0);
      this.angle = -1.65;
    }

    if (this.checkIsMoving()) {
      this.tileInfo = tile([1, 2, 1, 0][Math.floor(wave(16, 4))]);
    } else {
      this.tileInfo = tile(1);
    }

    super.update();
  }

  invulnerable() {
    if (this.isInvulnerable) {
      this.color = blink(wave(100, 2) / 1.2);
    } else {
      this.color = new Color(1, 1, 1, 1);
    }
  }

  collideWithObject(object: EngineObject): boolean {
    const distance = this.pos.distance(object.pos);

    if (distance > 1 || this.isDead()) return false; // add threshold to be damaged
    if (object instanceof Enemy && !this.isInvulnerable) {
      this.updateHp(this.hp - object.damage);
      const directionX = Math.sign(object.pos.x - this.pos.x);
      const directionY = Math.sign(object.pos.y - this.pos.y);
      this.velocity = vec2(directionX * -BASE_VELOCITY * 2, directionY * -BASE_VELOCITY * 2);
      object.velocity = vec2(directionX * BASE_VELOCITY * 2, directionY * BASE_VELOCITY * 2);

      damageParticle(this.pos, false);
      soundDamaged.play();

      this.isInvulnerable = true;
      setTimeout(() => {
        this.velocity = vec2(0, 0);
        object.velocity = vec2(0, 0);
      }, 100);

      if (this.hp <= 0) {
        setTimeout(() => {
          soundBossRoar.play();
        }, 2000);
      }

      setTimeout(() => {
        this.isInvulnerable = false;
      }, 1000);
    }
    return false;
  }
}

export default Player;
