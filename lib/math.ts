/**
 * Smooth damping: move current toward target with exponential decay.
 * Returns new value. Use in useFrame for smooth camera follow.
 */
export function damp(current: number, target: number, smoothing: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-smoothing * dt));
}
