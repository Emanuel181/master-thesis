"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

/**
 * Virtual List Component
 * ======================
 *
 * Renders only visible items for performance with large lists.
 * Uses intersection observer for efficient scroll detection.
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to render
 * @param {number} props.itemHeight - Fixed height of each item in pixels
 * @param {number} props.overscan - Number of items to render outside viewport (default: 5)
 * @param {Function} props.renderItem - Function to render each item (item, index) => ReactNode
 * @param {string} props.className - Additional class names for the container
 */
export function VirtualList({
    items,
    itemHeight,
    overscan = 5,
    renderItem,
    className = "",
    emptyMessage = "No items to display",
}) {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Calculate visible range
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

    // Handle scroll
    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    // Measure container
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });

        resizeObserver.observe(container);
        setContainerHeight(container.clientHeight);

        return () => resizeObserver.disconnect();
    }, []);

    // Render visible items
    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
        if (items[i]) {
            visibleItems.push(
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        top: i * itemHeight,
                        left: 0,
                        right: 0,
                        height: itemHeight,
                    }}
                >
                    {renderItem(items[i], i)}
                </div>
            );
        }
    }

    if (items.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full text-muted-foreground ${className}`}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className={`overflow-auto relative ${className}`}
            style={{ height: "100%" }}
        >
            <div style={{ height: totalHeight, position: "relative" }}>
                {visibleItems}
            </div>
        </div>
    );
}

/**
 * Virtual Table Component
 * =======================
 *
 * Virtual scrolling for table rows with fixed header.
 */
export function VirtualTable({
    items,
    columns,
    rowHeight = 52,
    headerHeight = 44,
    overscan = 5,
    className = "",
    onRowClick,
    emptyMessage = "No data available",
}) {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const bodyHeight = containerHeight - headerHeight;
    const totalHeight = items.length * rowHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(bodyHeight / rowHeight) + 2 * overscan;
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });

        resizeObserver.observe(container);
        setContainerHeight(container.clientHeight);

        return () => resizeObserver.disconnect();
    }, []);

    const visibleRows = [];
    for (let i = startIndex; i <= endIndex; i++) {
        if (items[i]) {
            visibleRows.push(
                <div
                    key={i}
                    onClick={() => onRowClick?.(items[i], i)}
                    className={`absolute left-0 right-0 flex items-center border-b hover:bg-muted/50 transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                    }`}
                    style={{
                        top: i * rowHeight,
                        height: rowHeight,
                    }}
                >
                    {columns.map((column, colIndex) => (
                        <div
                            key={colIndex}
                            className="px-4 truncate"
                            style={{
                                width: column.width || 'auto',
                                flex: column.width ? 'none' : 1,
                            }}
                        >
                            {column.render
                                ? column.render(items[i], i)
                                : items[i][column.key]}
                        </div>
                    ))}
                </div>
            );
        }
    }

    if (items.length === 0) {
        return (
            <div className={`flex flex-col ${className}`}>
                {/* Header */}
                <div
                    className="flex items-center border-b bg-muted/50 font-medium"
                    style={{ height: headerHeight }}
                >
                    {columns.map((column, index) => (
                        <div
                            key={index}
                            className="px-4 truncate"
                            style={{
                                width: column.width || 'auto',
                                flex: column.width ? 'none' : 1,
                            }}
                        >
                            {column.header}
                        </div>
                    ))}
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    {emptyMessage}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`flex flex-col overflow-hidden ${className}`}>
            {/* Fixed Header */}
            <div
                className="flex items-center border-b bg-muted/50 font-medium flex-shrink-0"
                style={{ height: headerHeight }}
            >
                {columns.map((column, index) => (
                    <div
                        key={index}
                        className="px-4 truncate"
                        style={{
                            width: column.width || 'auto',
                            flex: column.width ? 'none' : 1,
                        }}
                    >
                        {column.header}
                    </div>
                ))}
            </div>

            {/* Virtual Scrolling Body */}
            <div
                className="flex-1 overflow-auto relative"
                onScroll={handleScroll}
            >
                <div style={{ height: totalHeight, position: "relative" }}>
                    {visibleRows}
                </div>
            </div>
        </div>
    );
}

/**
 * Infinite Scroll Hook
 * ====================
 *
 * Hook for loading more items when scrolling to bottom.
 */
export function useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore,
    threshold = 100,
}) {
    const observerRef = useRef(null);
    const loadMoreRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            { rootMargin: `${threshold}px` }
        );

        observerRef.current = observer;

        return () => observer.disconnect();
    }, [hasMore, isLoading, onLoadMore, threshold]);

    useEffect(() => {
        const observer = observerRef.current;
        const element = loadMoreRef.current;

        if (observer && element) {
            observer.observe(element);
            return () => observer.unobserve(element);
        }
    }, []);

    return { loadMoreRef };
}

export default VirtualList;
