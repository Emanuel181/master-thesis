import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, File, Folder } from 'lucide-react';

export default function FileTree({ structure, selectedPath, onFileClick, loadingPath }) {
    if (!structure) return null;

    const renderNode = (node) => {
        if (!node) return null;
        if (node.type === 'file') {
            return (
                <div
                    key={node.path}
                    className={`flex items-center gap-2 pl-4 py-1 cursor-pointer hover:bg-muted rounded ${selectedPath === node.path ? 'bg-accent' : ''}`}
                    onClick={() => onFileClick && onFileClick(node)}
                >
                    <File className="h-4 w-4" />
                    {loadingPath === node.path ? (
                        <div className="h-3 w-3 border-2 border-current rounded-full animate-spin" />
                    ) : null}
                    <span className="text-sm" style={{ transform: 'none', writingMode: 'horizontal-tb' }}>{node.name}</span>
                </div>
            );
        }

        return (
            <Collapsible key={node.path} className="pl-2">
                <CollapsibleTrigger className="flex items-center gap-2 py-1 hover:bg-muted rounded w-full text-left">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                    <Folder className="h-4 w-4" />
                    <span className="text-sm font-medium" style={{ transform: 'none', writingMode: 'horizontal-tb' }}>{node.name}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4">
                    {node.children?.map(renderNode)}
                </CollapsibleContent>
            </Collapsible>
        );
    }

    return <div>{renderNode(structure)}</div>;
}
