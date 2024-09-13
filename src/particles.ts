import { Color, ParticleEmitter, Vector2 } from 'littlejsengine';

export const darkM = new Color(0.14, 0.16, 0.1, 1);
export const lightM = new Color(0.81, 0.84, 0.75, 1);

export const emitParticle = ({
  pos,
  isDark = false,
  large = false,
  angle = 0,
  isFountain,
}: { pos: Vector2; isDark?: boolean; angle?: number; isFountain?: boolean; large?: boolean }) => {
  const multiply = isDark ? darkM : lightM;
  return new ParticleEmitter(
    pos,
    angle,
    isFountain ? (large ? 3 : 2) : 1,
    isFountain ? 0 : 0.05,
    isFountain ? (large ? 180 : 30) : 100,
    0.57,
    undefined,
    new Color().multiply(multiply),
    new Color(0.941, 0.941, 0.941, 0.5).multiply(multiply),
    new Color(1, 1, 1, 0).multiply(multiply),
    new Color(0.945, 0.945, 0.945, 0).multiply(multiply),
    0.5,
    isFountain ? (large ? 0.4 : 0.2) : 0.5,
    0.1,
    large ? 0.1 : 0.03,
    0.05,
    1,
    1,
    isFountain ? -2 : 0,
    3.14,
    0.1,
    0.4,
  );
};
