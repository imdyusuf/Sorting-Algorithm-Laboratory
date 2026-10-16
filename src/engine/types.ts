export type AlgorithmId =
  | "bubble"
  | "selection"
  | "insertion"
  | "merge"
  | "quick"
  | "heap"
  | "shell";

export type InputPattern = "random" | "nearly-sorted" | "reversed" | "duplicates";
export type SortStatus = "idle" | "sorting" | "paused" | "complete" | "stopped";
export type Speed = "slow" | "normal" | "fast" | "turbo" | "instant";

export type SortStep =
  | { type: "compare"; indices: [number, number] }
  | { type: "swap"; indices: [number, number] }
  | { type: "overwrite"; index: number; value: number }
  | { type: "markSorted"; index: number }
  | { type: "pivot"; index: number }
  | { type: "minimum"; index: number }
  | { type: "insertion"; index: number }
  | { type: "range"; range: [number, number]; label: "active" | "partition" | "merge" | "heap" }
  | { type: "heapify"; index: number; range: [number, number] }
  | { type: "phase"; label: string }
  | { type: "clearHighlights" }
  | { type: "complete" };

export interface SortRun {
  steps: SortStep[];
  sorted: number[];
}

export interface SortStats {
  comparisons: number;
  swaps: number;
  writes: number;
  elapsedMs: number;
}

export interface ComplexityInfo {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export interface AlgorithmMetadata {
  id: AlgorithmId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  complexity: ComplexityInfo;
  stable: boolean;
  inPlace: boolean;
  concept: string;
  useCase: string;
  pseudocode: string[];
  accent: string;
}

export interface VisualState {
  compare: number[];
  swap: number[];
  pivot: number | null;
  minimum: number | null;
  insertion: number | null;
  range: [number, number] | null;
  rangeLabel: SortStep["type"] | null;
  heapRange: [number, number] | null;
  sorted: boolean[];
  phase: string;
}

export const emptyStats: SortStats = {
  comparisons: 0,
  swaps: 0,
  writes: 0,
  elapsedMs: 0,
};