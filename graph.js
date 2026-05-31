/* ===================================================================
   Engram — knowledge-graph mockup.

   A force-directed simulation that mirrors the real app's GraphEngine
   (macapp/Sources/Engram/GraphEngine.swift): node-node repulsion, edge
   springs, gravity toward origin, velocity damping. Abstracted into the
   project's conceptual layers: Domain (notebook) → Concept (section) →
   .md (note), with solid hierarchy edges and dashed cross-links.

   Interaction matches the app: drag a node; click one to highlight its
   neighborhood and dim the rest (incident edges turn blue).
   =================================================================== */
(function () {
  "use strict";
  const canvas = document.getElementById("graph-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // ---- physics constants (same character as GraphEngine.tick) ----
  const REPULSION = 11000, SPRING_LEN = 130, SPRING_K = 0.018;
  const GRAVITY = 0.025, DAMPING = 0.86, MAX_STEP = 28;

  const INK = "#14171a", BLUE = "#3b6ea5", ORANGE = "#e07a3a";
  const NOTE_FILL = "#dbe3ec", NOTE_STROKE = "#aebccd";

  // ---- the conceptual graph: 1 domain, 3 concepts, 9 notes ----
  // kind: domain | concept | note
  const N = [
    { t: "Domain",     kind: "domain"  }, // 0
    { t: "Concept · A", kind: "concept" }, // 1
    { t: "Concept · B", kind: "concept" }, // 2
    { t: "Concept · C", kind: "concept" }, // 3
    { t: "a1.md", kind: "note" }, // 4
    { t: "a2.md", kind: "note" }, // 5
    { t: "a3.md", kind: "note" }, // 6
    { t: "b1.md", kind: "note" }, // 7
    { t: "b2.md", kind: "note" }, // 8
    { t: "b3.md", kind: "note" }, // 9
    { t: "c1.md", kind: "note" }, // 10
    { t: "c2.md", kind: "note" }, // 11
    { t: "c3.md", kind: "note" }, // 12
  ];

  // hierarchy edges (solid) ...
  const HIER = [
    [0, 1], [0, 2], [0, 3],
    [1, 4], [1, 5], [1, 6],
    [2, 7], [2, 8], [2, 9],
    [3, 10], [3, 11], [3, 12],
  ];
  // ... and cross-links (dashed orange), added by the linking pass.
  const CROSS = [
    [4, 7],   // shared concept
    [6, 10],  // prerequisite
    [8, 11],  // variation
    [5, 9],   // related idea
    [6, 12],
  ];
  const EDGES = HIER.map(e => ({ a: e[0], b: e[1], cross: false }))
    .concat(CROSS.map(e => ({ a: e[0], b: e[1], cross: true })));

  // adjacency for highlight
  const adj = N.map(() => new Set());
  const degree = N.map(() => 0);
  for (const e of EDGES) { adj[e.a].add(e.b); adj[e.b].add(e.a); degree[e.a]++; degree[e.b]++; }

  // ---- node state (seeded on a circle, like the engine) ----
  const nodes = N.map((n, i) => {
    const a = (2 * Math.PI * i) / N.length;
    return { x: 220 * Math.cos(a), y: 220 * Math.sin(a), vx: 0, vy: 0, pinned: false, ...n };
  });

  function radius(i) {
    const base = nodes[i].kind === "domain" ? 14 : nodes[i].kind === "concept" ? 10 : 7;
    return base + Math.min(degree[i], 10) * 1.2;
  }
  function fill(i, dim) {
    if (dim) return "rgba(150,160,170,0.22)";
    return nodes[i].kind === "domain" ? INK : nodes[i].kind === "concept" ? BLUE : NOTE_FILL;
  }

  // ---- view transform ----
  let scale = 1, panX = 0, panY = 0, W = 0, H = 0, dpr = 1;
  let selected = null, hovered = null, dragNode = null, dragging = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // fit-ish: scale to viewport
    scale = Math.min(W, H) / 620;
  }
  window.addEventListener("resize", resize);

  // ---- physics step ----
  function tick() {
    const n = nodes.length;
    const fx = new Float64Array(n), fy = new Float64Array(n);
    // repulsion (O(n^2), fine for this size — same as the app)
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.01) { dx = i - j + 1; dy = 1; d2 = dx * dx + dy * dy; }
        const inv = REPULSION / d2, d = Math.sqrt(d2), ux = dx / d, uy = dy / d;
        fx[i] += inv * ux; fy[i] += inv * uy;
        fx[j] -= inv * ux; fy[j] -= inv * uy;
      }
    }
    // springs
    for (const e of EDGES) {
      const dx = nodes[e.b].x - nodes[e.a].x, dy = nodes[e.b].y - nodes[e.a].y;
      const d = Math.max(Math.hypot(dx, dy), 0.01);
      const f = SPRING_K * (d - SPRING_LEN), ux = dx / d, uy = dy / d;
      fx[e.a] += f * ux; fy[e.a] += f * uy;
      fx[e.b] -= f * ux; fy[e.b] -= f * uy;
    }
    // gravity + integrate
    for (let i = 0; i < n; i++) {
      if (nodes[i].pinned) { nodes[i].vx = nodes[i].vy = 0; continue; }
      fx[i] += -nodes[i].x * GRAVITY;
      fy[i] += -nodes[i].y * GRAVITY;
      nodes[i].vx = (nodes[i].vx + fx[i]) * DAMPING;
      nodes[i].vy = (nodes[i].vy + fy[i]) * DAMPING;
      nodes[i].x += Math.max(-MAX_STEP, Math.min(MAX_STEP, nodes[i].vx));
      nodes[i].y += Math.max(-MAX_STEP, Math.min(MAX_STEP, nodes[i].vy));
    }
  }

  function screen(p) { return { x: p.x * scale + W / 2 + panX, y: p.y * scale + H / 2 + panY }; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const hl = selected != null ? new Set([...adj[selected], selected]) : null;

    // edges
    for (const e of EDGES) {
      const pa = screen(nodes[e.a]), pb = screen(nodes[e.b]);
      const incident = selected != null && (e.a === selected || e.b === selected);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
      ctx.setLineDash(e.cross ? [6, 5] : []);
      if (selected != null) {
        if (incident) { ctx.strokeStyle = "rgba(59,110,165,0.65)"; ctx.lineWidth = 2; }
        else { ctx.strokeStyle = e.cross ? "rgba(224,122,58,0.10)" : "rgba(120,130,140,0.08)"; ctx.lineWidth = 1; }
      } else {
        ctx.strokeStyle = e.cross ? "rgba(224,122,58,0.55)" : "rgba(120,130,140,0.32)";
        ctx.lineWidth = e.cross ? 1.6 : 1;
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // nodes
    for (let i = 0; i < nodes.length; i++) {
      const p = screen(nodes[i]), r = radius(i) * scale;
      const dim = hl != null && !hl.has(i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill(i, dim);
      ctx.fill();
      ctx.lineWidth = i === selected ? 2.5 : (i === hovered ? 2 : 1);
      ctx.strokeStyle = i === selected ? INK
        : nodes[i].kind === "note" ? (dim ? "rgba(174,188,205,0.3)" : NOTE_STROKE)
        : (dim ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)");
      ctx.stroke();

      // labels
      if (scale > 0.45) {
        ctx.font = `${nodes[i].kind === "note" ? 500 : 600} ${nodes[i].kind === "domain" ? 13 : 11}px ui-monospace, "SF Mono", Menlo, monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = dim ? "rgba(20,23,26,0.22)" : "#14171a";
        ctx.fillText(nodes[i].t, p.x, p.y - r - 6);
      }
    }
  }

  function loop() { tick(); draw(); requestAnimationFrame(loop); }

  // ---- interaction ----
  function toLocal(ev) {
    const r = canvas.getBoundingClientRect();
    const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
    const cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
    return { cx, cy };
  }
  function hit(cx, cy) {
    let best = null, bestD = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      const p = screen(nodes[i]);
      const d = Math.hypot(cx - p.x, cy - p.y);
      if (d < radius(i) * scale + 8 && d < bestD) { best = i; bestD = d; }
    }
    return best;
  }

  let downX = 0, downY = 0, moved = false;
  function onDown(ev) {
    const { cx, cy } = toLocal(ev);
    downX = cx; downY = cy; moved = false;
    dragNode = hit(cx, cy);
    dragging = true;
    if (dragNode != null) nodes[dragNode].pinned = true;
  }
  function onMove(ev) {
    const { cx, cy } = toLocal(ev);
    if (!dragging) { hovered = hit(cx, cy); canvas.style.cursor = hovered != null ? "pointer" : "grab"; return; }
    if (Math.abs(cx - downX) + Math.abs(cy - downY) > 4) moved = true;
    if (ev.cancelable) ev.preventDefault();
    if (dragNode != null) {
      nodes[dragNode].x = (cx - W / 2 - panX) / scale;
      nodes[dragNode].y = (cy - H / 2 - panY) / scale;
    } else {
      panX += cx - downX; panY += cy - downY; downX = cx; downY = cy;
    }
  }
  function onUp() {
    if (!moved) {
      const i = dragNode != null ? dragNode : hit(downX, downY);
      if (i != null) select(i); else deselect();
    }
    if (dragNode != null && dragNode !== selected) nodes[dragNode].pinned = false;
    dragNode = null; dragging = false;
  }
  function select(i) {
    if (selected != null && selected !== i) nodes[selected].pinned = false;
    selected = i; nodes[i].pinned = true;
  }
  function deselect() {
    if (selected != null) nodes[selected].pinned = false;
    selected = null;
  }

  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", onDown, { passive: true });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onUp);

  // "shake" — re-energize the layout
  const resetBtn = document.getElementById("graph-reset");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    deselect();
    for (let i = 0; i < nodes.length; i++) {
      const a = (2 * Math.PI * i) / nodes.length + i * 0.7;
      nodes[i].x = 200 * Math.cos(a) + (i % 3 - 1) * 40;
      nodes[i].y = 200 * Math.sin(a) + (i % 2 ? 30 : -30);
      nodes[i].vx = nodes[i].vy = 0; nodes[i].pinned = false;
    }
  });

  resize();
  // auto-select the central domain node after settle, to demo the highlight.
  setTimeout(() => { if (selected == null) select(0); }, 2600);
  setTimeout(() => { if (selected === 0) deselect(); }, 5200);
  loop();
})();
