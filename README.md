# Algo / Lab

Interactive sorting algorithm laboratory for exploring the mechanics behind common sorting strategies. Algo / Lab turns each comparison, swap, overwrite, pivot choice, merge range, and heapify operation into a typed visualization event that can be paused, resumed, inspected, and replayed in a responsive developer-tool interface.

## Project Overview

This is a frontend-only React and TypeScript application. It is intentionally small enough to deploy as a static site while still separating algorithm logic, event generation, animation control, and rendering responsibilities.

**Live Demo:** _Add deployment URL here_

## Screenshots

_Add screenshots or a short screen recording here after deployment._

## Features

- Seven sorting algorithms implemented from scratch: Bubble, Selection, Insertion, Merge, Quick, Heap, and Shell Sort.
- Real-time bar visualization with comparison, swap, write, pivot, minimum, insertion, sorted, range, and heap states.
- Pause, resume, stop, reset, run again, and new array controls with guarded state transitions.
- Random, nearly sorted, reversed, and few-unique input patterns.
- Slow, normal, fast, turbo, and instant playback modes.
- Live comparisons, swaps, array writes, elapsed time, and sorted coverage telemetry.
- Complexity, stability, in-place, concept, pseudocode, and use-case information for the selected algorithm.
- Same-input comparison desk with operation counts and verified output.
- Binary heap relationship diagram for Heap Sort.
- Keyboard shortcuts: Space to start or pause, R for a new input, and Escape to stop.
- Responsive mobile layout, visible focus states, semantic controls, and reduced-motion support.
- Vitest coverage for edge cases, duplicate values, negative values, output correctness, and event replay.

## Algorithms

### Bubble Sort

Compares adjacent values and swaps out-of-order neighbors. After each pass, the largest remaining item is locked at the right edge. The implementation exits early when a pass performs no swaps.

### Selection Sort

Tracks the minimum value in the unsorted suffix, then swaps it into the next boundary position. This keeps writes low but still performs quadratic comparisons.

### Insertion Sort

Maintains a sorted prefix. Each incoming value is held, larger values are shifted right, and the held value is written into the gap. It performs especially well on nearly sorted input.

### Merge Sort

Recursively divides a range into halves, then merges ordered halves using overwrite events. The visualization exposes the active recursive and merge ranges rather than pretending the algorithm is swap-based.

### Quick Sort

Uses the middle element as a pivot source, moves it to the end of the current range, partitions values around it, then recurses on the left and right partitions. A middle pivot avoids the most obvious already-sorted input trap compared with always choosing the first item.

### Heap Sort

Builds a max heap inside the array, repeatedly extracts the maximum root to the sorted suffix, and heapifies the reduced range. The visualization marks the active heap boundary and the node being heapified.

### Shell Sort

Runs insertion-style passes over decreasing gaps, finishing with a normal gap-one insertion pass. It is included as a practical bridge between elementary insertion sorting and more advanced strategies.

## Complexity Table

| Algorithm | Best | Average | Worst | Space | Stable |
| --- | --- | --- | --- | --- | --- |
| Bubble Sort | O(n) | O(n^2) | O(n^2) | O(1) | Yes |
| Selection Sort | O(n^2) | O(n^2) | O(n^2) | O(1) | No |
| Insertion Sort | O(n) | O(n^2) | O(n^2) | O(1) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n^2) | O(log n) average | No |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
| Shell Sort | O(n log n) | O(n^1.5) | O(n^2) | O(1) | No |

The exact Shell Sort bounds depend on the gap sequence. This project uses a simple halving sequence to keep the implementation readable.

## Data Structures and DSA Concepts

- **Arrays:** All algorithms operate on index-addressable arrays so mutations can be surfaced as visual events.
- **Recursion:** Merge Sort and Quick Sort use recursive range decomposition. Their current ranges become active visualization regions.
- **Divide and conquer:** Merge and Quick Sort demonstrate how a large problem becomes smaller subproblems and how those sub-results return to the parent problem.
- **Binary heap:** Heap Sort uses the implicit heap representation where a node at index `i` has children at `2i + 1` and `2i + 2`.
- **Partitioning:** Quick Sort maintains a moving boundary while values are classified against a pivot.
- **State machine:** The controller moves through idle, sorting, paused, stopped, and complete states, preventing invalid control transitions.
- **Typed event queue:** Algorithms emit `SortStep` values. React never calls sorting code during a render and never needs to manipulate the DOM directly.

