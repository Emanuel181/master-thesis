# Code Graph Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat grid code graph with a clustered hierarchical visualization featuring ELK.js layout, redesigned nodes/edges, and four interaction layers (collapsible clusters, animated taint flow, focus mode, color themes).

**Architecture:** Keep ReactFlow v11 as the rendering engine. Replace the manual `layoutGraph` function with ELK.js for hierarchical compound layout. File groups become ReactFlow parent nodes (type `group`) with child function/class nodes positioned inside. All interaction state (collapse, focus, color theme, attack paths) managed in the main `CodeGraphInner` component.

**Tech Stack:** ReactFlow 11.11.4, elkjs (new dependency), Tailwind CSS, Lucide icons, existing shadcn/ui components.

---

### Task 1: Install elkjs and Create Layout Utility

**Files:**
- Modify: `package.json` (add elkjs dependency)
- Create: `components/dashboard/code-graph-page/elk-layout.js`

- [ ] **Step 1: Install elkjs**

Run:
```bash
npm install elkjs
```

Expected: elkjs added to package.json dependencies.

- [ ] **Step 2: Create the ELK layout utility**

Create `components/dashboard/code-graph-page/elk-layout.js`:

```js
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

/**
 * Language -> color mapping for group tints and badges.
 */
export const LANGUAGE_COLORS = {
  javascript: { bg: "bg-amber-500/5", border: "border-amber-500/20", dot: "bg-amber-500", badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  typescript: { bg: "bg-blue-500/5", border: "border-blue-500/20", dot: "bg-blue-500", badge: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  python:     { bg: "bg-green-500/5", border: "border-green-500/20", dot: "bg-green-500", badge: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30" },
  java:       { bg: "bg-orange-500/5", border: "border-orange-500/20", dot: "bg-orange-500", badge: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  go:         { bg: "bg-cyan-500/5", border: "border-cyan-500/20", dot: "bg-cyan-500", badge: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" },
  c:          { bg: "bg-zinc-400/5", border: "border-zinc-400/20", dot: "bg-zinc-400", badge: "bg-zinc-400/20 text-zinc-600 dark:text-zinc-300 border-zinc-400/30" },
  cpp:        { bg: "bg-zinc-400/5", border: "border-zinc-400/20", dot: "bg-zinc-400", badge: "bg-zinc-400/20 text-zinc-600 dark:text-zinc-300 border-zinc-400/30" },
};

const NODE_TYPE_COLORS = {
  function: { bg: "bg-blue-500/5", border: "border-blue-500/20" },
  method:   { bg: "bg-teal-500/5", border: "border-teal-500/20" },
  class:    { bg: "bg-purple-500/5", border: "border-purple-500/20" },
  module:   { bg: "bg-zinc-400/5", border: "border-zinc-400/20" },
};

const SEVERITY_COLORS = {
  Critical: { bg: "bg-red-500/10", border: "border-red-500/30", glow: "shadow-[0_0_12px_rgba(239,68,68,0.4)]" },
  High:     { bg: "bg-orange-500/10", border: "border-orange-500/30", glow: "shadow-[0_0_12px_rgba(249,115,22,0.4)]" },
  Medium:   { bg: "bg-yellow-500/10", border: "border-yellow-500/30", glow: "shadow-[0_0_10px_rgba(234,179,8,0.3)]" },
  Low:      { bg: "bg-green-500/10", border: "border-green-500/30", glow: "shadow-[0_0_8px_rgba(34,197,94,0.2)]" },
};

/**
 * Get color classes for a node based on the active color mode.
 * @param {'language'|'type'|'severity'|'file'} colorMode
 * @param {object} node - CodeGraphNode
 * @param {string} [severity] - Highest vulnerability severity for this node
 * @param {number} [fileIndex] - Index of the file for "by file" coloring
 */
export function getNodeColors(colorMode, node, severity, fileIndex) {
  if (colorMode === "severity" && severity) {
    return SEVERITY_COLORS[severity] || SEVERITY_COLORS.Low;
  }
  if (colorMode === "type") {
    return NODE_TYPE_COLORS[node.type] || NODE_TYPE_COLORS.function;
  }
  if (colorMode === "file") {
    const FILE_HUES = [
      "bg-rose-500/5 border-rose-500/20",
      "bg-violet-500/5 border-violet-500/20",
      "bg-emerald-500/5 border-emerald-500/20",
      "bg-sky-500/5 border-sky-500/20",
      "bg-fuchsia-500/5 border-fuchsia-500/20",
      "bg-lime-500/5 border-lime-500/20",
      "bg-teal-500/5 border-teal-500/20",
      "bg-amber-500/5 border-amber-500/20",
    ];
    const idx = (fileIndex ?? 0) % FILE_HUES.length;
    const [bg, border] = FILE_HUES[idx].split(" ");
    return { bg, border };
  }
  // Default: by language
  const langColors = LANGUAGE_COLORS[node.language];
  if (langColors) return { bg: langColors.bg, border: langColors.border };
  return { bg: "bg-muted/5", border: "border-border" };
}

// Estimated dimensions for ELK layout
const FUNC_NODE_WIDTH = 220;
const FUNC_NODE_HEIGHT = 72;
const CLASS_NODE_WIDTH = 240;
const CLASS_NODE_HEIGHT = 80;
const GROUP_PADDING_TOP = 40; // space for header
const GROUP_PADDING = 16;

/**
 * Run ELK layout on the code graph and return ReactFlow nodes + edges.
 *
 * @param {import('@/lib/code-graph/types').CodeGraphNode[]} graphNodes
 * @param {import('@/lib/code-graph/types').CodeGraphEdge[]} graphEdges
 * @param {object} options
 * @param {string} options.filterType
 * @param {string} options.filterLanguage
 * @param {string} options.searchTerm
 * @param {Set<string>} options.collapsedFiles - file paths that are collapsed
 * @param {string[]|null} options.highlightedPath - node IDs in the highlighted attack path
 * @returns {Promise<{rfNodes: object[], rfEdges: object[]}>}
 */
export async function runElkLayout(graphNodes, graphEdges, options = {}) {
  const {
    filterType = "all",
    filterLanguage = "all",
    searchTerm = "",
    collapsedFiles = new Set(),
    highlightedPath = null,
  } = options;

  // ── Filter nodes ──
  let filteredNodes = graphNodes.filter((n) => {
    if (filterType !== "all" && n.type !== filterType) return false;
    if (filterLanguage !== "all" && n.language !== filterLanguage) return false;
    if (searchTerm && !n.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Skip import/export nodes for cleaner visualization unless specifically filtered
  if (filterType === "all") {
    filteredNodes = filteredNodes.filter((n) => n.type !== "import" && n.type !== "export");
  }

  const filteredIds = new Set(filteredNodes.map((n) => n.id));

  // Filter edges to only connect visible nodes
  const filteredEdges = graphEdges.filter(
    (e) => filteredIds.has(e.source) && filteredIds.has(e.target)
  );

  // ── Group nodes by file ──
  const nodesByFile = new Map();
  for (const node of filteredNodes) {
    const list = nodesByFile.get(node.file) || [];
    list.push(node);
    nodesByFile.set(node.file, list);
  }

  // ── Build ELK graph ──
  const elkChildren = [];
  const elkEdges = [];
  const fileList = [...nodesByFile.keys()];

  for (const [file, fileNodes] of nodesByFile) {
    const isCollapsed = collapsedFiles.has(file);

    if (isCollapsed) {
      // Collapsed: single pill node representing the whole file
      const funcCount = fileNodes.filter((n) => n.type === "function" || n.type === "method").length;
      const classCount = fileNodes.filter((n) => n.type === "class").length;
      elkChildren.push({
        id: `group:${file}`,
        width: 200,
        height: 40,
        _collapsed: true,
        _file: file,
        _funcCount: funcCount,
        _classCount: classCount,
        _language: fileNodes[0]?.language || "javascript",
      });
    } else {
      // Expanded: parent node with children
      const typePriority = { class: 0, function: 1, method: 2, module: 3 };
      const sorted = [...fileNodes].sort(
        (a, b) => (typePriority[a.type] ?? 4) - (typePriority[b.type] ?? 4)
      );

      const children = sorted.map((node) => {
        const isClass = node.type === "class";
        const methods = isClass
          ? fileNodes.filter((n) => n.parentClass === node.name && n.file === node.file)
          : [];
        const height = isClass
          ? CLASS_NODE_HEIGHT + Math.min(methods.length, 6) * 18
          : FUNC_NODE_HEIGHT;

        return {
          id: node.id,
          width: isClass ? CLASS_NODE_WIDTH : FUNC_NODE_WIDTH,
          height,
        };
      });

      elkChildren.push({
        id: `group:${file}`,
        layoutOptions: {
          "elk.algorithm": "layered",
          "elk.direction": "DOWN",
          "elk.spacing.nodeNode": "20",
          "elk.padding": `[top=${GROUP_PADDING_TOP},left=${GROUP_PADDING},bottom=${GROUP_PADDING},right=${GROUP_PADDING}]`,
        },
        children,
        // Internal edges (within this file)
        edges: filteredEdges
          .filter((e) => {
            const srcInFile = fileNodes.some((n) => n.id === e.source);
            const tgtInFile = fileNodes.some((n) => n.id === e.target);
            return srcInFile && tgtInFile;
          })
          .map((e) => ({
            id: e.id,
            sources: [e.source],
            targets: [e.target],
          })),
        _collapsed: false,
        _file: file,
        _language: fileNodes[0]?.language || "javascript",
      });
    }
  }

  // Cross-file edges
  for (const edge of filteredEdges) {
    const srcFile = filteredNodes.find((n) => n.id === edge.source)?.file;
    const tgtFile = filteredNodes.find((n) => n.id === edge.target)?.file;
    if (srcFile && tgtFile && srcFile !== tgtFile) {
      const srcId = collapsedFiles.has(srcFile) ? `group:${srcFile}` : edge.source;
      const tgtId = collapsedFiles.has(tgtFile) ? `group:${tgtFile}` : edge.target;
      // Avoid duplicate collapsed->collapsed edges
      const edgeId = `cross:${srcId}->${tgtId}`;
      if (!elkEdges.some((e) => e.id === edgeId)) {
        elkEdges.push({
          id: edgeId,
          sources: [srcId],
          targets: [tgtId],
        });
      }
    }
  }

  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "60",
      "elk.layered.spacing.nodeNodeBetweenLayers": "120",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    },
    children: elkChildren,
    edges: elkEdges,
  };

  // ── Run ELK ──
  const layout = await elk.layout(elkGraph);

  // ── Convert to ReactFlow nodes ──
  const rfNodes = [];

  for (const elkGroup of layout.children) {
    const file = elkGroup._file;
    const isCollapsed = elkGroup._collapsed;
    const fileIndex = fileList.indexOf(file);
    const language = elkGroup._language;

    if (isCollapsed) {
      // Render as a single pill node
      rfNodes.push({
        id: elkGroup.id,
        type: "collapsedFileNode",
        position: { x: elkGroup.x, y: elkGroup.y },
        data: {
          label: file.split("/").pop(),
          filePath: file,
          funcCount: elkGroup._funcCount,
          classCount: elkGroup._classCount,
          language,
          fileIndex,
        },
      });
    } else {
      // Group container node
      rfNodes.push({
        id: elkGroup.id,
        type: "fileGroupNode",
        position: { x: elkGroup.x, y: elkGroup.y },
        style: { width: elkGroup.width, height: elkGroup.height },
        data: {
          label: file.split("/").pop(),
          filePath: file,
          language,
          fileIndex,
          funcCount: (elkGroup.children || []).filter(
            (c) => filteredNodes.find((n) => n.id === c.id)?.type === "function" ||
                   filteredNodes.find((n) => n.id === c.id)?.type === "method"
          ).length,
        },
      });

      // Child nodes
      for (const elkChild of elkGroup.children || []) {
        const graphNode = filteredNodes.find((n) => n.id === elkChild.id);
        if (!graphNode) continue;

        const isTainted = graphEdges.some(
          (e) =>
            (e.source === graphNode.id || e.target === graphNode.id) &&
            e.dataFlowDetail?.tainted
        );
        const isEntryPoint = !graphEdges.some(
          (e) => e.target === graphNode.id && e.type === "calls"
        );
        const isHighlighted = highlightedPath?.includes(graphNode.id);
        const methods =
          graphNode.type === "class"
            ? filteredNodes
                .filter(
                  (n) =>
                    n.parentClass === graphNode.name && n.file === graphNode.file
                )
                .map((n) => n.name)
            : [];

        let rfNodeType = "functionNode";
        if (graphNode.type === "class") rfNodeType = "classNode";

        rfNodes.push({
          id: graphNode.id,
          type: rfNodeType,
          parentNode: elkGroup.id,
          extent: "parent",
          position: { x: elkChild.x, y: elkChild.y },
          data: {
            label: graphNode.name,
            signature: graphNode.signature,
            language: graphNode.language,
            visibility: graphNode.visibility,
            tainted: isTainted,
            isEntryPoint,
            highlighted: isHighlighted,
            vulnCount: graphNode.vulnerabilityIds?.length || 0,
            filePath: graphNode.file,
            methods,
            fileIndex,
          },
        });
      }
    }
  }

  // ── Convert to ReactFlow edges ──
  const rfEdges = filteredEdges.map((edge) => {
    const srcFile = filteredNodes.find((n) => n.id === edge.source)?.file;
    const tgtFile = filteredNodes.find((n) => n.id === edge.target)?.file;
    const srcId = collapsedFiles.has(srcFile) ? `group:${srcFile}` : edge.source;
    const tgtId = collapsedFiles.has(tgtFile) ? `group:${tgtFile}` : edge.target;

    // Skip if both endpoints collapse to same group (internal edge in collapsed group)
    if (srcId === tgtId && srcId.startsWith("group:")) return null;

    // Deduplicate: if we already have an edge between these two endpoints, skip
    const edgeKey = `${srcId}->${tgtId}`;

    return {
      id: `${edge.id}::${edgeKey}`,
      source: srcId,
      target: tgtId,
      type: "dataFlow",
      animated: edge.type === "data-flow" || edge.dataFlowDetail?.tainted,
      data: {
        edgeType: edge.type,
        tainted: edge.dataFlowDetail?.tainted || false,
        highlighted:
          highlightedPath?.includes(edge.source) &&
          highlightedPath?.includes(edge.target),
        label: edge.label,
      },
    };
  }).filter(Boolean);

  // Deduplicate edges (collapsed groups can produce duplicates)
  const seen = new Set();
  const dedupedEdges = rfEdges.filter((e) => {
    const key = `${e.source}->${e.target}::${e.data.edgeType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { rfNodes, rfEdges: dedupedEdges };
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json components/dashboard/code-graph-page/elk-layout.js
git commit -m "feat(code-graph): add elkjs dependency and layout utility"
```

---

### Task 2: Create File Group Node and Collapsed File Node

**Files:**
- Create: `components/dashboard/code-graph-page/nodes/file-group-node.jsx`
- Create: `components/dashboard/code-graph-page/nodes/collapsed-file-node.jsx`

- [ ] **Step 1: Create the file group node (expanded container)**

Create `components/dashboard/code-graph-page/nodes/file-group-node.jsx`:

```jsx
"use client";

import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { FileCode2, ChevronDown } from "lucide-react";
import { LANGUAGE_COLORS } from "../elk-layout";

function FileGroupNode({ data, selected }) {
  const {
    label,
    filePath,
    language,
    funcCount = 0,
    onToggleCollapse,
  } = data;

  const langColors = LANGUAGE_COLORS[language] || {};

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all min-w-[200px]",
        langColors.border || "border-border/30",
        langColors.bg || "bg-muted/5",
        selected && "ring-2 ring-primary"
      )}
      style={{ width: "100%", height: "100%" }}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-muted-foreground/40" />

      {/* Header bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/20">
        <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div className={cn("w-2 h-2 rounded-full shrink-0", langColors.dot || "bg-muted-foreground")} />
        <span className="text-xs font-semibold truncate flex-1">{label}</span>
        {funcCount > 0 && (
          <span className="text-[10px] text-muted-foreground">{funcCount} fn</span>
        )}
        {onToggleCollapse && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(filePath);
            }}
            className="p-0.5 rounded hover:bg-muted/50 transition-colors"
          >
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-muted-foreground/40" />
    </div>
  );
}

export default memo(FileGroupNode);
```

- [ ] **Step 2: Create the collapsed file node (pill)**

Create `components/dashboard/code-graph-page/nodes/collapsed-file-node.jsx`:

```jsx
"use client";

import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { FileCode2, ChevronRight } from "lucide-react";
import { LANGUAGE_COLORS } from "../elk-layout";

function CollapsedFileNode({ data, selected }) {
  const {
    label,
    filePath,
    funcCount = 0,
    classCount = 0,
    language,
    onToggleCollapse,
  } = data;

  const langColors = LANGUAGE_COLORS[language] || {};

  const parts = [label];
  if (funcCount > 0) parts.push(`${funcCount} fn`);
  if (classCount > 0) parts.push(`${classCount} cls`);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-full border-2 bg-card shadow-sm transition-all cursor-pointer",
        langColors.border || "border-border/30",
        selected && "ring-2 ring-primary"
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-muted-foreground/40" />

      <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className={cn("w-2 h-2 rounded-full shrink-0", langColors.dot || "bg-muted-foreground")} />
      <span className="text-xs font-medium whitespace-nowrap">
        {parts.join(" · ")}
      </span>

      {onToggleCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(filePath);
          }}
          className="p-0.5 rounded hover:bg-muted/50 transition-colors ml-1"
        >
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </button>
      )}

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-muted-foreground/40" />
    </div>
  );
}

export default memo(CollapsedFileNode);
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/code-graph-page/nodes/file-group-node.jsx components/dashboard/code-graph-page/nodes/collapsed-file-node.jsx
git commit -m "feat(code-graph): add file group and collapsed file node components"
```

---

### Task 3: Redesign Function Node with Color Stripe and Glow

**Files:**
- Modify: `components/dashboard/code-graph-page/nodes/function-node.jsx` (full rewrite)

- [ ] **Step 1: Rewrite function-node.jsx**

Replace the entire content of `components/dashboard/code-graph-page/nodes/function-node.jsx`:

```jsx
"use client";

import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { FunctionSquare, ShieldAlert, Lock, Eye, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LANGUAGE_COLORS } from "../elk-layout";

const visibilityIcons = {
  public: Globe,
  private: Lock,
  protected: Eye,
  default: null,
};

function FunctionNode({ data, selected }) {
  const {
    label,
    signature,
    language,
    visibility,
    vulnCount = 0,
    tainted = false,
    isEntryPoint = false,
    highlighted = false,
    dimmed = false,
    severity,
  } = data;

  const VisIcon = visibilityIcons[visibility];
  const langColors = LANGUAGE_COLORS[language] || {};

  // Left stripe color: security state > entry point > default
  const stripeColor = tainted
    ? "bg-red-500"
    : vulnCount > 0
      ? "bg-orange-500"
      : isEntryPoint
        ? "bg-cyan-500"
        : "bg-border";

  // Glow for vulnerability severity
  const glowClass = severity === "Critical"
    ? "shadow-[0_0_12px_rgba(239,68,68,0.4)]"
    : severity === "High"
      ? "shadow-[0_0_12px_rgba(249,115,22,0.4)]"
      : severity === "Medium"
        ? "shadow-[0_0_10px_rgba(234,179,8,0.3)]"
        : severity === "Low"
          ? "shadow-[0_0_8px_rgba(34,197,94,0.2)]"
          : "";

  // Pulsing animation for tainted nodes when attack paths overlay is active
  const pulseClass = tainted && data.attackPathsActive ? "animate-pulse-red" : "";

  return (
    <div
      className={cn(
        "flex rounded-lg border bg-card text-card-foreground shadow-sm min-w-[140px] max-w-[260px] transition-all duration-200 overflow-hidden",
        selected && "ring-2 ring-primary",
        highlighted && "ring-2 ring-amber-400 shadow-amber-400/20 shadow-md",
        dimmed && "opacity-10",
        glowClass,
        pulseClass
      )}
    >
      {/* Left color stripe */}
      <div className={cn("w-1 shrink-0", stripeColor)} />

      <div className="px-2.5 py-2 flex-1 min-w-0">
        <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-muted-foreground/40" />

        <div className="flex items-center gap-1.5 mb-1">
          <FunctionSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="text-xs font-semibold truncate">{label}</span>
          {VisIcon && <VisIcon className="w-3 h-3 text-muted-foreground shrink-0" />}
        </div>

        {signature && (
          <p className="text-[10px] text-muted-foreground font-mono truncate mb-1">{signature}</p>
        )}

        <div className="flex items-center gap-1 flex-wrap">
          {language && (
            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4", langColors.badge)}>
              {language}
            </Badge>
          )}
          {isEntryPoint && (
            <Badge className="text-[9px] px-1 py-0 h-4 bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30">
              entry
            </Badge>
          )}
          {tainted && (
            <Badge className="text-[9px] px-1 py-0 h-4 bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30">
              tainted
            </Badge>
          )}
          {vulnCount > 0 && (
            <Badge className="text-[9px] px-1 py-0 h-4 bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30 gap-0.5">
              <ShieldAlert className="w-2.5 h-2.5" />{vulnCount}
            </Badge>
          )}
        </div>

        <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-muted-foreground/40" />
      </div>
    </div>
  );
}

