"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Tree } from "react-arborist";
import { Input } from "@/components/ui/input";
import {
    Search,
    ChevronsDown,
    ChevronsUp,
    ChevronRight,
    ChevronDown,
    File as DefaultFileIcon,
    Folder as DefaultFolderIcon,
    FolderOpen as DefaultFolderOpen,
} from "lucide-react";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";

// ---------- CONFIG ----------
const BASE_ICON_URL = "https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons";

// "Extension" mapped to "Filename in Repo"
const EXTENSION_ALIASES = {
    js: "javascript",
    jsx: "react",
    ts: "typescript",
    tsx: "react_ts",
    mjs: "javascript",
    cjs: "javascript",
    vue: "vue",
    svelte: "svelte",
    angular: "angular",
    css: "css",
    scss: "sass",
    sass: "sass",
    less: "less",
    styl: "stylus",
    py: "python",
    pyc: "python",
    pyw: "python",
    pyx: "python",
    rb: "ruby",
    rs: "rust",
    go: "go",
    java: "java",
    php: "php",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    h: "c",
    hpp: "cpp",
    hh: "cpp",
    cc: "cpp",
    json: "json",
    jsonc: "json",
    json5: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "yaml",
    env: "tune",
    lock: "lock",
    md: "markdown",
    mdx: "markdown",
    txt: "document",
    pdf: "pdf",
    zip: "zip",
    rar: "zip",
    "7z": "zip",
    tar: "zip",
    gz: "zip",
    png: "image",
    jpg: "image",
    jpeg: "image",
    gif: "image",
    webp: "image",
    bmp: "image",
    tiff: "image",
    svg: "svg",
    ico: "image",
    sh: "console",
    bash: "console",
    zsh: "console",
    bat: "console",
    cmd: "console",
    ps1: "console",
    exe: "exe",
    // Web
    html: "html",
    htm: "html",
    xhtml: "html",
    // Config
    ini: "settings",
    cfg: "settings",
    conf: "settings",
    config: "settings",
    properties: "settings",
    // Data
    sql: "database",
    sqlite: "database",
    db: "database",
    csv: "document",
    tsv: "document",
    log: "document",
    // Languages
    kt: "kotlin",
    kts: "kotlin",
    swift: "swift",
    dart: "dart",
    r: "r",
    R: "r",
    lua: "lua",
    pl: "perl",
    pm: "perl",
    ex: "elixir",
    exs: "elixir",
    erl: "erlang",
    hs: "haskell",
    scala: "scala",
    clj: "clojure",
    groovy: "groovy",
    gradle: "gradle",
    m: "objective-c",
    mm: "objective-c",
    // Markup / templates
    pug: "pug",
    jade: "pug",
    ejs: "ejs",
    hbs: "handlebars",
    mustache: "handlebars",
    njk: "nunjucks",
    twig: "twig",
    // GraphQL
    graphql: "graphql",
    gql: "graphql",
    // Prisma
    prisma: "prisma",
    // Docker
    dockerignore: "docker",
    // Terraform / infra
    tf: "terraform",
    tfvars: "terraform",
    hcl: "terraform",
    // Misc
    wasm: "wasm",
    proto: "protobuf",
    makefile: "makefile",
    cmake: "cmake",
    diff: "diff",
    patch: "diff",
};

// ---------- HELPER: URL GENERATORS ----------
const getFolderUrl = (name, open) => {
    return `${BASE_ICON_URL}/folder-${name.toLowerCase()}${open ? "-open" : ""}.svg`;
};

const getGenericFolderUrl = (open) => {
    return `${BASE_ICON_URL}/folder${open ? "-open" : ""}.svg`;
};

