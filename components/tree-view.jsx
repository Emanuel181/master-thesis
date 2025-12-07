import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronRight, Folder, File, Search, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Helper: Safely get a unique identifier for an item
// Prioritizes id, then path (common in file trees), then key, then name
const getId = (item) => item.id || item.path || item.key || item.name;

// Helper: Filter tree
function filterTree(items, q) {
    if (!q) return items;
    const lower = q.toLowerCase();
    const matches = [];
    for (const it of items) {
        const name = it.name || '';
        // Recursively filter children
        const children = it.children ? filterTree(it.children, q) : [];

        // If the name matches OR if it has matching children, keep it
        if (name.toLowerCase().includes(lower) || (children && children.length > 0)) {
            matches.push({ ...it, children });
        }
    }
    return matches;
}

export function TreeView({
                             data = [],
                             title,
                             showCheckboxes = false,
                             showExpandAll = false,
                             searchPlaceholder = 'Search...',
                             iconMap = {},
                             onCheckChange = () => {},
                             onItemClick = () => {},
                             className = ''
                         }) {
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState(new Set());
    const [checked, setChecked] = useState(new Set());

    // Derive the visible data based on search query
    const filtered = useMemo(() => filterTree(data, query), [data, query]);

    const toggleExpand = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleCheck = (item) => {
        const id = getId(item);
        setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                onCheckChange(item, false);
            } else {
                next.add(id);
                onCheckChange(item, true);
            }
            return next;
        });
    };

    const handleExpandAll = () => {
        const allIds = new Set();
        const walk = (items) => {
            for (const it of items) {
                if (it.children && it.children.length > 0) {
                    allIds.add(getId(it));
                    walk(it.children);
                }
            }
        };
        walk(data); // Always walk the full data tree, not filtered
        setExpanded(allIds); // Set directly, not new Set(allIds)
    };

    const handleCollapseAll = () => {
        setExpanded(new Set());
    };

    const renderIcon = (item) => {
        if (iconMap && iconMap[item.type]) return iconMap[item.type];
        return item.children ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />;
    };

    const renderNode = (item, level = 0) => {
        const id = getId(item); // Use the safe ID getter
        const isExpanded = expanded.has(id);
        const hasChildren = item.children && item.children.length > 0;

        return (
            <div key={id} className="flex flex-col">
                <div className={`flex items-center gap-2 py-1 select-none`} style={{ paddingLeft: Math.min(level * 16, 96) }}>
                    {hasChildren ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(id); }}
                            className="p-1 rounded hover:bg-muted/20 transition-colors"
                        >
                            <ChevronRight className={`h-4 w-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                    ) : (
                        <div style={{ width: 24 }} /> // Spacer for non-folder items
                    )}

                    <div
                        className="flex items-center gap-2 cursor-pointer flex-1 overflow-hidden"
                        onClick={(e) => {
                            if (hasChildren) {
                                e.stopPropagation();
                                toggleExpand(id);
                                return;
                            }
                            onItemClick(item);
                        }}
                    >
                        {renderIcon(item)}
                        {showCheckboxes && (
                            <input
                                type="checkbox"
                                checked={checked.has(id)}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    toggleCheck(item);
                                }}
                                className="cursor-pointer"
                            />
                        )}
                        <span className="text-sm truncate">{item.name}</span>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-0">
                        {item.children.map((c) => renderNode(c, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {(title || showExpandAll) && (
                <div className="flex items-center justify-between px-2 pb-2 shrink-0">
                    <div className="flex items-center gap-2">
                        {title && <div className="text-sm font-medium">{title}</div>}
                    </div>
                    {showExpandAll && (
                        <div className="flex items-center gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="p-2 rounded hover:bg-muted/20 transition-colors"
                                            onClick={handleExpandAll}
                                            aria-label="Expand all"
                                        >
                                            <ChevronsDown className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span>Expand all</span>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="p-2 rounded hover:bg-muted/20 transition-colors"
                                            onClick={handleCollapseAll}
                                            aria-label="Collapse all"
                                        >
                                            <ChevronsUp className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span>Collapse all</span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </div>
            )}

            <div className="px-2 pb-2 shrink-0">
                <div className="relative flex items-center">
                    <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-8 h-8"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {filtered.length > 0 ? (
                    filtered.map((item) => renderNode(item, 0))
                ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">No results found</div>
                )}
            </div>
        </div>
    );
}

export default TreeView;
