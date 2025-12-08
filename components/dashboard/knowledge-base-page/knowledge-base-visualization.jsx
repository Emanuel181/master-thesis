"use client"

import React, { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { File, X, Upload, Search, FolderOpen, Loader2, RefreshCw } from "lucide-react"
import * as LucideIcons from "lucide-react";
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area";

import { AddCategoryDialog } from "./add-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import { CategoryCard } from "./category-card";

// Dynamically import PDF viewer to avoid SSR issues with DOMMatrix
const PdfViewerDialog = dynamic(
  () => import("./pdf-viewer-dialog").then(mod => mod.PdfViewerDialog),
  { ssr: false }
);

export default function KnowledgeBaseVisualization() {
    const [useCases, setUseCases] = useState([]);
    const [selectedUseCase, setSelectedUseCase] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Documents state - initialized empty, will be populated from database
    const [documents, setDocuments] = useState({})

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

    // Track documents being deleted to prevent duplicate calls
    const [deletingDocs, setDeletingDocs] = useState(new Set());

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);

    // Edit use case dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [useCaseToEdit, setUseCaseToEdit] = useState(null);

    // Delete use case confirmation dialog state
    const [deleteUseCaseDialogOpen, setDeleteUseCaseDialogOpen] = useState(false);
    const [useCaseToDelete, setUseCaseToDelete] = useState(null);

    // Fetch use cases from database on mount
    useEffect(() => {
        fetchUseCases();
    }, []);

    const fetchUseCases = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/use-cases");
            if (!response.ok) {
                throw new Error("Failed to fetch use cases");
            }
            const data = await response.json();

            // Transform data to match expected format
            const transformedUseCases = data.useCases.map(uc => ({
                id: uc.id,
                name: uc.title,
                description: uc.content,
                icon: uc.icon,
            }));

            // Build documents map from PDFs
            const docsMap = {};
            data.useCases.forEach(uc => {
                docsMap[uc.id] = uc.pdfs.map(pdf => ({
                    id: pdf.id,
                    name: pdf.title,
                    size: formatFileSize(pdf.size),
                    sizeBytes: pdf.size,
                    type: "pdf",
                    url: pdf.url,
                    s3Key: pdf.s3Key,
                }));
            });

            setUseCases(transformedUseCases);
            setDocuments(docsMap);
        } catch (error) {
            console.error("Error fetching use cases:", error);
            toast.error("Failed to load use cases");
        } finally {
            setIsLoading(false);
        }
    };

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

    const confirmUpload = async () => {
        if (!pendingFiles || pendingFiles.length === 0) return;

        setNameDialogOpen(false);

        // Process files sequentially
        const totalFiles = pendingFiles.length;
        const filesToProcess = [...pendingFiles];
        const namesToUse = { ...customPdfNames };

        const processNextFile = async (fileIndex) => {
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

            setUploadState({ file: file, progress: 0, uploading: true });

            try {
                // Step 1: Get presigned URL from API
                setUploadState(prev => ({ ...prev, progress: 10 }));

                const presignedResponse = await fetch("/api/pdfs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: finalName,
                        fileSize: file.size,
                        useCaseId: selectedUseCase,
                    }),
                });

                if (!presignedResponse.ok) {
                    const errorData = await presignedResponse.json().catch(() => ({}));
                    throw new Error(errorData.error || "Failed to get upload URL");
                }

                const { uploadUrl, s3Key } = await presignedResponse.json();
                setUploadState(prev => ({ ...prev, progress: 30 }));

                // Step 2: Upload file directly to S3
                const uploadResponse = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": "application/pdf" },
                    body: file,
                });

                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text().catch(() => "");
                    console.error("S3 upload error:", uploadResponse.status, errorText);
                    throw new Error(`S3 upload failed (${uploadResponse.status}). Check CORS configuration.`);
                }

                setUploadState(prev => ({ ...prev, progress: 70 }));

                // Step 3: Confirm upload and save to database
                const confirmResponse = await fetch("/api/pdfs/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        s3Key,
                        fileName: finalName,
                        fileSize: file.size,
                        useCaseId: selectedUseCase,
                    }),
                });

                if (!confirmResponse.ok) {
                    throw new Error("Failed to confirm upload");
                }

                const { pdf } = await confirmResponse.json();
                setUploadState(prev => ({ ...prev, progress: 100 }));

                // Add document to local state
                const newDoc = {
                    id: pdf.id,
                    name: pdf.title,
                    size: formatFileSize(pdf.size),
                    sizeBytes: pdf.size,
                    type: "pdf",
                    url: pdf.url,
                    s3Key: pdf.s3Key,
                };

                setDocuments(prev => ({
                    ...prev,
                    [selectedUseCase]: [...(prev[selectedUseCase] || []), newDoc]
                }));

                setUploadState({ file: null, progress: 0, uploading: false });

                // Process next file after a short delay
                setTimeout(() => processNextFile(fileIndex + 1), 100);

            } catch (error) {
                console.error("Upload error:", error);
                toast.error(`Failed to upload ${finalName}: ${error.message}`);
                setUploadState({ file: null, progress: 0, uploading: false });
                // Continue with next file
                setTimeout(() => processNextFile(fileIndex + 1), 100);
            }
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

    // Open delete confirmation dialog
    const confirmDelete = (useCaseId, doc) => {
        setDocumentToDelete({ useCaseId, doc });
        setDeleteDialogOpen(true);
    };

    // Handle edit use case
    const handleEditUseCase = (useCase) => {
        setUseCaseToEdit(useCase);
        setEditDialogOpen(true);
    };

    // Handle delete use case confirmation
    const handleDeleteUseCase = (useCase) => {
        setUseCaseToDelete(useCase);
        setDeleteUseCaseDialogOpen(true);
    };

    // Handle actual deletion after confirmation
    const handleConfirmedDelete = async () => {
        if (!documentToDelete) return;

        const { useCaseId, doc } = documentToDelete;
        const docId = doc.id;

        // Close dialog first
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);

        // Prevent duplicate delete calls
        if (deletingDocs.has(docId)) {
            return;
        }

        setDeletingDocs(prev => new Set(prev).add(docId));

        try {
            const response = await fetch(`/api/pdfs/${docId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete document");
            }

            setDocuments(prev => ({
                ...prev,
                [useCaseId]: prev[useCaseId].filter(d => d.id !== docId)
            }));
            toast.success("Document deleted successfully!");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete document");
        } finally {
            setDeletingDocs(prev => {
                const newSet = new Set(prev);
                newSet.delete(docId);
                return newSet;
            });
        }
    }

    const openPdfViewer = async (doc) => {
        try {
            // Fetch a fresh presigned URL from the API
            const response = await fetch(`/api/pdfs/${doc.id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch PDF URL");
            }
            const data = await response.json();
            setSelectedPdf({ url: data.pdf.url, name: doc.name });
            setPdfViewerOpen(true);
            toast.info("Opening PDF viewer...", { duration: 2000 });
        } catch (error) {
            console.error("Error fetching PDF:", error);
            toast.error("Failed to open PDF viewer");
        }
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
        <div className="grid flex-1 grid-cols-1 gap-4 pt-0 pb-4 pl-0 md:grid-cols-12 md:gap-8 h-[calc(100vh-120px)] overflow-hidden">

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
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchUseCases}
                            title="Refresh use cases"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <AddCategoryDialog onAddCategory={handleAddCategory} />
                    </div>
                </div>

                {/* Scrollable List */}
                <ScrollArea className="flex-1 h-full">
                    <div className="p-4 lg:p-6 pt-2 space-y-3 min-h-full">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Loading categories...</p>
                            </div>
                        ) : paginatedCategories.length > 0 ? (
                            paginatedCategories.map((useCase) => (
                                <CategoryCard
                                    key={useCase.id}
                                    useCase={useCase}
                                    onSelect={setSelectedUseCase}
                                    isSelected={selectedUseCase === useCase.id}
                                    onEdit={handleEditUseCase}
                                    onDelete={handleDeleteUseCase}
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
                                                onClick={() => openPdfViewer(doc)}
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
                                                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                                    disabled={deletingDocs.has(doc.id)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmDelete(selectedUseCase, doc);
                                                    }}
                                                >
                                                    {deletingDocs.has(doc.id) ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <X className="h-4 w-4" />
                                                    )}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &quot;{documentToDelete?.doc?.name}&quot;? This action cannot be undone and the document will be permanently removed from storage.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmedDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Edit Category Dialog */}
        <EditCategoryDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            useCase={useCaseToEdit}
            onUpdate={(updatedCategory) => {
                setUseCases(prev => prev.map(uc => uc.id === updatedCategory.id ? updatedCategory : uc));
                toast.success(`Category "${updatedCategory.name}" updated successfully!`);
            }}
        />

        {/* Delete Use Case Confirmation Dialog */}
        <AlertDialog open={deleteUseCaseDialogOpen} onOpenChange={setDeleteUseCaseDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Use Case</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this use case? All associated documents will also be deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setUseCaseToDelete(null)}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={async () => {
                            if (!useCaseToDelete) return;

                            const { id } = useCaseToDelete;

                            setDeleteUseCaseDialogOpen(false);
                            setUseCaseToDelete(null);

                            try {
                                const response = await fetch(`/api/use-cases/${id}`, {
                                    method: "DELETE",
                                });

                                if (!response.ok) {
                                    throw new Error("Failed to delete use case");
                                }

                                setUseCases(prev => prev.filter(uc => uc.id !== id));
                                setDocuments(prev => {
                                    const newDocs = { ...prev };
                                    delete newDocs[id];
                                    return newDocs;
                                });
                                toast.success("Use case deleted successfully!");
                            } catch (error) {
                                console.error("Delete use case error:", error);
                                toast.error("Failed to delete use case");
                            }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
    )
}
