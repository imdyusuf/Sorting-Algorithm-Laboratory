import type { AlgorithmId, SortRun, SortStep } from "../engine/types";

const compare = (steps: SortStep[], left: number, right: number) => {
  steps.push({ type: "compare", indices: [left, right] });
};

const swap = (steps: SortStep[], values: number[], left: number, right: number) => {
  if (left === right) return;
  [values[left], values[right]] = [values[right], values[left]];
  steps.push({ type: "swap", indices: [left, right] });
};

const markAllSorted = (steps: SortStep[], length: number) => {
  for (let index = 0; index < length; index += 1) steps.push({ type: "markSorted", index });
};

function bubbleSort(input: number[]): SortRun {
  const values = [...input];
  const steps: SortStep[] = [];

  for (let end = values.length - 1; end > 0; end -= 1) {
    steps.push({ type: "phase", label: `Pass ${values.length - end}` });
    let changed = false;
    for (let index = 0; index < end; index += 1) {
      compare(steps, index, index + 1);
      if (values[index] > values[index + 1]) {
        swap(steps, values, index, index + 1);
        changed = true;
      }
    }
    steps.push({ type: "markSorted", index: end });
    if (!changed) {
      markAllSorted(steps, values.length);
      break;
    }
  }

  markAllSorted(steps, values.length);
  steps.push({ type: "complete" });
  return { steps, sorted: values };
}

function selectionSort(input: number[]): SortRun {
  const values = [...input];
  const steps: SortStep[] = [];

  for (let start = 0; start < values.length - 1; start += 1) {
    steps.push({ type: "phase", label: `Select minimum ${start + 1}` });
    steps.push({ type: "range", range: [start, values.length - 1], label: "active" });
    let minimum = start;
    steps.push({ type: "minimum", index: minimum });

    for (let index = start + 1; index < values.length; index += 1) {
      compare(steps, minimum, index);
      if (values[index] < values[minimum]) {
        minimum = index;
        steps.push({ type: "minimum", index: minimum });
      }
    }
    swap(steps, values, start, minimum);
    steps.push({ type: "markSorted", index: start });
  }

  markAllSorted(steps, values.length);
  steps.push({ type: "complete" });
  return { steps, sorted: values };
}

function insertionSort(input: number[]): SortRun {
  const values = [...input];
  const steps: SortStep[] = [];

  for (let index = 1; index < values.length; index += 1) {
    const current = values[index];
    let position = index;
    steps.push({ type: "phase", label: `Insert item ${index + 1}` });
    steps.push({ type: "range", range: [0, index], label: "active" });
    steps.push({ type: "insertion", index });

    while (position > 0) {
      compare(steps, position - 1, position);
      if (values[position - 1] <= current) break;
      values[position] = values[position - 1];
      steps.push({ type: "overwrite", index: position, value: values[position] });
      position -= 1;
      steps.push({ type: "insertion", index: position });
    }
    values[position] = current;
    steps.push({ type: "overwrite", index: position, value: current });
  }

  markAllSorted(steps, values.length);
  steps.push({ type: "complete" });
  return { steps, sorted: values };
}

function mergeSort(input: number[]): SortRun {
  const values = [...input];
  const steps: SortStep[] = [];

  const merge = (start: number, middle: number, end: number) => {
    steps.push({ type: "phase", label: `Merge ${start + 1}-${end + 1}` });
    steps.push({ type: "range", range: [start, end], label: "merge" });
    const left = values.slice(start, middle + 1);
    const right = values.slice(middle + 1, end + 1);
    let leftIndex = 0;
    let rightIndex = 0;
    let target = start;

    while (leftIndex < left.length && rightIndex < right.length) {
      compare(steps, start + leftIndex, middle + 1 + rightIndex);
      if (left[leftIndex] <= right[rightIndex]) {
        values[target] = left[leftIndex];
        leftIndex += 1;
      } else {
        values[target] = right[rightIndex];
        rightIndex += 1;
      }
      steps.push({ type: "overwrite", index: target, value: values[target] });
      target += 1;
    }
    while (leftIndex < left.length) {
      values[target] = left[leftIndex];
      steps.push({ type: "overwrite", index: target, value: values[target] });
      leftIndex += 1;
      target += 1;
    }
    while (rightIndex < right.length) {
      values[target] = right[rightIndex];
      steps.push({ type: "overwrite", index: target, value: values[target] });
      rightIndex += 1;
      target += 1;
    }
  };

  const divide = (start: number, end: number) => {
    if (start >= end) return;
    const middle = Math.floor((start + end) / 2);
    steps.push({ type: "range", range: [start, end], label: "active" });
    divide(start, middle);
    divide(middle + 1, end);
    merge(start, middle, end);
  };

  if (values.length > 1) divide(0, values.length - 1);
  markAllSorted(steps, values.length);
  steps.push({ type: "complete" });
  return { steps, sorted: values };
}

