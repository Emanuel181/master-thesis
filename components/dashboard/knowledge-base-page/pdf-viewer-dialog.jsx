"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Lock, Maximize2, Minimize2 } from "lucide-react";

// ── A4 constants ────────────────────────────────────────────────────
const A4_ASPECT = 842 / 595;

// Minimum dialog dimensions
const MIN_W = 400;
const MIN_H = 300;

export function PdfViewerDialog({ open, onOpenChange, pdfUrl, fileName, isDemo = false }) {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ── Resizable state ─────────────────────────────────────────────
    const [isMaximized, setIsMaximized] = useState(false);
    const [size, setSize] = useState({ w: 0, h: 0 }); // 0 = use responsive defaults
    const [isResizing, setIsResizing] = useState(false);
    const resizing = useRef(null); // { edge, startX, startY, startW, startH }

    // Responsive default size (used when size.w/h is 0 or reset)
    const getDefaultSize = useCallback(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (vw < 640) return { w: vw * 0.95, h: vh * 0.9 };
        if (vw < 1024) return { w: vw * 0.85, h: vh * 0.85 };
        return { w: vw * 0.75, h: vh * 0.8 };
    }, []);

    // Current effective size
    const getEffectiveSize = useCallback(() => {
        if (isMaximized) return { w: window.innerWidth * 0.98, h: window.innerHeight * 0.96 };
        if (size.w > 0 && size.h > 0) return size;
        return getDefaultSize();
    }, [isMaximized, size, getDefaultSize]);

    // Reset size on dialog open
    useEffect(() => {
        if (open) {
            setSize({ w: 0, h: 0 });
            setIsMaximized(false);
        }
    }, [open]);

    // ── Resize drag handlers ────────────────────────────────────────
    const handleResizeStart = useCallback((edge, e) => {
        e.preventDefault();
        e.stopPropagation();
        const s = getEffectiveSize();
        resizing.current = { edge, startX: e.clientX, startY: e.clientY, startW: s.w, startH: s.h };
        setIsResizing(true);

        const onMove = (ev) => {
            if (!resizing.current) return;
            const { edge: ed, startX, startY, startW, startH } = resizing.current;
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            let newW = startW;
            let newH = startH;

            if (ed.includes("e")) newW = startW + dx * 2;   // *2 because dialog is centered
            if (ed.includes("w")) newW = startW - dx * 2;
            if (ed.includes("s")) newH = startH + dy * 2;
            if (ed.includes("n")) newH = startH - dy * 2;

            newW = Math.max(MIN_W, Math.min(newW, window.innerWidth * 0.98));
            newH = Math.max(MIN_H, Math.min(newH, window.innerHeight * 0.96));

            setSize({ w: newW, h: newH });
            setIsMaximized(false);
        };

        const onUp = () => {
            resizing.current = null;
            setIsResizing(false);
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [getEffectiveSize]);

    // ── Blob fetch ──────────────────────────────────────────────────
    useEffect(() => {
        if (!open || !pdfUrl || isDemo) return;

        let revoked = false;
        setLoading(true);
        setError(null);

        fetch(pdfUrl)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`);
                return res.blob();
            })
            .then((blob) => {
                if (revoked) return;
                setBlobUrl(URL.createObjectURL(blob));
                setLoading(false);
            })
            .catch((err) => {
                if (revoked) return;
                console.error("Error fetching PDF blob:", err);
                setError(err.message);
                setLoading(false);
            });

        return () => {
            revoked = true;
            setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
            setLoading(false);
            setError(null);
        };
    }, [open, pdfUrl, isDemo]);

    // Measure container
    useEffect(() => {
        if (!open) return;
        const measure = () => {
            const el = containerRef.current;
            if (el) setContainerSize({ width: el.clientWidth, height: el.clientHeight });
        };
        const raf = requestAnimationFrame(measure);
        window.addEventListener("resize", measure);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", measure); };
    }, [open]);

    const demoWidth = Math.min(containerSize.width ? containerSize.width - 48 : 500, 595);
    const demoHeight = demoWidth * A4_ASPECT;

    const handleDownload = () => {
        if (!blobUrl) return;
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName || "document.pdf";
        link.click();
    };

    const toggleMaximize = () => setIsMaximized((prev) => !prev);

    const effectiveSize = getEffectiveSize();

    // Shared resize handle style
    const handleCls = "absolute z-50 transition-colors bg-transparent hover:bg-primary/20";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col p-0 gap-0 overflow-visible border border-border/80 shadow-2xl ring-1 ring-white/10"
                style={{
                    width: effectiveSize.w,
                    height: effectiveSize.h,
                    maxWidth: "98vw",
                    maxHeight: "96vh",
                    transition: isResizing ? "none" : "width 0.2s ease, height 0.2s ease",
                }}
            >
                {/* ── Resize handles ──────────────────────────────── */}
                {/* Right */}
                <div className={`${handleCls} top-4 -right-1 w-2 h-[calc(100%-2rem)] cursor-e-resize rounded-full`}
                     onMouseDown={(e) => handleResizeStart("e", e)}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-border/60" />
                </div>
                {/* Left */}
                <div className={`${handleCls} top-4 -left-1 w-2 h-[calc(100%-2rem)] cursor-w-resize rounded-full`}
                     onMouseDown={(e) => handleResizeStart("w", e)}>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-border/60" />
                </div>
                {/* Bottom */}
                <div className={`${handleCls} -bottom-1 left-4 h-2 w-[calc(100%-2rem)] cursor-s-resize rounded-full`}
                     onMouseDown={(e) => handleResizeStart("s", e)}>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-border/60" />
                </div>
                {/* Top */}
                <div className={`${handleCls} -top-1 left-4 h-2 w-[calc(100%-2rem)] cursor-n-resize rounded-full`}
                     onMouseDown={(e) => handleResizeStart("n", e)} />
                {/* Corners */}
                <div className={`${handleCls} -top-1 -right-1 w-3 h-3 cursor-ne-resize`}
                     onMouseDown={(e) => handleResizeStart("ne", e)} />
                <div className={`${handleCls} -top-1 -left-1 w-3 h-3 cursor-nw-resize`}
                     onMouseDown={(e) => handleResizeStart("nw", e)} />
                <div className={`${handleCls} -bottom-1 -right-1 w-4 h-4 cursor-se-resize`}
                     onMouseDown={(e) => handleResizeStart("se", e)} />
                <div className={`${handleCls} -bottom-1 -left-1 w-3 h-3 cursor-sw-resize`}
                     onMouseDown={(e) => handleResizeStart("sw", e)} />

                {/* ── Header ─────────────────────────────────────── */}
                <DialogHeader className="px-4 py-2.5 border-b shrink-0" onDoubleClick={toggleMaximize}>
                    <DialogTitle className="text-base font-semibold pr-8">
                        {fileName || "PDF Document"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {isDemo
                            ? "Demo Mode • This is a preview placeholder"
                            : loading
                              ? "Loading PDF…"
                              : error
                                ? "Error loading PDF"
                                : "Drag edges to resize • Double-click header to maximize"}
                    </DialogDescription>
                </DialogHeader>

                {/* ── Controls ────────────────────────────────────── */}
                <div className="px-4 py-1.5 border-b bg-muted/30 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMaximize}
                            className="h-7 w-7 p-0"
                            title={isMaximized ? "Restore size" : "Maximize"}
                        >
                            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownload} disabled={isDemo || !blobUrl}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                    </Button>
                </div>

                {/* ── PDF Viewer ──────────────────────────────────── */}
                <div ref={containerRef} className="flex-1 relative overflow-hidden min-h-0 bg-muted/20">
                    {/* Overlay to prevent iframe from capturing mouse during resize */}
                    {isResizing && <div className="absolute inset-0 z-10" />}
                    {isDemo ? (
                        <div className="flex justify-center items-start p-4 h-full overflow-auto">
                            <div className="flex flex-col items-center justify-center py-6">
                                <div
                                    className="relative bg-background rounded-lg shadow-xl border flex flex-col overflow-hidden"
                                    style={{ width: demoWidth, height: demoHeight }}
                                >
                                    <div className="p-6 border-b shrink-0">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-red-500" />
                                            <div>
                                                <h3 className="font-semibold text-lg text-foreground">{fileName || "Document.pdf"}</h3>
                                                <p className="text-sm text-muted-foreground">Security Documentation</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-6 space-y-4 overflow-hidden">
                                        {[...Array(5)].map((_, g) => (
                                            <div key={g} className="space-y-2 pt-2">
                                                <div className="h-3 bg-muted rounded" style={{ width: `${70 + ((g * 13) % 30)}%` }} />
                                                <div className="h-3 bg-muted rounded w-full" />
                                                <div className="h-3 bg-muted rounded" style={{ width: `${60 + ((g * 17) % 35)}%` }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                                        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="text-2xl font-semibold mb-2 text-foreground">Demo Mode Preview</h3>
                                        <p className="text-muted-foreground text-center max-w-sm px-4">
                                            Full PDF viewing is available with a VulnIQ account. Sign up to access your security documentation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <div className="h-8 w-8 border-4 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                            <div className="text-muted-foreground">Loading PDF…</div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <div className="text-destructive font-medium">Failed to load PDF</div>
                            <div className="text-sm text-muted-foreground">{error}</div>
                        </div>
                    ) : blobUrl ? (
                        <iframe
                            src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                            title={fileName || "PDF Document"}
                            className="w-full h-full"
                            style={{ border: "none" }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-muted-foreground">No PDF selected</div>
                        </div>
                    )}
                </div>

                {/* Bottom-right resize grip indicator */}
                <div
                    className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-50 flex items-end justify-end pr-1 pb-1 opacity-60 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeStart("se", e)}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted-foreground">
                        <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="11" y1="5" x2="5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="11" y1="9" x2="9" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
            </DialogContent>
        </Dialog>
    );
}