export default memo(FunctionNode);
```

- [ ] **Step 2: Add the pulse-red animation to globals.css**

Add to `app/globals.css` (at the end, before the closing block):

```css
@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.3); }
  50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); }
}

.animate-pulse-red {
  animation: pulse-red 2s ease-in-out infinite;
}
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/code-graph-page/nodes/function-node.jsx app/globals.css
git commit -m "feat(code-graph): redesign function node with color stripe, glow, and pulse animation"
```

---

### Task 4: Redesign Class Node with Purple Stripe

**Files:**
- Modify: `components/dashboard/code-graph-page/nodes/class-node.jsx` (full rewrite)

- [ ] **Step 1: Rewrite class-node.jsx**

Replace the entire content of `components/dashboard/code-graph-page/nodes/class-node.jsx`:

```jsx
"use client";

import React, { memo, useState } from "react";
import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { Box, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LANGUAGE_COLORS } from "../elk-layout";

function ClassNode({ data, selected }) {
  const {
    label,
    language,
    methods = [],
    highlighted = false,
    dimmed = false,
  } = data;

  const [methodsExpanded, setMethodsExpanded] = useState(true);
  const langColors = LANGUAGE_COLORS[language] || {};

  return (
    <div
      className={cn(
        "flex rounded-lg border-2 bg-card text-card-foreground shadow-sm min-w-[160px] max-w-[280px] transition-all duration-200 overflow-hidden",
        selected && "ring-2 ring-primary",
        highlighted && "ring-2 ring-amber-400 shadow-amber-400/20 shadow-md",
        dimmed && "opacity-10"
      )}
    >
      {/* Purple left stripe */}
      <div className="w-1 shrink-0 bg-purple-500" />

      <div className="px-2.5 py-2 flex-1 min-w-0">
        <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-muted-foreground/40" />

        <div className="flex items-center gap-1.5 mb-1">
          <Box className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="text-xs font-bold truncate">{label}</span>
          {language && (
            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4 ml-auto", langColors.badge)}>
              {language}
            </Badge>
          )}
        </div>

        {methods.length > 0 && (
          <div className="border-t border-border/50 pt-1 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMethodsExpanded(!methodsExpanded);
              }}
              className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5 hover:text-foreground transition-colors"
            >
              {methodsExpanded ? (
                <ChevronDown className="w-2.5 h-2.5" />
              ) : (
                <ChevronRight className="w-2.5 h-2.5" />
              )}
              {methods.length} methods
            </button>
            {methodsExpanded && (
              <div className="space-y-0.5">
                {methods.slice(0, 6).map((m) => (
                  <p key={m} className="text-[10px] text-muted-foreground font-mono truncate pl-3">
                    {m}()
                  </p>
                ))}
                {methods.length > 6 && (
                  <p className="text-[9px] text-muted-foreground italic pl-3">
                    +{methods.length - 6} more
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-muted-foreground/40" />
      </div>
    </div>
  );
}

export default memo(ClassNode);
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/code-graph-page/nodes/class-node.jsx
git commit -m "feat(code-graph): redesign class node with purple stripe and collapsible methods"
```

---

### Task 5: Redesign Edge Component with Type-Specific Visuals and Taint Particles

**Files:**
- Modify: `components/dashboard/code-graph-page/edges/data-flow-edge.jsx` (full rewrite)

- [ ] **Step 1: Rewrite data-flow-edge.jsx**

Replace the entire content of `components/dashboard/code-graph-page/edges/data-flow-edge.jsx`:

```jsx
"use client";

import React, { useId } from "react";
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from "reactflow";

const EDGE_COLORS = {
  calls: "hsl(215, 15%, 60%)",    // slate blue-gray
  imports: "hsl(215, 10%, 75%)",   // light gray
  extends: "hsl(270, 60%, 60%)",   // purple
  implements: "hsl(270, 60%, 60%)",
  "data-flow": "hsl(38, 92%, 60%)", // amber
  "returns-to": "hsl(160, 60%, 50%)",
};

const TAINTED_COLOR = "hsl(0, 84%, 60%)"; // red

export function DataFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const uniqueId = useId();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  const edgeType = data?.edgeType || "calls";
  const tainted = data?.tainted || false;
  const highlighted = data?.highlighted || false;
  const dimmed = data?.dimmed || false;
  const attackPathsActive = data?.attackPathsActive || false;
  const label = data?.label;

  const baseColor = tainted ? TAINTED_COLOR : (EDGE_COLORS[edgeType] || EDGE_COLORS.calls);

  const strokeWidth = highlighted
    ? 3
    : tainted
      ? 2.5
      : edgeType === "data-flow"
        ? 2
        : 1.5;

  const opacity = dimmed ? 0.05 : highlighted ? 1 : 0.7;

  const dashArray =
    edgeType === "imports" || edgeType === "extends" || edgeType === "implements"
      ? "6 3"
      : undefined;

  // Show animated particles for taint-flow when attack paths overlay is active
  const showParticles = tainted && attackPathsActive;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: baseColor,
          strokeWidth,
          opacity,
          strokeDasharray: dashArray,
          transition: "opacity 0.2s ease",
        }}
        markerEnd={markerEnd}
      />

      {/* Animated particles for taint flow */}
      {showParticles && (
        <>
          <circle r={3} fill={TAINTED_COLOR} opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r={3} fill={TAINTED_COLOR} opacity="0.7">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="0.7s" />
          </circle>
          <circle r={3} fill={TAINTED_COLOR} opacity="0.5">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="1.4s" />
          </circle>
        </>
      )}

      {/* Single animated dot for data-flow (non-tainted) */}
      {!showParticles && (edgeType === "data-flow" || (tainted && !attackPathsActive)) && (
        <circle r={tainted ? 4 : 3} fill={baseColor} opacity="0.8">
          <animateMotion dur={tainted ? "2s" : "3s"} repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Edge label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              opacity,
              transition: "opacity 0.2s ease",
            }}
            className="text-[9px] bg-background/90 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground max-w-[160px] truncate"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/code-graph-page/edges/data-flow-edge.jsx
git commit -m "feat(code-graph): redesign edges with type-specific colors and taint particle animation"
```

---

### Task 6: Redesign Graph Controls with Collapse/Attack Paths/Color Theme

**Files:**
- Modify: `components/dashboard/code-graph-page/graph-controls.jsx` (full rewrite)

- [ ] **Step 1: Rewrite graph-controls.jsx**

Replace the entire content of `components/dashboard/code-graph-page/graph-controls.jsx`:

```jsx
"use client";

import React, { useState } from "react";
import { useReactFlow } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  X,
  Filter,
  LayoutGrid,
  GitBranch,
  ShieldAlert,
  ChevronsDownUp,
  ChevronsUpDown,
  Palette,
} from "lucide-react";

export function GraphControls({
  stats,
  filterType,
  setFilterType,
  filterLanguage,
  setFilterLanguage,
  searchTerm,
  setSearchTerm,
  languages = [],
  onRelayout,
  // New props for interaction layers
  onCollapseAll,
  onExpandAll,
  attackPathsActive,
  onToggleAttackPaths,
  hasVulnerabilities,
  colorMode,
  onSetColorMode,
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2 flex-wrap">
      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 bg-background/90 backdrop-blur-sm border rounded-lg p-0.5 shadow-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomIn()}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomOut()}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fitView({ padding: 0.1 })}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRelayout}>
          <LayoutGrid className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm border rounded-lg p-0.5 shadow-sm">
        {searchOpen ? (
          <>
            <Input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search nodes..."
              className="h-7 w-[160px] text-xs border-0 bg-transparent shadow-none"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSearchTerm(""); setSearchOpen(false); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSearchOpen(true)}>
            <Search className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border rounded-lg p-1 shadow-sm">
        <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-7 w-[100px] text-xs border-0 bg-transparent shadow-none">
            <SelectValue placeholder="Node type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="function">Functions</SelectItem>
            <SelectItem value="class">Classes</SelectItem>
            <SelectItem value="method">Methods</SelectItem>
            <SelectItem value="module">Modules</SelectItem>
            <SelectItem value="import">Imports</SelectItem>
          </SelectContent>
        </Select>

        {languages.length > 1 && (
          <Select value={filterLanguage} onValueChange={setFilterLanguage}>
            <SelectTrigger className="h-7 w-[100px] text-xs border-0 bg-transparent shadow-none">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All langs</SelectItem>
              {languages.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Interaction Controls */}
      <div className="flex items-center gap-0.5 bg-background/90 backdrop-blur-sm border rounded-lg p-0.5 shadow-sm">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2" onClick={onCollapseAll} title="Collapse all file groups">
          <ChevronsDownUp className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2" onClick={onExpandAll} title="Expand all file groups">
          <ChevronsUpDown className="h-3 w-3" />
        </Button>

        {hasVulnerabilities && (
          <Button
            variant={attackPathsActive ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1 px-2"
            onClick={onToggleAttackPaths}
            title="Toggle attack paths overlay"
          >
            <ShieldAlert className="h-3 w-3" />
            Attack Paths
          </Button>
        )}

        {/* Color Theme */}
        <Select value={colorMode} onValueChange={onSetColorMode}>
          <SelectTrigger className="h-7 w-[110px] text-xs border-0 bg-transparent shadow-none gap-1">
            <Palette className="h-3 w-3 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="language">By Language</SelectItem>
            <SelectItem value="type">By Type</SelectItem>
            <SelectItem value="severity">By Severity</SelectItem>
            <SelectItem value="file">By File</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex items-center gap-1.5 ml-auto bg-background/90 backdrop-blur-sm border rounded-lg px-2 py-1 shadow-sm">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {stats.totalFunctions} fn &middot; {stats.totalClasses} cls &middot; {stats.totalCallEdges} calls
          </span>
          {stats.totalDataFlowEdges > 0 && (
            <Badge className="text-[9px] px-1 py-0 h-4 bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
              {stats.totalDataFlowEdges} flows
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/code-graph-page/graph-controls.jsx
git commit -m "feat(code-graph): redesign controls with collapse/expand, attack paths toggle, color theme dropdown"
```

---

### Task 7: Rewrite Main CodeGraph Component with All Interaction Layers

This is the core integration task. It replaces the `layoutGraph` function with the ELK layout utility, registers the new node types, and wires up all four interaction layers.

**Files:**
- Modify: `components/dashboard/code-graph-page/code-graph.jsx` (full rewrite)

- [ ] **Step 1: Rewrite code-graph.jsx**

Replace the entire content of `components/dashboard/code-graph-page/code-graph.jsx`:

```jsx
"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import { CodeGraphProvider, useCodeGraph } from "@/contexts/codeGraphContext";
import { useProject } from "@/contexts/projectContext";
import FunctionNode from "./nodes/function-node";
import ModuleNode from "./nodes/module-node";
import ClassNode from "./nodes/class-node";
import FileGroupNode from "./nodes/file-group-node";
import CollapsedFileNode from "./nodes/collapsed-file-node";
import { DataFlowEdge } from "./edges/data-flow-edge";
import { GraphControls } from "./graph-controls";
import { NodeDetailPanel } from "./node-detail-panel";
import { VulnerabilityOverlay } from "./vulnerability-overlay";
import { runElkLayout } from "./elk-layout";
import { Button } from "@/components/ui/button";
import { GitBranch, Loader2, AlertCircle, RefreshCw } from "lucide-react";

const nodeTypes = {
  functionNode: FunctionNode,
  moduleNode: ModuleNode,
  classNode: ClassNode,
  fileGroupNode: FileGroupNode,
  collapsedFileNode: CollapsedFileNode,
};

const edgeTypes = {
  dataFlow: DataFlowEdge,
};

// ─── Inner Component (needs ReactFlowProvider) ───────────────────────────────

function CodeGraphInner() {
  const {
    graph,
    isBuilding,
    buildError,
    buildGraph,
    selectedNode,
    setSelectedNode,
    highlightedPath,
    highlightAttackPath,
    clearHighlight,
  } = useCodeGraph();
  const { projectStructure, fileVulnerabilities } = useProject();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Interaction layer state
  const [collapsedFiles, setCollapsedFiles] = useState(new Set());
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [attackPathsActive, setAttackPathsActive] = useState(false);
  const [colorMode, setColorMode] = useState("language");
  const [highlightedVulnId, setHighlightedVulnId] = useState(null);

  const reactFlowRef = useRef(null);

  // Flatten vulnerabilities from all files
  const allVulnerabilities = useMemo(() => {
    return Object.values(fileVulnerabilities || {}).flat();
  }, [fileVulnerabilities]);

  // Extract all project files for graph building
  const extractFiles = useCallback((structure) => {
    const files = [];
    const walk = (node, parentPath = "") => {
      if (!node) return;
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      if (node.type === "file" && node.content) {
        files.push({ path: currentPath, content: node.content });
      }
      if (node.children) {
        node.children.forEach((child) => walk(child, currentPath));
      }
    };
    if (Array.isArray(structure)) {
      structure.forEach((s) => walk(s));
    } else if (structure?.children) {
      structure.children.forEach((s) => walk(s));
    }
    return files;
  }, []);

  // Build graph when project loads
  const handleBuild = useCallback(async () => {
    if (!projectStructure) return;
    const files = extractFiles(projectStructure);
    if (files.length === 0) return;
    await buildGraph(files);
  }, [projectStructure, extractFiles, buildGraph]);

  // Auto-build on project load
  useEffect(() => {
    if (projectStructure && !graph && !isBuilding) {
      handleBuild();
    }
  }, [projectStructure, graph, isBuilding, handleBuild]);

  // Pick up highlight info when navigated from Results page
  useEffect(() => {
    if (!graph) return;
    try {
      const raw = sessionStorage.getItem("vulniq_graph_highlight");
      if (!raw) return;
      sessionStorage.removeItem("vulniq_graph_highlight");
      const detail = JSON.parse(raw);
      if (detail.graphNodeIds?.length > 0) {
        highlightAttackPath(detail.vulnId, detail.graphNodeIds);
        setHighlightedVulnId(detail.vulnId);
        setAttackPathsActive(true);
      } else if (detail.fileName) {
        const match = graph.nodes.find(
          (n) =>
            n.file === detail.fileName &&
            n.startLine <= (detail.lineNumber || 0) &&
            n.endLine >= (detail.lineNumber || 0)
        );
        if (match) {
          setSelectedNode(match);
          setTimeout(() => {
            reactFlowRef.current?.fitView({
              nodes: [{ id: match.id }],
              padding: 0.5,
              duration: 300,
            });
          }, 100);
        }
      }
    } catch {
      /* ignore */
    }
  }, [graph, highlightAttackPath, setSelectedNode]);

  // ── Compute focused set (for dimming) ──
  const focusedSet = useMemo(() => {
    if (!focusedNodeId || !graph) return null;
    const set = new Set([focusedNodeId]);
    for (const edge of graph.edges) {
      if (edge.source === focusedNodeId) set.add(edge.target);
      if (edge.target === focusedNodeId) set.add(edge.source);
    }
    return set;
  }, [focusedNodeId, graph]);

  // ── Run ELK layout when graph, filters, or collapse state change ──
  useEffect(() => {
    if (!graph) return;
    let cancelled = false;

    runElkLayout(graph.nodes, graph.edges, {
      filterType,
      filterLanguage,
      searchTerm,
      collapsedFiles,
      highlightedPath,
    }).then(({ rfNodes, rfEdges }) => {
      if (cancelled) return;

      // Inject interaction state into node data
      const toggleCollapse = (filePath) => {
        setCollapsedFiles((prev) => {
          const next = new Set(prev);
          if (next.has(filePath)) next.delete(filePath);
          else next.add(filePath);
          return next;
        });
      };

      const enrichedNodes = rfNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onToggleCollapse: toggleCollapse,
          dimmed: focusedSet ? !focusedSet.has(n.id) && !n.id.startsWith("group:") : false,
          attackPathsActive,
          colorMode,
        },
      }));

      // Inject interaction state into edge data
      const enrichedEdges = rfEdges.map((e) => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
        data: {
          ...e.data,
          dimmed: focusedSet
            ? !(focusedSet.has(e.source) && focusedSet.has(e.target))
            : false,
          attackPathsActive,
        },
      }));

      setNodes(enrichedNodes);
      setEdges(enrichedEdges);
    });

    return () => { cancelled = true; };
  }, [graph, filterType, filterLanguage, searchTerm, collapsedFiles, highlightedPath, focusedSet, attackPathsActive, colorMode, setNodes, setEdges]);

  // ── Node click: select + focus mode ──
  const onNodeClick = useCallback(
    (_, rfNode) => {
      // Don't focus on group nodes
      if (rfNode.id.startsWith("group:")) return;
      const graphNode = graph?.nodes.find((n) => n.id === rfNode.id);
      if (graphNode) {
        setSelectedNode(graphNode);
        setFocusedNodeId(graphNode.id);
      }
    },
    [graph, setSelectedNode]
  );

  // ── Click canvas to exit focus mode ──
  const onPaneClick = useCallback(() => {
    setFocusedNodeId(null);
  }, []);

  // ── Escape key to exit focus / close panel ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setFocusedNodeId(null);
        setSelectedNode(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSelectedNode]);

  // Navigate to a node (from detail panel)
  const handleNavigateToNode = useCallback(
    (node) => {
      setSelectedNode(node);
      setFocusedNodeId(node.id);
      const rfInstance = reactFlowRef.current;
      if (rfInstance) {
        rfInstance.fitView({
          nodes: [{ id: node.id }],
          padding: 0.5,
          duration: 300,
        });
      }
    },
    [setSelectedNode]
  );

  // Relayout
  const handleRelayout = useCallback(() => {
    if (!graph) return;
    // Force re-run by toggling a dummy state? No — just re-run layout.
    // The effect already depends on all relevant state, so we can trigger a fit view.
    setTimeout(() => {
      reactFlowRef.current?.fitView({ padding: 0.1, duration: 300 });
    }, 50);
  }, [graph]);

  // Collapse/Expand all
  const handleCollapseAll = useCallback(() => {
    if (!graph) return;
    const allFiles = new Set(graph.nodes.map((n) => n.file));
    setCollapsedFiles(allFiles);
  }, [graph]);

  const handleExpandAll = useCallback(() => {
    setCollapsedFiles(new Set());
  }, []);

  // Attack paths toggle
  const handleToggleAttackPaths = useCallback(() => {
    setAttackPathsActive((prev) => !prev);
    if (attackPathsActive) {
      clearHighlight();
      setHighlightedVulnId(null);
    }
  }, [attackPathsActive, clearHighlight]);

  // Vulnerability highlight
  const handleHighlightVuln = useCallback(
    (vulnId, nodeIds) => {
      setHighlightedVulnId(vulnId);
      highlightAttackPath(vulnId, nodeIds);
      setAttackPathsActive(true);
      // Fit view to show the attack path
      if (nodeIds?.length > 0) {
        setTimeout(() => {
          reactFlowRef.current?.fitView({
            nodes: nodeIds.map((id) => ({ id })),
            padding: 0.3,
            duration: 400,
          });
        }, 100);
      }
    },
    [highlightAttackPath]
  );

  const handleClearHighlight = useCallback(() => {
    setHighlightedVulnId(null);
    clearHighlight();
  }, [clearHighlight]);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
    setFocusedNodeId(null);
  }, [setSelectedNode]);

  // ── Empty / Loading / Error states (unchanged) ──

  if (!projectStructure) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <GitBranch className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <h3 className="text-lg font-semibold mb-1">No Project Loaded</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Load a project in Code Inspection to generate the code structure graph.
          </p>
        </div>
      </div>
    );
  }

  if (isBuilding) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Building code graph...</p>
      </div>
    );
  }

  if (buildError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive/60" />
        <div>
          <h3 className="text-lg font-semibold mb-1">Graph Build Failed</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-3">{buildError}</p>
          <Button variant="outline" size="sm" onClick={handleBuild} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <GitBranch className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <h3 className="text-lg font-semibold mb-1">Code Graph</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-3">
            Analyze your project&apos;s code structure, cross-file data flows, and potential vulnerability paths.
          </p>
          <Button onClick={handleBuild} className="gap-1.5">
            <GitBranch className="h-4 w-4" /> Build Graph
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        snapToGrid
        snapGrid={[20, 20]}
        onInit={(instance) => {
          reactFlowRef.current = instance;
        }}
        panOnScroll
        panOnDrag
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="hsl(var(--border) / 0.3)" />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bg-background/80 !border-border rounded-lg"
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>

      {/* Controls overlay */}
      <GraphControls
        stats={graph.stats}
        filterType={filterType}
        setFilterType={setFilterType}
        filterLanguage={filterLanguage}
        setFilterLanguage={setFilterLanguage}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        languages={graph.languages}
        onRelayout={handleRelayout}
        onCollapseAll={handleCollapseAll}
        onExpandAll={handleExpandAll}
        attackPathsActive={attackPathsActive}
        onToggleAttackPaths={handleToggleAttackPaths}
        hasVulnerabilities={allVulnerabilities.length > 0}
        colorMode={colorMode}
        onSetColorMode={setColorMode}
      />

      {/* Node detail panel */}
      <NodeDetailPanel
        node={selectedNode}
        edges={graph.edges}
        allNodes={graph.nodes}
        onClose={handleClosePanel}
        onNavigateToNode={handleNavigateToNode}
        vulnerabilities={allVulnerabilities}
      />

      {/* Vulnerability overlay */}
      {allVulnerabilities.length > 0 && (
        <VulnerabilityOverlay
          vulnerabilities={allVulnerabilities}
          highlightedVulnId={highlightedVulnId}
          onHighlight={handleHighlightVuln}
          onClear={handleClearHighlight}
          visible={attackPathsActive}
          onToggle={handleToggleAttackPaths}
        />
      )}
    </div>
  );
}

