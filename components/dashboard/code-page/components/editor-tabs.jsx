"use client"

import React from 'react';
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFileIconUrl } from '../constants/icon-config';

/**
 * Editor Tabs component for managing open files
 */
export function EditorTabs({
    openTabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    dragOverIndex,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
}) {
    if (openTabs.length === 0) return null;

    return (
        <ScrollArea orientation="horizontal" className="w-full border-b">
            <div className="w-max">
                <Tabs value={activeTabId} onValueChange={setActiveTabId}>
                    <TabsList className="h-9 p-1 bg-transparent flex">
                        {openTabs.map((tab, index) => (
                            <TabsTrigger
                                key={`tab-${tab.id}-${index}`}
                                value={tab.id}
                                className={`relative px-3 py-1 text-sm flex items-center gap-1 cursor-move ${dragOverIndex === index ? 'ring-2 ring-blue-500 bg-muted' : ''}`}
                                draggable="true"
                                onDragStart={(e) => onDragStart(e, index)}
                                onDragOver={(e) => onDragOver(e, index)}
                                onDragLeave={onDragLeave}
                                onDrop={(e) => onDrop(e, index)}
                            >
                                <img src={getFileIconUrl(tab.name)} alt="" className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate max-w-[100px]">{tab.name}</span>
                                <span
                                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                    className="cursor-pointer hover:bg-muted rounded p-0.5 ml-1 flex-shrink-0"
                                >
                                    <X className="h-3 w-3" />
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>
        </ScrollArea>
    );
}

