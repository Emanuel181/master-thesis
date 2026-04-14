"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    GitBranch,
    Upload,
    Globe,
    Loader2,
    FolderGit2,
    Search,
    ChevronLeft,
    ChevronRight,
    FileArchive,
    ShieldCheck,
    X,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_ZIP_SIZE_MB = 500
const MAX_ZIP_SIZE_BYTES = MAX_ZIP_SIZE_MB * 1024 * 1024
const REPOS_PER_PAGE = 6

/** Allowed hosts for OSS public URLs (SSRF prevention) */
const ALLOWED_OSS_HOSTS = new Set([
    "github.com",
    "www.github.com",
    "gitlab.com",
    "www.gitlab.com",
])

/** ZIP magic bytes: PK\x03\x04 */
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Validate URL is a legitimate public GitHub/GitLab repo URL */
function validateOssUrl(raw) {
    const trimmed = raw.trim()
    if (!trimmed) return { valid: false, error: "URL is required" }

    let url
    try {
        url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    } catch {
        return { valid: false, error: "Invalid URL format" }
    }

    // Protocol must be HTTPS
    if (url.protocol !== "https:") {
        return { valid: false, error: "Only HTTPS URLs are allowed" }
    }

    // Host allowlist — prevents SSRF
    if (!ALLOWED_OSS_HOSTS.has(url.hostname)) {
        return { valid: false, error: "Only github.com and gitlab.com URLs are accepted" }
    }

    // Must contain at least owner/repo
    const parts = url.pathname.split("/").filter(Boolean)
    if (parts.length < 2) {
        return { valid: false, error: "URL must be in format: https://github.com/owner/repo" }
    }

    // Sanitize — strip anything after owner/repo to prevent injection
    const owner = parts[0].replace(/[^a-zA-Z0-9._-]/g, "")
    const repo = parts[1].replace(/\.git$/, "").replace(/[^a-zA-Z0-9._-]/g, "")

    if (!owner || !repo) {
        return { valid: false, error: "Could not parse owner/repo from URL" }
    }

    const provider = url.hostname.includes("gitlab") ? "gitlab" : "github"
    return { valid: true, owner, repo, provider, error: null }
}

/** Verify ZIP file magic bytes to prevent file type spoofing */
async function verifyZipMagicBytes(file) {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
            const arr = new Uint8Array(reader.result)
            const isZip = ZIP_MAGIC.every((byte, i) => arr[i] === byte)
            resolve(isZip)
        }
        reader.onerror = () => resolve(false)
        reader.readAsArrayBuffer(file.slice(0, 4))
    })
}

// ═════════════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════════════

