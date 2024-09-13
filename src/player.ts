import { clamp, Color, EngineObject, keyIsDown, tile, Timer, vec2, Vector2, wave } from 'littlejsengine';
import Enemy from './enemy';
import { blink, clampPosition } from './main';
import Attack from './attack';
import { emitParticle } from './particles';
import { soundDamaged } from './sound';

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
    this.hp = 10;
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

  animate() {
    this.tileInfo = tile(1);
    if (Object.values(MOVEMENT_KEY).some((key) => keyIsDown(key))) {
      this.tileInfo = tile([1, 2, 1, 0][Math.floor(wave(16, 4))]);
    }
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
      this.faceAngle = ANGLES[`${direction.x}${direction.y}`];
    }
    if (direction.length()) {
      this.velocityAngle = direction;
      this.faceAngle = ANGLES[`${direction.x}${direction.y}`];
    }
    this.pos = clampPosition(this.pos);
  }

  update(): void {
    this.move();
    this.animate();
    this.invulnerable();

    if (attackTimer.elapsed()) {
      this.spawnAttack();
      attackTimer.set(1 - (this.swordLvl - 1) * 0.05);
    }

    if (this.isDead()) {
      this.velocity = vec2(0);
      this.angle = -1.65;
    }

    super.update();
  }

  invulnerable() {
    this.color = this.isInvulnerable ? blink(wave(100, 2) / 1.2) : new Color(1, 1, 1, 1);
  }

  collideWithObject(object: EngineObject): boolean {
    const distance = this.pos.distance(object.pos);

    if (distance > 1 || this.isDead()) return false; // add threshold to be damaged
    if (object instanceof Enemy && !this.isInvulnerable) {
      this.updateHp(this.hp - object.damage);
      const direction = object.pos.subtract(this.pos);
      this.velocity = direction.multiply(vec2(-BASE_VELOCITY * 2));
      object.velocity = direction.multiply(vec2(BASE_VELOCITY * 2));
      emitParticle({ pos: this.pos });
      soundDamaged.play();

      this.isInvulnerable = true;
      setTimeout(() => {
        this.velocity = vec2(0, 0);
        object.velocity = vec2(0, 0);
      }, 100);

      setTimeout(() => {
        this.isInvulnerable = false;
      }, 1000);
    }
    return false;
  }
}

export default Player;
