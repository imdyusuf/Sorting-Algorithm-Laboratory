import type { InputPattern } from "../engine/types";

export const MIN_ARRAY_SIZE = 12;
export const MAX_ARRAY_SIZE = 96;

export function generateArray(size: number, pattern: InputPattern): number[] {
  const values = Array.from({ length: size }, () => Math.floor(Math.random() * 87) + 12);

  if (pattern === "reversed") {
    return values.sort((left, right) => right - left);
  }

  if (pattern === "nearly-sorted") {
    const sorted = [...values].sort((left, right) => left - right);
    const perturbations = Math.max(2, Math.floor(size * 0.1));
    for (let index = 0; index < perturbations; index += 1) {
      const left = Math.floor(Math.random() * size);
      const right = Math.floor(Math.random() * size);
      [sorted[left], sorted[right]] = [sorted[right], sorted[left]];
    }
    return sorted;
  }

  if (pattern === "duplicates") {
    const palette = [18, 27, 34, 43, 56, 68, 74, 86, 92];
    return values.map(() => palette[Math.floor(Math.random() * palette.length)]);
  }

  return values;
}