const getFileUrl = (name) => {
    const lowerName = name.toLowerCase();

    // Special full-name matches
    const SPECIAL_FILES = {
        "package.json": "nodejs",
        "package-lock.json": "nodejs",
        "favicon.ico": "favicon",
        ".gitignore": "git",
        ".gitattributes": "git",
        ".gitmodules": "git",
        "readme.md": "readme",
        "readme": "readme",
        "dockerfile": "docker",
        "docker-compose.yml": "docker",
        "docker-compose.yaml": "docker",
        ".dockerignore": "docker",
        "license": "license",
        "license.md": "license",
        "license.txt": "license",
        "jenkinsfile": "jenkins",
        ".editorconfig": "editorconfig",
        ".prettierrc": "prettier",
        ".prettierrc.json": "prettier",
        ".prettierrc.js": "prettier",
        ".prettierrc.cjs": "prettier",
        "prettier.config.js": "prettier",
        ".eslintrc": "eslint",
        ".eslintrc.js": "eslint",
        ".eslintrc.json": "eslint",
        ".eslintrc.cjs": "eslint",
        "eslint.config.js": "eslint",
        "eslint.config.mjs": "eslint",
        "eslint.config.cjs": "eslint",
        ".babelrc": "babel",
        "babel.config.js": "babel",
        "babel.config.json": "babel",
        "tsconfig.json": "tsconfig",
        "jsconfig.json": "jsconfig",
        "webpack.config.js": "webpack",
        "webpack.config.ts": "webpack",
        "rollup.config.js": "rollup",
        "rollup.config.ts": "rollup",
        "vite.config.js": "vite",
        "vite.config.ts": "vite",
        "next.config.js": "next",
        "next.config.mjs": "next",
        "next.config.ts": "next",
        "nuxt.config.js": "nuxt",
        "nuxt.config.ts": "nuxt",
        "tailwind.config.js": "tailwindcss",
        "tailwind.config.ts": "tailwindcss",
        "postcss.config.js": "postcss",
        "postcss.config.mjs": "postcss",
        "postcss.config.cjs": "postcss",
        ".env": "tune",
        ".env.local": "tune",
        ".env.development": "tune",
        ".env.production": "tune",
        ".env.test": "tune",
        "makefile": "makefile",
        "cmakelists.txt": "cmake",
        "gemfile": "ruby",
        "rakefile": "ruby",
        "cargo.toml": "rust",
        "cargo.lock": "rust",
        "go.mod": "go",
        "go.sum": "go",
        "requirements.txt": "python",
        "pipfile": "python",
        "setup.py": "python",
        "pyproject.toml": "python",
        "composer.json": "php",
        "pom.xml": "maven",
        "build.gradle": "gradle",
        ".npmrc": "npm",
        ".nvmrc": "nodejs",
        ".yarnrc": "yarn",
        "yarn.lock": "yarn",
        "pnpm-lock.yaml": "pnpm",
        ".browserslistrc": "browserlist",
        "vercel.json": "vercel",
        "netlify.toml": "netlify",
        ".travis.yml": "travis",
        "sonar-project.properties": "sonar",
        "prisma.config.ts": "prisma",
    };

    const specialIcon = SPECIAL_FILES[lowerName];
    if (specialIcon) return `${BASE_ICON_URL}/${specialIcon}.svg`;

    const parts = lowerName.split(".");
    const ext = parts.length > 1 ? parts.pop() : "";

    // No extension → generic file icon (don't try to load an empty icon name)
    if (!ext) return null;

    const iconName = EXTENSION_ALIASES[ext] || ext;
    return `${BASE_ICON_URL}/${iconName}.svg`;
};

// Stable style objects to avoid re-creating on every render
const STYLE_HIDDEN = { display: "none" };
const STYLE_VISIBLE = { display: "block" };

// Module-level cache: tracks which icon URLs have failed so we never re-fetch them.
// Persists across re-renders and re-mounts for the lifetime of the page.
const failedUrlCache = new Set();
const loadedUrlCache = new Set();

/** Check if a URL is known-bad before even rendering an <img> */
const isUrlFailed = (url) => url && failedUrlCache.has(url);
const markUrlFailed = (url) => { if (url) failedUrlCache.add(url); };
const markUrlLoaded = (url) => { if (url) loadedUrlCache.add(url); };

