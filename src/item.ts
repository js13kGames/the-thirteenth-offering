import { EngineObject, ParticleEmitter, randSign, tile, vec2, Vector2 } from 'littlejsengine';
import Player from './player';
import { soundHeal, soundPowerUp } from './sound';

import { gameState, objects } from './main';
import { emitParticle } from './particles';

export type Type = 'heart' | 'sword';

class Item extends EngineObject {
  type: Type;
  direction: number;
  index: number;
  particle: ParticleEmitter;
  constructor(index: number, pos: Vector2, type?: Type) {
    const randomType = randSign() === 1 ? 'heart' : 'sword';
    const appliedType = type || randomType;
    const sprite = appliedType === 'heart' ? tile(3) : tile(12);
    super(pos, vec2(1), sprite);
    this.setCollision();
    this.type = appliedType;
    this.index = index;
    this.direction = 0.005;
    this.particle = emitParticle({ pos, isFountain: true });
  }

  update(): void {
    super.update();
    if (!(objects[this.index] instanceof Item)) this.particle.destroy();
    if (gameState !== 'game') {
      this.particle.destroy();
    }
  }

  collideWithObject(object: EngineObject): boolean {
    if (object instanceof Player) {
      if (this.type === 'heart') {
        soundHeal.play();
        object.updateHp(object.hp + 25);
      } else {
        object.swordLvl += 1;
        soundPowerUp.play();
      }
      emitParticle({ pos: this.pos });
      delete objects[this.index];
      this.particle.destroy();
      this.destroy();
    }
    return false;
  }
}

export default Item;
