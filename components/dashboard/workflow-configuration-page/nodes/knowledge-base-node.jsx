"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, ChevronDown, RefreshCw, ChevronRight as ChevronRightIcon, Folder, File, Check, AlertCircle, Loader2, CircleCheckBig } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUseCases } from "@/contexts/useCasesContext";
import { useKbSelection } from "@/contexts/kbSelectionContext";
import { DEMO_USE_CASE_GROUPS, DEMO_DOCUMENTS } from "@/contexts/demoContext";

/**
 * Knowledge Base Node component for the workflow visualization
 */
export function KnowledgeBaseNode({ data }) {
    const [open, setOpen] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [kbSearchTerm, setKbSearchTerm] = React.useState(""); // Search term for KB dropdown
    
    // Demo mode passed from parent (AIWorkflowVisualization) — avoids usePathname timing issues in portals
    const isDemoMode = data.isDemoMode;

    // Get use cases directly from context (reactive, always fresh)
    const { useCases: contextUseCases } = useUseCases();

    // Shared KB selection state from context (single source of truth)
    const { selectedFiles, selectedGroups, setSelectedFiles, setSelectedGroups } = useKbSelection();

    // Hierarchical UI state (local to this node)
    const [expandedGroups, setExpandedGroups] = React.useState(new Set());
    const [expandedUseCases, setExpandedUseCases] = React.useState(new Set());
    const [useCaseGroups, setUseCaseGroups] = React.useState([]);
    const [useCasePdfs, setUseCasePdfs] = React.useState({});
    const [loadingPdfs, setLoadingPdfs] = React.useState(new Set());
    
    // Use parent's isRefreshingAll state or local isRefreshing state
    const showRefreshAnimation = data.isRefreshingAll || isRefreshing;
    
    const borderColorMap = {
        "bg-cyan-500": "border-cyan-500 dark:border-cyan-400",
    };
    const borderColor = borderColorMap[data.iconBg] || "border-cyan-500 dark:border-cyan-400";

    // Fetch groups on mount
    React.useEffect(() => {
        if (isDemoMode) {
            setUseCaseGroups(DEMO_USE_CASE_GROUPS);
            return;
        }
        const fetchGroups = async () => {
            try {
                const response = await fetch('/api/use-case-groups');
                if (response.ok) {
                    const responseData = await response.json();
                    const groups = responseData.data?.groups || responseData.groups || [];
                    setUseCaseGroups(groups);
                } else {
                    console.error('[KnowledgeBaseNode] Failed to fetch groups:', response.status);
                }
            } catch (error) {
                console.error('[KnowledgeBaseNode] Error fetching groups:', error);
            }
        };
        fetchGroups();
    }, [isDemoMode]);

    // Validate selectedFiles on mount — prune any IDs that no longer exist in the DB
    React.useEffect(() => {
        const allUseCases = contextUseCases || [];
        if (allUseCases.length === 0 || selectedFiles.size === 0) return;

        if (isDemoMode) {
            // In demo mode, validate against DEMO_DOCUMENTS
            const validIds = new Set();
            Object.values(DEMO_DOCUMENTS).forEach(docs => docs.forEach(doc => validIds.add(doc.id)));
            setSelectedFiles(prev => {
                const pruned = new Set([...prev].filter(id => validIds.has(id)));
                if (pruned.size !== prev.size) return pruned;
                return prev;
            });
            return;
        }

        const validateSelectedFiles = async () => {
            try {
                const allPdfsArrays = await Promise.all(
                    allUseCases.map(async (uc) => {
                        const response = await fetch(`/api/folders?useCaseId=${uc.id}`);
                        if (!response.ok) return [];
                        const data = await response.json();
                        const folders = data.data?.folders || data.folders || [];
                        const extractPdfs = (items) => {
                            let pdfs = [];
                            items.forEach(item => {
                                if (item.type === 'pdf') pdfs.push(item);
                                if (item.children) pdfs = pdfs.concat(extractPdfs(item.children));
                            });
                            return pdfs;
                        };
                        return extractPdfs(folders);
                    })
                );
                const validIds = new Set();
                allPdfsArrays.forEach(pdfs => pdfs.forEach(pdf => validIds.add(pdf.id)));

                setSelectedFiles(prev => {
                    const pruned = new Set([...prev].filter(id => validIds.has(id)));
                    if (pruned.size !== prev.size) return pruned;
                    return prev;
                });
            } catch {
                // Validation failure is non-critical
            }
        };

        validateSelectedFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextUseCases?.length, isDemoMode]);

    // Auto-expand group from codeType selection
    React.useEffect(() => {
        if (data.codeType) {
            setExpandedGroups(prev => {
                if (prev.has(data.codeType)) return prev;
                return new Set(prev).add(data.codeType);
            });
        }
    }, [data.codeType]);

    // Group use cases by groupId and filter by search term
    const groupedUseCases = React.useMemo(() => {
        const grouped = {};
        const allUseCases = contextUseCases || [];

        // Add all groups from useCaseGroups
        useCaseGroups.forEach(group => {
            // Filter use cases by search term
            const allUseCasesInGroup = allUseCases.filter(uc => uc.groupId === group.id);
            const filteredUseCases = allUseCasesInGroup.filter(uc =>
                kbSearchTerm === '' || 
                uc.title.toLowerCase().includes(kbSearchTerm.toLowerCase())
            );
            
            // Show group if: no search term OR group name matches OR has matching use cases
            const groupNameMatches = kbSearchTerm === '' || group.name.toLowerCase().includes(kbSearchTerm.toLowerCase());
            const hasMatchingUseCases = filteredUseCases.length > 0;
            
            if (groupNameMatches || hasMatchingUseCases) {
                grouped[group.id] = {
                    ...group,
                    useCases: groupNameMatches ? allUseCasesInGroup : filteredUseCases
                };
            }
        });
        
        // Add ungrouped use cases
        const allUngroupedUseCases = allUseCases.filter(uc => !uc.groupId);
        const filteredUngroupedUseCases = allUngroupedUseCases.filter(uc =>
            kbSearchTerm === '' || 
            uc.title.toLowerCase().includes(kbSearchTerm.toLowerCase())
        );
        
        // Always show ungrouped if there are ungrouped use cases or no search
        if (kbSearchTerm === '' || filteredUngroupedUseCases.length > 0) {
            grouped['ungrouped'] = {
                id: 'ungrouped',
                name: 'Ungrouped',
                useCases: kbSearchTerm === '' ? allUngroupedUseCases : filteredUngroupedUseCases
            };
        }
        
        return grouped;
    }, [useCaseGroups, contextUseCases, kbSearchTerm]);

    // Keep selectedGroups in sync: remove groups whose files are all deselected
    React.useEffect(() => {
        if (selectedGroups.size === 0) return;

        // If no files are selected at all, all groups are stale
        if (selectedFiles.size === 0) {
            setSelectedGroups(new Set());
            return;
        }

        // Only check individual groups once PDFs have been loaded
        if (Object.keys(useCasePdfs).length === 0) return;

        const groupsToRemove = [];
        for (const groupId of selectedGroups) {
            const group = groupedUseCases[groupId];
            if (!group) { groupsToRemove.push(groupId); continue; }

            // Check if any file from any use case in this group is still selected
            let hasSelectedFile = false;
            for (const uc of group.useCases) {
                const pdfs = useCasePdfs[uc.id] || [];
                if (pdfs.some(pdf => selectedFiles.has(pdf.id))) {
                    hasSelectedFile = true;
                    break;
                }
            }
            if (!hasSelectedFile) groupsToRemove.push(groupId);
        }

        if (groupsToRemove.length > 0) {
            setSelectedGroups(prev => {
                const next = new Set(prev);
                groupsToRemove.forEach(id => next.delete(id));
                return next;
            });
        }
    }, [selectedFiles, selectedGroups, groupedUseCases, useCasePdfs, setSelectedGroups]);

    // Helper: ensure PDFs are fetched for a use case (returns the PDFs)
    const ensurePdfsFetched = async (useCaseId) => {
        if (useCasePdfs[useCaseId]) return useCasePdfs[useCaseId];

        // In demo mode, use DEMO_DOCUMENTS
        if (isDemoMode) {
            const demoPdfs = DEMO_DOCUMENTS[useCaseId] || [];
            setUseCasePdfs(prev => ({ ...prev, [useCaseId]: demoPdfs }));
            return demoPdfs;
        }

        setLoadingPdfs(prev => new Set(prev).add(useCaseId));
        try {
            const response = await fetch(`/api/folders?useCaseId=${useCaseId}`);
            if (response.ok) {
                const data = await response.json();
                const folders = data.data?.folders || data.folders || [];

                const extractPdfs = (items) => {
                    let pdfs = [];
                    items.forEach(item => {
                        if (item.type === 'pdf') pdfs.push(item);
                        if (item.children) pdfs = pdfs.concat(extractPdfs(item.children));
                    });
                    return pdfs;
                };

                const allPdfs = extractPdfs(folders);
                setUseCasePdfs(prev => ({ ...prev, [useCaseId]: allPdfs }));
                return allPdfs;
            }
        } catch (error) {
            console.error('Error fetching PDFs:', error);
        } finally {
            setLoadingPdfs(prev => {
                const next = new Set(prev);
                next.delete(useCaseId);
                return next;
            });
        }
        return [];
    };

    // Fetch PDFs for a use case (kept for refresh and popover open)
    const fetchUseCasePdfs = async (useCaseId, force = false) => {
        if (force) {
            setUseCasePdfs(prev => {
                const next = { ...prev };
                delete next[useCaseId];
                return next;
            });
        }
        if (!force && useCasePdfs[useCaseId]) return;
        await ensurePdfsFetched(useCaseId);
    };

    // Toggle use case expansion and fetch PDFs
    const toggleUseCase = (useCaseId) => {
        setExpandedUseCases(prev => {
            const next = new Set(prev);
            if (next.has(useCaseId)) {
                next.delete(useCaseId);
            } else {
                next.add(useCaseId);
                ensurePdfsFetched(useCaseId);
            }
            return next;
        });
    };

    // Toggle file selection
    const toggleFile = (fileId) => {
        setSelectedFiles(prev => {
            const next = new Set(prev);
            if (next.has(fileId)) {
                next.delete(fileId);
            } else {
                next.add(fileId);
            }
            return next;
        });
    };

    // Toggle use case selection - selects/deselects all PDFs in the use case
    const toggleUseCaseSelection = async (useCaseId) => {
        const pdfs = await ensurePdfsFetched(useCaseId);
        const pdfIds = pdfs.map(pdf => pdf.id);

        const allSelected = pdfIds.length > 0 && pdfIds.every(id => selectedFiles.has(id));

        setSelectedFiles(prev => {
            const next = new Set(prev);
            if (allSelected) {
                pdfIds.forEach(id => next.delete(id));
            } else {
                pdfIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    // Toggle group selection - fetches all PDFs then selects/deselects all
    const toggleGroup = async (groupId) => {
        const isCurrentlySelected = selectedGroups.has(groupId);
        const group = groupedUseCases[groupId];

        if (!group) return;

        // Fetch all PDFs for every use case in the group
        const allPdfsPromises = group.useCases.map(uc => ensurePdfsFetched(uc.id));
        const allPdfsArrays = await Promise.all(allPdfsPromises);
        const allFileIds = new Set();
        allPdfsArrays.forEach(pdfs => pdfs.forEach(pdf => allFileIds.add(pdf.id)));

        if (isCurrentlySelected) {
            setSelectedGroups(prev => {
                const next = new Set(prev);
                next.delete(groupId);
                return next;
            });
            setSelectedFiles(prev => {
                const next = new Set(prev);
                allFileIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setSelectedGroups(prev => {
                const next = new Set(prev).add(groupId);
                return next;
            });
            setSelectedFiles(prev => {
                const next = new Set(prev);
                allFileIds.forEach(id => next.add(id));
                return next;
            });
        }
    };

    // Toggle group expansion
    const toggleGroupExpansion = (groupId) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Clear cached PDFs so they are re-fetched with fresh data
        setUseCasePdfs({});

        if (isDemoMode) {
            setUseCaseGroups(DEMO_USE_CASE_GROUPS);
        } else {
            // Re-fetch groups
            try {
                const response = await fetch('/api/use-case-groups');
                if (response.ok) {
                    const responseData = await response.json();
                    const groups = responseData.data?.groups || responseData.groups || [];
                    setUseCaseGroups(groups);
                }
            } catch (error) {
                console.error('[KnowledgeBaseNode] Error refreshing groups:', error);
            }
        }

        // Re-fetch PDFs for any currently expanded use cases
        for (const useCaseId of expandedUseCases) {
            fetchUseCasePdfs(useCaseId, true);
        }
        setIsRefreshing(false);
    };

    const isConfigured = selectedFiles.size > 0 || selectedGroups.size > 0;

    return (
        <>
            <Card className={`w-[220px] sm:w-[280px] shadow-lg border-2 transition-all duration-300 ${borderColor} ${
                isConfigured ? 'ring-2 ring-primary/20 shadow-md' : 'opacity-90'
            }`}>
                <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`p-2 sm:p-3 rounded-lg ${data.iconBg} relative`}>
                            <Database className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                            {isConfigured && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary border-2 border-background">
                                    <Check className="h-2 w-2 text-white" strokeWidth={3} />
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs sm:text-base truncate">{data.label}</div>
                            <div className="text-[10px] sm:text-xs text-primary font-medium">
                                {selectedGroups.size > 0 || selectedFiles.size > 0
                                    ? `${selectedGroups.size} group${selectedGroups.size !== 1 ? 's' : ''}, ${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''}`
                                    : <span className="text-muted-foreground">No selection</span>
                                }
                            </div>
                        </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                        {data.description}
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                        <div className="flex-1">
                            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Knowledge bases:</div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            onClick={handleRefresh}
                            disabled={showRefreshAnimation}
                        >
                            <RefreshCw className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${showRefreshAnimation ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <Popover open={open} onOpenChange={(isOpen) => {
                        setOpen(isOpen);
                        if (isOpen) {
                            // Invalidate cached PDFs so expanded use cases show fresh data
                            setUseCasePdfs({});
                            expandedUseCases.forEach(ucId => fetchUseCasePdfs(ucId, true));
                        }
                    }}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-auto justify-between text-left font-normal p-1.5 sm:p-2"
                            >
                                <div className="flex-1 min-w-0">
                                    {selectedGroups.size > 0 || selectedFiles.size > 0 ? (
                                        <span className="text-[10px] sm:text-xs truncate block">
                                            {selectedGroups.size} group{selectedGroups.size !== 1 ? 's' : ''}, {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                                            Select knowledge bases
                                        </span>
                                    )}
                                </div>
                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] sm:w-[320px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                            <div className="p-3 border-b">
                                <p className="text-sm font-medium">Select knowledge bases</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Select groups or individual files
                                </p>
                            </div>
                            {/* Search bar */}
                            <div className="p-2 border-b">
                                <Input
                                    placeholder="Search groups, use cases, files..."
                                    className="h-7 text-xs"
                                    value={kbSearchTerm}
                                    onChange={(e) => setKbSearchTerm(e.target.value)}
                                />
                            </div>
                            <ScrollArea className="h-[300px]" onWheelCapture={(e) => e.stopPropagation()}>
                                <div className="p-2 space-y-2">
                                    {Object.entries(groupedUseCases).map(([groupId, group]) => {
                                        const isExpanded = expandedGroups.has(groupId);
                                        const isGroupSelected = selectedGroups.has(groupId);
                                        
                                        return (
                                            <div key={groupId} className="border rounded-lg bg-background">
                                                {/* Group Header */}
                                                <div className="flex items-center gap-2 p-2 hover:bg-muted/50 transition-colors rounded-t-lg">
                                                    <Checkbox
                                                        checked={isGroupSelected}
                                                        onCheckedChange={() => toggleGroup(groupId)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                    <button
                                                        onClick={() => toggleGroupExpansion(groupId)}
                                                        className="flex items-center gap-2 flex-1"
                                                    >
                                                        <ChevronRightIcon className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        <Folder className="h-3.5 w-3.5 text-blue-500" />
                                                        <span className="text-xs font-medium flex-1 text-left">{group.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {group.useCases.length}
                                                        </span>
                                                    </button>
                                                </div>

                                                {/* Use Cases */}
                                                {isExpanded && (
                                                    <div className="border-t">
                                                        {group.useCases.length === 0 ? (
                                                            <div className="p-3 text-[10px] text-muted-foreground text-center">
                                                                No use cases
                                                            </div>
                                                        ) : (
                                                            group.useCases.map(useCase => {
                                                                const isUseCaseExpanded = expandedUseCases.has(useCase.id);
                                                                const pdfs = useCasePdfs[useCase.id] || [];
                                                                const isLoadingPdfs = loadingPdfs.has(useCase.id);
                                                                const allPdfsSelected = pdfs.length > 0 && pdfs.every(pdf => selectedFiles.has(pdf.id));
                                                                const somePdfsSelected = pdfs.some(pdf => selectedFiles.has(pdf.id));

                                                                return (
                                                                    <div key={useCase.id} className="border-b last:border-b-0">
                                                                        {/* Use Case Header */}
                                                                        <div className="w-full flex items-center gap-2 p-2 pl-6 hover:bg-muted/30 transition-colors">
                                                                            <Checkbox
                                                                                checked={allPdfsSelected ? true : somePdfsSelected ? "indeterminate" : false}
                                                                                onCheckedChange={() => toggleUseCaseSelection(useCase.id)}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="h-3 w-3"
                                                                            />
                                                                            <button
                                                                                onClick={() => toggleUseCase(useCase.id)}
                                                                                className="flex items-center gap-2 flex-1"
                                                                            >
                                                                                <ChevronRightIcon className={`h-3 w-3 transition-transform ${isUseCaseExpanded ? 'rotate-90' : ''}`} />
                                                                                <File className="h-3 w-3 text-severity-high" />
                                                                                <span className="text-xs flex-1 text-left">{useCase.title}</span>
                                                                                {isLoadingPdfs ? (
                                                                                    <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                                                                                ) : (
                                                                                    <span className="text-[10px] text-muted-foreground">
                                                                                        {pdfs.length}
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                        </div>

                                                                        {/* PDF Files */}
                                                                        {isUseCaseExpanded && (
                                                                            <div className="bg-muted/50">
                                                                                {isLoadingPdfs ? (
                                                                                    <div className="p-3 pl-12 text-[10px] text-muted-foreground">
                                                                                        Loading...
                                                                                    </div>
                                                                                ) : pdfs.length === 0 ? (
                                                                                    <div className="p-3 pl-12 text-[10px] text-muted-foreground">
                                                                                        No files
                                                                                    </div>
                                                                                ) : (
                                                                                    pdfs
                                                                                        .filter(pdf => 
                                                                                            kbSearchTerm === '' || 
                                                                                            (pdf.name || pdf.title || '').toLowerCase().includes(kbSearchTerm.toLowerCase())
                                                                                        )
                                                                                        .map(pdf => {
                                                                                            const isVectorized = pdf.vectorized && pdf.embeddingStatus === 'completed';
                                                                                            const isProcessing = pdf.embeddingStatus === 'processing';
                                                                                            const isFailed = pdf.embeddingStatus === 'failed';

                                                                                            return (
                                                                                            <label
                                                                                                key={pdf.id}
                                                                                                className="flex items-center gap-2 p-2 pl-12 hover:bg-muted/20 cursor-pointer transition-colors"
                                                                                            >
                                                                                                <Checkbox
                                                                                                checked={selectedFiles.has(pdf.id)}
                                                                                                onCheckedChange={() => toggleFile(pdf.id)}
                                                                                                className="h-3 w-3"
                                                                                            />
                                                                                            <File className="h-2.5 w-2.5 text-destructive" />
                                                                                            <span className="text-[10px] flex-1">{pdf.name || pdf.title}</span>
                                                                                            <TooltipProvider delayDuration={300}>
                                                                                                <Tooltip>
                                                                                                    <TooltipTrigger asChild>
                                                                                                        <span className="shrink-0">
                                                                                                            {isVectorized && <CircleCheckBig className="h-2.5 w-2.5 text-primary" />}
                                                                                                            {isProcessing && <Loader2 className="h-2.5 w-2.5 text-amber-500 animate-spin" />}
                                                                                                            {isFailed && <AlertCircle className="h-2.5 w-2.5 text-destructive" />}
                                                                                                            {!isVectorized && !isProcessing && !isFailed && <AlertCircle className="h-2.5 w-2.5 text-muted-foreground" />}
                                                                                                        </span>
                                                                                                    </TooltipTrigger>
                                                                                                    <TooltipContent side="left" className="text-[10px]">
                                                                                                        {isVectorized && 'Vectorized — ready for RAG'}
                                                                                                        {isProcessing && 'Vectorizing — will be ready soon'}
                                                                                                        {isFailed && 'Vectorization failed — re-upload recommended'}
                                                                                                        {!isVectorized && !isProcessing && !isFailed && 'Pending vectorization'}
                                                                                                    </TooltipContent>
                                                                                                </Tooltip>
                                                                                            </TooltipProvider>
                                                                                        </label>
                                                                                        );
                                                                                    })
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {Object.keys(groupedUseCases).length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <Database className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                            {kbSearchTerm ? (
                                                <>
                                                    <p className="text-xs text-muted-foreground">No results found</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">Try a different search term</p>
                                                </>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">No groups found</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                            {(selectedFiles.size > 0 || selectedGroups.size > 0) && (
                                <div className="p-2 border-t flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedFiles(new Set());
                                            setSelectedGroups(new Set());
                                        }}
                                        className="h-7 text-xs"
                                    >
                                        Clear all
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>
            {/* Output to Reviewer Agent (Bottom) */}
            <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
        </>
    );
}

