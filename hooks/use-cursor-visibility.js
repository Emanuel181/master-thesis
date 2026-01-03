"use client";
import { useWindowSize } from "@/hooks/use-window-size"
import { useBodyRect } from "@/hooks/use-element-rect"
import { useEffect } from "react"

/**
 * Custom hook that ensures the cursor remains visible when typing in a Tiptap editor.
 * Automatically scrolls the window when the cursor would be hidden by the toolbar.
 *
 * @param {Object} options - Hook options
 * @param {Object} options.editor - The Tiptap editor instance
 * @param {number} options.overlayHeight - Toolbar height to account for
 * @returns The bounding rect of the body
 */
export function useCursorVisibility({
  editor,
  overlayHeight = 0
}) {
  const { height: windowHeight } = useWindowSize()
  const rect = useBodyRect({
    enabled: true,
    throttleMs: 100,
    useResizeObserver: true,
  })

  useEffect(() => {
    const ensureCursorVisibility = () => {
      // Early return if no editor
      if (!editor) return

      try {
        // Check if editor is destroyed or view is not ready
        if (editor.isDestroyed) return

        const view = editor.view
        if (!view) return

        // Check if view has focus
        if (typeof view.hasFocus !== 'function' || !view.hasFocus()) return

        const { state } = editor

        // Get current cursor position coordinates
        const { from } = state.selection
        const cursorCoords = view.coordsAtPos(from)

        if (windowHeight < rect.height && cursorCoords) {
          const availableSpace = windowHeight - cursorCoords.top

          // If the cursor is hidden behind the overlay or offscreen, scroll it into view
          if (availableSpace < overlayHeight) {
            const targetCursorY = Math.max(windowHeight / 2, overlayHeight)
            const currentScrollY = window.scrollY
            const cursorAbsoluteY = cursorCoords.top + currentScrollY
            const newScrollY = cursorAbsoluteY - targetCursorY

            window.scrollTo({
              top: Math.max(0, newScrollY),
              behavior: "smooth",
            })
          }
        }
      } catch {
        // Editor view might not be ready yet - silently ignore
      }
    }

    ensureCursorVisibility()
  }, [editor, overlayHeight, windowHeight, rect.height])

  return rect
}
