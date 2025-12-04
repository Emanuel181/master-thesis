"use client";

import React, { useState } from "react";
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
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewerDialog({ open, onOpenChange, pdfUrl, fileName }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState(null);
    const [isViewerFocused, setIsViewerFocused] = useState(false);
    const viewerRef = React.useRef(null);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function onDocumentLoadError(error) {
        console.error("Error loading PDF:", error);
    }

    // Reset focus when dialog opens/closes
    React.useEffect(() => {
        if (open && viewerRef.current) {
            viewerRef.current.focus();
            setIsViewerFocused(true);
        } else {
            setIsViewerFocused(false);
        }
    }, [open]);

    const goToPreviousPage = () => {
        setPageNumber((prev) => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
    };

    const zoomIn = () => {
        setScale((prev) => Math.min(prev + 0.2, 3.0));
    };

    const zoomOut = () => {
        setScale((prev) => Math.max(prev - 0.2, 0.5));
    };

    // Handle wheel/touchpad zoom
    const handleWheel = (e) => {
        // Check if Ctrl key is pressed (or Cmd on Mac) for zoom
        if (e.ctrlKey || e.metaKey) {
            // Always prevent default browser zoom when Ctrl/Cmd is pressed in viewer
            e.preventDefault();
            e.stopPropagation();

            // Determine zoom direction based on wheel delta
            const delta = e.deltaY;
            const zoomAmount = 0.1;

            if (delta < 0) {
                // Scrolling up - zoom in
                setScale((prev) => Math.min(prev + zoomAmount, 3.0));
            } else {
                // Scrolling down - zoom out
                setScale((prev) => Math.max(prev - zoomAmount, 0.5));
            }
        }
    };

    // Prevent browser zoom shortcuts when viewer is focused
    const handleKeyDown = (e) => {
        // Prevent Ctrl/Cmd + Plus/Minus/0 (browser zoom shortcuts)
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
            e.preventDefault();
            if (e.key === '+' || e.key === '=') {
                zoomIn();
            } else if (e.key === '-') {
                zoomOut();
            } else if (e.key === '0') {
                setScale(1.0); // Reset to 100%
            }
        }
    };

    // Calculate PDF width based on container and scale
    const getPdfWidth = () => {
        // Use a percentage of viewport width, accounting for dialog padding
        const baseWidth = Math.min(window.innerWidth * 0.85, 1200);
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
                className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0"
                onKeyDown={handleKeyDown}
            >
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="text-lg font-semibold">
                        {fileName || "PDF Document"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {numPages ? `Page ${pageNumber} of ${numPages} • Use Ctrl+Scroll to zoom` : "Loading..."}
                    </DialogDescription>
                </DialogHeader>

                {/* Controls */}
                <div className="px-6 py-3 border-b bg-muted/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousPage}
                            disabled={pageNumber <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium min-w-[100px] text-center">
                            {pageNumber} / {numPages || "..."}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={pageNumber >= (numPages || 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={zoomOut}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium min-w-[60px] text-center">
                            {Math.round(scale * 100)}%
                        </div>
                        <Button variant="outline" size="sm" onClick={zoomIn}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div
                    ref={viewerRef}
                    className="flex-1 relative overflow-hidden outline-none"
                    onWheel={handleWheel}
                    onFocus={() => setIsViewerFocused(true)}
                    onBlur={() => setIsViewerFocused(false)}
                    tabIndex={0}
                >
                    <ScrollArea className="h-full w-full">
                        <div className="p-6 bg-muted/20 min-h-full">
                            {pdfUrl ? (
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