// ---------- COMPONENT: SMART FILE ICON ----------
const SmartFileIcon = React.memo(function SmartFileIcon({ name, isDir, isOpen }) {
    // Memoize URLs so they don't recompute on every render
    const closedSrc = useMemo(() => isDir ? getFolderUrl(name, false) : null, [name, isDir]);
    const openSrc = useMemo(() => isDir ? getFolderUrl(name, true) : null, [name, isDir]);
    const genericClosedSrc = useMemo(() => isDir ? getGenericFolderUrl(false) : null, [isDir]);
    const genericOpenSrc = useMemo(() => isDir ? getGenericFolderUrl(true) : null, [isDir]);
    const fileUrl = useMemo(() => !isDir ? getFileUrl(name) : null, [name, isDir]);

    // Determine initial error state from cache — avoids a render cycle
    const initialError = useMemo(() => {
        if (isDir) {
            // For folders: if both specific AND generic URLs are failed, use Lucide
            const closedFailed = isUrlFailed(closedSrc) && isUrlFailed(genericClosedSrc);
            const openFailed = isUrlFailed(openSrc) && isUrlFailed(genericOpenSrc);
            return closedFailed && openFailed;
        }
        // For files: if URL is null or failed, use Lucide
        return !fileUrl || isUrlFailed(fileUrl);
    }, [isDir, closedSrc, openSrc, genericClosedSrc, genericOpenSrc, fileUrl]);

    const [error, setError] = useState(initialError);
    const prevKeyRef = useRef(`${name}-${isDir}`);

    // Only reset error when the identity of the icon actually changes
    useEffect(() => {
        const key = `${name}-${isDir}`;
        if (prevKeyRef.current !== key) {
            prevKeyRef.current = key;
            // Recompute from cache for the new name
            if (isDir) {
                const newClosedSrc = getFolderUrl(name, false);
                const newOpenSrc = getFolderUrl(name, true);
                const newGenClosed = getGenericFolderUrl(false);
                const newGenOpen = getGenericFolderUrl(true);
                const allFailed = (isUrlFailed(newClosedSrc) && isUrlFailed(newGenClosed)) &&
                                  (isUrlFailed(newOpenSrc) && isUrlFailed(newGenOpen));
                setError(allFailed);
            } else {
                const newFileUrl = getFileUrl(name);
                setError(!newFileUrl || isUrlFailed(newFileUrl));
            }
        }
    }, [name, isDir]);

    // Stable error handlers
    const handleFolderError = useCallback((e) => {
        const src = e.target.src;
        markUrlFailed(src);
        // If the specific folder icon failed, try the generic one
        if (!src.endsWith("/folder.svg") && !src.endsWith("/folder-open.svg")) {
            const isOpenImg = e.target.getAttribute("data-state") === "open";
            const generic = getGenericFolderUrl(isOpenImg);
            if (!isUrlFailed(generic)) {
                e.target.src = generic;
                return;
            }
        }
        // Generic also failed — fall back to Lucide
        setError(true);
    }, []);

    const handleFileError = useCallback((e) => {
        markUrlFailed(e.target.src);
        setError(true);
    }, []);

    const handleLoad = useCallback((e) => {
        markUrlLoaded(e.target.src);
    }, []);

    if (error) {
        if (isDir) {
            return isOpen ? (
                <DefaultFolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
                <DefaultFolderIcon className="w-4 h-4 text-blue-500" />
            );
        }
        return <DefaultFileIcon className="w-4 h-4 text-muted-foreground" />;
    }

    if (isDir) {
        // If the specific URL is already known-bad, start with generic directly
        const actualClosedSrc = isUrlFailed(closedSrc) ? genericClosedSrc : closedSrc;
        const actualOpenSrc = isUrlFailed(openSrc) ? genericOpenSrc : openSrc;

        return (
            <>
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic icon URL from API */}
                <img
                    src={actualClosedSrc}
                    alt={name}
                    data-state="closed"
                    className="w-4 h-4 object-contain"
                    style={isOpen ? STYLE_HIDDEN : STYLE_VISIBLE}
                    onError={handleFolderError}
                    onLoad={handleLoad}
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic icon URL from API */}
                <img
                    src={actualOpenSrc}
                    alt={name}
                    data-state="open"
                    className="w-4 h-4 object-contain"
                    style={isOpen ? STYLE_VISIBLE : STYLE_HIDDEN}
                    onError={handleFolderError}
                    onLoad={handleLoad}
                />
            </>
        );
    }

    // For files: if getFileUrl returns null (no extension, no special match), show generic icon
    if (!fileUrl) {
        return <DefaultFileIcon className="w-4 h-4 text-muted-foreground" />;
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element -- dynamic icon URL from API
        <img
            src={fileUrl}
            alt={name}
            className="w-4 h-4 object-contain"
            onError={handleFileError}
            onLoad={handleLoad}
        />
    );
});

