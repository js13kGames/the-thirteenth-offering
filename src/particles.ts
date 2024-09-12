import { Color, ParticleEmitter, Vector2 } from 'littlejsengine';

export const darkM = new Color(0.14, 0.16, 0.1, 1);
export const lightM = new Color(0.81, 0.84, 0.75, 1);

export const damageParticle = (pos: Vector2, isDark = false, angle = 0) => {
  const multiply = isDark ? darkM : lightM;
  new ParticleEmitter(
    pos,
    angle,
    0,
    0.05,
    100,
    0.57,
    undefined,
    new Color().multiply(multiply),
    new Color(0.941, 0.941, 0.941, 1).multiply(multiply),
    new Color(1, 1, 1, 0).multiply(multiply),
    new Color(0.945, 0.945, 0.945, 0).multiply(multiply),
    0.5,
    0.5,
    0.1,
    0.1,
    0.05,
    1,
    1,
    0,
    3.14,
    0.1,
    0.4,
  );
};

export const fountainParticle = (pos: Vector2, boss?: boolean) =>
  new ParticleEmitter(
    pos,
    0,
    2,
    0,
    boss ? 300 : 22,
    90,
    undefined,
    new Color(1, 1, 1, 0.4),
    new Color(1, 1, 1, 0.3),
    new Color(1, 1, 1, 0),
    new Color(1, 1, 1, 0),
    0.5,
    boss ? 0.4 : 0.2,
    0,
    boss ? 0.1 : 0.03,
    0,
    1,
    0,
    -2,
    9,
    0.1,
    0.02,
    undefined,
  );
