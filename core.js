/* Pure graph and area rules. Data remains unchanged; no inferred semantic edges. */
(function (root) {
  'use strict';
  const DIMENSIONS = ['performance', 'reliability', 'scalability', 'security'];
  function createModel(data) {
    const nodes = new Map(), tierOf = new Map(), warnings = [], edges = [], seen = new Set();
    for (const [tier, items] of Object.entries(data.tiers)) {
      for (const n of items) {
        if (nodes.has(n.id)) throw Error(`Duplicate node: ${n.id}`);
        nodes.set(n.id, n); tierOf.set(n.id, tier);
      }
    }
    function edge(from, to, kind) {
      const key = `${kind}:${from}:${to}`;
      if (!seen.has(key)) { seen.add(key); edges.push({ from, to, kind }); }
    }
    for (const [id, n] of nodes) {
      if (!n.parentId) continue;
      if (tierOf.get(id) !== tierOf.get(n.parentId)) throw Error(`Invalid parent: ${id}`);
      edge(n.parentId, id, 'hierarchy');
    }
    for (const id of nodes.keys()) {
      const visited = new Set(); let cursor = id;
      while (cursor) {
        if (visited.has(cursor)) throw Error(`Hierarchy cycle: ${id}`);
        visited.add(cursor); cursor = nodes.get(cursor)?.parentId;
      }
    }
    const mappings = data.mappings || {};
    for (const n of data.tiers.tier4) {
      const goals = mappings.achievementToGoals?.[n.id] ?? n.goals ?? [];
      for (const g of goals) {
        if (tierOf.get(g) !== 'tier3') throw Error(`Achievement ${n.id} must connect only to Tier 3: ${g}`);
        edge(n.id, g, 'mapping');
      }
    }
    for (const key of ['goalToTier1', 'goalToTier2']) {
      for (const [goal, targets] of Object.entries(mappings[key] || {})) {
        if (tierOf.get(goal) !== 'tier3') throw Error(`Unknown goal: ${goal}`);
        for (const target of targets) {
          const tier = tierOf.get(target);
          if (!['tier1', 'tier2'].includes(tier)) throw Error(`Invalid foundation: ${target}`);
          if (tier !== key.replace('goalToT', 't')) warnings.push(`${goal} → ${target}: filed under ${key}; displayed in ${tier}.`);
          edge(goal, target, 'mapping');
        }
      }
    }
    const outgoing = new Map();
    for (const e of edges.filter(e => e.kind === 'mapping')) {
      if (!outgoing.has(e.from)) outgoing.set(e.from, []);
      outgoing.get(e.from).push(e);
    }
    function trace(achievement) {
      if (tierOf.get(achievement) !== 'tier4') return { ids: new Set(), edges: [] };
      const ids = new Set([achievement]), used = [], queue = [achievement];
      while (queue.length) {
        const current = queue.shift();
        for (const e of outgoing.get(current) || []) {
          used.push(e);
          if (!ids.has(e.to)) { ids.add(e.to); queue.push(e.to); }
        }
      }
      return { ids, edges: used };
    }
    function candidates(origin) {
      return data.tiers.tier4.filter(n => trace(n.id).ids.has(origin)).map(n => n.id);
    }
    return { nodes, tierOf, edges, warnings, trace, candidates };
  }
  function score(node, mode) {
    const values = (mode === 'balanced' ? DIMENSIONS : [mode]).map(d => node.influences?.[d]);
    if (values.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 1 || v > 10)) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  // A = pi * 14^2 * score. One global scale; no per-achievement normalization.
  function radius(value) { return value === null ? 14 : 14 * Math.sqrt(value); }
  function rings(items) {
    if (!items.length) return { size: 560, positions: [] };
    // Allocate concentric rings by their circumference, reserving space for score 10.
    const ringCount = Math.max(1, Math.ceil((Math.sqrt(1 + items.length / 1.5) - 1) / 2));
    let counts = Array(ringCount).fill(0);
    for (let i = 0; i < items.length; i++) {
      let best = 0;
      for (let j = 1; j < ringCount; j++) if (counts[j] / (180 + j * 110) < counts[best] / (180 + best * 110)) best = j;
      counts[best]++;
    }
    // If necessary add rings until every ring is collision-free even at score 10.
    if (counts.some((n, j) => n > 1 && 2 * (180 + j * 110) * Math.sin(Math.PI / n) < 100)) {
      return packedRings(items);
    }
    return place(items, counts);
  }
  function packedRings(items) {
    const counts = []; let remaining = items.length, j = 0;
    while (remaining) {
      const capacity = Math.floor(Math.PI / Math.asin(50 / (180 + 110 * j)));
      const n = Math.min(capacity, remaining); counts.push(n); remaining -= n; j++;
    }
    return place(items, counts);
  }
  function place(items, counts) {
    const size = (180 + (counts.length - 1) * 110 + 65) * 2;
    const positions = []; let index = 0;
    counts.forEach((count, ring) => {
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + 2 * Math.PI * (i + (ring % 2) * .5) / count;
        const distance = 180 + ring * 110;
        positions.push({ id: items[index++].id, x: size / 2 + Math.cos(angle) * distance, y: size / 2 + Math.sin(angle) * distance, ring, hue: (angle * 180 / Math.PI + 290 + 360) % 360 });
      }
    });
    return { size, positions };
  }
  const api = { createModel, score, radius, rings, DIMENSIONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AtlasCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
