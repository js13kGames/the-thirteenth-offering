import { Color, ParticleEmitter, tile, Vector2 } from 'littlejsengine';

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

export const summonBoss = (pos: Vector2) => {
  new ParticleEmitter(
    pos,
    0,
    0,
    1,
    200,
    3.14,
    tile(4),
    new Color(0.192, 0.376, 0.043, 1),
    new Color(0.1, 0.408, 0.145, 1),
    new Color(0.1, 0.082, 0.082, 0),
    new Color(0.933, 0.78, 1, 0),
    0.5,
    0.7,
    0,
    0.07,
    0.05,
    1,
    1,
    -0.5,
    3.14,
    0.1,
    1,
    undefined,
    true,
    true,
  );
};

export const itemParticle = (pos: Vector2) =>
  new ParticleEmitter(
    pos,
    0,
    2,
    0,
    22,
    90,
    undefined,
    new Color(1, 1, 1, 1),
    new Color(1, 1, 1, 1),
    new Color(1, 1, 1, 0),
    new Color(1, 1, 1, 0),
    0.5,
    0.2,
    0,
    0.03,
    0,
    1,
    0,
    -2,
    9,
    0.1,
    0.02,
    undefined,
  );