// ─── Wrapped Component ────────────────────────────────────────────────────────

export default function CodeGraph() {
  return (
    <CodeGraphProvider>
      <ReactFlowProvider>
        <CodeGraphInner />
      </ReactFlowProvider>
    </CodeGraphProvider>
  );
}
```

- [ ] **Step 2: Verify the app compiles**

Run:
```bash
npm run dev
```

Open `http://localhost:3000/demo/code-graph` in the browser. The demo project should load and display the graph with the new clustered layout and all interaction controls.

Expected: Graph renders with file group containers, function/class nodes inside groups, edges connecting nodes, control bar with collapse/expand/attack paths/color theme.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/code-graph-page/code-graph.jsx
git commit -m "feat(code-graph): rewrite main component with ELK layout and all interaction layers"
```

---

### Task 8: Remove Unused module-node.jsx

The old `module-node.jsx` is no longer used — file modules are now rendered as either `fileGroupNode` (expanded) or `collapsedFileNode` (collapsed). The `moduleNode` type is still registered in `nodeTypes` for backwards compatibility but is never generated by the new layout.

**Files:**
- Modify: `components/dashboard/code-graph-page/nodes/module-node.jsx` — keep the file but update the visual to match the new design system (in case any edge case generates it)

- [ ] **Step 1: Update module-node.jsx to use the new color stripe pattern**

Replace the entire content of `components/dashboard/code-graph-page/nodes/module-node.jsx`:

```jsx
"use client";