## Architecture

```text
Input controls
    -> Sorting controller
    -> Algorithm engine
    -> Typed SortStep sequence
    -> Timed animation loop
    -> React bar visualizer and telemetry
```

Important boundaries:

- `src/algorithms/index.ts` owns sorting logic and emits events while mutating a private working copy.
- `src/engine/types.ts` owns discriminated unions and shared application types.
- `src/utils/arrayGenerator.ts` creates representative input distributions.
- `src/data/algorithms.ts` keeps educational metadata out of algorithm implementations.
- `src/App.tsx` owns the controller, timed playback, and composed interface.
- `src/index.css` owns the visual design system, responsive breakpoints, and motion treatment.

This separation makes the algorithms testable without a browser and lets the UI change its animation timing without changing algorithm correctness.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4 import plus custom CSS design system
- Vitest
- Static deployment with no backend, database, or authentication

## Installation

```bash
git clone <your-repository-url>
cd <your-repository-directory>
npm install
```

## Development

```bash
npm run dev
```

Open the local URL printed by Vite. The main controls can also be operated from the keyboard.

## Production Build

```bash
npm run build
npm run preview
```

The Vite configuration includes a single-file plugin, so the production output is straightforward to serve from a static host.

## Tests

```bash
npx vitest run
```

The algorithm test suite covers empty, one-item, two-item, sorted, reverse-sorted, duplicate, negative, and mixed random-like inputs. It also replays swap and overwrite events to confirm that the visualization event stream produces the same final array as the algorithm engine.

## Deployment

### Vercel or Netlify

Import the repository and use:

- Build command: `npm run build`
- Output directory: `dist`

No environment variables or server configuration are required.

### GitHub Pages

Build the project with `npm run build`, publish the `dist` directory through a Pages action or static hosting workflow, and configure the host to serve `index.html` for the root path.

## Performance Decisions

- Algorithms generate a bounded event sequence once per run instead of repeatedly querying the DOM.
- Playback advances through one timer loop and updates only the visual state needed for the current event.
- Instant mode applies the final result and aggregated telemetry in one React update rather than animating every event.
- Array size is capped at 96 values so bars remain legible and quadratic event streams remain usable in a browser.
- The controller keeps mutable playback state in refs so timers do not restart on every React render.
- CSS transitions communicate bar changes without introducing a heavy canvas or animation dependency.

## Accessibility

Controls use real buttons, labels, select elements, range inputs, semantic sections, and visible focus rings. The current status is announced with `aria-live`, the chart has a descriptive label, touch targets remain comfortably large on mobile, and reduced-motion users receive simplified CSS transitions and no persistent pulsing treatment.

## Engineering Decisions

The main engineering decision is the `SortStep` boundary. A sorting algorithm should not know whether its output is rendered as bars, a table, a trace log, or a future race mode. By emitting comparison and mutation events, the algorithms remain deterministic and independently testable while the controller can offer pause, resume, replay, and multiple playback speeds.

The comparison desk intentionally reports operation counts and local engine generation time rather than presenting those numbers as universal performance claims. Browser timing depends on device, load, and visualization cost; operation counts are the more useful signal for this teaching and inspection tool.

## Future Improvements

- Custom user-entered arrays and URL-based configuration.
- Replay timeline scrubbing and exportable traces.
- Dedicated multi-column algorithm race mode.
- Optional sound mapping for comparisons and swaps.
- More advanced pivot strategies and adaptive gap sequences.
- Web Worker support for much larger benchmark-only inputs.

## What I Learned

The interesting part of this project was not writing seven loops. It was choosing a useful event vocabulary that could express both swap-heavy algorithms and overwrite-heavy algorithms like Merge Sort, then making that vocabulary survive pause, stop, responsive rendering, and accessibility constraints. Treating visualization as a consumer of algorithm events made correctness easier to test and made the UI feel like a real inspection tool rather than a collection of animated bars.

## Resume-ready Description

Built a responsive sorting algorithm laboratory with React and TypeScript, implementing seven sorting engines with a decoupled typed event pipeline, live comparison and write telemetry, pause and resume playback, input pattern generation, same-input algorithm comparison, complexity education, binary heap visualization, accessibility support, and Vitest coverage.