function quickSort(input: number[]): SortRun {
  const values = [...input];
  const steps: SortStep[] = [];

  const partition = (low: number, high: number): number => {
    steps.push({ type: "phase", label: `Partition ${low + 1}-${high + 1}` });
    steps.push({ type: "range", range: [low, high], label: "partition" });

    const pivotSource = Math.floor((low + high) / 2);
    const pivotValue = values[pivotSource];
    steps.push({ type: "pivot", index: pivotSource });
    swap(steps, values, pivotSource, high);
    steps.push({ type: "pivot", index: high });

    let boundary = low;
    for (let index = low; index < high; index += 1) {
      compare(steps, index, high);
      if (values[index] < pivotValue) {
        swap(steps, values, index, boundary);
        boundary += 1;
      }
    }
    swap(steps, values, boundary, high);
    steps.push({ type: "pivot", index: boundary });
    return boundary;
  };

  const sort = (low: number, high: number) => {
    if (low >= high) {
      if (low === high) steps.push({ type: "markSorted", index: low });
      return;
    }
    const pivot = partition(low, high);
    steps.push({ type: "markSorted", index: pivot });
    sort(low, pivot - 1);
    sort(pivot + 1, high);
  };

  if (values.length > 1) sort(0, values.length - 1);
  markAllSorted(steps, values.length);
  steps.push({ type: "complete" });
  return { steps, sorted: values };
}

function heapSort(input: number[]): SortRun {
  const values = [...input];
  const steps: SortStep[] = [];

  const heapify = (heapSize: number, root: number) => {
    let largest = root;
    const left = root * 2 + 1;
    const right = root * 2 + 2;
    steps.push({ type: "heapify", index: root, range: [0, heapSize - 1] });

    if (left < heapSize) {
      compare(steps, largest, left);
      if (values[left] > values[largest]) largest = left;
    }
    if (right < heapSize) {
      compare(steps, largest, right);
      if (values[right] > values[largest]) largest = right;
    }
    if (largest !== root) {
      swap(steps, values, root, largest);
      heapify(heapSize, largest);
    }
  };

  steps.push({ type: "phase", label: "Build max heap" });
  for (let index = Math.floor(values.length / 2) - 1; index >= 0; index -= 1) {
    heapify(values.length, index);
  }

  for (let end = values.length - 1; end > 0; end -= 1) {
    steps.push({ type: "phase", label: `Extract max to ${end + 1}` });
    steps.push({ type: "heapify", index: 0, range: [0, end] });
    swap(steps, values, 0, end);
    steps.push({ type: "markSorted", index: end });
    heapify(end, 0);
  }
  markAllSorted(steps, values.length);
  steps.push({ type: "complete" });
  return { steps, sorted: values };
}

function shellSort(input: number[]): SortRun {
  const values = [...input];
  const steps: SortStep[] = [];
  let gap = Math.floor(values.length / 2);

  while (gap > 0) {
    steps.push({ type: "phase", label: `Gap ${gap}` });
    for (let index = gap; index < values.length; index += 1) {
      const current = values[index];
      let position = index;
      steps.push({ type: "insertion", index });
      while (position >= gap) {
        compare(steps, position - gap, position);
        if (values[position - gap] <= current) break;
        values[position] = values[position - gap];
        steps.push({ type: "overwrite", index: position, value: values[position] });
        position -= gap;
      }
      values[position] = current;
      steps.push({ type: "overwrite", index: position, value: current });
    }
    gap = Math.floor(gap / 2);
  }
  markAllSorted(steps, values.length);
  steps.push({ type: "complete" });
  return { steps, sorted: values };
}

export function generateSortRun(input: number[], algorithm: AlgorithmId): SortRun {
  switch (algorithm) {
    case "bubble":
      return bubbleSort(input);
    case "selection":
      return selectionSort(input);
    case "insertion":
      return insertionSort(input);
    case "merge":
      return mergeSort(input);
    case "quick":
      return quickSort(input);
    case "heap":
      return heapSort(input);
    case "shell":
      return shellSort(input);
  }
}

export function countSteps(steps: SortStep[]) {
  return steps.reduce(
    (counts, step) => {
      if (step.type === "compare") counts.comparisons += 1;
      if (step.type === "swap") {
        counts.swaps += 1;
        counts.writes += 2;
      }
      if (step.type === "overwrite") counts.writes += 1;
      return counts;
    },
    { comparisons: 0, swaps: 0, writes: 0 },
  );
}