import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { FileCode2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LANGUAGE_COLORS } from "../elk-layout";

function ModuleNode({ data, selected }) {
  const {
    label,
    filePath,
    language,
    functionCount = 0,
    highlighted = false,
    dimmed = false,
  } = data;

  const langColors = LANGUAGE_COLORS[language] || {};

  return (
    <div
      className={cn(
        "flex rounded-lg border-2 border-dashed min-w-[180px] max-w-[300px] transition-all duration-200 overflow-hidden",
        langColors.bg || "bg-muted/20",
        langColors.border || "border-border/30",
        selected && "ring-2 ring-primary",
        highlighted && "border-amber-400 bg-amber-400/5",
        dimmed && "opacity-10"
      )}
    >
      <div className={cn("w-1 shrink-0", langColors.dot ? langColors.dot : "bg-muted-foreground")} />

      <div className="px-2.5 py-2 flex-1 min-w-0">
        <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-muted-foreground/40" />

        <div className="flex items-center gap-1.5 mb-1">
          <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold truncate">{label}</span>
        </div>

        {filePath && (
          <p className="text-[10px] text-muted-foreground font-mono truncate mb-1">{filePath}</p>
        )}

        <div className="flex items-center gap-1">
          {language && (
            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4", langColors.badge)}>
              {language}
            </Badge>
          )}
          {functionCount > 0 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
              {functionCount} fn
            </Badge>
          )}
        </div>

        <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-muted-foreground/40" />
      </div>
    </div>
  );
}

