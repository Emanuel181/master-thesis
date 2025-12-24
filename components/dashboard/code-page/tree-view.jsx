"use client";

import React, { useMemo, useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Tree } from "react-arborist";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    json: "json",
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
    svg: "svg",
    ico: "image",
    sh: "console",
    bash: "console",
    zsh: "console",
    bat: "console",
    cmd: "console",
    exe: "exe",
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
    if (lowerName === "package.json") return `${BASE_ICON_URL}/nodejs.svg`;
    if (lowerName === "favicon.ico") return `${BASE_ICON_URL}/favicon.svg`;
    if (lowerName === ".gitignore") return `${BASE_ICON_URL}/git.svg`;
    if (lowerName === "readme.md") return `${BASE_ICON_URL}/readme.svg`;
    if (lowerName === "dockerfile") return `${BASE_ICON_URL}/docker.svg`;
    if (lowerName === "license") return `${BASE_ICON_URL}/license.svg`;
    if (lowerName === "jenkinsfile") return `${BASE_ICON_URL}/jenkins.svg`;

    const parts = lowerName.split(".");
    const ext = parts.length > 1 ? parts.pop() : "";
    const iconName = EXTENSION_ALIASES[ext] || ext;
    return `${BASE_ICON_URL}/${iconName}.svg`;
};

// ---------- COMPONENT: SMART FILE ICON ----------
const SmartFileIcon = ({ name, isDir, isOpen }) => {
    const [error, setError] = useState(false);

    useEffect(() => {
        // Reset error asynchronously to avoid triggering sync state updates during render/effect
        const t = setTimeout(() => setError(false), 0);
        return () => clearTimeout(t);
    }, [name, isDir]);

    if (error) {
        if (isDir) {
            return isOpen ? (
                <DefaultFolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
                <DefaultFolderIcon className="w-4 h-4 text-blue-500" />
            );
        }
        return <DefaultFileIcon className="w-4 h-4 text-gray-400" />;
    }

    if (isDir) {
        const closedSrc = getFolderUrl(name, false);
        const openSrc = getFolderUrl(name, true);

        const handleFolderError = (e) => {
            if (
                !e.target.src.includes("/folder.svg") &&
                !e.target.src.includes("/folder-open.svg")
            ) {
                const isOpenImg = e.target.getAttribute("data-state") === "open";
                e.target.src = getGenericFolderUrl(isOpenImg);
            } else {
                setError(true);
            }
        };

        return (
            <>
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic icon URL from API */}
                <img
                    src={closedSrc}
                    alt={name}
                    data-state="closed"
                    className="w-4 h-4 object-contain"
                    style={{ display: isOpen ? "none" : "block" }}
                    onError={handleFolderError}
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic icon URL from API */}
                <img
                    src={openSrc}
                    alt={name}
                    data-state="open"
                    className="w-4 h-4 object-contain"
                    style={{ display: isOpen ? "block" : "none" }}
                    onError={handleFolderError}
                />
            </>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element -- dynamic icon URL from API
        <img
            src={getFileUrl(name)}
            alt={name}
            className="w-4 h-4 object-contain"
            onError={() => setError(true)}
        />
    );
};

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
    const treeRef = useRef();

    const filtered = useMemo(() => filterTree(data, query), [data, query]);

    const toggleCheck = (item) => {
        const id = getId(item);
        setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            onCheckChange(item, next.has(id));
            return next;
        });
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        openAll: () => treeRef.current?.openAll && treeRef.current.openAll(),
        closeAll: () => treeRef.current?.closeAll && treeRef.current.closeAll(),
    }), []);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* HEADER */}
            {(title || showExpandAll) && (
                <div className="flex items-center justify-between px-2 pb-2 pt-2">
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
            <div className="px-2 pb-2">
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

            {/* TREE with ScrollArea */}
            <ScrollArea className="flex-1 min-h-0">
                <Tree
                    data={filtered}
                    width="100%"
                    height={800}
                    childrenAccessor="children"
                    idAccessor={getId}
                    rowHeight={28}
                    padding={4}
                    indent={20}
                    ref={instance => { treeRef.current = instance; }}
                    className="h-full w-full"
                    dndRootElement={null}
                    onSelect={(nodes) => {
                        const node = nodes[0];
                        if (node) {
                            if (!Array.isArray(node.data.children)) {
                                onItemClick(node.data);
                            }
                        }
                    }}
                >
                    {({ node, style }) => {
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
                    }}
                </Tree>
            </ScrollArea>
        </div>
    );
});

export default TreeView;

