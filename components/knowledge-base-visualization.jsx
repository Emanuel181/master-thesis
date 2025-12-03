"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { File, X, Upload, Search, FolderOpen } from "lucide-react"
import * as LucideIcons from "lucide-react";
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area";

import { knowledgeBaseUseCases as initialUseCases } from "@/lib/knowledge-base-cases";
import { AddCategoryDialog } from "@/components/add-category-dialog";
import { CategoryCard } from "@/components/category-card";

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

    const handleFile = (file) => {
        if (!file) return

        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
        const isValidType = validFileTypes.includes(file.type) || validExtensions.includes(fileExt)

        if (isValidType) {
            setUploadState({ file, progress: 0, uploading: true })

            const interval = setInterval(() => {
                setUploadState((prev) => {
                    const newProgress = prev.progress + 10
                    if (newProgress >= 100) {
                        clearInterval(interval)
                        const newDoc = {
                            name: file.name,
                            size: formatFileSize(file.size),
                            type: "pdf"
                        }
                        setDocuments(prev => ({
                            ...prev,
                            [selectedUseCase]: [...(prev[selectedUseCase] || []), newDoc]
                        }))
                        toast.success("Document uploaded successfully!")
                        if (fileInputRef.current) fileInputRef.current.value = ""
                        return { file: null, progress: 0, uploading: false }
                    }
                    return { ...prev, progress: newProgress }
                })
            }, 150)
        } else {
            toast.error("Please upload a PDF file.")
        }
    }

    const handleFileChange = (event) => handleFile(event.target.files?.[0])
    const handleDrop = (event) => {
        event.preventDefault()
        handleFile(event.dataTransfer.files?.[0])
    }

    const deleteDocument = (useCase, docName) => {
        setDocuments(prev => ({
            ...prev,
            [useCase]: prev[useCase].filter(doc => doc.name !== docName)
        }))
        toast.success("Document deleted successfully!")
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
        // MAIN CONTAINER
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
                    {/* UPDATED: Added 'pb-20' (Padding Bottom 20).
                        This adds a significant buffer at the bottom of the list.
                        Now when you scroll to the end, you will see the full last card plus empty space below it.
                    */}
                    <div className="p-4 lg:p-6 pt-2 pb-20 space-y-3 min-h-full">
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
                                                    onChange={handleFileChange}
                                                    ref={fileInputRef}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop PDF</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Maximum file size 10MB</p>
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
                            {/* UPDATED: Added 'pb-20' here as well for the document list */}
                            <div className="p-6 pb-20">
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
                                            <div key={index} className="group relative flex items-start gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                    <File className="h-6 w-6" />
                                                </div>

                                                <div className="flex-1 min-w-0 pt-1">
                                                    <p className="text-sm font-medium text-foreground truncate pr-6" title={doc.name}>
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
                                                    onClick={() => deleteDocument(selectedUseCase, doc.name)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
    )
}