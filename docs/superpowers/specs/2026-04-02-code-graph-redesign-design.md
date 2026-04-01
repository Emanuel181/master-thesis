# Code Graph Redesign — Design Spec

## Overview

Redesign the code graph visualization to be visually striking and genuinely useful. Replace the current flat grid layout with a clustered hierarchical layout, redesign all node and edge visuals, and add four interaction layers: collapsible file clusters, animated taint flow, focus mode, and color themes.

**Approach:** ReactFlow overhaul — keep the existing rendering library and data pipeline, replace layout engine + visual components + interaction patterns.

**Scope:** Visual/interaction layer only. No changes to the data pipeline (`lib/code-graph/`), tree-sitter parsing, graph builder, context provider API surface, or API routes.

## Files Affected

### Replace / Major Rewrite
- `components/dashboard/code-graph-page/code-graph.jsx` — Replace `layoutGraph` function with ELK.js layout, add interaction state management (collapse, focus mode, color theme, attack path overlay)
- `components/dashboard/code-graph-page/nodes/function-node.jsx` — Redesign with color stripe, glow effects, security state visuals
- `components/dashboard/code-graph-page/nodes/module-node.jsx` — Replace with group header bar for ELK compound nodes
- `components/dashboard/code-graph-page/nodes/class-node.jsx` — Redesign with purple stripe, collapsible method list
- `components/dashboard/code-graph-page/edges/data-flow-edge.jsx` — Redesign with type-specific visuals, animated particles for taint flow
- `components/dashboard/code-graph-page/graph-controls.jsx` — Redesign control bar layout, add collapse all/expand all, attack paths toggle, color theme dropdown

### Modify
- `components/dashboard/code-graph-page/node-detail-panel.jsx` — Visual hierarchy improvements, focus mode integration on connection clicks
- `components/dashboard/code-graph-page/vulnerability-overlay.jsx` — Connect to animated taint flow system

### New Files
- None anticipated. All new functionality goes into existing component files or as utility functions within them.

### New Dependency
- `elkjs` — ELK layout engine (npm package, ~200KB, well-maintained, used by VS Code)

### Unchanged
- `lib/code-graph/*` — All parsing, graph building, type definitions, summarization
- `contexts/codeGraphContext.jsx` — Context provider (collapse state managed in `code-graph.jsx` component state, not in context)
- `app/api/code-graph/route.js` — API endpoint
- `app/demo/code-graph/page.jsx` — Page route

---

## 1. Layout Engine

Replace the manual grid layout (`layoutGraph` function) with ELK.js.

### How it works
- Each **file** becomes an **ELK parent node** (compound/group node). Functions, classes, and methods inside that file become ELK child nodes.
- ELK positions child nodes **within** each file group (top-to-bottom, sorted by type: classes first, then functions, then methods).
- ELK positions file groups **relative to each other** based on edge density — files with many cross-file connections are placed closer together.
- Result: files that interact heavily cluster naturally, while internal structure stays organized.

### Why ELK over dagre
Dagre does not support compound/nested nodes. ELK was designed for hierarchical grouped layouts and is used by VS Code's extension graph and many IDE visualizers.

### Group node rendering
- File groups render as a rounded container with:
  - Header bar: file icon, filename, language color dot, collapse/expand chevron toggle
  - Subtle background tint color-coded by language
  - Children rendered inside the container
- **Collapsed state:** group becomes a single compact pill node showing `filename.js · 4 fn · 2 classes`. All internal edges hidden. Cross-file edges re-route to the collapsed pill.

### Layout configuration
- `elk.algorithm`: `layered`
- `elk.direction`: `RIGHT` (left-to-right flow)
- `elk.hierarchyHandling`: `INCLUDE_CHILDREN`
- Node spacing within groups: ~60px vertical
- Group spacing: ~200px horizontal, ~100px vertical
- Edge routing: ELK's built-in routing (curves around nodes)

---

## 2. Node Design

### Function/Method Nodes
- Rounded card (`rounded-lg`) with a **left color stripe** (4px wide):
  - Cyan: entry point
  - Red: tainted
  - Orange: has vulnerabilities
  - Default border color: regular function
- Content layout:
  - Row 1: Type icon (FunctionSquare for function, method uses same) + name (semibold, truncated) + visibility icon
  - Row 2: Signature in monospace (10px, muted, truncated)
  - Row 3: Badge row — language badge, plus conditional: entry, tainted, vuln count badges
- **Glow effect**: Nodes with vulnerabilities get `box-shadow` glow in severity color:
  - Critical: `0 0 12px rgba(239, 68, 68, 0.4)` (red)
  - High: `0 0 12px rgba(249, 115, 22, 0.4)` (orange)
  - Medium: `0 0 10px rgba(234, 179, 8, 0.3)` (yellow)
  - Low: `0 0 8px rgba(34, 197, 94, 0.2)` (green)
- Min width: 140px, max width: 260px (same as current)

### Class Nodes
- Purple left stripe
- Content: class icon (Box) + name (bold) + language badge
- Collapsible method list below a divider: method names as compact rows, clickable to select that method node
- Max 6 methods shown, "+N more" indicator

### Module (File) Group Header
- Not a standalone node — it's the **header bar** of the ELK group container
- Content: FileCode2 icon, filename, language color dot, function count, collapse chevron
- When collapsed: becomes a pill node — `filename.js · 4 fn · 2 classes`

### Language Color System
| Language   | Color  | CSS Variable / Tailwind |
|------------|--------|------------------------|
| JavaScript | Amber  | `amber-500`            |
| TypeScript | Blue   | `blue-500`             |
| Python     | Green  | `green-500`            |
| Java       | Orange | `orange-500`           |
| Go         | Cyan   | `cyan-500`             |
| C / C++    | Gray   | `zinc-400`             |