// ---------- HELPERS ----------
// IMPORTANT: ID must be unique. Prefer Path > ID > Name
const getId = (item) => item.path || item.id || item.name;

function filterTree(items, q) {
    if (!q) return items;
    const lower = q.toLowerCase();
    const matches = [];
    for (const it of items) {
        const name = it.name || "";
        const children = Array.isArray(it.children) ? filterTree(it.children, q) : undefined;
        if (name.toLowerCase().includes(lower) || (children && children.length > 0)) {
            matches.push({ ...it, children: children || it.children });
        }
    }
    return matches;
}

// ---------- ROW COMPONENT ----------
const TreeRow = React.memo(function TreeRow({ node, style, showCheckboxes, checked, toggleCheck, onItemClick }) {
    const item = node.data;
    const id = getId(item);
    const hasChildren = item.children && item.children.length > 0;
    const isFolder = Array.isArray(item.children) || item.isFolder;
    const isOpen = node.isOpen;

    return (
        <div
            style={style}
            className={`flex items-center px-2 text-sm cursor-pointer select-none transition-colors hover:bg-muted/30 group ${
                node.isSelected ? "bg-muted/40" : ""
            }`}
            onClick={() => {
                if (hasChildren) {
                    node.toggle();
                } else {
                    node.select();
                }
            }}
        >
            {/* --- TOGGLE ARROW ICON --- */}
            <div
                className={`flex items-center justify-center w-4 h-4 mr-1 rounded-sm ${
                    hasChildren ? "hover:bg-black/10 dark:hover:bg-white/10" : ""
                }`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (hasChildren) node.toggle();
                }}
            >
                {/* Only show arrow if it is a folder AND has children */}
                {isFolder && hasChildren ? (
                    isOpen ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground pointer-events-none" />
                    ) : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground pointer-events-none" />
                    )
                ) : (
                    // Spacer for alignment if no arrow (files or empty folders)
                    <span className="w-3 h-3" />
                )}
            </div>

            {/* FILE/FOLDER ICON */}
            <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 mr-2">
                <SmartFileIcon name={item.name} isDir={isFolder} isOpen={isOpen} />
            </div>

            {/* CHECKBOX */}
            {showCheckboxes && (
                <input
                    type="checkbox"
                    checked={checked.has(id)}
                    onChange={(e) => {
                        e.stopPropagation();
                        toggleCheck(item);
                    }}
                    className="mr-2"
                />
            )}

            {/* NAME */}
            <span className="truncate flex-1 text-muted-foreground group-hover:text-foreground">
                {item.name}
            </span>
        </div>
    );
}, (prev, next) => {
    // Custom comparator: skip re-render if the visible data hasn't changed.
    // The `node` wrapper from react-arborist is a new object on every Tree render,
    // but the underlying data, open/selected state, and style are what matter.
    const pn = prev.node;
    const nn = next.node;
    return (
        pn.data === nn.data &&
        pn.isOpen === nn.isOpen &&
        pn.isSelected === nn.isSelected &&
        prev.style === next.style &&
        prev.showCheckboxes === next.showCheckboxes &&
        prev.checked === next.checked &&
        prev.toggleCheck === next.toggleCheck &&
        prev.onItemClick === next.onItemClick
    );
});

