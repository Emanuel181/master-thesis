import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FileTree({ structure, selectedPath, onFileClick, loadingPath }) {
    const [openFolders, setOpenFolders] = useState(new Set());

    if (!structure) return null;

    const toggleFolder = (path) => {
        setOpenFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const renderNode = (node) => {
        if (!node) return null;
        if (node.type === 'file') {
            return (
                <div
                    key={node.path}
                    className={cn(
                        "flex items-center gap-2 pl-4 py-1.5 cursor-pointer hover:bg-muted rounded transition-colors",
                        selectedPath === node.path && "bg-accent"
                    )}
                    onClick={() => onFileClick && onFileClick(node)}
                >
                    <File className="h-4 w-4 text-muted-foreground" />
                    {loadingPath === node.path ? (
                        <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span className="text-sm truncate" style={{ transform: 'none', writingMode: 'horizontal-tb' }}>{node.name}</span>
                </div>
            );
        }

        const isOpen = openFolders.has(node.path);

        return (
            <Collapsible
                key={node.path}
                className="pl-2"
                open={isOpen}
                onOpenChange={() => toggleFolder(node.path)}
            >
                <CollapsibleTrigger
                    className={cn(
                        "flex items-center gap-2 py-1.5 px-1 hover:bg-muted rounded w-full text-left cursor-pointer transition-colors select-none",
                        !isOpen && "hover:bg-muted/70"
                    )}
                >
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                    )}
                    {isOpen ? (
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                    ) : (
                        <Folder className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm font-medium truncate" style={{ transform: 'none', writingMode: 'horizontal-tb' }}>{node.name}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4 border-l border-border/50 pl-2">
                    {node.children?.map(renderNode)}
                </CollapsibleContent>
            </Collapsible>
        );
    }

    return <div className="space-y-0.5">{renderNode(structure)}</div>;
}
