import { clamp, Color, EngineObject, tile, Timer, vec2, Vector2 } from 'littlejsengine';
import Enemy, { BossEnemy } from './enemy';
import { emitParticle } from './particles';
import { soundAttack, soundAttackHit } from './sound';

class Attack extends EngineObject {
  spawnTimer: Timer;
  damage: number;
  constructor(pos: Vector2, size: Vector2, angle: number, direction: Vector2, damage: number, swordLv: number) {
    super(pos, size, tile(11), angle);
    this.velocity = direction.multiply(vec2(0.2 + swordLv * 0.02));
    this.damage = damage;
    this.spawnTimer = new Timer(0.2);
    this.setCollision();
    soundAttack.play();
  }

  update(): void {
    super.update();
    this.color = new Color(1, 1, 1, 1 - clamp(this.spawnTimer.getPercent(), 0, 0.5));
    if (this.spawnTimer.elapsed()) {
      this.destroy();
    }
  }

  collideWithObject(object: EngineObject): boolean {
    if (object instanceof Enemy && !object.takingDamage) {
      object.velocity = this.velocity.multiply(vec2(object instanceof BossEnemy ? 0.2 : 1.2));
      object.takingDamage = true;
      object.hp -= this.damage;
      soundAttackHit.play();
      emitParticle({ pos: this.pos, isDark: true, angle: this.velocity.angle() });
      setTimeout(() => {
        object.velocity = vec2(0, 0);
        object.takingDamage = false;
      }, 300);
    }

    return false;
  }
}

export default Attack;