// ---------- MAIN COMPONENT ----------
const TreeView = forwardRef(function TreeView({
                             data = [],
                             title,
                             showCheckboxes = false,
                             showExpandAll = false,
                             searchPlaceholder = "Search...",
                             onCheckChange = () => {},
                             onItemClick = () => {},
                             className = "",
                         }, ref) {
    const [query, setQuery] = useState("");
    const [checked, setChecked] = useState(new Set());
    const [treeHeight, setTreeHeight] = useState(400); // Default height
    const treeRef = useRef();
    const treeContainerRef = useRef();
    const lastHeightRef = useRef(400);
    const rafRef = useRef(null);

    const filtered = useMemo(() => filterTree(data, query), [data, query]);

    // Track container height with resize observer — throttled to avoid re-render storms during drag
    useEffect(() => {
        const container = treeContainerRef.current;
        if (!container) return;

        const updateHeight = () => {
            const rect = container.getBoundingClientRect();
            if (rect.height > 0 && Math.abs(rect.height - lastHeightRef.current) > 2) {
                lastHeightRef.current = rect.height;
                setTreeHeight(rect.height);
            }
        };

        // Initial measurement
        updateHeight();

        const resizeObserver = new ResizeObserver(() => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updateHeight);
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const toggleCheck = useCallback((item) => {
        const id = getId(item);
        setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            onCheckChange(item, next.has(id));
            return next;
        });
    }, [onCheckChange]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        openAll: () => treeRef.current?.openAll && treeRef.current.openAll(),
        closeAll: () => treeRef.current?.closeAll && treeRef.current.closeAll(),
    }), []);

    // Stable render callback to avoid re-creating on every parent re-render
    const renderRow = useCallback(({ node, style }) => (
        <TreeRow
            node={node}
            style={style}
            showCheckboxes={showCheckboxes}
            checked={checked}
            toggleCheck={toggleCheck}
            onItemClick={onItemClick}
        />
    ), [showCheckboxes, checked, toggleCheck, onItemClick]);

    return (
        <div className={`flex flex-col h-full min-h-0 overflow-hidden ${className}`}>
            {/* HEADER */}
            {(title || showExpandAll) && (
                <div className="flex items-center justify-between px-2 pb-2 pt-2 shrink-0">
                    <div className="text-sm font-medium">{title}</div>
                    {showExpandAll && (
                        <TooltipProvider>
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="p-2 rounded hover:bg-muted/20"
                                            onClick={() => treeRef.current?.openAll()}
                                        >
                                            <ChevronsDown className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Expand all</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="p-2 rounded hover:bg-muted/20"
                                            onClick={() => treeRef.current?.closeAll()}
                                        >
                                            <ChevronsUp className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Collapse all</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    )}
                </div>
            )}

            {/* SEARCH */}
            <div className="px-2 pb-2 shrink-0">
                <div className="relative flex items-center">
                    <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-8 h-8"
                    />
                </div>
            </div>

            {/* TREE - uses measured height to fill container, scrolls internally */}
            <div ref={treeContainerRef} className="flex-1 min-h-0 overflow-hidden">
                <Tree
                    data={filtered}
                    width="100%"
                    height={treeHeight}
                    childrenAccessor="children"
                    idAccessor={getId}
                    rowHeight={28}
                    padding={4}
                    indent={20}
                    ref={instance => { treeRef.current = instance; }}
                    className="h-full w-full [&>div]:scrollbar-thin [&>div]:overflow-auto"
                    dndRootElement={null}
                    overscanCount={5}
                    initialOpenState="all"
                    onSelect={(nodes) => {
                        const node = nodes[0];
                        if (node) {
                            if (!Array.isArray(node.data.children)) {
                                onItemClick(node.data);
                            }
                        }
                    }}
                >
                    {renderRow}
                </Tree>
            </div>
        </div>
    );
});

export default TreeView;

