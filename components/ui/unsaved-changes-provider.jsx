"use client"

import * as React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const UnsavedChangesContext = React.createContext(null)

export function useUnsavedChanges() {
    const context = React.useContext(UnsavedChangesContext)
    if (!context) {
        throw new Error("useUnsavedChanges must be used within UnsavedChangesProvider")
    }
    return context
}

export function UnsavedChangesProvider({ children }) {
    const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
    const [pendingAction, setPendingAction] = React.useState(null)
    const [dialogOpen, setDialogOpen] = React.useState(false)

    // Track which items have unsaved changes
    const [unsavedItems, setUnsavedItems] = React.useState(new Set())

    // Mark an item as having unsaved changes
    const markUnsaved = React.useCallback((itemId) => {
        setUnsavedItems(prev => {
            const next = new Set(prev)
            next.add(itemId)
            return next
        })
        setHasUnsavedChanges(true)
    }, [])

    // Mark an item as saved
    const markSaved = React.useCallback((itemId) => {
        setUnsavedItems(prev => {
            const next = new Set(prev)
            next.delete(itemId)
            if (next.size === 0) {
                setHasUnsavedChanges(false)
            }
            return next
        })
    }, [])

    // Clear all unsaved markers
    const clearAll = React.useCallback(() => {
        setUnsavedItems(new Set())
        setHasUnsavedChanges(false)
    }, [])

    // Check if an item has unsaved changes
    const isUnsaved = React.useCallback((itemId) => {
        return unsavedItems.has(itemId)
    }, [unsavedItems])

    // Request to perform an action that might discard changes
    const requestAction = React.useCallback((action, options = {}) => {
        const { itemId, force = false } = options

        // If force, just do it
        if (force) {
            action()
            return
        }

        // Check if there are unsaved changes
        const hasChanges = itemId ? unsavedItems.has(itemId) : hasUnsavedChanges

        if (hasChanges) {
            setPendingAction(() => action)
            setDialogOpen(true)
        } else {
            action()
        }
    }, [hasUnsavedChanges, unsavedItems])

    // Handle dialog confirmation
    const handleConfirm = React.useCallback(() => {
        if (pendingAction) {
            pendingAction()
            clearAll()
        }
        setDialogOpen(false)
        setPendingAction(null)
    }, [pendingAction, clearAll])

    // Handle dialog cancellation
    const handleCancel = React.useCallback(() => {
        setDialogOpen(false)
        setPendingAction(null)
    }, [])

    // Browser beforeunload warning
    React.useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = ""
                return ""
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [hasUnsavedChanges])

    const value = React.useMemo(() => ({
        hasUnsavedChanges,
        unsavedItems,
        markUnsaved,
        markSaved,
        clearAll,
        isUnsaved,
        requestAction,
    }), [
        hasUnsavedChanges,
        unsavedItems,
        markUnsaved,
        markSaved,
        clearAll,
        isUnsaved,
        requestAction,
    ])

    return (
        <UnsavedChangesContext.Provider value={value}>
            {children}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes that will be lost if you continue.
                            Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </UnsavedChangesContext.Provider>
    )
}

// Hook for tracking changes in a specific component
export function useTrackChanges(itemId, initialValue) {
    const { markUnsaved, markSaved, isUnsaved } = useUnsavedChanges()
    const [currentValue, setCurrentValue] = React.useState(initialValue)
    const originalValueRef = React.useRef(initialValue)

    // Update tracking when value changes
    const setValue = React.useCallback((newValue) => {
        setCurrentValue(newValue)

        // Check if value differs from original
        const isDifferent = JSON.stringify(newValue) !== JSON.stringify(originalValueRef.current)
        if (isDifferent) {
            markUnsaved(itemId)
        } else {
            markSaved(itemId)
        }
    }, [itemId, markUnsaved, markSaved])

    // Mark as saved and update original
    const save = React.useCallback(() => {
        originalValueRef.current = currentValue
        markSaved(itemId)
    }, [currentValue, itemId, markSaved])

    // Reset to original
    const reset = React.useCallback(() => {
        setCurrentValue(originalValueRef.current)
        markSaved(itemId)
    }, [itemId, markSaved])

    return {
        value: currentValue,
        setValue,
        save,
        reset,
        isDirty: isUnsaved(itemId),
    }
}

export default UnsavedChangesProvider

