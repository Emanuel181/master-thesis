"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, ChevronRight as ChevronRightIcon, Folder, File } from "lucide-react";
import { Input } from "@/components/ui/input";

const USE_CASES_PER_PAGE = 5;

/**
 * Knowledge Base Node component for the workflow visualization
 */
export function KnowledgeBaseNode({ data }) {
    const [open, setOpen] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [useCasePage, setUseCasePage] = React.useState(0);
    const [useCaseSearchTerm, setUseCaseSearchTerm] = React.useState("");
    const [kbSearchTerm, setKbSearchTerm] = React.useState(""); // Search term for KB dropdown
    
    // Hierarchical selection state
    const [expandedGroups, setExpandedGroups] = React.useState(new Set());
    const [expandedUseCases, setExpandedUseCases] = React.useState(new Set());
    const [selectedFiles, setSelectedFiles] = React.useState(new Set());
    const [selectedGroups, setSelectedGroups] = React.useState(new Set());
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
        const fetchGroups = async () => {
            try {
                const response = await fetch('/api/use-case-groups');
                if (response.ok) {
                    const responseData = await response.json();
                    const groups = responseData.data?.groups || responseData.groups || [];
                    console.log('[KnowledgeBaseNode] Fetched groups:', groups);
                    setUseCaseGroups(groups);
                } else {
                    console.error('[KnowledgeBaseNode] Failed to fetch groups:', response.status);
                }
            } catch (error) {
                console.error('[KnowledgeBaseNode] Error fetching groups:', error);
            }
        };
        fetchGroups();
    }, []);

    // Load auto-selected group from localStorage and sync with Knowledge Base
    React.useEffect(() => {
        const loadAutoSelectedGroup = async () => {
            try {
                // Get auto-selected group from Code Input
                const savedGroups = localStorage.getItem('vulniq_selected_groups');
                const savedDocuments = localStorage.getItem('vulniq_selected_documents');
                
                if (savedGroups) {
                    const groupIds = JSON.parse(savedGroups);
                    if (groupIds.length > 0) {
                        const groupId = groupIds[0]; // Take the first group
                        
                        // Set the group in the dropdown if not already set
                        if (!data.codeType && data.onCodeTypeChange) {
                            data.onCodeTypeChange(groupId);
                        }
                        
                        // Auto-select the group
                        setSelectedGroups(new Set([groupId]));
                        
                        // Expand the group to show use cases
                        setExpandedGroups(new Set([groupId]));
                        
                        console.log('[KnowledgeBaseNode] Auto-selected group:', groupId);
                    }
                }
                
                if (savedDocuments) {
                    const documentIds = JSON.parse(savedDocuments);
                    setSelectedFiles(new Set(documentIds));
                    console.log('[KnowledgeBaseNode] Auto-selected documents:', documentIds.length);
                }
            } catch (error) {
                console.error('[KnowledgeBaseNode] Error loading auto-selected group:', error);
            }
        };
        
        // Only load once on mount
        loadAutoSelectedGroup();
    }, []); // Empty dependency array - only run once on mount

    // Group use cases by groupId and filter by search term
    const groupedUseCases = React.useMemo(() => {
        const grouped = {};
        
        // Add all groups from useCaseGroups
        useCaseGroups.forEach(group => {
            // Filter use cases by search term
            const allUseCasesInGroup = (data.useCases || []).filter(uc => uc.groupId === group.id);
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
        const allUngroupedUseCases = (data.useCases || []).filter(uc => !uc.groupId);
        const filteredUngroupedUseCases = allUngroupedUseCases.filter(uc => 
            kbSearchTerm === '' || 
            uc.title.toLowerCase().includes(kbSearchTerm.toLowerCase())
        );
        
        // Show ungrouped if: no search OR has matching use cases OR (no search and no other groups)
        if (kbSearchTerm === '' || filteredUngroupedUseCases.length > 0) {
            grouped['ungrouped'] = {
                id: 'ungrouped',
                name: 'Ungrouped',
                useCases: kbSearchTerm === '' ? allUngroupedUseCases : filteredUngroupedUseCases
            };
        }
        
        console.log('[KnowledgeBaseNode] useCaseGroups:', useCaseGroups);
        console.log('[KnowledgeBaseNode] data.useCases:', data.useCases);
        console.log('[KnowledgeBaseNode] kbSearchTerm:', kbSearchTerm);
        console.log('[KnowledgeBaseNode] Grouped use cases:', grouped);
        console.log('[KnowledgeBaseNode] Total groups:', Object.keys(grouped).length);
        return grouped;
    }, [useCaseGroups, data.useCases, kbSearchTerm]);

    // Fetch PDFs for a use case
    const fetchUseCasePdfs = async (useCaseId) => {
        if (useCasePdfs[useCaseId]) return;
        
        setLoadingPdfs(prev => new Set(prev).add(useCaseId));
        try {
            const response = await fetch(`/api/folders?useCaseId=${useCaseId}`);
            if (response.ok) {
                const data = await response.json();
                const folders = data.data?.folders || data.folders || [];
                
                const extractPdfs = (items) => {
                    let pdfs = [];
                    items.forEach(item => {
                        if (item.type === 'pdf') {
                            pdfs.push(item);
                        }
                        if (item.children) {
                            pdfs = pdfs.concat(extractPdfs(item.children));
                        }
                    });
                    return pdfs;
                };
                
                const allPdfs = extractPdfs(folders);
                setUseCasePdfs(prev => ({ ...prev, [useCaseId]: allPdfs }));
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
    };

    // Toggle use case expansion and fetch PDFs
    const toggleUseCase = (useCaseId) => {
        setExpandedUseCases(prev => {
            const next = new Set(prev);
            if (next.has(useCaseId)) {
                next.delete(useCaseId);
            } else {
                next.add(useCaseId);
                fetchUseCasePdfs(useCaseId);
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
            // Save to localStorage
            localStorage.setItem('vulniq_selected_documents', JSON.stringify(Array.from(next)));
            return next;
        });
    };

    // Toggle group selection
    const toggleGroup = (groupId) => {
        const isCurrentlySelected = selectedGroups.has(groupId);
        
        if (isCurrentlySelected) {
            setSelectedGroups(prev => {
                const next = new Set(prev);
                next.delete(groupId);
                // Save to localStorage
                localStorage.setItem('vulniq_selected_groups', JSON.stringify(Array.from(next)));
                return next;
            });
            const group = groupedUseCases[groupId];
            if (group) {
                const allFileIds = new Set();
                group.useCases.forEach(uc => {
                    const pdfs = useCasePdfs[uc.id] || [];
                    pdfs.forEach(pdf => allFileIds.add(pdf.id));
                });
                setSelectedFiles(prev => {
                    const next = new Set(prev);
                    allFileIds.forEach(id => next.delete(id));
                    // Save to localStorage
                    localStorage.setItem('vulniq_selected_documents', JSON.stringify(Array.from(next)));
                    return next;
                });
            }
        } else {
            setSelectedGroups(prev => {
                const next = new Set(prev).add(groupId);
                // Save to localStorage
                localStorage.setItem('vulniq_selected_groups', JSON.stringify(Array.from(next)));
                return next;
            });
            const group = groupedUseCases[groupId];
            if (group) {
                const allFileIds = new Set();
                group.useCases.forEach(uc => {
                    const pdfs = useCasePdfs[uc.id] || [];
                    pdfs.forEach(pdf => allFileIds.add(pdf.id));
                });
                setSelectedFiles(prev => {
                    const next = new Set(prev);
                    allFileIds.forEach(id => next.add(id));
                    // Save to localStorage
                    localStorage.setItem('vulniq_selected_documents', JSON.stringify(Array.from(next)));
                    return next;
                });
            }
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

    // Filter and paginate groups (group dropdown)
    const filteredGroups = useCaseGroups.filter(group =>
        group.name.toLowerCase().includes(useCaseSearchTerm.toLowerCase())
    );
    const totalGroupPages = Math.ceil(filteredGroups.length / USE_CASES_PER_PAGE);
    const paginatedGroups = filteredGroups.slice(
        useCasePage * USE_CASES_PER_PAGE,
        (useCasePage + 1) * USE_CASES_PER_PAGE
    );

    const handleCodeTypeChange = (newCodeType) => {
        if (data.onCodeTypeChange) {
            data.onCodeTypeChange(newCodeType);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    const isKnowledgeBaseDisabled = !data.codeType;

    return (
        <>
            <Card className={`w-[220px] sm:w-[280px] shadow-lg border-2 ${borderColor}`}>
                <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`p-2 sm:p-3 rounded-lg ${data.iconBg}`}>
                            <Database className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs sm:text-base truncate">{data.label}</div>
                            <div className="text-[10px] sm:text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                                {selectedGroups.size} group{selectedGroups.size !== 1 ? 's' : ''}, {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                        {data.description}
                    </div>

                    <div className="mb-2 sm:mb-3">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Group:</div>
                        </div>
                        <Select
                            value={data.codeType || ""}
                            onValueChange={handleCodeTypeChange}
                        >
                            <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs">
                                <SelectValue placeholder="Select group" />
                            </SelectTrigger>
                            <SelectContent>
                                <div onWheelCapture={(e) => e.stopPropagation()}>
                                    <div className="p-2 border-b">
                                        <Input
                                            placeholder="Search groups..."
                                            className="h-7 text-xs"
                                            value={useCaseSearchTerm}
                                            onChange={(e) => {
                                                setUseCaseSearchTerm(e.target.value);
                                                setUseCasePage(0);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="max-h-[160px]">
                                        {paginatedGroups.length > 0 ? (
                                            paginatedGroups.map((group) => (
                                                <SelectItem key={group.id} value={group.id} className="text-xs">
                                                    {group.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="py-2 px-3 text-xs text-muted-foreground text-center">No groups found</div>
                                        )}
                                    </div>
                                    {totalGroupPages > 1 && (
                                        <div className="flex items-center justify-between px-2 py-1.5 border-t">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => { e.stopPropagation(); setUseCasePage(p => Math.max(0, p - 1)); }}
                                                disabled={useCasePage === 0}
                                            >
                                                <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                            <span className="text-[10px] text-muted-foreground">
                                                {useCasePage + 1} / {totalGroupPages}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => { e.stopPropagation(); setUseCasePage(p => Math.min(totalGroupPages - 1, p + 1)); }}
                                                disabled={useCasePage >= totalGroupPages - 1}
                                            >
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SelectContent>
                        </Select>
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

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-auto justify-between text-left font-normal p-1.5 sm:p-2"
                                disabled={isKnowledgeBaseDisabled}
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
                                                <div className="flex items-center gap-2 p-2 hover:bg-accent/50 transition-colors rounded-t-lg">
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
                                                                
                                                                return (
                                                                    <div key={useCase.id} className="border-b last:border-b-0">
                                                                        {/* Use Case Header */}
                                                                        <button
                                                                            onClick={() => toggleUseCase(useCase.id)}
                                                                            className="w-full flex items-center gap-2 p-2 pl-6 hover:bg-accent/30 transition-colors"
                                                                        >
                                                                            <ChevronRightIcon className={`h-3 w-3 transition-transform ${isUseCaseExpanded ? 'rotate-90' : ''}`} />
                                                                            <File className="h-3 w-3 text-orange-500" />
                                                                            <span className="text-xs flex-1 text-left">{useCase.title}</span>
                                                                            {isLoadingPdfs ? (
                                                                                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                                                                            ) : (
                                                                                <span className="text-[10px] text-muted-foreground">
                                                                                    {pdfs.length}
                                                                                </span>
                                                                            )}
                                                                        </button>

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
                                                                                        .map(pdf => (
                                                                                            <label
                                                                                                key={pdf.id}
                                                                                                className="flex items-center gap-2 p-2 pl-12 hover:bg-accent/20 cursor-pointer transition-colors"
                                                                                            >
                                                                                                <Checkbox
                                                                                                checked={selectedFiles.has(pdf.id)}
                                                                                                onCheckedChange={() => toggleFile(pdf.id)}
                                                                                                className="h-3 w-3"
                                                                                            />
                                                                                            <File className="h-2.5 w-2.5 text-red-500" />
                                                                                            <span className="text-[10px] flex-1">{pdf.name || pdf.title}</span>
                                                                                        </label>
                                                                                    ))
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
                                            // Clear localStorage
                                            localStorage.setItem('vulniq_selected_documents', JSON.stringify([]));
                                            localStorage.setItem('vulniq_selected_groups', JSON.stringify([]));
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
            <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3" />
        </>
    );
}

