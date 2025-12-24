"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Hash } from "lucide-react"

export function GoToLineDialog({ open, onOpenChange, onGoToLine, maxLine = 1 }) {
    const [lineNumber, setLineNumber] = React.useState("")
    const [error, setError] = React.useState("")
    const inputRef = React.useRef(null)

    // Focus input when dialog opens
    React.useEffect(() => {
        if (open) {
            setLineNumber("")
            setError("")
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    const handleSubmit = (e) => {
        e.preventDefault()

        const num = parseInt(lineNumber, 10)

        if (isNaN(num) || num < 1) {
            setError("Please enter a valid line number")
            return
        }

        if (num > maxLine) {
            setError(`Line number must be between 1 and ${maxLine}`)
            return
        }

        onGoToLine(num)
        onOpenChange(false)
    }

    const handleInputChange = (e) => {
        const value = e.target.value
        // Only allow digits
        if (value === "" || /^\d+$/.test(value)) {
            setLineNumber(value)
            setError("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[350px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Go to Line
                    </DialogTitle>
                    <DialogDescription>
                        Enter a line number (1 - {maxLine})
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            ref={inputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Line number..."
                            value={lineNumber}
                            onChange={handleInputChange}
                            className={error ? "border-destructive" : ""}
                        />
                        {error && (
                            <p className="text-xs text-destructive">{error}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!lineNumber}>
                            Go
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default GoToLineDialog

