import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { countSteps, generateSortRun } from "./algorithms";
import { algorithmMetadata, algorithmOrder } from "./data/algorithms";
import type {
  AlgorithmId,
  InputPattern,
  SortStats,
  SortStatus,
  SortStep,
  Speed,
  VisualState,
} from "./engine/types";
import { emptyStats } from "./engine/types";
import { generateArray, MAX_ARRAY_SIZE, MIN_ARRAY_SIZE } from "./utils/arrayGenerator";

type IconName =
  | "activity"
  | "arrow"
  | "clock"
  | "code"
  | "compare"
  | "external"
  | "github"
  | "grid"
  | "layers"
  | "pause"
  | "play"
  | "refresh"
  | "spark"
  | "stop"
  | "swap"
  | "tree"
  | "write";

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, ReactNode> = {
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    code: <><path d="m8 9-3 3 3 3" /><path d="m16 9 3 3-3 3" /><path d="m14 5-4 14" /></>,
    compare: <><path d="M5 6h14" /><path d="M5 12h9" /><path d="M5 18h14" /><circle cx="17" cy="12" r="2" /></>,
    external: <><path d="M14 5h5v5" /><path d="m19 5-8 8" /><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" /></>,
    github: <><path d="M15 22v-3.5c0-1-.35-1.75-1-2.5 3.25-.35 6.65-1.6 6.65-7.1a5.5 5.5 0 0 0-1.5-3.85c.15-.38.65-1.82-.15-3.8 0 0-1.25-.4-4.1 1.48a14 14 0 0 0-7.5 0C4.55.85 3.3 1.25 3.3 1.25c-.8 1.98-.3 3.42-.15 3.8a5.5 5.5 0 0 0-1.5 3.85c0 5.48 3.4 6.75 6.65 7.1-.65.75-1 1.5-1 2.5V22" /><path d="M7.3 18.5c-3 .9-3-1.6-4.3-1.8" /></>,
    grid: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M10 4v16" /></>,
    layers: <><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 17 8 4 8-4" /></>,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    play: <><path d="m8 5 11 7-11 7V5Z" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.7-4L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14.7 4L20 15" /><path d="M20 20v-5h-5" /></>,
    spark: <><path d="m12 3 1.35 5.65L19 10l-5.65 1.35L12 17l-1.35-5.65L5 10l5.65-1.35L12 3Z" /><path d="m19 16 .55 2.45L22 19l-2.45.55L19 22l-.55-2.45L16 19l2.45-.55L19 16Z" /></>,
    stop: <><rect x="6" y="6" width="12" height="12" rx="1.5" /></>,
    swap: <><path d="M7 7h11l-3-3" /><path d="m18 7-3 3" /><path d="M17 17H6l3 3" /><path d="m6 17 3-3" /></>,
    tree: <><circle cx="12" cy="5" r="2" /><circle cx="6" cy="17" r="2" /><circle cx="18" cy="17" r="2" /><path d="M12 7v4M12 11 6 15M12 11l6 4" /></>,
    write: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  };

  return <svg {...shared}>{paths[name]}</svg>;
}

function defaultVisual(size: number): VisualState {
  return {
    compare: [],
    swap: [],
    pivot: null,
    minimum: null,
    insertion: null,
    range: null,
    rangeLabel: null,
    heapRange: null,
    sorted: Array.from({ length: size }, () => false),
    phase: "Ready for a run",
  };
}

function statusLabel(status: SortStatus) {
  if (status === "sorting") return "Sorting in progress";
  if (status === "paused") return "Paused at current step";
  if (status === "complete") return "Run complete";
  if (status === "stopped") return "Run stopped";
  return "Ready to visualize";
}

function formatTime(milliseconds: number) {
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  return `${(milliseconds / 1000).toFixed(2)} s`;
}

function patternLabel(pattern: InputPattern) {
  return { random: "Random", "nearly-sorted": "Nearly sorted", reversed: "Reversed", duplicates: "Few unique" }[pattern];
}

