"use client"

import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

/**
 * Shared DnD Provider wrapper for the entire app
 * This prevents "Cannot have two HTML5 backends at the same time" error
 * when using libraries like react-arborist that internally use react-dnd
 */
export function SharedDndProvider({ children }) {
    return (
        <DndProvider backend={HTML5Backend}>
            {children}
        </DndProvider>
    )
}

