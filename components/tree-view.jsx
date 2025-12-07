"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Tree } from "react-arborist";
import { Input } from "@/components/ui/input";
import {
    Search,
    ChevronsDown,
    ChevronsUp,
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
    // JavaScript / React
    js: "javascript",
    jsx: "react",        // JSX gets the React Atom icon
    ts: "typescript",
    tsx: "react_ts",     // TSX gets the React + TS icon
    mjs: "javascript",
    cjs: "javascript",
    vue: "vue",
    svelte: "svelte",
    angular: "angular",

    // Styles
    css: "css",
    scss: "sass",
    sass: "sass",
    less: "less",
    styl: "stylus",

    // Backend / Systems
    py: "python",
    rb: "ruby",
    rs: "rust",
    go: "go",
    java: "java",
    php: "php",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    h: "c",            // Header files
    hpp: "cpp",

    // Data / Config
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "yaml",      // Fallback
    env: "tune",       // .env usually uses the 'tune' settings icon
    lock: "lock",      // Generic lock

    // Documents / Assets
    md: "markdown",
    mdx: "markdown",
    txt: "document",   // "txt.svg" doesn't exist, mapped to "document.svg"
    pdf: "pdf",
    zip: "zip",
    rar: "zip",
    "7z": "zip",
    tar: "zip",
    gz: "zip",

    // Images
    png: "image",
    jpg: "image",
    jpeg: "image",
    svg: "svg",
    ico: "image",

    // Shell / Executables
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

    // 1. Check exact filenames first (highest priority)
    if (lowerName === "package.json") return `${BASE_ICON_URL}/nodejs.svg`;
    if (lowerName === "favicon.ico") return `${BASE_ICON_URL}/favicon.svg`;
    if (lowerName === ".gitignore") return `${BASE_ICON_URL}/git.svg`;
    if (lowerName === "readme.md") return `${BASE_ICON_URL}/readme.svg`;
    if (lowerName === "dockerfile") return `${BASE_ICON_URL}/docker.svg`;
    if (lowerName === "license") return `${BASE_ICON_URL}/license.svg`;
    if (lowerName === "jenkinsfile") return `${BASE_ICON_URL}/jenkins.svg`;

    // 2. Check Extension
    const parts = lowerName.split(".");
    const ext = parts.length > 1 ? parts.pop() : ""; // get last part

    // 3. Translate extension using Alias Map, or use extension as-is
    const iconName = EXTENSION_ALIASES[ext] || ext;

    return `${BASE_ICON_URL}/${iconName}.svg`;
};

// ---------- COMPONENT: SMART FILE ICON ----------
const SmartFileIcon = ({ name, isDir, isOpen }) => {
    const [error, setError] = useState(false);

    // Reset error if name changes
    useEffect(() => {
        setError(false);
    }, [name, isDir]);

    // Fallback to Lucide if image fails to load
    if (error) {
        if (isDir) {
            return isOpen ?
                <DefaultFolderOpen className="w-4 h-4 text-blue-500" /> :
                <DefaultFolderIcon className="w-4 h-4 text-blue-500" />;
        }
        return <DefaultFileIcon className="w-4 h-4 text-gray-400" />;
    }

    // --- FOLDER LOGIC (Anti-Flicker) ---
    if (isDir) {
        const closedSrc = getFolderUrl(name, false);
        const openSrc = getFolderUrl(name, true);

        const handleFolderError = (e) => {
            // If specific folder icon fails, switch to generic folder
            if (!e.target.src.includes("/folder.svg") && !e.target.src.includes("/folder-open.svg")) {
                const isOpenImg = e.target.getAttribute("data-state") === "open";
                e.target.src = getGenericFolderUrl(isOpenImg);
            } else {
                setError(true);
            }
        };

        return (
            <>
                <img
                    src={closedSrc}
                    alt={name}
                    data-state="closed"
                    className="w-4 h-4 object-contain"
                    style={{ display: isOpen ? "none" : "block" }}
                    onError={handleFolderError}
                />
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

    // --- FILE LOGIC ---
    return (
        <img
            src={getFileUrl(name)}
            alt={name}
            className="w-4 h-4 object-contain"
            onError={() => setError(true)}
        />
    );
};

// ---------- HELPERS ----------
const getId = (item) => item.id || item.path || item.key || item.name;

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
export function TreeView({
                             data = [],
                             title,
                             showCheckboxes = false,
                             showExpandAll = false,
                             searchPlaceholder = "Search...",
                             onCheckChange = () => {},
                             onItemClick = () => {},
                             className = "",
                         }) {
    const [query, setQuery] = useState("");
    const [checked, setChecked] = useState(new Set());

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

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* HEADER */}
            {(title || showExpandAll) && (
                <div className="flex items-center justify-between px-2 pb-2">
                    <div className="text-sm font-medium">{title}</div>
                    {showExpandAll && (
                        <TooltipProvider>
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="p-2 rounded hover:bg-muted/20" onClick={() => window.__treeRef?.openAll()}>
                                            <ChevronsDown className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Expand all</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="p-2 rounded hover:bg-muted/20" onClick={() => window.__treeRef?.closeAll()}>
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

            {/* TREE */}
            <div className="flex-1 overflow-hidden">
                <Tree
                    data={filtered}
                    width="100%"
                    childrenAccessor="children"
                    idAccessor={getId}
                    rowHeight={28}
                    padding={4}
                    indent={20}
                    ref={(r) => (window.__treeRef = r)}
                    onSelect={(nodes) => {
                        const node = nodes[0];
                        if (node && !Array.isArray(node.data.children)) {
                            onItemClick(node.data);
                        }
                    }}
                >
                    {({ node, style }) => {
                        const item = node.data;
                        const id = getId(item);
                        const isDir = Array.isArray(item.children) || item.isFolder;
                        const isOpen = node.isOpen;

                        return (
                            <div
                                style={style}
                                className="flex items-center gap-2 px-2 text-sm cursor-pointer select-none hover:bg-muted/30 group"
                                onClick={() => node.toggle()}
                            >
                                {/* ICON */}
                                <div className="flex-shrink-0 flex items-center justify-center w-5 h-5">
                                    <SmartFileIcon name={item.name} isDir={isDir} isOpen={isOpen} />
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
                                        className="mr-1"
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
            </div>
        </div>
    );
}

export default TreeView;