function speedDelay(speed: Speed) {
  return { slow: 230, normal: 90, fast: 32, turbo: 8, instant: 0 }[speed];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function StatItem({ icon, label, value, accent }: { icon: IconName; label: string; value: string; accent?: string }) {
  return <div className="stat-item"><div className={`stat-icon ${accent ?? ""}`}><Icon name={icon} size={15} /></div><div><p className="stat-label">{label}</p><p className="stat-value">{value}</p></div></div>;
}

interface ComparisonRow {
  id: AlgorithmId;
  comparisons: number;
  swaps: number;
  writes: number;
  elapsed: number;
  sorted: boolean;
}

export default function App() {
  const initialArray = useMemo(() => generateArray(42, "random"), []);
  const [array, setArray] = useState(initialArray);
  const [size, setSize] = useState(initialArray.length);
  const [algorithm, setAlgorithm] = useState<AlgorithmId>("quick");
  const [pattern, setPattern] = useState<InputPattern>("random");
  const [speed, setSpeed] = useState<Speed>("normal");
  const [status, setStatus] = useState<SortStatus>("idle");
  const [visual, setVisual] = useState<VisualState>(() => defaultVisual(initialArray.length));
  const [stats, setStats] = useState<SortStats>(emptyStats);
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);

  const baseArrayRef = useRef(initialArray);
  const workingArrayRef = useRef([...initialArray]);
  const finalArrayRef = useRef([...initialArray]);
  const stepsRef = useRef<SortStep[]>([]);
  const stepIndexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const pausedRef = useRef(false);
  const speedRef = useRef(speed);
  const runStartedRef = useRef(0);
  const elapsedBaseRef = useRef(0);

  const selectedMetadata = algorithmMetadata[algorithm];
  speedRef.current = speed;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishSorting = useCallback(() => {
    clearTimer();
    activeRef.current = false;
    pausedRef.current = false;
    const elapsed = elapsedBaseRef.current + (runStartedRef.current ? performance.now() - runStartedRef.current : 0);
    const finalValues = stepsRef.current.length > 0 ? finalArrayRef.current : workingArrayRef.current;
    workingArrayRef.current = [...finalValues];
    setArray([...finalValues]);
    setStats((current) => ({ ...current, elapsedMs: elapsed }));
    setVisual((current) => ({ ...current, compare: [], swap: [], pivot: null, minimum: null, insertion: null, range: null, heapRange: null, phase: "Complete", sorted: Array.from({ length: finalValues.length }, () => true) }));
    setStatus("complete");
  }, [clearTimer]);

  const applyStep = useCallback((step: SortStep) => {
    switch (step.type) {
      case "compare":
        setVisual((current) => ({ ...current, compare: step.indices, swap: [], minimum: null, insertion: null, phase: "Comparing" }));
        break;
      case "swap": {
        const next = [...workingArrayRef.current];
        [next[step.indices[0]], next[step.indices[1]]] = [next[step.indices[1]], next[step.indices[0]]];
        workingArrayRef.current = next;
        setArray(next);
        setStats((current) => ({ ...current, swaps: current.swaps + 1, writes: current.writes + 2 }));
        setVisual((current) => ({ ...current, compare: [], swap: step.indices, phase: "Swapping" }));
        break;
      }
      case "overwrite": {
        const next = [...workingArrayRef.current];
        next[step.index] = step.value;
        workingArrayRef.current = next;
        setArray(next);
        setStats((current) => ({ ...current, writes: current.writes + 1 }));
        setVisual((current) => ({ ...current, compare: [], swap: [step.index], phase: "Writing to array" }));
        break;
      }
      case "markSorted":
        setVisual((current) => {
          const sorted = [...current.sorted];
          sorted[step.index] = true;
          return { ...current, sorted, compare: [], swap: [], phase: "Locking sorted position" };
        });
        break;
      case "pivot":
        setVisual((current) => ({ ...current, pivot: step.index, compare: [], swap: [], phase: "Pivot selected" }));
        break;
      case "minimum":
        setVisual((current) => ({ ...current, minimum: step.index, compare: [], swap: [], phase: "Tracking minimum" }));
        break;
      case "insertion":
        setVisual((current) => ({ ...current, insertion: step.index, compare: [], swap: [], phase: "Insertion item" }));
        break;
      case "range":
        setVisual((current) => ({ ...current, range: step.range, rangeLabel: step.type, phase: step.label === "merge" ? "Merging ordered halves" : step.label === "partition" ? "Partitioning range" : "Active range" }));
        break;
      case "heapify":
        setVisual((current) => ({ ...current, heapRange: step.range, range: step.range, rangeLabel: step.type, compare: [], phase: "Heapifying subtree" }));
        break;
      case "phase":
        setVisual((current) => ({ ...current, phase: step.label, compare: [], swap: [] }));
        break;
      case "clearHighlights":
        setVisual((current) => ({ ...current, compare: [], swap: [], pivot: null, minimum: null, insertion: null }));
        break;
      case "complete":
        break;
    }
    if (step.type === "compare") setStats((current) => ({ ...current, comparisons: current.comparisons + 1 }));
  }, []);

  const advance = useCallback(() => {
    if (!activeRef.current || pausedRef.current) return;
    const steps = stepsRef.current;
    if (stepIndexRef.current >= steps.length) {
      finishSorting();
      return;
    }
    const step = steps[stepIndexRef.current];
    stepIndexRef.current += 1;
    if (step.type === "complete") {
      finishSorting();
      return;
    }
    applyStep(step);
    if (activeRef.current && !pausedRef.current) timerRef.current = window.setTimeout(advance, speedDelay(speedRef.current));
  }, [applyStep, finishSorting]);

  const runInstant = useCallback((run: ReturnType<typeof generateSortRun>) => {
    const counts = countSteps(run.steps);
    workingArrayRef.current = [...run.sorted];
    setArray([...run.sorted]);
    setStats({ ...counts, elapsedMs: 0 });
    setVisual((current) => ({ ...current, compare: [], swap: [], pivot: null, minimum: null, insertion: null, range: null, heapRange: null, phase: "Complete", sorted: Array.from({ length: run.sorted.length }, () => true) }));
    setStatus("complete");
  }, []);

  const startSorting = useCallback(() => {
    if (status === "sorting") return;
    if (status === "paused") {
      pausedRef.current = false;
      activeRef.current = true;
      runStartedRef.current = performance.now();
      setStatus("sorting");
      timerRef.current = window.setTimeout(advance, 0);
      return;
    }
    clearTimer();
    const run = generateSortRun(baseArrayRef.current, algorithm);
    stepsRef.current = run.steps;
    stepIndexRef.current = 0;
    finalArrayRef.current = [...run.sorted];
    workingArrayRef.current = [...baseArrayRef.current];
    setArray([...baseArrayRef.current]);
    setStats(emptyStats);
    setVisual(defaultVisual(baseArrayRef.current.length));
    elapsedBaseRef.current = 0;
    runStartedRef.current = performance.now();
    activeRef.current = true;
    pausedRef.current = false;
    if (speed === "instant") {
      activeRef.current = false;
      runInstant(run);
      return;
    }
    setStatus("sorting");
    timerRef.current = window.setTimeout(advance, 0);
  }, [advance, algorithm, clearTimer, runInstant, speed, status]);

  const pauseSorting = useCallback(() => {
    if (status !== "sorting") return;
    clearTimer();
    elapsedBaseRef.current += performance.now() - runStartedRef.current;
    pausedRef.current = true;
    setStats((current) => ({ ...current, elapsedMs: elapsedBaseRef.current }));
    setStatus("paused");
  }, [clearTimer, status]);

  const stopSorting = useCallback(() => {
    if (!activeRef.current && status !== "paused") return;
    clearTimer();
    activeRef.current = false;
    pausedRef.current = false;
    elapsedBaseRef.current += runStartedRef.current ? performance.now() - runStartedRef.current : 0;
    setStats((current) => ({ ...current, elapsedMs: elapsedBaseRef.current }));
    setVisual((current) => ({ ...current, compare: [], swap: [], pivot: null, minimum: null, insertion: null, phase: "Stopped" }));
    setStatus("stopped");
  }, [clearTimer, status]);

  const resetArray = useCallback(() => {
    clearTimer();
    activeRef.current = false;
    pausedRef.current = false;
    workingArrayRef.current = [...baseArrayRef.current];
    setArray([...baseArrayRef.current]);
    setVisual(defaultVisual(baseArrayRef.current.length));
    setStats(emptyStats);
    setStatus("idle");
  }, [clearTimer]);

  const createNewArray = useCallback(() => {
    clearTimer();
    activeRef.current = false;
    pausedRef.current = false;
    const next = generateArray(size, pattern);
    baseArrayRef.current = next;
    workingArrayRef.current = [...next];
    setArray(next);
    setVisual(defaultVisual(next.length));
    setStats(emptyStats);
    setStatus("idle");
    setComparison([]);
  }, [clearTimer, pattern, size]);

  const updateSize = (nextSize: number) => {
    if (activeRef.current) return;
    setSize(nextSize);
    const next = generateArray(nextSize, pattern);
    baseArrayRef.current = next;
    workingArrayRef.current = [...next];
    setArray(next);
    setVisual(defaultVisual(next.length));
    setStats(emptyStats);
    setStatus("idle");
  };

  const updatePattern = (nextPattern: InputPattern) => {
    if (activeRef.current) return;
    setPattern(nextPattern);
    const next = generateArray(size, nextPattern);
    baseArrayRef.current = next;
    workingArrayRef.current = [...next];
    setArray(next);
    setVisual(defaultVisual(next.length));
    setStats(emptyStats);
    setStatus("idle");
  };

  const runComparison = () => {
    if (activeRef.current) return;
    const input = [...baseArrayRef.current];
    const rows = algorithmOrder.map((id) => {
      const started = performance.now();
      const run = generateSortRun(input, id);
      const elapsed = performance.now() - started;
      const counts = countSteps(run.steps);
      return { id, ...counts, elapsed, sorted: run.sorted.every((value, index) => index === 0 || run.sorted[index - 1] <= value) };
    });
    setComparison(rows);
  };

  useEffect(() => {
    if (status !== "sorting") return undefined;
    const ticker = window.setInterval(() => setStats((current) => ({ ...current, elapsedMs: elapsedBaseRef.current + performance.now() - runStartedRef.current })), 100);
    return () => window.clearInterval(ticker);
  }, [status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.isContentEditable) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (status === "sorting") pauseSorting();
        else if (status === "paused" || status === "idle" || status === "stopped" || status === "complete") startSorting();
      }
      if (event.key.toLowerCase() === "r") createNewArray();
      if (event.key === "Escape") stopSorting();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createNewArray, pauseSorting, startSorting, status, stopSorting]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const progress = visual.sorted.filter(Boolean).length;
  const active = activeRef.current;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Algo Lab home"><span className="brand-mark"><span /><span /><span /><span /></span><span className="brand-copy"><strong>ALGO<span>/</span>LAB</strong><small>Interactive sorting laboratory</small></span></a>
        <nav className="header-nav" aria-label="Primary navigation"><a href="#workspace">Workspace</a><a href="#insights">Insights</a><a href="#comparison">Compare</a></nav>
        <a className="github-link" href="https://github.com/imdyusuf/Sorting-Algorithm-Laboratory" target="_blank" rel="noreferrer"><Icon name="github" size={17} /><span>Repository</span><Icon name="external" size={13} /></a>
      </header>

      <main id="top">
        <section className="intro-section"><div className="eyebrow"><span className="eyebrow-dot" /> SORTING SYSTEMS / PLAYGROUND <span className="eyebrow-rule" /></div><div className="intro-grid"><div><h1>See the logic.<br /><em>Feel the rhythm.</em></h1></div><div className="intro-copy"><p>Turn abstract algorithms into a living system. Trace every comparison, swap, write, and recursive boundary as it happens.</p><div className="intro-meta"><span><Icon name="spark" size={14} /> 07 algorithms</span><span><Icon name="code" size={14} /> TypeScript engine</span><span><Icon name="activity" size={14} /> Live telemetry</span></div></div></div></section>

        <section className="workspace-section" id="workspace">
          <div className="workspace-toolbar"><div className="toolbar-topline"><div className="section-kicker"><span>01</span> CONTROL ROOM</div><div className="keyboard-hint"><kbd>SPACE</kbd> start / pause <kbd>R</kbd> new input <kbd>ESC</kbd> stop</div></div><div className="control-grid">
            <div className="control-field algorithm-field"><label htmlFor="algorithm">Algorithm</label><div className="select-wrap"><select id="algorithm" value={algorithm} onChange={(event) => setAlgorithm(event.target.value as AlgorithmId)} disabled={active}>{algorithmOrder.map((id) => <option key={id} value={id}>{algorithmMetadata[id].name}</option>)}</select><span className="select-arrow"><Icon name="arrow" size={14} /></span></div><span className="field-note">{selectedMetadata.tagline}</span></div>
            <div className="control-field size-field"><div className="field-heading"><label htmlFor="array-size">Array size</label><output htmlFor="array-size">{size}</output></div><input id="array-size" type="range" min={MIN_ARRAY_SIZE} max={MAX_ARRAY_SIZE} value={size} onChange={(event) => updateSize(Number(event.target.value))} disabled={active} style={{ "--range-percent": `${((size - MIN_ARRAY_SIZE) / (MAX_ARRAY_SIZE - MIN_ARRAY_SIZE)) * 100}%` } as CSSProperties} /><div className="range-labels"><span>{MIN_ARRAY_SIZE}</span><span>{MAX_ARRAY_SIZE} max</span></div></div>
            <div className="control-field pattern-field"><label>Input pattern</label><div className="pattern-options" role="group" aria-label="Input pattern">{(["random", "nearly-sorted", "reversed", "duplicates"] as InputPattern[]).map((option) => <button key={option} className={pattern === option ? "pattern-option selected" : "pattern-option"} onClick={() => updatePattern(option)} disabled={active} aria-pressed={pattern === option}>{patternLabel(option)}</button>)}</div></div>
            <div className="control-field speed-field"><label>Playback</label><div className="speed-options" role="group" aria-label="Animation speed">{(["slow", "normal", "fast", "turbo", "instant"] as Speed[]).map((option) => <button key={option} className={speed === option ? "speed-option selected" : "speed-option"} onClick={() => setSpeed(option)} aria-pressed={speed === option}>{option === "turbo" ? "Turbo" : option[0].toUpperCase() + option.slice(1)}</button>)}</div></div>
          </div><div className="action-row"><button className="button button-primary" onClick={startSorting} disabled={status === "sorting"}><Icon name="play" size={16} /> {status === "paused" ? "Resume run" : status === "complete" ? "Run again" : "Start sorting"}</button><button className="button button-secondary" onClick={pauseSorting} disabled={status !== "sorting"}><Icon name="pause" size={15} /> Pause</button><button className="button button-secondary" onClick={stopSorting} disabled={!active && status !== "paused"}><Icon name="stop" size={15} /> Stop</button><button className="button button-quiet" onClick={resetArray}><Icon name="refresh" size={15} /> Reset</button><button className="button button-quiet new-array" onClick={createNewArray} disabled={active}><Icon name="spark" size={15} /> New array</button></div></div>

          <div className="visualizer-panel"><div className="visualizer-header"><div><span className="live-mark"><span /></span><span className="visualizer-title">Live array trace</span><span className="visualizer-subtitle">{patternLabel(pattern)} input / {array.length} values</span></div><div className={`status-readout status-${status}`} aria-live="polite"><span className="status-pulse" />{statusLabel(status)}</div></div><div className="bar-stage" aria-label={`${selectedMetadata.name} visualization with ${array.length} values`} role="img"><div className="stage-gridlines"><span /><span /><span /><span /></div><div className="bars" style={{ "--bar-count": array.length } as CSSProperties}>{array.map((value, index) => { const inRange = visual.range ? index >= visual.range[0] && index <= visual.range[1] : false; const inHeap = visual.heapRange ? index >= visual.heapRange[0] && index <= visual.heapRange[1] : false; const classes = ["bar", inRange ? "bar-in-range" : "", inHeap ? "bar-in-heap" : "", visual.sorted[index] ? "bar-sorted" : "", visual.compare.includes(index) ? "bar-compare" : "", visual.swap.includes(index) ? "bar-swap" : "", visual.pivot === index ? "bar-pivot" : "", visual.minimum === index ? "bar-minimum" : "", visual.insertion === index ? "bar-insertion" : ""].filter(Boolean).join(" "); return <div className={classes} key={`${index}-${value}`} style={{ "--bar-height": `${Math.max(7, value)}%` } as CSSProperties}><span className="bar-value">{value}</span></div>; })}</div><div className="baseline" /><div className="stage-scale"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div></div><div className="visualizer-footer"><div className="phase-readout"><span className="phase-index">{String(Math.min(stepIndexRef.current, stepsRef.current.length)).padStart(3, "0")}</span><span>{visual.phase}</span></div><div className="legend" aria-label="Visualization legend"><span><i className="legend-swatch default" />Default</span><span><i className="legend-swatch compare" />Compare</span><span><i className="legend-swatch swap" />Swap / write</span><span><i className="legend-swatch pivot" />Pivot</span><span><i className="legend-swatch sorted" />Sorted</span></div></div></div>

          <div className="stats-strip"><StatItem icon="compare" label="Comparisons" value={formatNumber(stats.comparisons)} accent="cyan" /><StatItem icon="swap" label="Swaps" value={formatNumber(stats.swaps)} accent="orange" /><StatItem icon="write" label="Array writes" value={formatNumber(stats.writes)} accent="violet" /><StatItem icon="clock" label="Elapsed time" value={formatTime(stats.elapsedMs)} accent="green" /><div className="progress-stat"><div className="progress-heading"><span>Sorted coverage</span><strong>{Math.round((progress / Math.max(1, array.length)) * 100)}%</strong></div><div className="progress-track"><span style={{ width: `${(progress / Math.max(1, array.length)) * 100}%` }} /></div></div></div>
        </section>

        <section className="insights-section" id="insights"><div className="section-heading"><div><div className="section-kicker"><span>02</span> ALGORITHM NOTES</div><h2>Read the pattern<br /><em>behind the motion.</em></h2></div><p>Every trace is produced by an independent algorithm engine. The interface only consumes typed steps, keeping the logic testable and the visualization replaceable.</p></div><div className="insights-grid"><article className="how-panel"><div className="panel-label"><Icon name="code" size={15} /> How it works</div><div className="how-title-row"><h3>{selectedMetadata.name}</h3><span className={`accent-chip chip-${selectedMetadata.accent}`}>{selectedMetadata.tagline}</span></div><p className="panel-description">{selectedMetadata.description}</p><ol className="pseudocode-list">{selectedMetadata.pseudocode.map((line, index) => <li key={line}><span>{String(index + 1).padStart(2, "0")}</span><code>{line}</code></li>)}</ol><div className="use-case"><span className="use-case-mark"><Icon name="arrow" size={13} /></span><div><span>Good fit</span><p>{selectedMetadata.useCase}</p></div></div></article><article className="complexity-panel"><div className="panel-label"><Icon name="activity" size={15} /> Complexity profile</div><div className="complexity-list"><ComplexityRow label="Best case" value={selectedMetadata.complexity.best} tone="green" /><ComplexityRow label="Average case" value={selectedMetadata.complexity.average} tone="cyan" /><ComplexityRow label="Worst case" value={selectedMetadata.complexity.worst} tone="orange" /><ComplexityRow label="Auxiliary space" value={selectedMetadata.complexity.space} tone="violet" /></div><div className="property-grid"><div><span>Stable</span><strong>{selectedMetadata.stable ? "Yes" : "No"}</strong></div><div><span>In-place</span><strong>{selectedMetadata.inPlace ? "Yes" : "No"}</strong></div><div><span>Primary concept</span><strong>{selectedMetadata.concept}</strong></div></div></article></div>{algorithm === "heap" && <HeapPreview />}</section>

        <section className="lower-section" id="comparison"><div className="comparison-header section-heading"><div><div className="section-kicker"><span>03</span> BENCHMARK DESK</div><h2>One input.<br /><em>Seven different rhythms.</em></h2></div><div className="comparison-action"><p>Generate operation counts from the same snapshot to compare behavior without pretending a browser micro-benchmark is universal.</p><button className="button button-secondary" onClick={runComparison} disabled={active}><Icon name="compare" size={15} /> Run comparison</button></div></div><div className="comparison-table-wrap">{comparison.length === 0 ? <div className="empty-comparison"><span className="empty-icon"><Icon name="activity" size={22} /></span><div><strong>Comparison desk is ready</strong><p>Run all seven engines against the current {patternLabel(pattern).toLowerCase()} snapshot.</p></div><span className="empty-arrow"><Icon name="arrow" size={17} /></span></div> : <ComparisonTable rows={comparison} />}</div><div className="concept-grid"><ConceptItem icon="grid" index="A1" title="Arrays" text="In-place index access makes each mutation visible and measurable." /><ConceptItem icon="layers" index="B2" title="Recursion" text="Merge and quick sort turn call depth into active ranges." /><ConceptItem icon="tree" index="C3" title="Binary heap" text="Heap sort maps parent and child relationships into indices." /><ConceptItem icon="activity" index="D4" title="Event stream" text="A typed step queue separates algorithm logic from React rendering." /></div></section>
      </main>

      <footer className="site-footer"><span>ALGO / LAB <i /> Built for curious engineers.</span><span><span className="footer-status" /> Frontend only / no backend required</span></footer>
    </div>
  );
}

function ComplexityRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="complexity-row"><span><i className={`complexity-dot ${tone}`} />{label}</span><code>{value}</code></div>;
}

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return <table className="comparison-table"><thead><tr><th>Algorithm</th><th>Comparisons</th><th>Swaps</th><th>Writes</th><th>Engine time</th><th>Result</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><span className="table-algorithm"><span className={`table-dot dot-${algorithmMetadata[row.id].accent}`} />{algorithmMetadata[row.id].name}</span></td><td>{formatNumber(row.comparisons)}</td><td>{formatNumber(row.swaps)}</td><td>{formatNumber(row.writes)}</td><td>{row.elapsed.toFixed(2)} ms</td><td><span className="sorted-result">{row.sorted ? "verified" : "check"}</span></td></tr>)}</tbody></table>;
}

function ConceptItem({ icon, index, title, text }: { icon: IconName; index: string; title: string; text: string }) {
  return <article className="concept-item"><div className="concept-top"><span className="concept-index">{index}</span><Icon name={icon} size={18} /></div><h3>{title}</h3><p>{text}</p></article>;
}

function HeapPreview() {
  return <div className="heap-preview"><div><div className="panel-label"><Icon name="tree" size={15} /> Binary heap in array form</div><p>A max heap keeps the largest value at index 0. For any node <code>i</code>, its children live at <code>2i + 1</code> and <code>2i + 2</code>.</p></div><div className="heap-tree" aria-label="Binary heap relationship diagram"><div className="tree-node root">90</div><div className="tree-branch branch-left" /><div className="tree-branch branch-right" /><div className="tree-node child-one">70</div><div className="tree-node child-two">80</div><div className="tree-branch branch-three" /><div className="tree-branch branch-four" /><div className="tree-node leaf-one">30</div><div className="tree-node leaf-two">40</div></div></div>;
}
