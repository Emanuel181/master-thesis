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
    ShieldAlert,
} from "lucide-react";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { useProject } from "@/contexts/projectContext";
import { getFileVulnSummary, getFolderVulnSummary } from "./hooks/use-vulnerability-decorations";

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

// Known folder names that exist in vscode-material-icon-theme.
// Only these will attempt a specific folder icon fetch; all others use Lucide fallback.
const KNOWN_FOLDER_ICONS = new Set([
    "admin", "android", "angular", "animation", "ansible", "api", "apollo", "app",
    "archive", "astro", "atom", "attachment", "audio", "aurelia", "aws", "azure-pipelines",
    "backup", "base", "batch", "benchmark", "bibliography", "bicep", "blender", "bloc",
    "bower", "buildkite", "cart", "changesets", "ci", "circleci", "class", "claude",
    "client", "cline", "cloud-functions", "cloudflare", "cluster", "cobol", "command",
    "components", "config", "connection", "console", "constant", "container", "content",
    "context", "contract", "controller", "core", "coverage", "css", "cue", "cursor",
    "custom", "cypress", "dal", "dart", "database", "debug", "decorators", "delta",
    "desktop", "directive", "dist", "docker", "docs", "download", "drizzle", "dump",
    "element", "enum", "environment", "error", "eslint", "event", "examples", "expo",
    "export", "fastlane", "favicon", "features", "filter", "firebase", "firestore",
    "flow", "flutter", "font", "forgejo", "form", "functions", "gamemaker", "gemini-ai",
    "generator", "gh-workflows", "git", "gitea", "github", "gitlab", "global", "godot",
    "gradle", "graphql", "guard", "gulp", "helm", "helper", "home", "hook", "husky",
    "i18n", "images", "import", "include", "input", "intellij", "interceptor", "interface",
    "ios", "java", "javascript", "jinja", "job", "json", "jupyter", "keys", "kubernetes",
    "kusto", "layout", "lefthook", "less", "lib", "license", "link", "linux", "liquibase",
    "log", "lottie", "lua", "luau", "macos", "mail", "mappings", "markdown", "mercurial",
    "messages", "meta", "metro", "middleware", "migrations", "mjml", "mobile", "mock",
    "mojo", "molecule", "moon", "netlify", "next", "nginx", "ngrx-store", "node", "nuxt",
    "obsidian", "organism", "other", "packages", "pdf", "pdm", "php", "phpmailer", "pipe",
    "plastic", "plugin", "policy", "powershell", "prisma", "private", "project", "prompts",
    "proto", "public", "python", "pytorch", "quasar", "queue", "r", "react-components",
    "redux-reducer", "repository", "resolver", "resource", "review", "robot", "routes",
    "rules", "rust", "salt", "sandbox", "sass", "scala", "scons", "scripts", "secure",
    "seeders", "server", "serverless", "shader", "shared", "simulations", "snapcraft",
    "snippet", "src", "src-tauri", "stack", "stencil", "store", "storybook", "stylus",
    "sublime", "supabase", "svelte", "svg", "syntax", "target", "taskfile", "tasks",
    "television", "temp", "template", "terraform", "test", "theme", "toc", "tools",
    "trash", "trigger", "turborepo", "typescript", "ui", "unity", "update", "upload",
    "utils", "vercel", "verdaccio", "video", "views", "vm", "vscode", "vue",
    "vue-directives", "vuepress", "vuex-store", "wakatime", "webpack", "windows",
    "wordpress", "yarn", "zeabur",
]);

// ---------- HELPER: URL GENERATORS ----------
const getFolderUrl = (name, open) => {
    const lower = name.toLowerCase();
    if (!KNOWN_FOLDER_ICONS.has(lower)) return null;
    return `${BASE_ICON_URL}/folder-${lower}${open ? "-open" : ""}.svg`;
};