Applied as:
- Faint background wash on group containers (`{color}/5` opacity)
- Badge color on individual nodes
- Dot in group header

### Security state overrides (higher priority than language colors)
- Tainted: red border + red glow
- Vulnerable: orange pulsing glow (CSS keyframe, ~2s cycle)
- Highlighted attack path: amber ring (`ring-2 ring-amber-400`) + elevated shadow

---

## 3. Edge Design

### Edge Types

| Type       | Style      | Color      | Animation        |
|------------|-----------|------------|------------------|
| Call       | Solid     | Blue-gray (`slate-400`) | None   |
| Import     | Dashed    | Light gray (`zinc-300`) | None   |
| Data-flow  | Slightly thicker solid | Amber (`amber-400`) | None |
| Taint-flow | Thick solid | Red (`red-500`) | Animated particles |

### Taint-flow particle animation
- Small dots (3px circles) travel along the SVG edge path from source to sink
- Uses SVG `animateMotion` along the edge's path element
- 2-3 particles per edge, staggered timing
- Only active when "Attack Paths" overlay is toggled on

### Edge routing
- ELK handles routing — edges curve around nodes
- Edges between nodes in the same file group stay internal to the group container
- Cross-file edges arc between groups with smooth bezier curves

### Edge interaction
- Hover: edge highlights (opacity boost + thicker stroke), tooltip shows relationship type and label (e.g., "calls -> encrypt(text)" or "tainted: req.body -> query param")
- Focus mode: unrelated edges fade to opacity ~0.05

### Edge markers
- Arrow at target end: `MarkerType.ArrowClosed`, 12x12 (same as current)

---

## 4. Interaction Layers

### 4.1 Collapsible File Clusters

- **Trigger:** Chevron toggle in each file group's header bar
- **Collapsed state:** Group becomes a single compact pill node. Internal edges hidden. Cross-file edges re-route to the pill.
- **Expanded state:** Full internal layout visible (default).
- **Bulk controls:** "Collapse All" / "Expand All" buttons in the controls bar.
- **State persistence:** Collapse state stored in component state (React `useState` map of `fileId -> boolean`). Survives filter changes within the session. Does not persist across page navigation.
- **Layout re-run:** Collapsing/expanding triggers an ELK re-layout to adjust group spacing.

### 4.2 Focus Mode (Dim Unrelated)

- **Trigger:** Click any node.
- **Behavior:**
  - Selected node + all directly connected nodes (1-hop: callers, callees, import sources/targets) stay at full opacity.
  - Everything else (nodes, edges, group containers) dims to opacity ~0.10.
  - The detail panel opens simultaneously.
- **Exit:** Click canvas background, press Escape, or click the close button on the detail panel.
- **Implementation:** CSS classes toggled via state. Each node/edge gets a `dimmed` class when focus is active and the node is not in the focused set. Transitions with `transition-opacity duration-200`.

### 4.3 Animated Taint Flow (Security Overlay)

- **Trigger:** "Show Attack Paths" toggle button in the controls bar.
- **When active:**
  - All taint-flow edges render with red animated particles.
  - Tainted nodes pulse with a slow red glow (CSS `@keyframes pulse-red`, ~2s cycle).
  - Non-security nodes/edges dim slightly (opacity ~0.6) to push attack paths forward.
- **Vulnerability integration:** Clicking a vulnerability in the overlay panel highlights its specific attack path AND fits the viewport to show the full source-to-sink chain.
- **When inactive:** Taint edges render as regular data-flow edges (amber, no animation). Tainted badges still visible on nodes.

### 4.4 Color Themes

- **Trigger:** Dropdown in controls bar.
- **Modes:**
  - "By Language" (default): Node backgrounds and group tints use the language color system.
  - "By Node Type": Functions = blue, classes = purple, methods = teal, modules = gray.
  - "By Security Severity": Nodes color from green (clean) through yellow/orange/red based on vulnerability severity. Nodes with no vulnerabilities are neutral gray.
  - "By File": Each file group gets a unique hue (auto-assigned from a palette).
- **Implementation:** A `colorMode` state variable. Node components receive it as a prop and select their background/border colors accordingly.

---

## 5. Controls & Detail Panel

### Top Controls Bar

Layout (left to right):
1. **Left group:** Zoom in, zoom out, fit view, relayout buttons (icon buttons)
2. **Center:** Search input with live filtering
3. **Right group:** Filter dropdowns (node type, language), "Collapse All" button, "Attack Paths" toggle, color theme dropdown, stats pill

**Stats pill** (far right): Compact display — `12 fn · 3 cls · 18 calls · 4 flows`

### Node Detail Panel (Right Side)

Slides in from the right (280px width, same as current) with a smooth `transform` transition.

**Sections:**
1. **Identity:** Name, type badge, file path, line range, language
2. **Signature:** Function signature with syntax-highlighted parameters (monospace)
3. **Connections:**
   - "Called by" list — clickable items that navigate viewport to caller AND activate focus mode
   - "Calls" list — same behavior
4. **Vulnerabilities:** Linked vulnerabilities with severity badge, click to highlight attack path in graph

**Close:** X button or Escape key.

### Minimap

Keep ReactFlow's built-in minimap. Style nodes in the minimap to reflect the active color theme.

---

## Non-Goals

- No changes to tree-sitter parsing or graph builder logic
- No changes to the API endpoint or database storage
- No changes to the context provider's public API
- No new pages or routes
- No server-side rendering of the graph (stays client-only)
- No WebGL or canvas rendering — stays SVG via ReactFlow