export function NewScanDialog({
    open,
    onOpenChange,
    githubRepos = [],
    gitlabRepos = [],
    isGithubConnected = false,
    isGitlabConnected = false,
    onStartScan,
}) {
    // ── Shared state ─────────────────────────────────────────────────────
    const [scanName, setScanName] = useState("")
    const [isStarting, setIsStarting] = useState(false)
    const [activeTab, setActiveTab] = useState("repository")

    // ── Repository tab ───────────────────────────────────────────────────
    const [selectedProvider, setSelectedProvider] = useState("")
    const [selectedRepoId, setSelectedRepoId] = useState("")
    const [selectedBranch, setSelectedBranch] = useState("")
    const [branches, setBranches] = useState([])
    const [isLoadingBranches, setIsLoadingBranches] = useState(false)
    const [repoSearch, setRepoSearch] = useState("")
    const [repoPage, setRepoPage] = useState(1)

    // ── Upload tab ───────────────────────────────────────────────────────
    const [zipFile, setZipFile] = useState(null)
    const [zipError, setZipError] = useState("")
    const fileInputRef = useRef(null)

    // ── OSS tab ──────────────────────────────────────────────────────────
    const [publicUrl, setPublicUrl] = useState("")
    const [ossValidation, setOssValidation] = useState(null)

    // ── Derived ──────────────────────────────────────────────────────────
    const providers = useMemo(() => {
        const p = []
        if (isGithubConnected) p.push({ id: "github", label: "GitHub" })
        if (isGitlabConnected) p.push({ id: "gitlab", label: "GitLab" })
        return p
    }, [isGithubConnected, isGitlabConnected])

    // Auto-select first available provider
    useEffect(() => {
        if (open && !selectedProvider && providers.length > 0) {
            setSelectedProvider(providers[0].id)
        }
    }, [open, providers, selectedProvider])

    const availableRepos = useMemo(() =>
        selectedProvider === "github" ? githubRepos
        : selectedProvider === "gitlab" ? gitlabRepos
        : []
    , [selectedProvider, githubRepos, gitlabRepos])

    // Filtered + paginated repos
    const filteredRepos = useMemo(() => {
        if (!repoSearch.trim()) return availableRepos
        const q = repoSearch.toLowerCase()
        return availableRepos.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            r.full_name?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        )
    }, [availableRepos, repoSearch])

    const totalRepoPages = Math.max(1, Math.ceil(filteredRepos.length / REPOS_PER_PAGE))
    const paginatedRepos = useMemo(() => {
        const start = (repoPage - 1) * REPOS_PER_PAGE
        return filteredRepos.slice(start, start + REPOS_PER_PAGE)
    }, [filteredRepos, repoPage])

    const selectedRepo = availableRepos.find(r => String(r.id) === String(selectedRepoId))

    // ── Fetch branches ───────────────────────────────────────────────────
    const fetchBranches = useCallback(async () => {
        if (!selectedRepo || !selectedProvider) return
        setIsLoadingBranches(true)
        setBranches([])
        setSelectedBranch("")

        try {
            const [owner, ...rest] = selectedRepo.full_name.split("/")
            const repoName = rest.join("/")
            const endpoint = selectedProvider === "github" ? "/api/github/branches" : "/api/gitlab/branches"
            const res = await fetch(`${endpoint}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repoName)}`)
            let branchList = []
            if (res.ok) {
                const data = await res.json()
                branchList = (data.data || data || []).map(b => (typeof b === "string" ? b : b.name)).filter(Boolean)
            }
            if (branchList.length === 0) branchList = [selectedRepo.default_branch || "main"]
            setBranches(branchList)
            setSelectedBranch(selectedRepo.default_branch || branchList[0] || "main")
        } catch {
            const fb = selectedRepo.default_branch || "main"
            setBranches([fb])
            setSelectedBranch(fb)
        } finally {
            setIsLoadingBranches(false)
        }
    }, [selectedRepo, selectedProvider])

    useEffect(() => {
        if (selectedRepo) fetchBranches()
    }, [selectedRepo, fetchBranches])

    // ── Resets ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) {
            setScanName("")
            setSelectedProvider("")
            setSelectedRepoId("")
            setSelectedBranch("")
            setBranches([])
            setRepoSearch("")
            setRepoPage(1)
            setZipFile(null)
            setZipError("")
            setPublicUrl("")
            setOssValidation(null)
            setIsStarting(false)
            setActiveTab("repository")
        }
    }, [open])

    useEffect(() => {
        setSelectedRepoId("")
        setSelectedBranch("")
        setBranches([])
        setRepoSearch("")
        setRepoPage(1)
    }, [selectedProvider])

    useEffect(() => { setRepoPage(1) }, [repoSearch])

    // Live-validate OSS URL
    useEffect(() => {
        if (!publicUrl.trim()) { setOssValidation(null); return }
        const t = setTimeout(() => setOssValidation(validateOssUrl(publicUrl)), 300)
        return () => clearTimeout(t)
    }, [publicUrl])

    // ── Handlers ─────────────────────────────────────────────────────────
    const handleStartRepoScan = async () => {
        if (!selectedRepo || !selectedBranch) return
        setIsStarting(true)
        try {
            await onStartScan?.({
                type: "repository",
                name: scanName || selectedRepo.name,
                provider: selectedProvider,
                repo: selectedRepo,
                branch: selectedBranch,
            })
            onOpenChange(false)
        } catch (err) {
            toast.error(err.message || "Failed to start scan")
        } finally {
            setIsStarting(false)
        }
    }

    const handleStartUploadScan = async () => {
        if (!zipFile) return
        setIsStarting(true)
        try {
            await onStartScan?.({
                type: "upload",
                name: scanName || zipFile.name.replace(/\.zip$/i, ""),
                file: zipFile,
            })
            onOpenChange(false)
        } catch (err) {
            toast.error(err.message || "Failed to start scan")
        } finally {
            setIsStarting(false)
        }
    }

    const handleStartOssScan = async () => {
        if (!ossValidation?.valid) return
        setIsStarting(true)
        try {
            await onStartScan?.({
                type: "oss",
                name: scanName || ossValidation.repo || "oss-scan",
                url: publicUrl.trim(),
                owner: ossValidation.owner,
                repo: ossValidation.repo,
                provider: ossValidation.provider,
            })
            onOpenChange(false)
        } catch (err) {
            toast.error(err.message || "Failed to start scan")
        } finally {
            setIsStarting(false)
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        setZipError("")
        setZipFile(null)
        if (!file) return

        // 1. Extension check
        if (!file.name.toLowerCase().endsWith(".zip")) {
            setZipError("Only .zip files are accepted")
            return
        }

        // 2. Size check
        if (file.size > MAX_ZIP_SIZE_BYTES) {
            setZipError(`File exceeds ${MAX_ZIP_SIZE_MB} MB limit (${formatBytes(file.size)})`)
            return
        }

        // 3. Magic bytes verification (anti file-type-spoofing)
        const isRealZip = await verifyZipMagicBytes(file)
        if (!isRealZip) {
            setZipError("File does not appear to be a valid ZIP archive")
            return
        }

        setZipFile(file)
        if (!scanName) setScanName(file.name.replace(/\.zip$/i, ""))
    }

    const clearZip = () => {
        setZipFile(null)
        setZipError("")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">New Scan</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Select a source to scan for security vulnerabilities.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
                    {/* Tab bar */}
                    <div className="px-6">
                        <TabsList className="w-full h-9 bg-muted/50">
                            <TabsTrigger value="repository" className="flex-1 gap-1.5 text-xs h-7 data-[state=active]:shadow-sm">
                                <FolderGit2 className="h-3.5 w-3.5" />
                                Repository
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="flex-1 gap-1.5 text-xs h-7 data-[state=active]:shadow-sm">
                                <Upload className="h-3.5 w-3.5" />
                                Upload
                            </TabsTrigger>
                            <TabsTrigger value="oss" className="flex-1 gap-1.5 text-xs h-7 data-[state=active]:shadow-sm">
                                <Globe className="h-3.5 w-3.5" />
                                OSS
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ─── Repository Tab ──────────────────────────────── */}
                    <TabsContent value="repository" className="mt-0 focus-visible:ring-0">
                        <div className="px-6 pt-4 pb-6 space-y-4">
                            {/* Scan name */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Name</Label>
                                <Input
                                    placeholder="Enter scan name"
                                    value={scanName}
                                    onChange={(e) => setScanName(e.target.value)}
                                    className="h-9 text-sm bg-muted/30"
                                />
                            </div>

                            {providers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg">
                                    <FolderGit2 className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">No providers connected</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Connect GitHub or GitLab from the home page to get started.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Provider selector (only if multiple) */}
                                    {providers.length > 1 && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium">Provider</Label>
                                            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                                                <SelectTrigger className="h-9 text-sm bg-muted/30">
                                                    <SelectValue placeholder="Select provider" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {providers.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Repository picker with search + pagination */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Repository</Label>
                                        <div className="border rounded-lg overflow-hidden">
                                            {/* Search bar */}
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search repositories..."
                                                    value={repoSearch}
                                                    onChange={(e) => setRepoSearch(e.target.value)}
                                                    className="h-8 text-xs pl-8 border-0 border-b rounded-none focus-visible:ring-0 bg-muted/20"
                                                />
                                                {repoSearch && (
                                                    <button
                                                        onClick={() => setRepoSearch("")}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Repo list */}
                                            <ScrollArea className="h-[152px]">
                                                {paginatedRepos.length === 0 ? (
                                                    <div className="flex items-center justify-center h-full py-8">
                                                        <p className="text-xs text-muted-foreground">
                                                            {repoSearch ? "No matching repositories" : "No repositories found"}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="p-1">
                                                        {paginatedRepos.map((repo) => {
                                                            const isSelected = String(repo.id) === String(selectedRepoId)
                                                            return (
                                                                <button
                                                                    key={repo.id}
                                                                    onClick={() => {
                                                                        setSelectedRepoId(String(repo.id))
                                                                        if (!scanName) setScanName(repo.name)
                                                                    }}
                                                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors ${
                                                                        isSelected
                                                                            ? "bg-primary/10 border border-primary/30"
                                                                            : "hover:bg-muted/60 border border-transparent"
                                                                    }`}
                                                                >
                                                                    <FolderGit2 className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-xs font-medium truncate ${isSelected ? "text-primary" : ""}`}>
                                                                            {repo.name}
                                                                        </p>
                                                                        {repo.description && (
                                                                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                                                {repo.description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {repo.private && (
                                                                        <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">Private</Badge>
                                                                    )}
                                                                    {repo.language && (
                                                                        <span className="text-[10px] text-muted-foreground shrink-0">{repo.language}</span>
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </ScrollArea>

                                            {/* Pagination footer */}
                                            {totalRepoPages > 1 && (
                                                <div className="flex items-center justify-between px-2.5 py-1.5 border-t bg-muted/10">
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {filteredRepos.length} repo{filteredRepos.length !== 1 ? "s" : ""}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            disabled={repoPage <= 1}
                                                            onClick={() => setRepoPage(p => p - 1)}
                                                        >
                                                            <ChevronLeft className="h-3 w-3" />
                                                        </Button>
                                                        <span className="text-[10px] tabular-nums text-muted-foreground min-w-[40px] text-center">
                                                            {repoPage}/{totalRepoPages}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            disabled={repoPage >= totalRepoPages}
                                                            onClick={() => setRepoPage(p => p + 1)}
                                                        >
                                                            <ChevronRight className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Branch selector */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Branch</Label>
                                        {isLoadingBranches ? (
                                            <Skeleton className="h-9 w-full rounded-md" />
                                        ) : (
                                            <Select
                                                value={selectedBranch}
                                                onValueChange={setSelectedBranch}
                                                disabled={!selectedRepoId || branches.length === 0}
                                            >
                                                <SelectTrigger className="h-9 text-sm bg-muted/30">
                                                    <div className="flex items-center gap-1.5">
                                                        <GitBranch className="h-3 w-3 text-muted-foreground" />
                                                        <SelectValue placeholder="Select branch" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {branches.map((branch) => (
                                                        <SelectItem key={branch} value={branch}>
                                                            {branch}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Start button */}
                            <Button
                                className="w-full h-10"
                                disabled={!selectedRepo || !selectedBranch || isStarting}
                                onClick={handleStartRepoScan}
                            >
                                {isStarting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                )}
                                Start Scan
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ─── Upload Tab ──────────────────────────────────── */}
                    <TabsContent value="upload" className="mt-0 focus-visible:ring-0">
                        <div className="px-6 pt-4 pb-6 space-y-4">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Name</Label>
                                <Input
                                    placeholder="Enter scan name"
                                    value={scanName}
                                    onChange={(e) => setScanName(e.target.value)}
                                    className="h-9 text-sm bg-muted/30"
                                />
                            </div>

                            {/* Upload area */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Upload Files</Label>
                                    <span className="text-[10px] text-muted-foreground">
                                        Max {MAX_ZIP_SIZE_MB} MB
                                    </span>
                                </div>

                                {zipFile ? (
                                    <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/20">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <FileArchive className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{zipFile.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{formatBytes(zipFile.size)}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={clearZip}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="zip-upload"
                                        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/30 hover:border-primary/30 transition-colors text-center"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Upload ZIP file</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                Click to browse or drag &amp; drop
                                            </p>
                                        </div>
                                    </label>
                                )}
                                <input
                                    ref={fileInputRef}
                                    id="zip-upload"
                                    type="file"
                                    accept=".zip"
                                    className="sr-only"
                                    onChange={handleFileChange}
                                />

                                {zipError && (
                                    <div className="flex items-center gap-1.5 text-destructive text-xs">
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        {zipError}
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full h-10"
                                disabled={!zipFile || isStarting}
                                onClick={handleStartUploadScan}
                            >
                                {isStarting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                )}
                                Start Scan
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ─── OSS Tab ─────────────────────────────────────── */}
                    <TabsContent value="oss" className="mt-0 focus-visible:ring-0">
                        <div className="px-6 pt-4 pb-6 space-y-4">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Name</Label>
                                <Input
                                    placeholder="Enter scan name"
                                    value={scanName}
                                    onChange={(e) => setScanName(e.target.value)}
                                    className="h-9 text-sm bg-muted/30"
                                />
                            </div>

                            {/* Public URL */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Public Git URL</Label>
                                <div className="relative">
                                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="https://github.com/owner/repo"
                                        value={publicUrl}
                                        onChange={(e) => setPublicUrl(e.target.value)}
                                        className="h-9 text-sm pl-8 bg-muted/30"
                                    />
                                </div>

                                {/* Live validation indicator */}
                                {ossValidation && (
                                    <div className={`flex items-center gap-1.5 text-xs ${ossValidation.valid ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                                        {ossValidation.valid ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                                                <span>
                                                    {ossValidation.provider === "github" ? "GitHub" : "GitLab"}: {ossValidation.owner}/{ossValidation.repo}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                                <span>{ossValidation.error}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Allowed domains info */}
                            <div className="rounded-lg bg-muted/30 border p-3 space-y-1.5">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Allowed sources</p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] h-5">github.com</Badge>
                                    <Badge variant="secondary" className="text-[10px] h-5">gitlab.com</Badge>
                                </div>
                            </div>

                            <Button
                                className="w-full h-10"
                                disabled={!ossValidation?.valid || isStarting}
                                onClick={handleStartOssScan}
                            >
                                {isStarting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                )}
                                Start Scan
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