export default memo(ModuleNode);
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/code-graph-page/nodes/module-node.jsx
git commit -m "feat(code-graph): update module node to match new design system"
```

---

### Task 9: Smoke Test and Polish

**Files:** No new files — manual testing and minor fixes.

- [ ] **Step 1: Start dev server and open the demo code graph**

Run:
```bash
npm run dev
```

Navigate to `http://localhost:3000/demo/code-graph`. Wait for the graph to build.

Verify:
1. File groups appear as rounded containers with headers showing filename and language dot
2. Function nodes inside groups have a colored left stripe (cyan for entry, red for tainted, default for regular)
3. Class nodes have a purple left stripe
4. Edges render with correct colors (blue-gray for calls, dashed gray for imports, amber for data-flow)
5. Control bar shows: zoom controls, search, filters, collapse all/expand all, attack paths toggle, color theme dropdown, stats

- [ ] **Step 2: Test collapsible file clusters**

Click the chevron on a file group header — it should collapse to a pill. Click the pill's chevron — it should expand back. Click "Collapse All" in controls — all groups collapse. Click "Expand All" — all expand.

- [ ] **Step 3: Test focus mode**

Click a function node. All unrelated nodes and edges should dim to ~10% opacity. The node detail panel should open on the right. Click the canvas background — focus mode exits, all nodes return to full opacity. Press Escape — same behavior.

- [ ] **Step 4: Test attack paths overlay**

Click "Attack Paths" in controls. Taint-flow edges should show red animated particles (3 dots traveling along the path). Tainted nodes should pulse with a red glow. Non-security nodes should dim slightly. Click a vulnerability in the overlay panel — viewport should fit to show that attack path.

- [ ] **Step 5: Test color themes**

Switch color theme dropdown: "By Language" (default), "By Type", "By Severity", "By File". Node backgrounds should change accordingly.

- [ ] **Step 6: Fix any issues found during testing, then commit**

```bash
git add -A
git commit -m "fix(code-graph): polish and fix issues from smoke testing"
```
