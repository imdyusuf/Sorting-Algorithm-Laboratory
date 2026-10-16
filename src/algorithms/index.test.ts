import { describe, expect, it } from "vitest";
import { countSteps, generateSortRun } from "./index";
import type { AlgorithmId, SortStep } from "../engine/types";

const algorithms: AlgorithmId[] = ["bubble", "selection", "insertion", "merge", "quick", "heap", "shell"];
const inputs = [
  [],
  [7],
  [2, 1],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [4, 2, 4, 1, 2, 9, 0],
  [-3, 8, -1, 8, 0, 2],
];

function replay(input: number[], steps: SortStep[]) {
  const values = [...input];
  for (const step of steps) {
    if (step.type === "swap") [values[step.indices[0]], values[step.indices[1]]] = [values[step.indices[1]], values[step.indices[0]]];
    if (step.type === "overwrite") values[step.index] = step.value;
  }
  return values;
}

describe("sorting engines", () => {
  it.each(algorithms)("sorts every supported input with %s", (algorithm) => {
    for (const input of inputs) {
      const run = generateSortRun(input, algorithm);
      expect(run.sorted).toEqual([...input].sort((left, right) => left - right));
      expect(run.steps[run.steps.length - 1]).toEqual({ type: "complete" });
    }
  });

  it.each(algorithms)("produces replayable visualization steps for %s", (algorithm) => {
    const input = [9, 3, 7, 1, 6, 2, 8, 4, 5];
    const run = generateSortRun(input, algorithm);
    expect(replay(input, run.steps)).toEqual(run.sorted);
  });

  it("counts comparisons, swaps, and writes independently", () => {
    const run = generateSortRun([3, 2, 1], "bubble");
    const counts = countSteps(run.steps);
    expect(counts.comparisons).toBeGreaterThan(0);
    expect(counts.swaps).toBe(3);
    expect(counts.writes).toBe(6);
  });
});