// Known file icon names that exist in vscode-material-icon-theme.
// Used to validate that an icon URL will resolve before attempting to fetch it.
const KNOWN_FILE_ICONS = new Set([
    "3d", "abap", "abc", "actionscript", "ada", "adobe-illustrator", "adobe-photoshop",
    "adobe-swc", "adonis", "advpl", "amplify", "android", "angular", "antlr", "apiblueprint",
    "apollo", "applescript", "apps-script", "appveyor", "architecture", "arduino", "asciidoc",
    "assembly", "astro", "astro-config", "astyle", "audio", "aurelia", "authors", "auto",
    "autohotkey", "autoit", "azure", "azure-pipelines", "babel", "ballerina", "bashly",
    "bashly-hook", "bazel", "bbx", "beancount", "bench-js", "bench-jsx", "bench-ts",
    "bibliography", "bibtex-style", "bicep", "biome", "bitbucket", "bithound", "blender",
    "blink", "blitz", "bower", "brainfuck", "browserlist", "bruno", "buck", "bucklescript",
    "buildkite", "bun", "c", "c3", "cabal", "caddy", "cadence", "cairo", "cake", "capacitor",
    "capnp", "cbx", "cds", "certificate", "changelog", "chess", "chromatic", "chrome",
    "circleci", "citation", "clangd", "claude", "cline", "clojure", "cloudfoundry", "cmake",
    "coala", "cobol", "coconut", "code-climate", "codecov", "codeowners", "coderabbit-ai",
    "coffee", "coldfusion", "coloredpetrinets", "command", "commitizen", "commitlint",
    "concourse", "conduct", "console", "contentlayer", "context", "contributing", "controller",
    "copilot", "cpp", "craco", "credits", "crystal", "csharp", "css", "css-map", "cucumber",
    "cuda", "cue", "cursor", "cypress", "d", "dart", "dart_generated", "database", "deepsource",
    "denizenscript", "deno", "dependabot", "dependencies-update", "dhall", "diff", "dinophp",
    "disc", "django", "dll", "docker", "doctex-installer", "document", "dotjs", "drawio",
    "drizzle", "drone", "duc", "dune", "edge", "editorconfig", "ejs", "elixir", "elm", "email",
    "ember", "epub", "erlang", "esbuild", "eslint", "excalidraw", "exe", "fastlane", "favicon",
    "figma", "firebase", "flash", "flow", "font", "forth", "fortran", "foxpro", "freemarker",
    "fsharp", "fusebox", "gamemaker", "garden", "gatsby", "gcp", "gemfile", "gemini",
    "gemini-ai", "git", "github-actions-workflow", "github-sponsors", "gitlab", "gitpod",
    "gleam", "gnuplot", "go", "go-mod", "go_gopher", "godot", "godot-assets", "google",
    "gradle", "grafana-alloy", "grain", "graphcool", "graphql", "gridsome", "groovy", "grunt",
    "gulp", "h", "hack", "hadolint", "haml", "handlebars", "happo", "hardhat", "harmonix",
    "haskell", "haxe", "hcl", "helm", "heroku", "hex", "histoire", "hjson", "horusec", "hosts",
    "hpp", "html", "http", "huff", "hurl", "husky", "i18n", "idris", "ifanr-cloud", "image",
    "imba", "installation", "ionic", "istanbul", "jar", "java", "javaclass", "javascript",
    "javascript-map", "jenkins", "jest", "jinja", "jsconfig", "json", "json_schema", "jsr",
    "julia", "jupyter", "just", "karma", "kcl", "key", "keystatic", "kivy", "kl", "knip",
    "kotlin", "kubernetes", "kusto", "label", "laravel", "latexmk", "lbx", "lean", "lefthook",
    "lerna", "less", "liara", "lib", "license", "lighthouse", "lilypond", "lintstaged", "liquid",
    "lisp", "livescript", "lock", "log", "lolcode", "lottie", "lua", "luau", "lynx", "lyric",
    "macaulay2", "makefile", "markdoc", "markdoc-config", "markdown", "markdownlint", "markojs",
    "mathematica", "matlab", "maven", "mdsvex", "mdx", "mercurial", "merlin", "mermaid", "meson",
    "metro", "minecraft", "minecraft-fabric", "mint", "mjml", "mocha", "modernizr", "mojo",
    "moon", "moonscript", "mxml", "nano-staged", "ndst", "nest", "netlify", "next", "nginx",
    "ngrx-actions", "ngrx-effects", "ngrx-entity", "ngrx-reducer", "ngrx-selectors",
    "ngrx-state", "nim", "nix", "nodejs", "nodejs_alt", "nodemon", "npm", "nuget", "nunjucks",
    "nuxt", "nx", "objective-c", "objective-cpp", "ocaml", "odin", "onnx", "opa", "opam",
    "openapi", "opentofu", "otne", "oxc", "packship", "palette", "panda", "parcel", "pascal",
    "pawn", "payload", "pdf", "pdm", "percy", "perl", "php", "php-cs-fixer", "php_elephant",
    "phpstan", "phpunit", "pinejs", "pipeline", "pkl", "plastic", "playwright", "plop",
    "pm2-ecosystem", "pnpm", "poetry", "postcss", "posthtml", "powerpoint", "powershell",
    "pre-commit", "prettier", "prisma", "processing", "prolog", "prompt", "proto", "protractor",
    "pug", "puppet", "puppeteer", "purescript", "python", "python-misc", "pytorch", "qsharp",
    "quarto", "quasar", "quokka", "qwik", "r", "racket", "raml", "razor", "rbxmk", "rc",
    "react", "react_ts", "readme", "reason", "red", "redux-action", "redux-reducer",
    "redux-selector", "redux-store", "regedit", "remark", "remix", "renovate", "replit",
    "rescript", "rescript-interface", "restql", "riot", "roadmap", "roblox", "robot", "robots",
    "rocket", "rojo", "rolldown", "rollup", "rome", "routing", "rspec", "rstack", "rubocop",
    "ruby", "ruff", "rust", "salesforce", "salt", "san", "sas", "sass", "sbt", "scala",
    "scheme", "scons", "screwdriver", "search", "semantic-release", "semgrep", "sentry",
    "sequelize", "serverless", "settings", "shader", "shellcheck", "silverstripe", "simulink",
    "siyuan", "sketch", "slim", "slint", "slug", "smarty", "sml", "snakemake", "snapcraft",
    "snowpack", "snyk", "solidity", "sonarcloud", "spwn", "stackblitz", "stan", "steadybit",
    "stencil", "stitches", "storybook", "stryker", "stylable", "stylelint", "stylus", "sublime",
    "subtitles", "supabase", "svelte", "svg", "svgo", "svgr", "swagger", "sway", "swc", "swift",
    "syncpack", "systemd", "table", "tailwindcss", "taskfile", "tauri", "taze", "tcl", "teal",
    "templ", "template", "terraform", "test-js", "test-jsx", "test-ts", "tex", "textlint",
    "tilt", "tldraw", "tobi", "tobimake", "toc", "todo", "toml", "toon", "travis", "tree",
    "trigger", "tsconfig", "tsdoc", "tsil", "tune", "turborepo", "twig", "twine", "typedoc",
    "typescript", "typescript-def", "typst", "umi", "uml", "unity", "unlicense", "unocss", "url",
    "uv", "vagrant", "vala", "vanilla-extract", "varnish", "vedic", "velite", "velocity",
    "vercel", "verdaccio", "verified", "verilog", "verse", "vfl", "video", "vim", "virtual",
    "visualstudio", "vite", "vitest", "vlang", "vscode", "vue", "vue-config", "vuex-store",
    "wakatime", "wallaby", "wally", "warp", "watchman", "webassembly", "webhint", "webpack",
    "wepy", "werf", "windicss", "wolframlanguage", "word", "wrangler", "wxt", "xaml", "xmake",
    "xml", "yaml", "yang", "yarn", "zeabur", "zig", "zip",
]);

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
    if (!KNOWN_FILE_ICONS.has(iconName)) return null;
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
    const fileUrl = useMemo(() => !isDir ? getFileUrl(name) : null, [name, isDir]);

    // Determine initial error state from cache — avoids a render cycle
    const initialError = useMemo(() => {
        if (isDir) {
            // No whitelisted icon or known-bad — use Lucide
            return (!closedSrc || isUrlFailed(closedSrc)) && (!openSrc || isUrlFailed(openSrc));
        }
        // For files: if URL is null or failed, use Lucide
        return !fileUrl || isUrlFailed(fileUrl);
    }, [isDir, closedSrc, openSrc, fileUrl]);

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
                const allFailed = (!newClosedSrc || isUrlFailed(newClosedSrc)) &&
                                  (!newOpenSrc || isUrlFailed(newOpenSrc));
                setError(allFailed);
            } else {
                const newFileUrl = getFileUrl(name);
                setError(!newFileUrl || isUrlFailed(newFileUrl));
            }
        }
    }, [name, isDir]);

    // Stable error handlers
    const handleFolderError = useCallback((e) => {
        markUrlFailed(e.target.src);
        // Specific folder icon failed — fall back to Lucide directly (no generic fetch)
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
                <DefaultFolderOpen className="w-4 h-4 text-accent" />
            ) : (
                <DefaultFolderIcon className="w-4 h-4 text-accent" />
            );
        }
        return <DefaultFileIcon className="w-4 h-4 text-muted-foreground" />;
    }

    if (isDir) {
        // If specific URL is null (not in whitelist) or known-bad, use Lucide directly
        const actualClosedSrc = closedSrc && !isUrlFailed(closedSrc) ? closedSrc : null;
        const actualOpenSrc = openSrc && !isUrlFailed(openSrc) ? openSrc : null;

        // No specific icon available — use Lucide fallback immediately (no network request)
        if (!actualClosedSrc && !actualOpenSrc) {
            return isOpen ? (
                <DefaultFolderOpen className="w-4 h-4 text-accent" />
            ) : (
                <DefaultFolderIcon className="w-4 h-4 text-accent" />
            );
        }

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

/**
 * Build the full path of a node by walking up the react-arborist parent chain.
 * Skips the root node (depth 0) since it's the repo name, not part of the file path.
 * Falls back to item.path if available.
 */
function getNodeFullPath(node) {
    const item = node.data;
    // If the node already has a path property, use it directly
    if (item.path) return item.path;

    // Build path from parent chain
    const parts = [];
    let current = node;
    while (current) {
        // Skip the root node (repo name) — it shouldn't be part of the file path
        if (current.parent && current.parent.parent !== null) {
            parts.unshift(current.data.name);
        } else if (!current.parent) {
            // This is the root — skip it
        } else {
            parts.unshift(current.data.name);
        }
        current = current.parent;
    }
    return parts.join('/');
}

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

// Severity text colors for tree view icon
const VULN_ICON_COLORS = {
    Critical: 'text-[var(--severity-critical)]',
    High:     'text-[var(--severity-high)]',
    Medium:   'text-[var(--severity-medium)]',
    Low:      'text-[var(--severity-low)]',
};

// ---------- ROW COMPONENT ----------
const TreeRow = React.memo(function TreeRow({ node, style, showCheckboxes, checked, toggleCheck, onItemClick, fileVulnerabilities }) {
    const item = node.data;
    const id = getId(item);
    const hasChildren = item.children && item.children.length > 0;
    const isFolder = Array.isArray(item.children) || item.isFolder;
    const isOpen = node.isOpen;

    // Build the full path for this node (works even without item.path)
    const fullPath = getNodeFullPath(node);

    // Compute vulnerability summary for this node (files get exact match, folders aggregate children)
    const vulnSummary = isFolder
        ? getFolderVulnSummary(fileVulnerabilities, fullPath)
        : getFileVulnSummary(fileVulnerabilities, fullPath);

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
                {isFolder && hasChildren ? (
                    isOpen ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground pointer-events-none" />
                    ) : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground pointer-events-none" />
                    )
                ) : (
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

            {/* VULNERABILITY BADGE — ShieldAlert icon + count */}
            {vulnSummary && (
                <span
                    className={`ml-1 flex-shrink-0 inline-flex items-center gap-0.5 ${isFolder ? 'opacity-70' : ''} ${VULN_ICON_COLORS[vulnSummary.highestSeverity] || VULN_ICON_COLORS.Medium}`}
                    title={
                        isFolder
                            ? `${vulnSummary.count} ${vulnSummary.count === 1 ? 'vulnerability' : 'vulnerabilities'} in files under this folder`
                            : `${vulnSummary.count} ${vulnSummary.count === 1 ? 'vulnerability' : 'vulnerabilities'}`
                    }
                >
                    <ShieldAlert className={isFolder ? "w-3 h-3" : "w-3.5 h-3.5"} />
                    <span className="text-[10px] font-semibold tabular-nums leading-none">{vulnSummary.count}</span>
                </span>
            )}
        </div>
    );
}, (prev, next) => {
    // Custom comparator: skip re-render if the visible data hasn't changed.
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
        prev.onItemClick === next.onItemClick &&
        prev.fileVulnerabilities === next.fileVulnerabilities
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

    // Access fileVulnerabilities from project context for tree badges
    const { fileVulnerabilities } = useProject();

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
            fileVulnerabilities={fileVulnerabilities}
        />
    ), [showCheckboxes, checked, toggleCheck, onItemClick, fileVulnerabilities]);

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
            <div ref={treeContainerRef} className="flex-1 min-h-0 overflow-hidden scrollbar-on-hover">
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
                    className="h-full w-full scrollbar-on-hover [&>div]:scrollbar-on-hover [&>div]:overflow-auto [&_*]:scrollbar-on-hover"
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

