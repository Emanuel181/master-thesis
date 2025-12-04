"use client"

import React, { useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { File, X, Upload, Search, FolderOpen } from "lucide-react"
import * as LucideIcons from "lucide-react";
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area";

import { knowledgeBaseUseCases as initialUseCases } from "@/lib/knowledge-base-cases";
import { AddCategoryDialog } from "@/components/add-category-dialog";
import { CategoryCard } from "@/components/category-card";

// Dynamically import PDF viewer to avoid SSR issues with DOMMatrix
const PdfViewerDialog = dynamic(
  () => import("@/components/pdf-viewer-dialog").then(mod => mod.PdfViewerDialog),
  { ssr: false }
);

export default function KnowledgeBaseVisualization() {
    const [useCases, setUseCases] = useState(initialUseCases || []);
    const [selectedUseCase, setSelectedUseCase] = useState("login")

    // Mock data state
    const [documents, setDocuments] = useState({
        login: [
            { name: "auth-implementation.pdf", size: "2.3 MB", type: "pdf" },
            { name: "oauth-guide.pdf", size: "1.8 MB", type: "pdf" },
            { name: "jwt-tokens.pdf", size: "1.2 MB", type: "pdf" },
            { name: "legacy-systems.pdf", size: "3.2 MB", type: "pdf" },
            { name: "sso-saml-setup.pdf", size: "1.4 MB", type: "pdf" },
            { name: "password-hashing.pdf", size: "0.9 MB", type: "pdf" },
            { name: "mfa-workflow.pdf", size: "1.7 MB", type: "pdf" },
        ],
        serverApi: [
            { name: "rest-api-design.pdf", size: "3.2 MB", type: "pdf" },
            { name: "middleware-patterns.pdf", size: "2.1 MB", type: "pdf" },
            { name: "database-schema.pdf", size: "1.5 MB", type: "pdf" },
        ],
        clientCode: [
            { name: "react-best-practices.pdf", size: "2.7 MB", type: "pdf" },
            { name: "state-management.pdf", size: "1.9 MB", type: "pdf" },
        ],
    })

    const [uploadState, setUploadState] = useState({
        file: null,
        progress: 0,
        uploading: false,
    })
    const fileInputRef = useRef(null)

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const categoriesPerPage = 8;

    // PDF Viewer state
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState({ url: null, name: null });

    // PDF Name Dialog state
    const [nameDialogOpen, setNameDialogOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [customPdfNames, setCustomPdfNames] = useState({});

    // --- Logic Handlers ---

    const handleAddCategory = (newCategory) => {
        setUseCases(prev => [...prev, newCategory]);
        setDocuments(prev => ({ ...prev, [newCategory.id]: [] }));
        toast.success(`Category "${newCategory.name}" added successfully!`);
    };

    const useCasesWithCounts = useCases.map(uc => {
        // @ts-ignore
        const IconComponent = LucideIcons[uc.icon];
        return {
            ...uc,
            count: documents[uc.id]?.length || 0,
            icon: IconComponent ? React.createElement(IconComponent) : null
        };
    });

    const filteredCategories = useCasesWithCounts.filter(
        (uc) =>
            uc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            uc.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedCategories = filteredCategories.slice(
        (currentPage - 1) * categoriesPerPage,
        currentPage * categoriesPerPage
    );

    const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

    const validFileTypes = ["application/pdf"]
    const validExtensions = ['.pdf']

    const handleFiles = (files) => {
        if (!files || files.length === 0) return;

        const validFiles = [];
        const invalidFiles = [];

        Array.from(files).forEach(file => {
            const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
            const isValidType = validFileTypes.includes(file.type) || validExtensions.includes(fileExt);

            if (isValidType) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            toast.error(`Invalid files: ${invalidFiles.join(', ')}. Only PDF files are allowed.`);
        }

        if (validFiles.length > 0) {
            // Open name dialog to let user customize the PDF names
            setPendingFiles(validFiles);

            // Pre-fill names without .pdf extension
            const initialNames = {};
            validFiles.forEach((file, index) => {
                initialNames[index] = file.name.replace('.pdf', '');
            });
            setCustomPdfNames(initialNames);
            setNameDialogOpen(true);
        }
    }

    const confirmUpload = () => {
        if (!pendingFiles || pendingFiles.length === 0) return;

        setNameDialogOpen(false);

        // Process files sequentially
        const totalFiles = pendingFiles.length;
        const filesToProcess = [...pendingFiles]; // Create a copy
        const namesToUse = { ...customPdfNames }; // Create a copy

        const processNextFile = (fileIndex) => {
            if (fileIndex >= totalFiles) {
                toast.success(`${totalFiles} document${totalFiles > 1 ? 's' : ''} uploaded successfully!`);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setPendingFiles([]);
                setCustomPdfNames({});
                setUploadState({ file: null, progress: 0, uploading: false });
                return;
            }

            const file = filesToProcess[fileIndex];
            const customName = namesToUse[fileIndex]?.trim();
            const finalName = customName ? `${customName}.pdf` : file.name;

            let progress = 0;
            setUploadState({ file: file, progress: 0, uploading: true });

            const interval = setInterval(() => {
                progress += 10;

                if (progress >= 100) {
                    clearInterval(interval);

                    // Add document to list
                    const newDoc = {
                        name: finalName,
                        size: formatFileSize(file.size),
                        type: "pdf"
                    };
                    setDocuments(prev => ({
                        ...prev,
                        [selectedUseCase]: [...(prev[selectedUseCase] || []), newDoc]
                    }));

                    setUploadState({ file: null, progress: 0, uploading: false });

                    // Process next file after a short delay
                    setTimeout(() => processNextFile(fileIndex + 1), 100);
                } else {
                    setUploadState({ file: file, progress: progress, uploading: true });
                }
            }, 100);
        };

        processNextFile(0);
    }

    const cancelUpload = () => {
        setNameDialogOpen(false);
        setPendingFiles([]);
        setCustomPdfNames({});
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const handleFileChange = (event) => handleFiles(event.target.files)
    const handleDrop = (event) => {
        event.preventDefault()
        handleFiles(event.dataTransfer.files)
    }

    const deleteDocument = (useCase, docName) => {
        setDocuments(prev => ({
            ...prev,
            [useCase]: prev[useCase].filter(doc => doc.name !== docName)
        }))
        toast.success("Document deleted successfully!")
    }

    const openPdfViewer = (docName) => {
        // For demo purposes, we'll use a sample PDF URL
        // In production, you would fetch the actual PDF URL from your backend/database
        // Using a publicly available sample PDF for demonstration
        const samplePdfUrl = "https://pdfobject.com/pdf/sample.pdf";
        setSelectedPdf({ url: samplePdfUrl, name: docName });
        setPdfViewerOpen(true);
        toast.info("Opening PDF viewer...", { duration: 2000 });
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    }

    const currentDocs = documents[selectedUseCase] || [];
    const selectedCategoryName = useCases.find(uc => uc.id === selectedUseCase)?.name || "Category";

    return (
        <>
        {/* MAIN CONTAINER */}
        <div className="grid flex-1 grid-cols-1 gap-4 p-4 pt-0 md:grid-cols-12 md:gap-8 h-[calc(100vh-120px)] overflow-hidden">

            {/* ---------------------------------------------------------------------------
          COLUMN 1: CATEGORIES
         --------------------------------------------------------------------------- */}
            <div className="md:col-span-5 flex flex-col h-full min-h-0 rounded-xl bg-muted/50 border border-border/50 shadow-sm overflow-hidden">

                {/* Header (Fixed) */}
                <div className="flex items-center justify-between shrink-0 p-4 lg:p-6 pb-2">
                    <div className="relative w-full mr-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 bg-background"
                        />
                    </div>
                    <AddCategoryDialog onAddCategory={handleAddCategory} />
                </div>

                {/* Scrollable List */}
                <ScrollArea className="flex-1 h-full">
                    <div className="p-4 lg:p-6 pt-2 space-y-3 min-h-full">
                        {paginatedCategories.length > 0 ? (
                            paginatedCategories.map((useCase) => (
                                <CategoryCard
                                    key={useCase.id}
                                    useCase={useCase}
                                    onSelect={setSelectedUseCase}
                                    isSelected={selectedUseCase === useCase.id}
                                />
                            ))
                        ) : (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                No categories found
                            </div>
                        )}

                        {/* Spacer to allow final card to scroll fully into view */}
                        <div className="h-48" aria-hidden="true" />
                    </div>
                </ScrollArea>

                {/* Footer (Pagination - Fixed) */}
                {totalPages > 1 && (
                    <div className="shrink-0 p-4 lg:p-6 pt-0 border-t border-border/50 bg-muted/50 z-10">
                        <Pagination className="mt-2">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(p - 1, 1)); }}
                                        // @ts-ignore
                                        disabled={currentPage === 1}
                                    />
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="text-xs text-muted-foreground px-2">
                                        {currentPage}/{totalPages}
                                    </span>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(p + 1, totalPages)); }}
                                        // @ts-ignore
                                        disabled={currentPage === totalPages}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>


            {/* ---------------------------------------------------------------------------
          COLUMN 2: UPLOAD + DOCUMENTS
         --------------------------------------------------------------------------- */}
            <div className="md:col-span-7 flex flex-col h-full min-h-0 rounded-xl bg-muted/50 overflow-hidden border border-border/50 shadow-sm relative">

                {selectedUseCase ? (
                    <>
                        {/* --- SECTION A: UPLOAD (Fixed at Top) --- */}
                        <div className="shrink-0 p-6 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        {selectedCategoryName} <span className="text-muted-foreground font-normal text-sm">/ Upload</span>
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Add relevant documents to this knowledge base.</p>
                                </div>
                            </div>

                            <div
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-input px-6 py-8 transition-colors hover:bg-accent/50 hover:border-accent-foreground/50 bg-background"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                        <Upload className="h-6 w-6 text-primary" aria-hidden={true} />
                                    </div>
                                    <div>
                                        <div className="flex text-sm leading-6 text-muted-foreground justify-center sm:justify-start">
                                            <label
                                                htmlFor={`file-upload-${selectedUseCase}`}
                                                className="relative cursor-pointer font-semibold text-primary hover:underline hover:underline-offset-4"
                                            >
                                                <span>Click to upload</span>
                                                <input
                                                    id={`file-upload-${selectedUseCase}`}
                                                    name={`file-upload-${selectedUseCase}`}
                                                    type="file"
                                                    className="sr-only"
                                                    accept=".pdf,application/pdf"
                                                    multiple
                                                    onChange={handleFileChange}
                                                    ref={fileInputRef}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop PDFs</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">You can upload multiple files at once • Maximum 10MB per file</p>
                                    </div>
                                </div>

                                {uploadState.uploading && (
                                    <div className="w-full mt-4 max-w-md">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="truncate">{uploadState.file?.name}</span>
                                            <span>{uploadState.progress}%</span>
                                        </div>
                                        <Progress value={uploadState.progress} className="h-2" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- SECTION B: DOCUMENTS LIST (Scrollable Bottom) --- */}
                        <ScrollArea className="flex-1 h-full bg-muted/30">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        Attached Documents ({currentDocs.length})
                                    </h3>
                                </div>

                                {currentDocs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-60">
                                        <FolderOpen className="h-12 w-12 mb-2" />
                                        <p>No documents found in this category.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {currentDocs.map((doc, index) => (
                                            <div
                                                key={index}
                                                className="group relative flex items-start gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200 cursor-pointer"
                                                onClick={() => openPdfViewer(doc.name)}
                                            >
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                    <File className="h-6 w-6" />
                                                </div>

                                                <div className="flex-1 min-w-0 pt-1">
                                                    <p className="text-sm font-medium text-foreground truncate pr-6 hover:text-primary transition-colors" title={doc.name}>
                                                        {doc.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">PDF</span>
                                                        <span className="text-xs text-muted-foreground">•</span>
                                                        <span className="text-xs text-muted-foreground">{doc.size}</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteDocument(selectedUseCase, doc.name);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Spacer to allow final document card to scroll fully into view */}
                                <div className="h-96" aria-hidden="true" />
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center p-8">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No Category Selected</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">Select a category from the left sidebar to view documents and upload new files.</p>
                    </div>
                )}
            </div>

        </div>

        {/* PDF Viewer Dialog */}
        <PdfViewerDialog
            open={pdfViewerOpen}
            onOpenChange={setPdfViewerOpen}
            pdfUrl={selectedPdf.url}
            fileName={selectedPdf.name}
        />

        {/* PDF Name Dialog */}
        <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Name Your PDF{pendingFiles.length > 1 ? 's' : ''}</DialogTitle>
                    <DialogDescription>
                        {pendingFiles.length === 1
                            ? 'Choose a custom name for this PDF document. The .pdf extension will be added automatically.'
                            : `Customize names for ${pendingFiles.length} PDF documents. The .pdf extension will be added automatically.`
                        }
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[400px] pr-4">
                    <div className="grid gap-4 py-4">
                        {pendingFiles.map((file, index) => (
                            <div key={index} className="grid gap-2 p-4 rounded-lg border bg-muted/30">
                                <Label htmlFor={`pdf-name-${index}`}>
                                    Document {pendingFiles.length > 1 ? `${index + 1}` : 'Name'}
                                </Label>
                                <Input
                                    id={`pdf-name-${index}`}
                                    value={customPdfNames[index] || ''}
                                    onChange={(e) => setCustomPdfNames(prev => ({
                                        ...prev,
                                        [index]: e.target.value
                                    }))}
                                    placeholder="Enter document name"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && index === pendingFiles.length - 1) {
                                            confirmUpload();
                                        }
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Original: {file.name}
                                </p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={cancelUpload}>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmUpload}
                        disabled={Object.values(customPdfNames).some(name => !name?.trim())}
                    >
                        Upload {pendingFiles.length > 1 ? `${pendingFiles.length} Files` : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
    )
}