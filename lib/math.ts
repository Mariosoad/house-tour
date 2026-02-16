/**
 * Fractional part (normalized 0..1 for positive numbers).
 * fract(1.3) === 0.3, fract(-0.2) === 0.8
 */
export function fract(x: number): number {
  return x - Math.floor(x);
}

/**
 * Linear interpolation: a + (b - a) * t
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smooth damping: move current toward target with exponential decay.
 * Returns new value. Use in useFrame for smooth camera follow.
 */
export function damp(current: number, target: number, smoothing: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-smoothing * dt));
}
