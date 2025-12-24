"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Link, Loader2, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function ImportFromUrlDialog({ open, onOpenChange, useCaseId, onSuccess }) {
    const [url, setUrl] = React.useState("")
    const [customName, setCustomName] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [status, setStatus] = React.useState("idle") // idle, fetching, uploading, success, error
    const [error, setError] = React.useState("")

    const reset = () => {
        setUrl("")
        setCustomName("")
        setLoading(false)
        setProgress(0)
        setStatus("idle")
        setError("")
    }

    const handleClose = () => {
        reset()
        onOpenChange(false)
    }

    const extractFilenameFromUrl = (urlString) => {
        try {
            const urlObj = new URL(urlString)
            const pathname = urlObj.pathname
            const filename = pathname.split('/').pop()
            if (filename && filename.includes('.')) {
                return filename
            }
            return null
        } catch {
            return null
        }
    }

    const isValidPdfUrl = (urlString) => {
        try {
            const urlObj = new URL(urlString)
            const pathname = urlObj.pathname.toLowerCase()
            return pathname.endsWith('.pdf') || urlString.includes('pdf')
        } catch {
            return false
        }
    }

    const handleImport = async () => {
        if (!url.trim()) {
            setError("Please enter a URL")
            return
        }

        if (!isValidPdfUrl(url)) {
            const confirm = window.confirm(
                "The URL doesn't appear to be a PDF file. Continue anyway?"
            )
            if (!confirm) return
        }

        setLoading(true)
        setError("")
        setStatus("fetching")
        setProgress(10)

        try {
            // Step 1: Fetch the PDF from URL via our API
            setProgress(20)

            const response = await fetch("/api/pdfs/import-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: url.trim(),
                    useCaseId,
                    customName: customName.trim() || extractFilenameFromUrl(url) || "Imported PDF",
                }),
            })

            setProgress(60)
            setStatus("uploading")

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to import PDF")
            }

            setProgress(100)
            setStatus("success")

            const data = await response.json()
            toast.success("PDF imported successfully!")

            // Give a moment to show success state
            setTimeout(() => {
                onSuccess?.(data)
                handleClose()
            }, 1000)

        } catch (err) {
            setStatus("error")
            setError(err.message || "Failed to import PDF from URL")
            toast.error(err.message || "Failed to import PDF")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link className="h-5 w-5" />
                        Import PDF from URL
                    </DialogTitle>
                    <DialogDescription>
                        Enter a URL to a PDF file to import it into your knowledge base.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* URL Input */}
                    <div className="space-y-2">
                        <Label htmlFor="pdf-url">PDF URL</Label>
                        <Input
                            id="pdf-url"
                            type="url"
                            placeholder="https://example.com/document.pdf"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value)
                                setError("")
                                // Auto-extract filename for name suggestion
                                const extracted = extractFilenameFromUrl(e.target.value)
                                if (extracted && !customName) {
                                    setCustomName(extracted.replace('.pdf', ''))
                                }
                            }}
                            disabled={loading}
                            className={error && !url.trim() ? "border-destructive" : ""}
                        />
                    </div>

                    {/* Custom Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="pdf-name">Document Name (optional)</Label>
                        <Input
                            id="pdf-name"
                            placeholder="Custom name for the document"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty to use the filename from URL
                        </p>
                    </div>

                    {/* Progress indicator */}
                    {loading && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                {status === "fetching" && (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Fetching PDF from URL...</span>
                                    </>
                                )}
                                {status === "uploading" && (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Uploading to storage...</span>
                                    </>
                                )}
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {/* Success state */}
                    {status === "success" && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>PDF imported successfully!</span>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Info box */}
                    <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                        <FileText className="h-4 w-4 inline-block mr-1.5 mb-0.5" />
                        <strong>Supported:</strong> Direct links to PDF files. Some sites may block
                        direct downloads - if import fails, try downloading the PDF manually and
                        uploading it.
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={loading || !url.trim()}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Link className="h-4 w-4 mr-2" />
                                Import PDF
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ImportFromUrlDialog

