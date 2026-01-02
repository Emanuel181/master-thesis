"use client";

import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Tree } from "react-arborist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { DEMO_DOCUMENTS } from "@/contexts/demoContext";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    Search,
    FolderPlus,
    MoreVertical,
    Folder,
    FolderOpen,
    File,
    ChevronRight,
    ChevronDown,
    Pencil,
    Trash2,
    GripVertical,
    Eye,
    LayoutGrid,
    List,
    LayoutList,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Check,
    Home,
} from "lucide-react";
import { toast } from "sonner";

// Node component for the tree
function TreeNode({ node, style, dragHandle }) {
    const isFolder = node.data.type === "folder";
    const isOpen = node.isOpen;
    const isSelected = node.data.isChecked;

    // Drag-and-drop state indicators from react-arborist
    const isDragging = node.state.isDragging;
    const willReceiveDrop = node.state.willReceiveDrop;

    return (
        <div
            ref={dragHandle}
            style={style}
            className={`relative flex items-center gap-1 py-0.5 px-1 rounded-md cursor-pointer group transition-colors duration-200 ${
                node.isSelected ? "bg-accent" : "hover:bg-accent/50"
            } ${isSelected ? "bg-accent/30" : ""} ${
                isDragging ? "opacity-40 cursor-grabbing" : ""
            } ${
                willReceiveDrop && isFolder 
                    ? "bg-primary/10 border border-dashed border-primary shadow-sm" 
                    : "border border-transparent"
            }`}
            onClick={() => {
                if (isFolder) {
                    node.toggle();
                } else {
                    node.select();
                }
            }}
        >
            {/* Checkbox - on left side, visible on hover or when selected */}
            <div className={`shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => node.data.onCheckChange?.(node.data.id, checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5"
                />
            </div>

            {/* Expand/collapse arrow for folders only */}
            {isFolder && (
                <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                </span>
            )}

            {/* Icon */}
            {isFolder ? (
                isOpen ? (
                    <FolderOpen className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                        willReceiveDrop ? "text-primary" : "text-blue-500"
                    }`} />
                ) : (
                    <Folder className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                        willReceiveDrop ? "text-primary" : "text-blue-500"
                    }`} />
                )
            ) : (
                <File className={`h-4 w-4 text-red-500 shrink-0 transition-opacity ${isDragging ? "opacity-40" : ""}`} />
            )}

            {/* Name */}
            <span className="text-sm truncate flex-1">{node.data.name || node.data.title}</span>

            {/* Action buttons - grouped on the right */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">

                {/* Drag handle */}
                <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />

                {/* View button for PDFs */}
                {!isFolder && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                            e.stopPropagation();
                            node.data.onView?.(node.data);
                        }}
                        title="View PDF"
                    >
                        <Eye className="h-3 w-3" />
                    </Button>
                )}

                {/* Context menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                        >
                            <MoreVertical className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isFolder && (
                            <>
                                <DropdownMenuItem onClick={() => node.data.onCreateFolder?.(node.data.id)}>
                                    <FolderPlus className="h-4 w-4 mr-2" />
                                    New Subfolder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem onClick={() => node.data.onRename?.(node.data)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => node.data.onDelete?.(node.data)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

const FolderTree = forwardRef(function FolderTree({
    useCaseId,
    onFileSelect,
    onRefresh,
}, ref) {
    const pathname = usePathname();
    const isDemoMode = pathname?.startsWith('/demo');
    
    const [treeData, setTreeData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const treeRef = useRef(null);

    // View mode: "tree" | "list" | "grid" | "details"
    const [viewMode, setViewMode] = useState("tree");

    // Sort options: "manual" | "name-asc" | "name-desc" | "date-asc" | "date-desc" | "size-asc" | "size-desc"
    const [sortBy, setSortBy] = useState("manual");

    // Selection state
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Current folder for grid/list navigation (null = root)
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folderPath, setFolderPath] = useState([]); // Array of { id, name } for breadcrumbs

    // Dialog states
    const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [parentFolderId, setParentFolderId] = useState(null);

    // Folder picker dialog state (for selecting where to create new folder)
    const [folderPickerOpen, setFolderPickerOpen] = useState(false);
    const [folderPickerSearch, setFolderPickerSearch] = useState("");
    const [folderPickerPage, setFolderPickerPage] = useState(1);
    const FOLDERS_PER_PAGE = 10;

    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [itemToRename, setItemToRename] = useState(null);
    const [newName, setNewName] = useState("");

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Bulk delete dialog
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

    // Open folder picker to select where to create folder
    const handleOpenFolderPicker = useCallback(() => {
        setFolderPickerSearch("");
        setFolderPickerPage(1);
        setFolderPickerOpen(true);
    }, []);

    // Select folder from picker and open create dialog
    const handleSelectFolderFromPicker = useCallback((folderId) => {
        setParentFolderId(folderId);
        setNewFolderName("");
        setFolderPickerOpen(false);
        setCreateFolderDialogOpen(true);
    }, []);

    // Create folder handlers - defined early so they can be used in callbacks
    const handleOpenCreateFolder = useCallback((parentId = null) => {
        setParentFolderId(parentId);
        setNewFolderName("");
        setCreateFolderDialogOpen(true);
    }, []);

    // Rename handlers
    const handleOpenRename = useCallback((item) => {
        setItemToRename(item);
        setNewName(item.name || item.title || "");
        setRenameDialogOpen(true);
    }, []);

    // Delete handlers
    const handleOpenDelete = useCallback((item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    }, []);

    // Expose refresh method to parent
    useImperativeHandle(ref, () => ({
        refresh: fetchFolders,
    }));

    // Fetch folder tree data
    const fetchFolders = useCallback(async () => {
        if (!useCaseId) return;

        setIsLoading(true);
        try {
            // Demo mode - use mock data from DEMO_DOCUMENTS
            if (isDemoMode) {
                const documents = DEMO_DOCUMENTS[useCaseId] || [];
                
                // Group documents by folder
                const folders = {};
                const rootDocs = [];
                
                documents.forEach(doc => {
                    if (doc.folder) {
                        if (!folders[doc.folder]) {
                            folders[doc.folder] = {
                                id: `folder-${doc.folder.toLowerCase().replace(/\s+/g, '-')}`,
                                name: doc.folder,
                                type: "folder",
                                children: []
                            };
                        }
                        folders[doc.folder].children.push({
                            id: doc.id,
                            name: doc.name,
                            type: "file",
                            size: doc.size,
                        });
                    } else {
                        rootDocs.push({
                            id: doc.id,
                            name: doc.name,
                            type: "file",
                            size: doc.size,
                        });
                    }
                });
                
                // Combine folders and root docs
                const mockTreeData = [...Object.values(folders), ...rootDocs];
                setTreeData(mockTreeData);
                setIsLoading(false);
                return;
            }
            
            const response = await fetch(`/api/folders?useCaseId=${useCaseId}`);
            if (!response.ok) throw new Error("Failed to fetch folders");

            const data = await response.json();
            setTreeData(data.folders || []);
        } catch (error) {
            console.error("Error fetching folders:", error);
            toast.error("Failed to load folders");
        } finally {
            setIsLoading(false);
        }
    }, [useCaseId, isDemoMode]);

    useEffect(() => {
        fetchFolders();
        // Clear selection when use case changes
        setSelectedItems(new Set());
    }, [fetchFolders]);

    // Get flattened list of folders for "Create New Folder" dropdown
    const availableFoldersForCreate = useMemo(() => {
        const flatten = (items, depth = 0) => {
            let result = [];
            items.forEach(item => {
                if (item.type === "folder") {
                    result.push({ id: item.id, name: item.name || item.title, depth });
                    if (item.children) {
                        result = result.concat(flatten(item.children.filter(c => c.type === "folder"), depth + 1));
                    }
                }
            });
            return result;
        };
        return flatten(treeData);
    }, [treeData]);

    // Filtered folders based on search
    const filteredFoldersForPicker = useMemo(() => {
        if (!folderPickerSearch.trim()) return availableFoldersForCreate;
        const search = folderPickerSearch.toLowerCase();
        return availableFoldersForCreate.filter(folder =>
            folder.name.toLowerCase().includes(search)
        );
    }, [availableFoldersForCreate, folderPickerSearch]);

    // Paginated folders for picker
    const paginatedFoldersForPicker = useMemo(() => {
        const start = (folderPickerPage - 1) * FOLDERS_PER_PAGE;
        return filteredFoldersForPicker.slice(start, start + FOLDERS_PER_PAGE);
    }, [filteredFoldersForPicker, folderPickerPage]);

    // Total pages for folder picker
    const totalFolderPickerPages = Math.ceil(filteredFoldersForPicker.length / FOLDERS_PER_PAGE);

    // Handle checkbox change for selection
    const handleCheckChange = useCallback((itemId, checked) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(itemId);
            } else {
                newSet.delete(itemId);
            }
            return newSet;
        });
    }, []);

    // Handle view PDF
    const handleView = useCallback((item) => {
        onFileSelect?.(item);
    }, [onFileSelect]);

    // Add callbacks to tree data
    const addCallbacks = useCallback((items) => {
        return items.map(item => ({
            ...item,
            id: item.id,
            name: item.name || item.title,
            isChecked: selectedItems.has(item.id),
            onCheckChange: handleCheckChange,
            onView: handleView,
            onCreateFolder: handleOpenCreateFolder,
            onRename: handleOpenRename,
            onDelete: handleOpenDelete,
            children: item.children ? addCallbacks(item.children) : undefined,
        }));
    }, [selectedItems, handleCheckChange, handleView, handleOpenCreateFolder, handleOpenRename, handleOpenDelete]);

    // Sort items helper
    const sortItems = useCallback((items) => {
        if (sortBy === "manual") return items;

        const sortFn = (a, b) => {
            // Folders always come first
            if (a.type === "folder" && b.type !== "folder") return -1;
            if (a.type !== "folder" && b.type === "folder") return 1;

            const nameA = (a.name || a.title || "").toLowerCase();
            const nameB = (b.name || b.title || "").toLowerCase();
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            const sizeA = a.size || 0;
            const sizeB = b.size || 0;

            switch (sortBy) {
                case "name-asc": return nameA.localeCompare(nameB);
                case "name-desc": return nameB.localeCompare(nameA);
                case "date-asc": return dateA - dateB;
                case "date-desc": return dateB - dateA;
                case "size-asc": return sizeA - sizeB;
                case "size-desc": return sizeB - sizeA;
                default: return 0;
            }
        };

        return items.map(item => ({
            ...item,
            children: item.children ? sortItems([...item.children]).sort(sortFn) : undefined,
        })).sort(sortFn);
    }, [sortBy]);

    // Filter tree data based on search
    const filteredData = useMemo(() => {
        let data = treeData;

        // Apply search filter
        if (searchTerm) {
            const filterNodes = (nodes) => {
                return nodes.reduce((acc, node) => {
                    const name = (node.name || node.title || "").toLowerCase();
                    const matches = name.includes(searchTerm.toLowerCase());
                    const filteredChildren = node.children ? filterNodes(node.children) : [];

                    if (matches || filteredChildren.length > 0) {
                        acc.push({
                            ...node,
                            children: filteredChildren.length > 0 ? filteredChildren : node.children,
                        });
                    }
                    return acc;
                }, []);
            };

            data = filterNodes(data);
        }

        // Apply sorting
        data = sortItems(data);

        // Add callbacks
        data = addCallbacks(data);

        return data;
    }, [treeData, searchTerm, sortItems, addCallbacks]);


    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            toast.error("Please enter a folder name");
            return;
        }

        // Demo mode - mock folder creation locally
        if (isDemoMode) {
            const newFolder = {
                id: `demo-folder-${Date.now()}`,
                name: newFolderName.trim(),
                type: "folder",
                children: [],
            };
            
            setTreeData(prev => {
                if (parentFolderId) {
                    // Add to specific parent folder
                    const addToParent = (nodes) => nodes.map(node => {
                        if (node.id === parentFolderId) {
                            return { ...node, children: [...(node.children || []), newFolder] };
                        }
                        if (node.children) {
                            return { ...node, children: addToParent(node.children) };
                        }
                        return node;
                    });
                    return addToParent(prev);
                } else {
                    return [...prev, newFolder];
                }
            });
            
            toast.success("Folder created successfully (demo)");
            setCreateFolderDialogOpen(false);
            setNewFolderName("");
            return;
        }

        try {
            const response = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: newFolderName.trim(),
                    useCaseId,
                    parentId: parentFolderId,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create folder");
            }

            toast.success("Folder created successfully");
            setCreateFolderDialogOpen(false);
            fetchFolders();
            onRefresh?.();
        } catch (error) {
            console.error("Error creating folder:", error);
            toast.error(error.message || "Failed to create folder");
        }
    };


    const handleRename = async () => {
        if (!newName.trim() || !itemToRename) {
            toast.error("Please enter a name");
            return;
        }

        // Demo mode - mock rename locally
        if (isDemoMode) {
            setTreeData(prev => {
                const updateName = (nodes) => nodes.map(node => {
                    if (node.id === itemToRename.id) {
                        return { ...node, name: newName.trim(), title: newName.trim() };
                    }
                    if (node.children) {
                        return { ...node, children: updateName(node.children) };
                    }
                    return node;
                });
                return updateName(prev);
            });
            
            toast.success("Renamed successfully (demo)");
            setRenameDialogOpen(false);
            setItemToRename(null);
            setNewName("");
            return;
        }

        try {
            const endpoint = itemToRename.type === "folder"
                ? `/api/folders/${itemToRename.id}`
                : `/api/pdfs/${itemToRename.id}`;

            const body = itemToRename.type === "folder"
                ? { name: newName.trim() }
                : { title: newName.trim() };

            const response = await fetch(endpoint, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error("Failed to rename");

            toast.success("Renamed successfully");
            setRenameDialogOpen(false);
            fetchFolders();
            onRefresh?.();
        } catch (error) {
            console.error("Error renaming:", error);
            toast.error("Failed to rename");
        }
    };


    const handleDelete = async () => {
        if (!itemToDelete) return;

        // Demo mode - mock delete locally
        if (isDemoMode) {
            setTreeData(prev => {
                const removeItem = (nodes) => nodes.filter(node => {
                    if (node.id === itemToDelete.id) {
                        return false;
                    }
                    if (node.children) {
                        node.children = removeItem(node.children);
                    }
                    return true;
                });
                return removeItem(prev);
            });
            
            toast.success("Deleted successfully (demo)");
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            return;
        }

        try {
            const endpoint = itemToDelete.type === "folder"
                ? `/api/folders/${itemToDelete.id}`
                : `/api/pdfs/${itemToDelete.id}`;

            const response = await fetch(endpoint, { method: "DELETE" });

            if (!response.ok) throw new Error("Failed to delete");

            toast.success("Deleted successfully");
            setDeleteDialogOpen(false);
            fetchFolders();
            onRefresh?.();
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Failed to delete");
        }
    };

    // Handle drag and drop reordering
    const handleMove = async ({ dragIds, parentId, index }) => {
        // Demo mode - mock reorder locally
        if (isDemoMode) {
            setTreeData(prev => {
                // Remove dragged items from their current locations
                let draggedItems = [];
                const removeItems = (nodes) => nodes.filter(node => {
                    if (dragIds.includes(node.id)) {
                        draggedItems.push(node);
                        return false;
                    }
                    if (node.children) {
                        node.children = removeItems(node.children);
                    }
                    return true;
                });
                
                let newTree = removeItems([...prev]);
                
                // Add items to new location
                if (parentId === null) {
                    // Add to root
                    newTree.splice(index, 0, ...draggedItems);
                } else {
                    // Add to specific parent
                    const addToParent = (nodes) => nodes.map(node => {
                        if (node.id === parentId) {
                            const children = [...(node.children || [])];
                            children.splice(index, 0, ...draggedItems);
                            return { ...node, children };
                        }
                        if (node.children) {
                            return { ...node, children: addToParent(node.children) };
                        }
                        return node;
                    });
                    newTree = addToParent(newTree);
                }
                
                return newTree;
            });
            toast.success("Items reordered (demo)");
            return;
        }
        
        try {
            // Build the items array with updated order
            const items = dragIds.map((id, idx) => {
                const node = findNode(treeData, id);
                return {
                    id,
                    type: node?.type || "folder",
                    order: index + idx,
                    parentId: parentId === null ? null : parentId,
                };
            });

            const response = await fetch("/api/folders/reorder", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ useCaseId, items }),
            });

            if (!response.ok) throw new Error("Failed to reorder");

            fetchFolders();
        } catch (error) {
            console.error("Error reordering:", error);
            toast.error("Failed to reorder items");
        }
    };

    // Helper to find a node by id
    const findNode = (nodes, id) => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    // Handle node selection (for PDFs)
    const handleSelect = (nodes) => {
        const selected = nodes[0];
        if (selected && selected.data.type === "pdf") {
            onFileSelect?.(selected.data);
        }
    };

    // Select all items (folders and PDFs)
    const selectAllItems = useCallback(() => {
        const getAllIds = (items) => {
            let ids = [];
            items.forEach(item => {
                ids.push(item.id);
                if (item.children) {
                    ids = ids.concat(getAllIds(item.children));
                }
            });
            return ids;
        };
        setSelectedItems(new Set(getAllIds(treeData)));
    }, [treeData]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedItems(new Set());
    }, []);

    // Get selected PDF count
    const selectedCount = selectedItems.size;

    // Bulk delete handler (handles both folders and PDFs)
    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return;

        // Demo mode - mock bulk delete locally
        if (isDemoMode) {
            setTreeData(prev => {
                const removeItems = (nodes) => nodes.filter(node => {
                    if (selectedItems.has(node.id)) {
                        return false;
                    }
                    if (node.children) {
                        node.children = removeItems(node.children);
                    }
                    return true;
                });
                return removeItems([...prev]);
            });
            
            toast.success(`${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} deleted successfully (demo)`);
            setSelectedItems(new Set());
            setBulkDeleteDialogOpen(false);
            return;
        }

        try {
            // Find all selected items and their types
            const findItemType = (items, id) => {
                for (const item of items) {
                    if (item.id === id) return item.type;
                    if (item.children) {
                        const found = findItemType(item.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const deletePromises = Array.from(selectedItems).map(async (id) => {
                const itemType = findItemType(treeData, id);
                const endpoint = itemType === "folder" ? `/api/folders/${id}` : `/api/pdfs/${id}`;
                const response = await fetch(endpoint, { method: "DELETE" });
                if (!response.ok) throw new Error(`Failed to delete ${id}`);
            });

            await Promise.all(deletePromises);

            toast.success(`${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} deleted successfully`);
            setSelectedItems(new Set());
            setBulkDeleteDialogOpen(false);
            fetchFolders();
            onRefresh?.();
        } catch (error) {
            console.error("Error bulk deleting:", error);
            toast.error("Failed to delete some items");
        }
    };

    // Navigate into a folder (for grid/list view)
    const navigateToFolder = useCallback((folder) => {
        if (!folder) {
            // Navigate to root
            setCurrentFolderId(null);
            setFolderPath([]);
        } else {
            setCurrentFolderId(folder.id);
            setFolderPath(prev => [...prev, { id: folder.id, name: folder.name || folder.title }]);
        }
    }, []);

    // Navigate to a specific folder in the breadcrumb path
    const navigateToBreadcrumb = useCallback((index) => {
        if (index === -1) {
            // Go to root
            setCurrentFolderId(null);
            setFolderPath([]);
        } else {
            const targetFolder = folderPath[index];
            setCurrentFolderId(targetFolder.id);
            setFolderPath(prev => prev.slice(0, index + 1));
        }
    }, [folderPath]);

    // Get items for the current folder view (grid/list)
    const currentFolderItems = useMemo(() => {
        if (viewMode === "tree") {
            return filteredData; // Tree view shows everything
        }

        // For grid/list/details view, show items in current folder
        if (currentFolderId === null) {
            // Root level - show top level items only
            return filteredData.filter(item => !item.parentId || item.parentId === null);
        } else {
            // Inside a folder - find that folder and show its children
            const findFolder = (items, id) => {
                for (const item of items) {
                    if (item.id === id) return item;
                    if (item.children) {
                        const found = findFolder(item.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const folder = findFolder(filteredData, currentFolderId);
            return folder?.children || [];
        }
    }, [filteredData, currentFolderId, viewMode]);

    // Get flat list of all items for list/grid view (only from current folder)
    const flatItems = useMemo(() => {
        if (viewMode === "tree") {
            // For tree view, flatten everything
            const flatten = (items, depth = 0) => {
                let result = [];
                items.forEach(item => {
                    result.push({ ...item, depth });
                    if (item.children) {
                        result = result.concat(flatten(item.children, depth + 1));
                    }
                });
                return result;
            };
            return flatten(filteredData);
        }

        // For other views, just return current folder items (no nesting)
        return currentFolderItems.map(item => ({ ...item, depth: 0 }));
    }, [filteredData, currentFolderItems, viewMode]);

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header with search and create button */}
            <div className="flex items-center gap-2 p-3 border-b shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-9"
                    />
                </div>
                {/* New Folder Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                        >
                            <FolderPlus className="h-4 w-4 mr-1" />
                            New
                            <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Create Folder In</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenCreateFolder(null)}>
                            <Home className="h-4 w-4 mr-2" />
                            Root Level
                        </DropdownMenuItem>
                        {availableFoldersForCreate.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleOpenFolderPicker}>
                                    <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                    Choose Folder...
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Toolbar with view mode and sort options */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/30 shrink-0">
                <div className="flex items-center gap-1">
                    {/* View Mode Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                {viewMode === "tree" && <List className="h-4 w-4 mr-1" />}
                                {viewMode === "list" && <LayoutList className="h-4 w-4 mr-1" />}
                                {viewMode === "grid" && <LayoutGrid className="h-4 w-4 mr-1" />}
                                {viewMode === "details" && <LayoutList className="h-4 w-4 mr-1" />}
                                <span className="text-xs capitalize hidden sm:inline">{viewMode}</span>
                                <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>View Mode</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={viewMode} onValueChange={setViewMode}>
                                <DropdownMenuRadioItem value="tree">
                                    <List className="h-4 w-4 mr-2" />
                                    Tree View
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="list">
                                    <LayoutList className="h-4 w-4 mr-2" />
                                    List View
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="grid">
                                    <LayoutGrid className="h-4 w-4 mr-2" />
                                    Grid View
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="details">
                                    <LayoutList className="h-4 w-4 mr-2" />
                                    Details View
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                <ArrowUpDown className="h-4 w-4 mr-1" />
                                <span className="text-xs hidden sm:inline">Sort</span>
                                <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                <DropdownMenuRadioItem value="manual">
                                    <GripVertical className="h-4 w-4 mr-2" />
                                    Manual Order
                                </DropdownMenuRadioItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioItem value="name-asc">
                                    <ArrowUp className="h-4 w-4 mr-2" />
                                    Name (A-Z)
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="name-desc">
                                    <ArrowDown className="h-4 w-4 mr-2" />
                                    Name (Z-A)
                                </DropdownMenuRadioItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioItem value="date-desc">
                                    <ArrowDown className="h-4 w-4 mr-2" />
                                    Date (Newest)
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="date-asc">
                                    <ArrowUp className="h-4 w-4 mr-2" />
                                    Date (Oldest)
                                </DropdownMenuRadioItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioItem value="size-desc">
                                    <ArrowDown className="h-4 w-4 mr-2" />
                                    Size (Largest)
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="size-asc">
                                    <ArrowUp className="h-4 w-4 mr-2" />
                                    Size (Smallest)
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Selection controls */}
                <div className="flex items-center gap-1">
                    {selectedCount > 0 ? (
                        <>
                            <span className="text-xs text-muted-foreground mr-1">
                                {selectedCount} selected
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={clearSelection}
                            >
                                Clear
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => setBulkDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={selectAllItems}
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Select All
                        </Button>
                    )}
                </div>
            </div>

            {/* Breadcrumbs for non-tree views */}
            {viewMode !== "tree" && (currentFolderId !== null || folderPath.length > 0) && (
                <div className="px-3 py-2 border-b bg-background shrink-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigateToBreadcrumb(-1);
                                    }}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    <Home className="h-3.5 w-3.5" />
                                    <span>Root</span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {folderPath.map((folder, index) => (
                                <React.Fragment key={folder.id}>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        {index === folderPath.length - 1 ? (
                                            <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigateToBreadcrumb(index);
                                                }}
                                                className="hover:text-primary"
                                            >
                                                {folder.name}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            )}

            {/* Content area based on view mode */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            Loading...
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Folder className="h-12 w-12 mb-2 opacity-50" />
                            <p className="text-sm">No files or folders</p>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleOpenCreateFolder(null)}
                            >
                                Create a folder
                            </Button>
                        </div>
                    ) : viewMode === "tree" ? (
                        <Tree
                            ref={treeRef}
                            data={filteredData}
                            openByDefault={false}
                            width="100%"
                            height={600}
                            indent={20}
                            rowHeight={32}
                            onSelect={handleSelect}
                            onMove={sortBy === "manual" ? handleMove : undefined}
                            disableDrag={sortBy !== "manual"}
                            disableDrop={sortBy !== "manual"}
                            dndRootElement={null}
                        >
                            {TreeNode}
                        </Tree>
                    ) : viewMode === "list" ? (
                        <div className="space-y-0.5">
                            {flatItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`relative flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-accent/50 cursor-pointer group ${
                                        selectedItems.has(item.id) ? "bg-accent/30" : ""
                                    }`}
                                    onClick={() => {
                                        if (item.type === "folder") {
                                            navigateToFolder(item);
                                        } else {
                                            onFileSelect?.(item);
                                        }
                                    }}
                                >
                                    {/* Checkbox - on left, visible on hover or when selected */}
                                    <div className={`shrink-0 ${selectedItems.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                        <Checkbox
                                            checked={selectedItems.has(item.id)}
                                            onCheckedChange={(checked) => handleCheckChange(item.id, checked)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4"
                                        />
                                    </div>
                                    {item.type === "folder" ? (
                                        <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                                    ) : (
                                        <File className="h-4 w-4 text-red-500 shrink-0" />
                                    )}
                                    <span className="text-sm truncate flex-1">{item.name || item.title}</span>
                                    {/* Action buttons on the right */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                                        {item.type === "pdf" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onFileSelect?.(item);
                                                }}
                                                title="View PDF"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-1">
                            {flatItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border hover:bg-accent/50 cursor-pointer group transition-colors ${
                                        selectedItems.has(item.id) ? "bg-accent/30 border-primary" : "border-transparent"
                                    }`}
                                    onClick={() => {
                                        if (item.type === "folder") {
                                            navigateToFolder(item);
                                        } else {
                                            onFileSelect?.(item);
                                        }
                                    }}
                                >
                                    {/* Checkbox - shows on hover or when selected */}
                                    <div className={`absolute top-1 left-1 ${selectedItems.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10`}>
                                        <Checkbox
                                            checked={selectedItems.has(item.id)}
                                            onCheckedChange={(checked) => handleCheckChange(item.id, checked)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-3.5 w-3.5"
                                        />
                                    </div>
                                    <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${
                                        item.type === "folder" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"
                                    }`}>
                                        {item.type === "folder" ? (
                                            <Folder className="h-5 w-5 text-blue-500" />
                                        ) : (
                                            <File className="h-5 w-5 text-red-500" />
                                        )}
                                    </div>
                                    <span className="text-[11px] text-center truncate w-full leading-tight">{item.name || item.title}</span>
                                    {item.type === "pdf" && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onFileSelect?.(item);
                                            }}
                                            title="View PDF"
                                        >
                                            <Eye className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : viewMode === "details" ? (
                        <div className="w-full">
                            {/* Header row */}
                            <div className="flex items-center gap-1.5 py-1.5 px-2 border-b text-xs font-medium text-muted-foreground">
                                <div className="w-5"></div>
                                <div className="flex-1">Name</div>
                                <div className="w-16 text-right">Size</div>
                                <div className="w-20 text-right">Date</div>
                                <div className="w-6"></div>
                            </div>
                            {/* Data rows */}
                            {flatItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`relative flex items-center gap-1.5 py-1 px-2 border-b hover:bg-accent/50 cursor-pointer group ${
                                        selectedItems.has(item.id) ? "bg-accent/30" : ""
                                    }`}
                                    onClick={() => {
                                        if (item.type === "folder") {
                                            navigateToFolder(item);
                                        } else {
                                            onFileSelect?.(item);
                                        }
                                    }}
                                >
                                    {/* Checkbox - on left, visible on hover or when selected */}
                                    <div className={`shrink-0 ${selectedItems.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                        <Checkbox
                                            checked={selectedItems.has(item.id)}
                                            onCheckedChange={(checked) => handleCheckChange(item.id, checked)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-3.5 w-3.5"
                                        />
                                    </div>
                                    {item.type === "folder" ? (
                                        <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                                    ) : (
                                        <File className="h-4 w-4 text-red-500 shrink-0" />
                                    )}
                                    <span className="text-sm truncate flex-1">{item.name || item.title}</span>
                                    <span className="w-16 text-xs text-muted-foreground text-right shrink-0">
                                        {item.type === "pdf" ? formatFileSize(item.size) : "-"}
                                    </span>
                                    <span className="w-20 text-xs text-muted-foreground text-right shrink-0">
                                        {formatDate(item.createdAt)}
                                    </span>
                                    {/* Action buttons on right */}
                                    <div className="w-8 flex justify-end items-center gap-0.5 shrink-0">
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                                            {item.type === "pdf" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onFileSelect?.(item);
                                                    }}
                                                    title="View PDF"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </ScrollArea>

            {/* Create Folder Dialog */}
            <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            {parentFolderId
                                ? `Creating folder inside "${availableFoldersForCreate.find(f => f.id === parentFolderId)?.name || 'selected folder'}"`
                                : "Creating folder at root level"
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateFolder}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename</DialogTitle>
                        <DialogDescription>
                            Enter a new name.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="New name"
                        onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRename}>Rename</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {itemToDelete?.type === "folder" ? "Folder" : "File"}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {itemToDelete?.type === "folder"
                                ? "This will delete the folder and all its contents. This action cannot be undone."
                                : "This will permanently delete this file. This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedCount} Document{selectedCount > 1 ? 's' : ''}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the selected document{selectedCount > 1 ? 's' : ''}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete {selectedCount} Document{selectedCount > 1 ? 's' : ''}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Folder Picker Dialog */}
            <Dialog open={folderPickerOpen} onOpenChange={setFolderPickerOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Folder Location</DialogTitle>
                        <DialogDescription>
                            Choose where to create the new folder
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search input */}
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search folders..."
                            value={folderPickerSearch}
                            onChange={(e) => {
                                setFolderPickerSearch(e.target.value);
                                setFolderPickerPage(1);
                            }}
                            className="pl-8"
                        />
                    </div>

                    {/* Folder list with scroll area */}
                    <ScrollArea className="h-[250px] rounded-md border">
                        <div className="p-2 space-y-1">
                            {/* Root option */}
                            <div
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                onClick={() => handleSelectFolderFromPicker(null)}
                            >
                                <Home className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Root Level</span>
                            </div>

                            {paginatedFoldersForPicker.length > 0 ? (
                                paginatedFoldersForPicker.map(folder => (
                                    <div
                                        key={folder.id}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                        style={{ paddingLeft: `${folder.depth * 12 + 8}px` }}
                                        onClick={() => handleSelectFolderFromPicker(folder.id)}
                                    >
                                        <Folder className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm">{folder.name}</span>
                                    </div>
                                ))
                            ) : folderPickerSearch ? (
                                <div className="text-center text-sm text-muted-foreground py-4">
                                    No folders matching &ldquo;{folderPickerSearch}&rdquo;
                                </div>
                            ) : null}
                        </div>
                    </ScrollArea>

                    {/* Pagination */}
                    {totalFolderPickerPages > 1 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Page {folderPickerPage} of {totalFolderPickerPages}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFolderPickerPage(p => Math.max(1, p - 1))}
                                    disabled={folderPickerPage <= 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFolderPickerPage(p => Math.min(totalFolderPickerPages, p + 1))}
                                    disabled={folderPickerPage >= totalFolderPickerPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFolderPickerOpen(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});

export { FolderTree };

