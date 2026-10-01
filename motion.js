export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// Scroll-linked depth for the abstract hero. Deterministic in both directions.
export function getSceneOffset(progress) {
  const p = clamp(progress);
  return -24 * p * p * (3 - 2 * p);
}
