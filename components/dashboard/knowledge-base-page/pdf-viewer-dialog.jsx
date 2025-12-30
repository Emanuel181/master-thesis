"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText, Lock } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker - use unpkg with the exact version from react-pdf's pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewerDialog({ open, onOpenChange, pdfUrl, fileName, isDemo = false }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const viewerRef = React.useRef(null);
    const scrollAreaRef = React.useRef(null);

    // Drag/pan state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function onDocumentLoadError(error) {
        console.error("Error loading PDF:", error);
    }

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open && viewerRef.current) {
            viewerRef.current.focus();
        }
        if (!open) {
            setScale(1.0);
            setPageNumber(1);
        }
    }, [open]);

    const goToPreviousPage = () => {
        setPageNumber((prev) => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
    };

    const zoomIn = useCallback(() => {
        setScale((prev) => Math.min(prev + 0.2, 3.0));
    }, []);

    const zoomOut = useCallback(() => {
        setScale((prev) => Math.max(prev - 0.2, 0.1));
    }, []);

    // Drag/pan handlers
    const handleMouseDown = (e) => {
        // Only start drag with left mouse button
        if (e.button !== 0) return;

        const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (!scrollArea) return;

        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setScrollStart({ x: scrollArea.scrollLeft, y: scrollArea.scrollTop });
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (!scrollArea) return;

        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        scrollArea.scrollLeft = scrollStart.x - deltaX;
        scrollArea.scrollTop = scrollStart.y - deltaY;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // Handle wheel/touchpad zoom - must capture at document level with non-passive listener
    useEffect(() => {
        if (!open) return;

        const handleWheel = (e) => {
            // Check if Ctrl key is pressed (or Cmd on Mac) - this is how touchpad pinch zoom works
            if (e.ctrlKey || e.metaKey) {
                // Check if the event target is within our viewer
                const viewer = viewerRef.current;
                if (viewer && (viewer.contains(e.target) || viewer === e.target)) {
                    // Prevent browser zoom
                    e.preventDefault();
                    e.stopPropagation();

                    // Determine zoom direction based on wheel delta
                    const delta = e.deltaY;
                    const zoomAmount = 0.05; // Smaller amount for smoother touchpad zoom

                    setScale((prev) => {
                        if (delta < 0) {
                            // Scrolling up / pinch out - zoom in
                            return Math.min(prev + zoomAmount, 3.0);
                        } else {
                            // Scrolling down / pinch in - zoom out
                            return Math.max(prev - zoomAmount, 0.1);
                        }
                    });
                }
            }
        };

        // Add non-passive event listener at document level to capture before browser zoom
        document.addEventListener('wheel', handleWheel, { passive: false, capture: true });

        return () => {
            document.removeEventListener('wheel', handleWheel, { capture: true });
        };
    }, [open]);

    // Prevent browser zoom shortcuts when dialog is open
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            // Prevent Ctrl/Cmd + Plus/Minus/0 (browser zoom shortcuts)
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
                const viewer = viewerRef.current;
                if (viewer && (viewer.contains(document.activeElement) || viewer === document.activeElement)) {
                    e.preventDefault();
                    if (e.key === '+' || e.key === '=') {
                        setScale((prev) => Math.min(prev + 0.2, 3.0));
                    } else if (e.key === '-') {
                        setScale((prev) => Math.max(prev - 0.2, 0.1));
                    } else if (e.key === '0') {
                        setScale(1.0); // Reset to 100%
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    // Calculate PDF width based on container and scale
    const getPdfWidth = () => {
        // Use a larger percentage of viewport width for wider display
        const baseWidth = Math.min(window.innerWidth * 0.92, 1600);
        return baseWidth * scale;
    };

    const handleDownload = () => {
        if (pdfUrl) {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = fileName || "document.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-[98vw] w-[98vw] h-[98vh] flex flex-col p-0"
            >
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="text-lg font-semibold">
                        {fileName || "PDF Document"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {isDemo 
                            ? "Demo Mode • This is a preview placeholder" 
                            : (numPages ? `Page ${pageNumber} of ${numPages} • Use Ctrl+Scroll to zoom` : "Loading...")}
                    </DialogDescription>
                </DialogHeader>

                {/* Controls */}
                <div className="px-6 py-3 border-b bg-muted/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousPage}
                            disabled={isDemo || pageNumber <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium min-w-[100px] text-center">
                            {isDemo ? "1 / 1" : `${pageNumber} / ${numPages || "..."}`}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={isDemo || pageNumber >= (numPages || 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={zoomOut} disabled={isDemo}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium min-w-[60px] text-center">
                            {Math.round(scale * 100)}%
                        </div>
                        <Button variant="outline" size="sm" onClick={zoomIn} disabled={isDemo}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDemo}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div
                    ref={viewerRef}
                    className={`flex-1 relative overflow-hidden outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    tabIndex={0}
                >
                    <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
                        <div className="p-6 bg-muted/20 min-h-full">
                            {isDemo ? (
                                /* Demo mode placeholder */
                                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                    <div className="relative w-[500px] max-w-full h-[650px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border flex flex-col overflow-hidden">
                                        {/* Mock PDF Header */}
                                        <div className="p-6 border-b shrink-0">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-8 w-8 text-red-500" />
                                                <div>
                                                    <h3 className="font-semibold text-lg text-foreground">{fileName || "Document.pdf"}</h3>
                                                    <p className="text-sm text-muted-foreground">Security Documentation</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Mock PDF Content */}
                                        <div className="flex-1 p-6 space-y-4 overflow-hidden">
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                            </div>
                                            <div className="space-y-2 pt-4">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                            </div>
                                            <div className="space-y-2 pt-4">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                            </div>
                                            <div className="space-y-2 pt-4">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                                            </div>
                                        </div>
                                        
                                        {/* Demo Overlay */}
                                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                                            <Lock className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                                            <h3 className="text-2xl font-semibold mb-2 text-foreground">Demo Mode Preview</h3>
                                            <p className="text-muted-foreground text-center max-w-sm px-4">
                                                Full PDF viewing is available with a VulnIQ account. Sign up to access your security documentation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : pdfUrl ? (
                                <div className="inline-block min-w-full">
                                    <Document
                                        file={pdfUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        onLoadError={onDocumentLoadError}
                                        loading={
                                            <div className="flex items-center justify-center py-20">
                                                <div className="text-muted-foreground">Loading PDF...</div>
                                            </div>
                                        }
                                        error={
                                            <div className="flex items-center justify-center py-20">
                                                <div className="text-destructive">
                                                    Failed to load PDF. Please try again.
                                                </div>
                                            </div>
                                        }
                                    >
                                        <div className="flex justify-center">
                                            <Page
                                                pageNumber={pageNumber}
                                                width={getPdfWidth()}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={true}
                                                className="shadow-lg"
                                            />
                                        </div>
                                    </Document>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-muted-foreground">No PDF selected</div>
                                </div>
                            )}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

