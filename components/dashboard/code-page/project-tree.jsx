import React, { useState, useRef, useEffect, useCallback } from 'react';
import TreeView from './tree-view';
import { ChevronLeft, ChevronRight, FolderOpen, FolderClosed, Menu } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Helper: Recursively set isOpen state
const setExpansionState = (nodes, isOpen) => {
    if (!nodes) return [];
    return nodes.map(node => ({
        ...node,
        isOpen: isOpen,
        children: node.children ? setExpansionState(node.children, isOpen) : undefined
    }));
};

export default function ProjectTree({
                                        structure,
                                        onFileClick,
                                        width,
                                        onWidthChange,
                                        collapsed,
                                        setCollapsed,
                                        onDragStateChange,
                                        minWidth = 140,
                                        maxWidth = 640,
                                        additionalButtons = null
                                    }) {
    const [isDragging, setIsDragging] = useState(false);
    const [treeData, setTreeData] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

    const sidebarLeftRef = useRef(0);
    const containerRef = useRef(null);
    const animationFrameRef = useRef(null); // Ref for throttling drag updates

    const controlsRef = useRef(null); // Ref for TreeView controls (openAll/closeAll)

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const mapStructure = useCallback((node) => {
        if (!node) return null;
        const mapNode = (n, parentPath = '') => {
            const id = (parentPath ? `${parentPath}/${n.name}` : n.name) || Math.random().toString();
            return {
                id,
                name: n.name,
                type: n.type || (n.children ? 'folder' : 'file'),
                children: n.children?.map(ch => mapNode(ch, id)),
                _orig: n
            };
        };
        if (Array.isArray(node)) return node.map(n => mapNode(n));
        return node.children ? node.children.map(n => mapNode(n)) : [];
    }, []);

    useEffect(() => { setTreeData(mapStructure(structure)); }, [structure, mapStructure]);

    useEffect(() => { onDragStateChange?.(isDragging); }, [isDragging, onDragStateChange]);

    // --- Global Expand/Collapse Handlers ---
    const handleExpandAll = () => {
        // Try imperative API first (if available), then update source treeData to ensure consistency.
        try {
            controlsRef.current?.openAll?.();
        } catch (e) {
            // ignore
        }
        setTreeData(prev => setExpansionState(prev, true));
    };
    const handleCollapseAll = () => {
        try {
            controlsRef.current?.closeAll?.();
        } catch (e) {
            // ignore
        }
        setTreeData(prev => setExpansionState(prev, false));
    };

    const startResize = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        if (containerRef.current) sidebarLeftRef.current = containerRef.current.getBoundingClientRect().left;
    }, []);

    useEffect(() => {
        const onMove = (e) => {
            if (!isDragging) return;

            // Throttle updates with requestAnimationFrame for performance
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

            animationFrameRef.current = requestAnimationFrame(() => {
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const rawWidth = clientX - sidebarLeftRef.current;

                if (collapsed) {
                    if (rawWidth > minWidth / 2) {
                        setCollapsed(false);
                        onWidthChange(Math.max(minWidth, rawWidth));
                    }
                } else {
                    if (rawWidth < 80) { setCollapsed(true); return; }
                    const w = Math.max(minWidth, Math.min(maxWidth, rawWidth));
                    onWidthChange(w);
                }
            });
        };

        const onUp = () => {
            setIsDragging(false);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };

        if (isDragging) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            // Optimization: Change cursor globally
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isDragging, collapsed, minWidth, maxWidth, onWidthChange, setCollapsed]);

    // Handle file click with mobile sheet close
    const handleFileClick = useCallback((item) => {
        if (!item.children) {
            onFileClick(item._orig);
            if (isMobile) {
                setMobileSheetOpen(false);
            }
        }
    }, [onFileClick, isMobile]);

    // Mobile view - Sheet/Drawer
    if (isMobile) {
        return (
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 gap-1.5 shrink-0"
                    >
                        <Menu className="h-4 w-4" />
                        <span className="text-xs">Files</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
                    <SheetHeader className="px-4 py-3 border-b shrink-0">
                        <SheetTitle className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Project Files</span>
                            <div className="flex items-center gap-1">
                                <button onClick={handleExpandAll} className="p-1.5 hover:bg-accent rounded-md" title="Expand All">
                                    <FolderOpen className="h-4 w-4" />
                                </button>
                                <button onClick={handleCollapseAll} className="p-1.5 hover:bg-accent rounded-md" title="Collapse All">
                                    <FolderClosed className="h-4 w-4" />
                                </button>
                                {additionalButtons}
                            </div>
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-2">
                            <TreeView
                                ref={controlsRef}
                                data={treeData}
                                onItemClick={handleFileClick}
                            />
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        );
    }

    // Desktop view - Resizable sidebar
    return (
        <div
            ref={containerRef}
            className={cn(
                "relative flex flex-col h-full bg-muted/10 border-r border-border shrink-0 group",
                // Remove transition during drag to prevent lag
                isDragging ? "transition-none" : "transition-all duration-100 ease-out",
                collapsed ? "w-12" : ""
            )}
            style={{ width: collapsed ? undefined : width }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 h-10 border-b border-border bg-muted/30 shrink-0">
                {!collapsed && (
                    <>
                        <span className="text-sm font-semibold truncate">Project</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={handleExpandAll} className="p-1 hover:bg-accent rounded-md" title="Expand All">
                                <FolderOpen className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={handleCollapseAll} className="p-1 hover:bg-accent rounded-md" title="Collapse All">
                                <FolderClosed className="h-3.5 w-3.5" />
                            </button>
                            {additionalButtons}
                        </div>
                    </>
                )}
                <button onClick={() => setCollapsed(!collapsed)} className={cn("p-1 hover:bg-accent rounded-md z-10", collapsed && "mx-auto")}>
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-hidden">
                {!collapsed ? (
                    <div className="h-full w-full p-2">
                        <TreeView ref={controlsRef} data={treeData} onItemClick={(i) => !i.children && onFileClick(i._orig)} />
                    </div>
                ) : (
                    <div className="pt-4 flex justify-center cursor-pointer h-full hover:bg-muted/50" onClick={() => setCollapsed(false)}>
                        <span className="writing-mode-vertical text-xs text-muted-foreground font-medium tracking-widest uppercase" style={{ writingMode: 'vertical-rl' }}>PROJECT</span>
                    </div>
                )}
            </div>

            {/* Drag Handle */}
            <div
                onMouseDown={startResize}
                className={cn(
                    "absolute -right-1 top-0 h-full w-4 cursor-col-resize z-50 flex justify-center hover:after:bg-primary/50",
                    isDragging && "after:bg-primary"
                )}
            >
                <div className="w-[1px] h-full after:content-[''] after:block after:w-1 after:h-full transition-colors" />
            </div>
        </div>
    );
}