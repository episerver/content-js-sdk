import { findImportedComponents, generateArguments } from './generate.js';
import type { JSONContent, Manifest } from './manifest.js';

// TYPE DEFINITIONS

export type DependencyGraph = Map<string, Set<string>>;
export type SCC = Set<string>;
export type CircularDependencyMap = DependencyGraph;

// PUBLIC API

/** Detects circular dependencies between content types using Tarjan's SCC algorithm. Used with isCircular() to check if two types are circular. */
export const buildCircularDependencyMap = (
  contents: JSONContent[],
  manifest: Manifest,
): CircularDependencyMap => {
  const graph = buildDependencyGraph(contents, manifest);
  const sccs = findStronglyConnectedComponents(graph);
  return sccsToMap(sccs);
};

/** Checks if two content types form a circular dependency */
export const isCircular = (
  from: string,
  to: string,
  circularMap?: CircularDependencyMap,
): boolean => {
  if (!circularMap) return false;
  return circularMap.get(from)?.has(to) ?? false;
};

// GRAPH CONSTRUCTION

/** Builds a dependency graph from content types by analyzing their references */
export const buildDependencyGraph = (
  contents: JSONContent[],
  manifest: Manifest,
): DependencyGraph =>
  contents.reduce((acc, content) => {
    const args = generateArguments(content);
    const dependencies = findImportedComponents(manifest, args);
    const edges = dependencies.reduce(
      (acc, dep) => (dep.key !== content.key ? acc.add(dep.key) : acc),
      new Set<string>(),
    );

    return acc.set(content.key, edges);
  }, new Map());

// CYCLE DETECTION (TARJAN'S ALGORITHM)

const findStronglyConnectedComponents = (graph: DependencyGraph): SCC[] => {
  const sccs: SCC[] = [];
  const indices = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  let index = 0;

  const strongConnect = (v: string) => {
    indices.set(v, index);
    lowLinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = graph.get(v) || new Set();
    for (const w of neighbors) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowLinks.set(v, Math.min(lowLinks.get(v)!, lowLinks.get(w)!));
      } else if (onStack.has(w)) {
        lowLinks.set(v, Math.min(lowLinks.get(v)!, indices.get(w)!));
      }
    }

    if (lowLinks.get(v) === indices.get(v)) {
      const scc = new Set<string>();
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.add(w);
      } while (w !== v);

      if (scc.size > 1) {
        sccs.push(scc);
      }
    }
  };

  for (const v of graph.keys()) {
    if (!indices.has(v)) {
      strongConnect(v);
    }
  }

  return sccs;
};

// MAP TRANSFORMATION

const sccsToMap = (sccs: SCC[]): CircularDependencyMap =>
  sccs.reduce((map, scc) => {
    const members = Array.from(scc);
    return members.reduce(
      (acc, member) => acc.set(member, new Set(members.filter(m => m !== member))),
      map,
    );
  }, new Map<string, Set<string>>());

