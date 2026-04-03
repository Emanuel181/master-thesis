"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { File, X, Upload, Search, FolderOpen, Loader2, RefreshCw, Folder, FolderPlus, PanelLeftClose, PanelLeftOpen, GripVertical, Download, Trash2 } from "lucide-react"
import * as LucideIcons from "lucide-react";
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { AddCategoryDialog } from "./add-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import { CategoryCard } from "./category-card";
import { FolderTree } from "./folder-tree";
import { UseCaseGroupsPanel } from "./use-case-groups-panel";
import { CategoryCardSkeleton, DocumentListSkeleton } from "@/components/ui/loading-skeletons";
import { NoCategoriesEmptyState, NoDocumentsEmptyState, NoSearchResultsEmptyState } from "@/components/ui/empty-states";
import { DEMO_USE_CASES, DEMO_USE_CASE_GROUPS, DEMO_DOCUMENTS } from "@/contexts/demoContext";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";

// Dynamically import PDF viewer to avoid SSR issues with DOMMatrix
const PdfViewerDialog = dynamic(
  () => import("./pdf-viewer-dialog").then(mod => mod.PdfViewerDialog),
  { ssr: false }
);

export default function KnowledgeBaseVisualization() {
    const pathname = usePathname();
    const isDemoMode = pathname?.startsWith('/demo');
    
    // Biometric authentication for sensitive actions
    const { authenticate: biometricAuth, isAuthenticating: isBioAuthenticating } = useBiometricAuth();
    const [isDownloading, setIsDownloading] = useState(false);

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
    const folderTreeRef = useRef(null)

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const categoriesPerPage = 10;

    const [currentDocPage, setCurrentDocPage] = useState(1);
    const docsPerPage = 10;

    // PDF Viewer state
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState({ url: null, name: null });

    // PDF Name Dialog state
    const [nameDialogOpen, setNameDialogOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [customPdfNames, setCustomPdfNames] = useState({});

    // Upload location state: "root" | "existing" | "new"
    const [uploadLocation, setUploadLocation] = useState("root");
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [newFolderName, setNewFolderName] = useState("");
    const [availableFolders, setAvailableFolders] = useState([]);

    // Folder picker state for upload dialog
    const [folderSearchTerm, setFolderSearchTerm] = useState("");
    const [folderPage, setFolderPage] = useState(1);
    const FOLDERS_PER_PAGE = 8;

    // Track documents being deleted to prevent duplicate calls
    const [deletingDocs, setDeletingDocs] = useState(new Set());

    // Drop zone drag-active state
    const [isDragActive, setIsDragActive] = useState(false);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);

    // Edit use case dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [useCaseToEdit, setUseCaseToEdit] = useState(null);

    // Delete use case confirmation dialog state
    const [deleteUseCaseDialogOpen, setDeleteUseCaseDialogOpen] = useState(false);
    const [useCaseToDelete, setUseCaseToDelete] = useState(null);

    // Track selected documents for bulk actions
    const [selectedDocs, setSelectedDocs] = useState(new Set());

    // Track refreshing use cases
    const [refreshingUseCases, setRefreshingUseCases] = useState(new Set());

    // Use case groups state
    const [useCaseGroups, setUseCaseGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [showGroupsPanel, setShowGroupsPanel] = useState(true);
    const [isGroupsPanelCollapsed, setIsGroupsPanelCollapsed] = useState(false);

    // Resizable columns state (percentages for categories and documents columns)
    const [categoriesWidth, setCategoriesWidth] = useState(42); // 5/12 ≈ 42%
    const [isResizing, setIsResizing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const resizeRef = useRef(null);
    const containerRef = useRef(null);

    // Resizable groups panel width (px)
    const [groupsPanelWidth, setGroupsPanelWidth] = useState(256); // default lg:w-64 = 256px
    const [isResizingGroups, setIsResizingGroups] = useState(false);
    const groupsResizeRef = useRef(null);

    // Multi-select use cases for drag-drop to groups
    const [selectedUseCases, setSelectedUseCases] = useState(new Set());

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Collapse groups panel by default on mobile
            if (mobile) {
                setIsGroupsPanelCollapsed(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch use cases and groups from database on mount
    useEffect(() => {
        fetchUseCases();
        fetchUseCaseGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only needed on mount
    }, [isDemoMode]);

    // Reset document page and selection when use case changes
    useEffect(() => {
        setCurrentDocPage(1);
        setSelectedDocs(new Set());
    }, [selectedUseCase]);

    // Poll vectorization + virus scan status for documents still in progress
    // Notifications are handled server-side via DB; this only updates UI badges.
    useEffect(() => {
        const pollingIds = [];
        Object.values(documents).forEach(docs => {
            (docs || []).forEach(doc => {
                if (doc.embeddingStatus === 'processing' || doc.embeddingStatus === 'pending' ||
                    doc.virusScanStatus === 'scanning') {
                    pollingIds.push(doc.id);
                }
            });
        });

        if (pollingIds.length === 0) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/pdfs/vectorization-status?ids=${pollingIds.join(',')}`);
                if (!res.ok) return;
                const data = await res.json();
                const updatedDocs = data.data?.documents || data.documents || [];

                if (updatedDocs.length === 0) return;

                // Build lookup map
                const statusMap = {};
                updatedDocs.forEach(d => { statusMap[d.id] = d; });

                // Update local state with all new statuses
                setDocuments(prev => {
                    const next = { ...prev };
                    let changed = false;
                    for (const [ucId, docs] of Object.entries(next)) {
                        next[ucId] = (docs || []).map(doc => {
                            const updated = statusMap[doc.id];
                            if (!updated) return doc;
                            const needsUpdate =
                                (updated.embeddingStatus !== doc.embeddingStatus) ||
                                (updated.vectorized !== doc.vectorized) ||
                                (updated.virusScanStatus && updated.virusScanStatus !== doc.virusScanStatus);
                            if (needsUpdate) {
                                changed = true;
                                return {
                                    ...doc,
                                    vectorized: updated.vectorized,
                                    embeddingStatus: updated.embeddingStatus,
                                    ...(updated.virusScanStatus ? { virusScanStatus: updated.virusScanStatus } : {}),
                                };
                            }
                            return doc;
                        });
                    }
                    return changed ? next : prev;
                });
            } catch {
                // Silently ignore polling errors
            }
        }, 8000); // Poll every 8 seconds

        return () => clearInterval(interval);
    }, [documents]);

    const fetchUseCases = async () => {
        try {
            setIsLoading(true);
            
            // In demo mode, use demo data instead of fetching
            if (isDemoMode) {
                const transformedUseCases = DEMO_USE_CASES.map(uc => ({
                    id: uc.id,
                    name: uc.name,
                    description: uc.description,
                    fullDescription: uc.fullDescription,
                    shortDescription: uc.shortDescription,
                    icon: uc.icon,
                    color: uc.color || 'default',
                    groupId: uc.groupId || null,
                    order: uc.order || 0,
                    pdfCount: uc.pdfCount,
                    formattedTotalSize: uc.formattedTotalSize,
                }));
                setUseCases(transformedUseCases);
                setDocuments(DEMO_DOCUMENTS);
                setIsLoading(false);
                return;
            }

            const response = await fetch("/api/use-cases");
            if (!response.ok) {
                throw new Error("Failed to fetch use cases");
            }
            const result = await response.json();
            const data = result.data || result;

            // Transform data to match expected format
            const transformedUseCases = (data.useCases || []).map(uc => ({
                id: uc.id,
                name: uc.title,
                description: uc.shortDescription || uc.shortContent || uc.content, // Display truncated
                fullDescription: uc.fullContent || uc.content, // Keep full for "Show More"
                shortDescription: uc.shortDescription, // Word-based truncation
                icon: uc.icon,
                color: uc.color || 'default',
                groupId: uc.groupId || null,
                order: uc.order || 0,
                pdfCount: uc.pdfCount,
                formattedTotalSize: uc.formattedTotalSize,
            }));

            // Build documents map from PDFs - use backend-formatted size
            const docsMap = {};
            data.useCases.forEach(uc => {
                docsMap[uc.id] = uc.pdfs.map(pdf => ({
                    id: pdf.id,
                    name: pdf.title,
                    size: pdf.formattedSize || formatFileSize(pdf.size), // Prefer backend-formatted
                    sizeBytes: pdf.size,
                    type: "pdf",
                    url: pdf.url,
                    s3Key: pdf.s3Key,
                    vectorized: pdf.vectorized || false,
                    embeddingStatus: pdf.embeddingStatus || 'pending',
                    virusScanStatus: pdf.virusScanStatus || 'pending',
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

    const fetchUseCaseGroups = async () => {
        try {
            // In demo mode, use demo data
            if (isDemoMode) {
                setUseCaseGroups(DEMO_USE_CASE_GROUPS);
                return;
            }

            const response = await fetch("/api/use-case-groups");
            if (!response.ok) {
                throw new Error("Failed to fetch groups");
            }
            const jsonResponse = await response.json();

            // The API returns { success: true, data: { groups: [...] } }
            const groups = jsonResponse.data?.groups || jsonResponse.groups || [];

            // Filter out any null/undefined values
            const validGroups = groups.filter(g => g && g.id);
            setUseCaseGroups(validGroups);
        } catch (error) {
            console.error("[KnowledgeBase] Error fetching use case groups:", error);
            // Don't show error toast - groups are optional
            setUseCaseGroups([]);
        }
    };

    // --- Resize Handlers ---
    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleResizeMove = useCallback((e) => {
        if (!isResizing || !containerRef.current) return;

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const panelWidth = isGroupsPanelCollapsed ? 48 : groupsPanelWidth + 8; // panel + resize handle
        const availableWidth = containerRect.width - panelWidth - 48; // minus gaps and resize handle

        // Calculate mouse position relative to the resizable area
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const mouseX = clientX - containerRect.left - panelWidth - 16;
        // Minimum 25% to ensure card content is readable, maximum 75%
        const newWidth = Math.max(25, Math.min(75, (mouseX / availableWidth) * 100));

        setCategoriesWidth(newWidth);
    }, [isResizing, isGroupsPanelCollapsed, groupsPanelWidth]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
    }, []);

    // Add/remove resize event listeners
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
            window.addEventListener('touchmove', handleResizeMove);
            window.addEventListener('touchend', handleResizeEnd);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
            window.removeEventListener('touchmove', handleResizeMove);
            window.removeEventListener('touchend', handleResizeEnd);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    // ── Groups panel resize handlers ──────────────────────────────────
    const handleGroupsResizeMove = useCallback((e) => {
        if (!isResizingGroups || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const newWidth = clientX - containerRect.left;
        // Clamp between 160px and 600px
        setGroupsPanelWidth(Math.max(160, Math.min(600, newWidth)));
    }, [isResizingGroups]);

    const handleGroupsResizeEnd = useCallback(() => {
        setIsResizingGroups(false);
    }, []);

    useEffect(() => {
        if (isResizingGroups) {
            window.addEventListener('mousemove', handleGroupsResizeMove);
            window.addEventListener('mouseup', handleGroupsResizeEnd);
            window.addEventListener('touchmove', handleGroupsResizeMove);
            window.addEventListener('touchend', handleGroupsResizeEnd);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleGroupsResizeMove);
            window.removeEventListener('mouseup', handleGroupsResizeEnd);
            window.removeEventListener('touchmove', handleGroupsResizeMove);
            window.removeEventListener('touchend', handleGroupsResizeEnd);
            if (!isResizing) {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };
    }, [isResizingGroups, handleGroupsResizeMove, handleGroupsResizeEnd, isResizing]);

    // --- Logic Handlers ---

    const handleAddCategory = (newCategory) => {
        setUseCases(prev => [...prev, newCategory]);
        setDocuments(prev => ({ ...prev, [newCategory.id]: [] }));
        toast.success(`Category "${newCategory.name}" added successfully!`);
    };

    // Handle moving use cases to a group
    const handleMoveUseCasesToGroup = async (useCaseIds, targetGroupId) => {
        if (!useCaseIds || useCaseIds.length === 0) {
            return;
        }

        if (isDemoMode) {
            // Mock in demo mode
            setUseCases(prev => prev.map(uc =>
                useCaseIds.includes(uc.id) ? { ...uc, groupId: targetGroupId } : uc
            ));
            setSelectedUseCases(new Set());
            const groupName = targetGroupId
                ? useCaseGroups.find(g => g.id === targetGroupId)?.name || 'group'
                : 'Ungrouped';
            toast.success(`Moved ${useCaseIds.length} use case(s) to ${groupName}`);
            return;
        }

        // Show loading toast
        const loadingToast = toast.loading(`Moving ${useCaseIds.length} use case(s)...`);

        try {
            // Move each use case
            const movePromises = useCaseIds.map(id =>
                fetch(`/api/use-cases/${id}/move`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ groupId: targetGroupId }),
                })
            );

            const results = await Promise.all(movePromises);
            const allSuccessful = results.every(r => r.ok);

            toast.dismiss(loadingToast);

            if (allSuccessful) {
                setUseCases(prev => prev.map(uc =>
                    useCaseIds.includes(uc.id) ? { ...uc, groupId: targetGroupId } : uc
                ));
                setSelectedUseCases(new Set());
                const groupName = targetGroupId
                    ? useCaseGroups.find(g => g.id === targetGroupId)?.name || 'group'
                    : 'Ungrouped';
                toast.success(`Moved ${useCaseIds.length} use case(s) to ${groupName}`);
            } else {
                toast.error("Some use cases failed to move");
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error("Error moving use cases:", error);
            toast.error("Failed to move use cases");
        }
    };

    // Toggle use case selection
    const toggleUseCaseSelection = (useCaseId) => {
        setSelectedUseCases(prev => {
            const next = new Set(prev);
            if (next.has(useCaseId)) {
                next.delete(useCaseId);
            } else {
                next.add(useCaseId);
            }
            return next;
        });
    };

    // Clear use case selection
    const clearUseCaseSelection = () => {
        setSelectedUseCases(new Set());
    };

    // Move PDFs from one category to another (drag-drop on category card)
    const handleMovePdfsToCategory = async (pdfIds, targetUseCaseId) => {
        if (!pdfIds || pdfIds.length === 0 || !targetUseCaseId) return;
        try {
            const res = await fetch("/api/pdfs/bulk-move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pdfIds, targetUseCaseId }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to move documents");
            }
            const data = await res.json();
            toast.success(`Moved ${data.data?.moved || pdfIds.length} document(s)`);
            // Refresh all to keep state consistent
            fetchUseCases();
        } catch (error) {
            console.error("Move PDFs error:", error);
            toast.error(error.message || "Failed to move documents");
        }
    };

    const useCasesWithCounts = useCases.map(uc => {
        // @ts-ignore
        const IconComponent = LucideIcons[uc.icon];
        return {
            ...uc,
            count: documents[uc.id]?.length || 0,
            iconElement: IconComponent ? React.createElement(IconComponent) : null
        };
    });


    // Max pdf count for relative density on category cards
    const maxPdfCount = useMemo(() => {
        return Math.max(1, ...useCasesWithCounts.map(uc => uc.count));
    }, [useCasesWithCounts]);

    const filteredCategories = useCasesWithCounts.filter(
        (uc) => {
            // Filter by search term
            const matchesSearch = uc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                uc.description.toLowerCase().includes(searchTerm.toLowerCase());

            // Filter by selected group
            // null means show all, "ungrouped" means show only items without a group
            let matchesGroup = true;
            if (selectedGroupId === null) {
                matchesGroup = true; // Show all
            } else if (selectedGroupId === "ungrouped") {
                matchesGroup = !uc.groupId; // Show only ungrouped items
            } else {
                matchesGroup = uc.groupId === selectedGroupId; // Show items in specific group
            }

            return matchesSearch && matchesGroup;
        }
    );

    const paginatedCategories = filteredCategories.slice(
        (currentPage - 1) * categoriesPerPage,
        currentPage * categoriesPerPage
    );

    const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

    // Filtered folders based on search
    const filteredFoldersForUpload = useMemo(() => {
        if (!folderSearchTerm.trim()) return availableFolders;
        const search = folderSearchTerm.toLowerCase();
        return availableFolders.filter(folder =>
            folder.name.toLowerCase().includes(search) ||
            folder.path.toLowerCase().includes(search)
        );
    }, [availableFolders, folderSearchTerm]);

    // Paginated folders for upload dialog
    const paginatedFoldersForUpload = useMemo(() => {
        const start = (folderPage - 1) * FOLDERS_PER_PAGE;
        return filteredFoldersForUpload.slice(start, start + FOLDERS_PER_PAGE);
    }, [filteredFoldersForUpload, folderPage]);

    // Total pages for folder selection
    const totalFolderPages = Math.ceil(filteredFoldersForUpload.length / FOLDERS_PER_PAGE);

    const validFileTypes = ["application/pdf"]
    const validExtensions = ['.pdf']

    // Fetch folders for upload location selection
    const fetchFoldersForUpload = async () => {
        if (!selectedUseCase) return;
        try {
            const response = await fetch(`/api/folders?useCaseId=${selectedUseCase}`);
            if (!response.ok) throw new Error("Failed to fetch folders");
            const data = await response.json();

            // Flatten the folder tree for the select dropdown
            const flattenFolders = (folders, depth = 0, parentPath = "") => {
                let result = [];
                folders.forEach(folder => {
                    if (folder.type === "folder") {
                        const path = parentPath ? `${parentPath} / ${folder.name}` : folder.name;
                        result.push({ id: folder.id, name: folder.name, path, depth });
                        if (folder.children) {
                            result = result.concat(flattenFolders(folder.children.filter(c => c.type === "folder"), depth + 1, path));
                        }
                    }
                });
                return result;
            };

            setAvailableFolders(flattenFolders(data.folders || []));
        } catch (error) {
            console.error("Error fetching folders:", error);
        }
    };

    const handleFiles = async (files) => {
        if (!files || files.length === 0) return;

        // Enforce max 4 PDFs per user
        const MAX_PDFS_PER_USER = 4;
        const totalExistingPdfs = Object.values(documents).reduce(
            (sum, docs) => sum + (docs || []).length, 0
        );
        const remainingSlots = MAX_PDFS_PER_USER - totalExistingPdfs;

        if (remainingSlots <= 0) {
            toast.error(`You've reached the limit of ${MAX_PDFS_PER_USER} PDFs. Delete an existing file to upload more.`);
            return;
        }

        const MAX_PDF_SIZE = 12 * 1024 * 1024; // 12MB
        const validFiles = [];
        const invalidFiles = [];
        const oversizedFiles = [];

        Array.from(files).forEach(file => {
            const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
            const isValidType = validFileTypes.includes(file.type) || validExtensions.includes(fileExt);

            if (!isValidType) {
                invalidFiles.push(file.name);
            } else if (file.size > MAX_PDF_SIZE) {
                oversizedFiles.push(file.name);
            } else {
                validFiles.push(file);
            }
        });

        if (invalidFiles.length > 0) {
            toast.error(`Invalid files: ${invalidFiles.join(', ')}. Only PDF files are allowed.`);
        }

        if (oversizedFiles.length > 0) {
            toast.error(`Files too large (max 12 MB): ${oversizedFiles.join(', ')}`);
        }

        // Trim to remaining slots
        if (validFiles.length > remainingSlots) {
            toast.warning(`Only ${remainingSlots} upload slot${remainingSlots !== 1 ? 's' : ''} remaining (max ${MAX_PDFS_PER_USER} PDFs). ${validFiles.length - remainingSlots} file(s) were excluded.`);
            validFiles.length = remainingSlots;
        }

        if (validFiles.length > 0) {
            // Fetch available folders for upload location selection
            await fetchFoldersForUpload();

            // Reset upload location state
            setUploadLocation("root");
            setSelectedFolderId(null);
            setNewFolderName("");
            setFolderSearchTerm("");
            setFolderPage(1);

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

        // Validate new folder name if creating new folder
        if (uploadLocation === "new" && !newFolderName.trim()) {
            toast.error("Please enter a folder name");
            return;
        }

        setNameDialogOpen(false);

        let targetFolderId = null;

        // Create new folder if needed
        if (uploadLocation === "new") {
            try {
                const response = await fetch("/api/folders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: newFolderName.trim(),
                        useCaseId: selectedUseCase,
                        parentId: null, // Create at root level
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to create folder");
                }

                const data = await response.json();
                targetFolderId = data.folder.id;
                toast.success(`Folder "${newFolderName}" created`);
            } catch (error) {
                console.error("Error creating folder:", error);
                toast.error("Failed to create folder");
                return;
            }
        } else if (uploadLocation === "existing") {
            targetFolderId = selectedFolderId;
        }

        // Process files sequentially
        const totalFiles = pendingFiles.length;
        const filesToProcess = [...pendingFiles];
        const namesToUse = { ...customPdfNames };

        const processNextFile = async (fileIndex) => {
            if (fileIndex >= totalFiles) {
                toast.success(`📄 ${totalFiles} document${totalFiles > 1 ? 's' : ''} uploaded and scanned! Vectorization in progress — check 🔔 for updates.`, { duration: 5000 });
                if (fileInputRef.current) fileInputRef.current.value = "";
                setPendingFiles([]);
                setCustomPdfNames({});
                setUploadState({ file: null, progress: 0, uploading: false });
                // Refresh the folder tree to show new files
                folderTreeRef.current?.refresh();
                return;
            }

            const file = filesToProcess[fileIndex];
            const customName = namesToUse[fileIndex]?.trim();
            const finalName = customName ? `${customName}.pdf` : file.name;

            setUploadState({ file: file, progress: 0, uploading: true, status: 'Scanning for threats…' });

            try {
                // Step 1: Security scan BEFORE uploading to S3
                setUploadState(prev => ({ ...prev, progress: 5, status: `🔍 Scanning "${finalName}" for threats…` }));

                let scanVerdict = 'skipped';
                const scanForm = new FormData();
                scanForm.append('file', file);
                scanForm.append('fileName', finalName);

                try {
                    const scanRes = await fetch("/api/pdfs/pre-scan", {
                        method: "POST",
                        credentials: "include",
                        body: scanForm,
                    });

                    if (scanRes.ok) {
                        const scanJson = await scanRes.json();
                        const scanData = scanJson.data || scanJson;
                        scanVerdict = scanData.verdict || 'clean';

                        if (scanVerdict === 'malicious') {
                            toast.error(`🛑 "${finalName}" was flagged as malicious and will not be uploaded.`, { duration: 8000 });
                            // Skip this file, continue with next
                            await processNextFile(fileIndex + 1);
                            return;
                        }
                    } else {
                        // Scan endpoint returned error — treat as scan error, proceed anyway
                        scanVerdict = 'error';
                        console.warn(`Pre-scan failed for "${finalName}", proceeding with upload.`);
                    }
                } catch (scanErr) {
                    console.warn(`Pre-scan network error for "${finalName}":`, scanErr.message);
                    scanVerdict = 'error';
                }

                setUploadState(prev => ({ ...prev, progress: 25, status: scanVerdict === 'clean' ? `🛡️ "${finalName}" is clean — uploading…` : `⚠️ Scan inconclusive — uploading…` }));

                // Step 2: Get presigned URL from API
                const presignedResponse = await fetch("/api/pdfs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        fileName: finalName,
                        fileSize: file.size,
                        useCaseId: selectedUseCase,
                        folderId: targetFolderId,
                    }),
                });

                if (!presignedResponse.ok) {
                    const errorData = await presignedResponse.json().catch(() => ({}));
                    throw new Error(errorData.error || "Failed to get upload URL");
                }

                const presignedData = await presignedResponse.json();
                const { uploadUrl, s3Key } = presignedData.data || presignedData;
                
                if (!uploadUrl || !s3Key) {
                    console.error("Invalid presigned response:", presignedData);
                    throw new Error("Failed to get upload URL from server");
                }
                
                setUploadState(prev => ({ ...prev, progress: 40, status: `📤 Uploading "${finalName}"…` }));

                // Step 3: Upload file directly to S3
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

                setUploadState(prev => ({ ...prev, progress: 75, status: `✅ Confirming "${finalName}"…` }));

                // Step 4: Confirm upload and save to database (pass scan verdict)
                const confirmResponse = await fetch("/api/pdfs/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        s3Key,
                        fileName: finalName,
                        fileSize: file.size,
                        useCaseId: selectedUseCase,
                        folderId: targetFolderId,
                        scanVerdict,
                    }),
                });

                if (!confirmResponse.ok) {
                    const errorData = await confirmResponse.json().catch(() => ({}));
                    throw new Error(errorData.error || "Failed to confirm upload");
                }

                const confirmData = await confirmResponse.json();
                const pdf = confirmData.data?.pdf || confirmData.pdf;
                
                if (!pdf) {
                    console.error("Invalid confirm response:", confirmData);
                    throw new Error("Failed to confirm upload");
                }
                
                setUploadState(prev => ({ ...prev, progress: 100, status: `📊 Vectorizing "${finalName}"…` }));

                // Add document to local state
                const newDoc = {
                    id: pdf.id,
                    name: pdf.title,
                    size: formatFileSize(pdf.size),
                    sizeBytes: pdf.size,
                    type: "pdf",
                    url: pdf.url,
                    s3Key: pdf.s3Key,
                    vectorized: pdf.vectorized || false,
                    embeddingStatus: pdf.embeddingStatus || 'processing', // Server triggers vectorization on confirm
                    virusScanStatus: scanVerdict === 'clean' ? 'clean' : scanVerdict === 'skipped' ? 'skipped' : 'error',
                };

                setDocuments(prev => ({
                    ...prev,
                    [selectedUseCase]: [...(prev[selectedUseCase] || []), newDoc]
                }));

                // Refresh folder tree
                folderTreeRef.current?.refresh();

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

    // Handle refresh all use cases based on selected group
    const handleRefreshAllUseCases = async () => {
        // Get use cases to refresh based on selected group
        let useCasesToRefresh = [];

        if (selectedGroupId === null) {
            // All use cases
            useCasesToRefresh = useCases;
        } else if (selectedGroupId === "ungrouped") {
            // Only ungrouped use cases
            useCasesToRefresh = useCases.filter(uc => !uc.groupId);
        } else {
            // Use cases in the selected group
            useCasesToRefresh = useCases.filter(uc => uc.groupId === selectedGroupId);
        }

        if (useCasesToRefresh.length === 0) {
            toast.info("No use cases to refresh in this view");
            return;
        }

        // Refresh each use case
        const groupName = selectedGroupId === null
            ? "all use cases"
            : selectedGroupId === "ungrouped"
                ? "ungrouped"
                : useCaseGroups.find(g => g.id === selectedGroupId)?.name || "group";

        toast.info(`Refreshing ${useCasesToRefresh.length} use case(s) in ${groupName}...`);

        for (const useCase of useCasesToRefresh) {
            await handleRefreshUseCase(useCase);
        }
    };

    // Handle refresh use case (sync documents from S3)
    const handleRefreshUseCase = async (useCase) => {
        if (refreshingUseCases.has(useCase.id)) return;
        
        setRefreshingUseCases(prev => new Set(prev).add(useCase.id));
        
        try {
            // Demo mode - mock refresh
            if (isDemoMode) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                toast.success(`"${useCase.name}" synced successfully! ${useCase.count || 0} documents found. (demo)`);
                setRefreshingUseCases(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(useCase.id);
                    return newSet;
                });
                return;
            }
            
            // Production mode - actually sync from S3
            const response = await fetch(`/api/use-cases/${useCase.id}/sync`, {
                method: "POST",
                credentials: "include",
            });
            
            if (!response.ok) {
                throw new Error("Failed to sync documents");
            }
            
            const data = await response.json();
            toast.success(`"${useCase.name}" synced successfully! ${data.documentsFound || 0} documents found.`);
            
            // Refresh the use cases and documents list
            fetchUseCases();
        } catch (error) {
            console.error("Error syncing use case:", error);
            toast.error(`Failed to sync "${useCase.name}"`);
        } finally {
            setRefreshingUseCases(prev => {
                const newSet = new Set(prev);
                newSet.delete(useCase.id);
                return newSet;
            });
        }
    };

    // Handle actual deletion after confirmation (with biometric auth)
    const handleConfirmedDelete = async () => {
        if (!documentToDelete) return;

        const { useCaseId, doc } = documentToDelete;
        const docId = doc.id;

        // Close dialog first
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);

        // Require biometric authentication
        try {
            await biometricAuth();
        } catch {
            return;
        }

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
            // Demo mode - show a placeholder PDF view
            if (isDemoMode) {
                setSelectedPdf({ 
                    url: null, 
                    name: doc.name || doc.title,
                    isDemo: true 
                });
                setPdfViewerOpen(true);
                toast.info("Opening demo PDF viewer...", { duration: 2000 });
                return;
            }

            // Fetch a fresh presigned URL from the API
            const response = await fetch(`/api/pdfs/${doc.id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch PDF URL");
            }
            const data = await response.json();
            const pdf = data.data?.pdf || data.pdf;
            if (!pdf?.url) {
                throw new Error("No URL returned for PDF");
            }
            setSelectedPdf({ url: pdf.url, name: doc.name || doc.title });
            setPdfViewerOpen(true);
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

    const paginatedDocs = currentDocs.slice(
        (currentDocPage - 1) * docsPerPage,
        currentDocPage * docsPerPage
    );

    const totalDocPages = Math.ceil(currentDocs.length / docsPerPage);

    // Handle document selection
    const handleDocSelect = (docId, checked) => {
        setSelectedDocs(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(docId);
            } else {
                newSet.delete(docId);
            }
            return newSet;
        });
    };

    // Select all documents in current category
    const selectAllDocs = () => {
        setSelectedDocs(new Set(currentDocs.map(doc => doc.id)));
    };

    // Clear all selections
    const clearSelection = () => {
        setSelectedDocs(new Set());
    };

    // Bulk delete selected documents (with biometric auth)
    const handleBulkDelete = async () => {
        if (selectedDocs.size === 0) return;

        // Require biometric authentication
        try {
            await biometricAuth();
        } catch {
            return;
        }

        const docIds = Array.from(selectedDocs);

        // Prevent duplicate delete calls
        setDeletingDocs(prev => new Set([...prev, ...docIds]));

        try {
            // Delete each document
            for (const docId of docIds) {
                const response = await fetch(`/api/pdfs/${docId}`, {
                    method: "DELETE",
                });

                if (!response.ok) {
                    throw new Error(`Failed to delete document ${docId}`);
                }
            }

            // Update local state
            setDocuments(prev => ({
                ...prev,
                [selectedUseCase]: prev[selectedUseCase].filter(doc => !selectedDocs.has(doc.id))
            }));

            toast.success(`${selectedDocs.size} document${selectedDocs.size > 1 ? 's' : ''} deleted successfully!`);
            setSelectedDocs(new Set());
        } catch (error) {
            console.error("Bulk delete error:", error);
            toast.error("Failed to delete some documents");
        } finally {
            setDeletingDocs(prev => {
                const newSet = new Set(prev);
                docIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        }
    };

    // Bulk download selected documents as zip (with biometric auth)
    const handleBulkDownload = async (pdfIds) => {
        if (!pdfIds || pdfIds.length === 0) return;

        let token;
        try {
            token = await biometricAuth();
        } catch {
            return;
        }

        setIsDownloading(true);
        try {
            const res = await fetch("/api/pdfs/download-zip", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ pdfIds }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Download failed");
            }

            // Stream the zip as a download
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] || "documents.zip";
            link.click();
            URL.revokeObjectURL(url);
            toast.success(`Downloaded ${pdfIds.length} document${pdfIds.length > 1 ? 's' : ''}`);
        } catch (error) {
            console.error("Download error:", error);
            toast.error(error.message || "Failed to download documents");
        } finally {
            setIsDownloading(false);
        }
    };

    // Download all PDFs in a category/use case
    const handleCategoryDownload = async (useCaseId) => {
        const docs = documents[useCaseId] || [];
        if (docs.length === 0) {
            toast.info("No documents to download in this category");
            return;
        }
        await handleBulkDownload(docs.map(d => d.id));
    };

    // Download all PDFs across selected use cases
    const handleSelectedUseCasesDownload = async () => {
        const allIds = [];
        for (const ucId of selectedUseCases) {
            const docs = documents[ucId] || [];
            allIds.push(...docs.map(d => d.id));
        }
        if (allIds.length === 0) {
            toast.info("No documents found in selected categories");
            return;
        }
        await handleBulkDownload(allIds);
    };

    // Bulk delete selected use cases (with biometric auth)
    const handleBulkDeleteUseCases = async () => {
        if (selectedUseCases.size === 0) return;

        try {
            await biometricAuth();
        } catch {
            return;
        }

        const ucIds = Array.from(selectedUseCases);
        try {
            for (const ucId of ucIds) {
                const response = await fetch(`/api/use-cases/${ucId}`, { method: "DELETE" });
                if (!response.ok) throw new Error(`Failed to delete use case ${ucId}`);
            }
            toast.success(`${ucIds.length} categor${ucIds.length > 1 ? 'ies' : 'y'} deleted successfully!`);
            setSelectedUseCases(new Set());
            if (ucIds.includes(selectedUseCase)) setSelectedUseCase(null);
            fetchUseCases();
        } catch (error) {
            console.error("Bulk delete use cases error:", error);
            toast.error("Failed to delete some categories");
        }
    };

    // Bulk move selected use cases to a different group
    const handleBulkMoveUseCasesToGroup = async (targetGroupId) => {
        if (selectedUseCases.size === 0) return;
        const ucIds = Array.from(selectedUseCases);
        try {
            for (const ucId of ucIds) {
                await fetch(`/api/use-cases/${ucId}/move`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ groupId: targetGroupId || null }),
                });
            }
            toast.success(`Moved ${ucIds.length} categor${ucIds.length > 1 ? 'ies' : 'y'}`);
            setSelectedUseCases(new Set());
            fetchUseCases();
            fetchUseCaseGroups();
        } catch (error) {
            console.error("Bulk move error:", error);
            toast.error("Failed to move some categories");
        }
    };

    // Download all PDFs in a single group
    const handleGroupDownload = async (groupId) => {
        // Collect all use cases in this group
        const groupUseCases = groupId === "ungrouped"
            ? useCases.filter(uc => !uc.groupId)
            : useCases.filter(uc => uc.groupId === groupId);

        if (groupUseCases.length === 0) {
            toast.info("No categories in this group");
            return;
        }

        const allIds = [];
        for (const uc of groupUseCases) {
            const docs = documents[uc.id] || [];
            allIds.push(...docs.map(d => d.id));
        }

        if (allIds.length === 0) {
            toast.info("No documents found in this group");
            return;
        }

        await handleBulkDownload(allIds);
    };

    // Bulk download multiple groups at once
    const handleBulkGroupsDownload = async (groupIds) => {
        if (!groupIds || groupIds.length === 0) return;

        const allIds = [];
        for (const gId of groupIds) {
            const groupUseCases = gId === "ungrouped"
                ? useCases.filter(uc => !uc.groupId)
                : useCases.filter(uc => uc.groupId === gId);

            for (const uc of groupUseCases) {
                const docs = documents[uc.id] || [];
                allIds.push(...docs.map(d => d.id));
            }
        }

        if (allIds.length === 0) {
            toast.info("No documents found in selected groups");
            return;
        }

        await handleBulkDownload(allIds);
    };

    const currentDocsDisplay = paginatedDocs.map(doc => {
        const isSelected = selectedDocs.has(doc.id);
        return (
            <div
                key={doc.id}
                className={`group relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card transition-all duration-200 cursor-pointer ${isSelected ? 'bg-accent/10' : ''}`}
                onClick={(e) => {
                    // Don't open viewer if click came from a button, checkbox, or label inside
                    const target = e.target;
                    if (target.closest('button') || target.closest('[role="checkbox"]') || target.closest('label')) return;
                    openPdfViewer(doc);
                }}
            >
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <File className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate pr-6 hover:text-primary transition-colors" title={doc.name}>
                        {doc.name}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                        <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1 sm:px-1.5 py-0.5 rounded">PDF</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">•</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">{doc.size}</span>
                        {/* Virus scan status badge */}
                        {doc.virusScanStatus && doc.virusScanStatus !== 'skipped' && (
                            <>
                                <span className="text-[10px] sm:text-xs text-muted-foreground">•</span>
                                {doc.virusScanStatus === 'scanning' && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">
                                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                        Scanning
                                    </span>
                                )}
                                {doc.virusScanStatus === 'clean' && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">
                                        <LucideIcons.ShieldCheck className="h-2.5 w-2.5" />
                                        Clean
                                    </span>
                                )}
                                {doc.virusScanStatus === 'malicious' && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-destructive font-medium">
                                        <LucideIcons.ShieldAlert className="h-2.5 w-2.5" />
                                        Malware detected
                                    </span>
                                )}
                                {doc.virusScanStatus === 'error' && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                        <LucideIcons.ShieldQuestion className="h-2.5 w-2.5" />
                                        Scan failed
                                    </span>
                                )}
                                {doc.virusScanStatus === 'pending' && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                        <LucideIcons.Shield className="h-2.5 w-2.5" />
                                        Pending scan
                                    </span>
                                )}
                            </>
                        )}
                        {/* Vectorization status badge */}
                        {doc.embeddingStatus && doc.embeddingStatus !== 'completed' && (
                            <>
                                <span className="text-[10px] sm:text-xs text-muted-foreground">•</span>
                                {doc.embeddingStatus === 'processing' && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">
                                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                        Vectorizing
                                    </span>
                                )}
                                {doc.embeddingStatus === 'pending' && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                        <LucideIcons.Clock className="h-2.5 w-2.5" />
                                        Pending
                                    </span>
                                )}
                                {doc.embeddingStatus === 'failed' && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-destructive">
                                        <LucideIcons.AlertCircle className="h-2.5 w-2.5" />
                                        Failed
                                    </span>
                                )}
                            </>
                        )}
                        {doc.embeddingStatus === 'completed' && (
                            <>
                                <span className="text-[10px] sm:text-xs text-muted-foreground">•</span>
                                <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">
                                    <LucideIcons.Database className="h-2.5 w-2.5" />
                                    RAG ready
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all disabled:opacity-50"
                    disabled={deletingDocs.has(doc.id)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent?.stopImmediatePropagation?.();
                        confirmDelete(selectedUseCase, doc);
                    }}
                >
                    {deletingDocs.has(doc.id) ? (
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                </Button>

                <div className="absolute left-3 sm:left-4 top-3 sm:top-4 flex items-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleDocSelect(doc.id, checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        aria-label={`Select document ${doc.name}`}
                    />
                </div>
            </div>
        );
    });

    return (
        <>

        {/* MAIN CONTAINER */}
        <div
            ref={containerRef}
            className={cn(
                "flex flex-col md:flex-row flex-1 gap-4 md:gap-0 pt-0 pb-4 pl-0 h-auto md:h-[calc(100vh-120px)] overflow-auto md:overflow-hidden",
                (isResizing || isResizingGroups) && "select-none"
            )}
        >
            {/* Mobile Groups Panel Toggle */}
            <div className="md:hidden flex items-center gap-2 px-2 py-2 bg-muted/30 rounded-lg mx-2">
                <Button
                    variant={isGroupsPanelCollapsed ? "default" : "outline"}
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => setIsGroupsPanelCollapsed(!isGroupsPanelCollapsed)}
                >
                    {isGroupsPanelCollapsed ? (
                        <>
                            <PanelLeftOpen className="h-4 w-4" />
                            <span>Show Groups</span>
                        </>
                    ) : (
                        <>
                            <PanelLeftClose className="h-4 w-4" />
                            <span>Hide Groups</span>
                        </>
                    )}
                </Button>
                <span className="text-sm text-muted-foreground truncate flex-1">
                    {selectedGroupId === null
                        ? "All use cases"
                        : selectedGroupId === "ungrouped"
                            ? "Ungrouped"
                            : useCaseGroups.find(g => g.id === selectedGroupId)?.name || "All"}
                </span>
            </div>

            {/* Mobile Groups Panel (collapsible) */}
            {!isGroupsPanelCollapsed && (
                <div className="md:hidden mx-2 rounded-xl bg-muted/50 border border-border/50 shadow-sm overflow-hidden h-[450px] min-h-[400px]">
                    <UseCaseGroupsPanel
                        groups={useCaseGroups}
                        useCases={useCasesWithCounts}
                        selectedGroupId={selectedGroupId}
                        onSelectGroup={setSelectedGroupId}
                        onGroupsChange={setUseCaseGroups}
                        selectedUseCases={selectedUseCases}
                        onMoveUseCases={handleMoveUseCasesToGroup}
                        onDownloadGroup={handleGroupDownload}
                        onBulkDownloadGroups={handleBulkGroupsDownload}
                        isDownloading={isDownloading}
                        onSelectUseCase={(id) => {
                            setSelectedUseCase(id);
                            // Only collapse on mobile when selecting a specific use case, not when selecting a group
                            if (isMobile) setIsGroupsPanelCollapsed(true);
                        }}
                    />
                </div>
            )}

            {/* Desktop Groups Panel Toggle Button (visible when collapsed) */}
            {isGroupsPanelCollapsed && (
                <div className="hidden md:flex flex-col items-center py-2 shrink-0">
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-lg"
                                    onClick={() => setIsGroupsPanelCollapsed(false)}
                                >
                                    <PanelLeftOpen className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">Show Groups Panel</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            {/* Desktop Groups Panel (collapsible sidebar) */}
            {!isGroupsPanelCollapsed && (
                <>
                <div
                    className="hidden md:flex flex-col rounded-xl bg-muted/50 border border-border/50 shadow-sm overflow-hidden shrink-0"
                    style={{ width: `${groupsPanelWidth}px`, minWidth: '160px', maxWidth: '600px' }}
                >
                    <UseCaseGroupsPanel
                        groups={useCaseGroups}
                        useCases={useCasesWithCounts}
                        selectedGroupId={selectedGroupId}
                        onSelectGroup={setSelectedGroupId}
                        onGroupsChange={setUseCaseGroups}
                        selectedUseCases={selectedUseCases}
                        onMoveUseCases={handleMoveUseCasesToGroup}
                        onDownloadGroup={handleGroupDownload}
                        onBulkDownloadGroups={handleBulkGroupsDownload}
                        isDownloading={isDownloading}
                        onSelectUseCase={setSelectedUseCase}
                        onCollapse={() => setIsGroupsPanelCollapsed(true)}
                    />
                </div>
                {/* Resize handle for groups panel */}
                <div
                    ref={groupsResizeRef}
                    onMouseDown={(e) => { e.preventDefault(); setIsResizingGroups(true); }}
                    onTouchStart={(e) => { e.preventDefault(); setIsResizingGroups(true); }}
                    className={cn(
                        "hidden md:flex items-center justify-center w-3 cursor-col-resize group shrink-0 transition-colors",
                        isResizingGroups && ""
                    )}
                >
                    <div className={cn(
                        "w-0.5 h-8 rounded-full bg-border/50 group-hover:bg-primary/50 transition-colors",
                        isResizingGroups && "bg-primary"
                    )} />
                </div>
                </>
            )}

            {/* Main content area with resizable columns */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-0 min-w-0 overflow-visible">

            {/* ---------------------------------------------------------------------------
          COLUMN 1: CATEGORIES (Resizable on desktop)
         --------------------------------------------------------------------------- */}
            <div
                className="flex flex-col min-h-[300px] md:h-full md:min-h-0 rounded-xl bg-muted/50 border border-border/50 shadow-sm overflow-hidden w-full md:w-auto"
                style={!isMobile ? { flex: `0 0 ${Math.max(categoriesWidth, 25)}%`, minWidth: '280px' } : undefined}
            >

                {/* Header (Fixed) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0 p-3 sm:p-4 lg:p-6 pb-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-8 bg-background h-9 sm:h-10"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded-sm transition-colors"
                                title="Clear search"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefreshAllUseCases}
                            title={
                                selectedGroupId === null
                                    ? "Refresh all use cases"
                                    : selectedGroupId === "ungrouped"
                                        ? "Refresh ungrouped use cases"
                                        : `Refresh use cases in ${useCaseGroups.find(g => g.id === selectedGroupId)?.name || 'group'}`
                            }
                            disabled={isLoading || refreshingUseCases.size > 0}
                            className="h-9 w-9 sm:h-10 sm:w-10"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading || refreshingUseCases.size > 0 ? 'animate-spin' : ''}`} />
                        </Button>
                        <AddCategoryDialog onAddCategory={handleAddCategory} groups={useCaseGroups} />
                    </div>
                </div>

                {/* Selection toolbar - appears when items are selected */}
                {selectedUseCases.size > 0 && (
                    <div className="flex items-center justify-between gap-2 px-4 py-2 bg-primary/5 border-b border-primary/20">
                        <span className="text-sm font-medium text-primary">
                            {selectedUseCases.size} selected
                        </span>
                        <div className="flex items-center gap-1.5">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSelectedUseCasesDownload}
                                            disabled={isDownloading || isBioAuthenticating}
                                            className="h-7 text-xs gap-1"
                                        >
                                            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                            Download
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Download all PDFs from selected categories as zip (biometric required)</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleBulkDeleteUseCases}
                                            disabled={isBioAuthenticating}
                                            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete selected categories (biometric required)</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                Drag to group
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearUseCaseSelection}
                                className="h-7 text-xs"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                )}

                {/* Scrollable List */}
                <ScrollArea className="flex-1 h-0">
                    <div className="p-4 lg:p-6 pt-2 space-y-3 min-h-full">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Loading categories...</p>
                            </div>
                        ) : paginatedCategories.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {paginatedCategories.map((useCase, index) => (
                                    <motion.div
                                        key={useCase.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        layout
                                    >
                                        <CategoryCard
                                            useCase={useCase}
                                            onSelect={setSelectedUseCase}
                                            isSelected={selectedUseCase === useCase.id}
                                            onEdit={handleEditUseCase}
                                            onDelete={handleDeleteUseCase}
                                            onRefresh={handleRefreshUseCase}
                                            onDownload={handleCategoryDownload}
                                            onDropPdfs={handleMovePdfsToCategory}
                                            isRefreshing={refreshingUseCases.has(useCase.id)}
                                            isChecked={selectedUseCases.has(useCase.id)}
                                            onCheckChange={toggleUseCaseSelection}
                                            allSelectedIds={Array.from(selectedUseCases)}
                                            maxPdfCount={maxPdfCount}
                                            isDownloading={isDownloading}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-10 text-muted-foreground text-sm"
                            >
                                {searchTerm ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                                            <Search className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">No results for &quot;{searchTerm}&quot;</p>
                                        <p className="text-xs">Try a different search term</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                                            <FolderOpen className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">No categories found</p>
                                        <p className="text-xs">Create a new category to get started</p>
                                    </div>
                                )}
                            </motion.div>
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

            {/* Resize Handle */}
            <div
                ref={resizeRef}
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
                className={cn(
                    "hidden md:flex items-center justify-center w-3 cursor-col-resize group shrink-0 transition-colors",
                )}
            >
                <div className={cn(
                    "w-0.5 h-8 rounded-full bg-border/50 group-hover:bg-primary/50 transition-colors",
                    isResizing && "bg-primary"
                )} />
            </div>

            {/* ---------------------------------------------------------------------------
          COLUMN 2: UPLOAD + DOCUMENTS (Resizable)
         --------------------------------------------------------------------------- */}
            <div
                className="flex flex-col min-h-[400px] md:h-full md:min-h-0 rounded-xl bg-muted/50 overflow-hidden border border-border/50 shadow-sm relative"
                style={{ flex: 1 }}
            >

                {selectedUseCase ? (
                    <>
                        {/* --- SECTION A: UPLOAD (Fixed at Top) --- */}
                        <div className="shrink-0 p-3 sm:p-4 md:p-6 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div>
                                    <h2 className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2 flex-wrap">
                                        <span className="truncate max-w-[150px] sm:max-w-none">{selectedCategoryName}</span>
                                        <span className="text-muted-foreground font-normal text-xs sm:text-sm">/ Upload</span>
                                        {currentDocs.length > 0 && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium">
                                                {currentDocs.length} file{currentDocs.length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Add relevant documents to this knowledge base.</p>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 sm:px-6 py-4 sm:py-8 transition-all duration-200 bg-background",
                                    isDragActive
                                        ? "border-primary bg-primary/5 scale-[1.01] shadow-inner"
                                        : "border-input hover:bg-accent/50 hover:border-accent-foreground/50"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                                onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
                                onDrop={(e) => { setIsDragActive(false); handleDrop(e); }}
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                                    <motion.div
                                        animate={isDragActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                                        transition={{ repeat: isDragActive ? Infinity : 0, duration: 1.2 }}
                                        className={cn(
                                            "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-colors",
                                            isDragActive ? "bg-primary/20" : "bg-primary/10"
                                        )}
                                    >
                                        <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden={true} />
                                    </motion.div>
                                    <div>
                                        {isDragActive ? (
                                            <p className="text-sm font-semibold text-primary">Drop files here</p>
                                        ) : (
                                            <div className="flex flex-wrap justify-center sm:justify-start text-xs sm:text-sm leading-6 text-muted-foreground">
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
                                        )}
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Max 12 MB per file • 4 PDFs total per account</p>
                                    </div>
                                </div>

                                {uploadState.uploading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="w-full mt-4 max-w-md"
                                    >
                                        <div className="flex items-center gap-2 text-xs mb-1.5">
                                            <File className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                            <span className="truncate flex-1">
                                                {uploadState.status || uploadState.file?.name}
                                            </span>
                                            <span className={cn(
                                                "font-medium shrink-0",
                                                uploadState.progress === 100 ? "text-emerald-500" : "text-primary"
                                            )}>
                                                {uploadState.progress}%
                                            </span>
                                        </div>
                                        <Progress value={uploadState.progress} className="h-2" />
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* --- SECTION B: FOLDER TREE (Scrollable Bottom) --- */}
                        <div className="flex-1 min-h-[200px] bg-muted/30 flex flex-col">
                            <FolderTree
                                ref={folderTreeRef}
                                useCaseId={selectedUseCase}
                                onFileSelect={openPdfViewer}
                                onRefresh={fetchUseCases}
                                onBulkDownload={handleBulkDownload}
                                onBiometricAuth={biometricAuth}
                                isDownloading={isDownloading}
                                isBioAuthenticating={isBioAuthenticating}
                            />
                        </div>
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex h-full min-h-[200px] flex-col items-center justify-center text-center p-4 sm:p-8"
                    >
                        <div className="h-14 w-14 sm:h-16 sm:w-16 bg-muted rounded-full flex items-center justify-center mb-3 sm:mb-4 ring-4 ring-muted/50">
                            <FolderOpen className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold">No category selected</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 max-w-sm">
                            Select a category from the list to view its documents, upload files, and manage your knowledge base.
                        </p>
                        <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground/70">
                            <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            <span>Click a category card to get started</span>
                            <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        </div>
                    </motion.div>
                )}
            </div>

            </div>{/* End of main content wrapper */}
        </div>

        {/* PDF Viewer Dialog */}
        <PdfViewerDialog
            open={pdfViewerOpen}
            onOpenChange={setPdfViewerOpen}
            pdfUrl={selectedPdf.url}
            fileName={selectedPdf.name}
            isDemo={selectedPdf.isDemo || false}
        />

        {/* PDF Name Dialog */}
        <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
            <DialogContent className="w-[95vw] max-w-[650px] max-h-[90vh] p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Upload PDF{pendingFiles.length > 1 ? 's' : ''}</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Choose where to upload and customize the document name{pendingFiles.length > 1 ? 's' : ''}.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] sm:max-h-[500px] pr-2 sm:pr-4">
                    <div className="grid gap-4 py-2 sm:py-4">
                        {/* Upload Location Selection */}
                        <div className="p-4 rounded-lg border bg-muted/30">
                            <Label className="text-sm font-medium mb-3 block">Upload Location</Label>
                            <RadioGroup
                                value={uploadLocation}
                                onValueChange={setUploadLocation}
                                className="space-y-3"
                            >
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem value="root" id="location-root" />
                                    <Label htmlFor="location-root" className="flex items-center gap-2 cursor-pointer">
                                        <FolderOpen className="h-4 w-4 text-blue-500" />
                                        <span>Root (Default Location)</span>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem value="existing" id="location-existing" />
                                    <Label htmlFor="location-existing" className="flex items-center gap-2 cursor-pointer">
                                        <Folder className="h-4 w-4 text-blue-500" />
                                        <span>Existing Folder</span>
                                    </Label>
                                </div>
                                {uploadLocation === "existing" && (
                                    <div className="ml-7 space-y-2">
                                        {/* Search input */}
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search folders..."
                                                value={folderSearchTerm}
                                                onChange={(e) => {
                                                    setFolderSearchTerm(e.target.value);
                                                    setFolderPage(1);
                                                }}
                                                className="pl-8 h-9"
                                            />
                                        </div>

                                        {/* Folder list with scroll area */}
                                        <ScrollArea className="h-[150px] rounded-md border">
                                            <div className="p-2 space-y-1">
                                                {paginatedFoldersForUpload.length > 0 ? (
                                                    paginatedFoldersForUpload.map(folder => (
                                                        <div
                                                            key={folder.id}
                                                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                                                selectedFolderId === folder.id 
                                                                    ? 'bg-primary/10 border border-primary' 
                                                                    : 'hover:bg-accent'
                                                            }`}
                                                            style={{ paddingLeft: `${folder.depth * 12 + 8}px` }}
                                                            onClick={() => setSelectedFolderId(folder.id)}
                                                        >
                                                            <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                                                            <span className="text-sm truncate">{folder.name}</span>
                                                        </div>
                                                    ))
                                                ) : folderSearchTerm ? (
                                                    <div className="text-center text-sm text-muted-foreground py-4">
                                                        No folders matching &quot;{folderSearchTerm}&quot;
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-sm text-muted-foreground py-4">
                                                        No folders available
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>

                                        {/* Pagination */}
                                        {totalFolderPages > 1 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                    Page {folderPage} of {totalFolderPages}
                                                </span>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => setFolderPage(p => Math.max(1, p - 1))}
                                                        disabled={folderPage <= 1}
                                                    >
                                                        Prev
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => setFolderPage(p => Math.min(totalFolderPages, p + 1))}
                                                        disabled={folderPage >= totalFolderPages}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Selected folder display */}
                                        {selectedFolderId && (
                                            <div className="text-xs text-muted-foreground">
                                                Selected: {availableFolders.find(f => f.id === selectedFolderId)?.path || 'Unknown'}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem value="new" id="location-new" />
                                    <Label htmlFor="location-new" className="flex items-center gap-2 cursor-pointer">
                                        <FolderPlus className="h-4 w-4 text-green-500" />
                                        <span>Create New Folder</span>
                                    </Label>
                                </div>
                                {uploadLocation === "new" && (
                                    <div className="ml-7">
                                        <Input
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            placeholder="Enter new folder name..."
                                            className="w-full"
                                        />
                                    </div>
                                )}
                            </RadioGroup>
                        </div>

                        {/* Document Names */}
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
                        disabled={
                            Object.values(customPdfNames).some(name => !name?.trim()) ||
                            (uploadLocation === "existing" && !selectedFolderId) ||
                            (uploadLocation === "new" && !newFolderName.trim())
                        }
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
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete &quot;{documentToDelete?.doc?.name}&quot; from storage.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmedDelete}>
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Edit Category Dialog */}
        <EditCategoryDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            useCase={useCaseToEdit}
            groups={useCaseGroups}
            onUpdate={(updatedCategory) => {
                setUseCases(prev => prev.map(uc => uc.id === updatedCategory.id ? { ...uc, ...updatedCategory } : uc));
                toast.success(`Category "${updatedCategory.name}" updated successfully!`);
            }}
        />

        {/* Delete Use Case Confirmation Dialog */}
        <AlertDialog open={deleteUseCaseDialogOpen} onOpenChange={setDeleteUseCaseDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this use case and all associated documents.
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

                            // Require biometric authentication
                            try {
                                await biometricAuth();
                            } catch {
                                return;
                            }

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
                    >
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
    )
}
