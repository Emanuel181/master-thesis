"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { Plus, Edit } from "lucide-react"

/**
 * Add prompt dialog component
 */
export function AddPromptDialog({
    isOpen,
    onOpenChange,
    agent,
    title,
    setTitle,
    prompt,
    setPrompt,
    onAdd,
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-7 px-2.5 text-[10px] gap-1">
                    <Plus className="h-3 w-3" />
                    Add
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>New Prompt</DialogTitle>
                    <DialogDescription>
                        Create a prompt for the {agent} agent
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter prompt title..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="prompt-content">Prompt Content</Label>
                        <Textarea
                            id="prompt-content"
                            placeholder="Enter your prompt here..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={6}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onAdd}>
                        Create Prompt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * View full prompt dialog component
 */
export function ViewPromptDialog({
    prompt,
    onClose,
    onEdit,
    currentAgent,
}) {
    return (
        <Dialog open={!!prompt} onOpenChange={() => onClose()}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                        {prompt?.title || "Untitled Prompt"}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Full prompt content
                    </DialogDescription>
                </DialogHeader>
                {prompt && (
                    <div className="py-2 sm:py-4">
                        <ScrollArea className="h-60 sm:h-80 rounded-md border p-3 sm:p-4">
                            <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono leading-relaxed">
                                {prompt.text}
                            </pre>
                        </ScrollArea>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-right">
                            {prompt.text.length} characters
                        </p>
                    </div>
                )}
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto order-2 sm:order-1"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            if (prompt) {
                                onEdit(currentAgent, prompt)
                                onClose()
                            }
                        }}
                        className="w-full sm:w-auto order-1 sm:order-2"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Edit prompt dialog component
 */
export function EditPromptDialog({
    isOpen,
    onOpenChange,
    editingData,
    setEditingData,
    onSave,
}) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            onOpenChange(open)
            if (!open) setEditingData(null)
        }}>
            <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Edit Prompt</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Modify the prompt for the {editingData?.agent} agent
                    </DialogDescription>
                </DialogHeader>

                {editingData && (
                    <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
                        <div className="grid gap-1.5 sm:gap-2">
                            <Label htmlFor="edit-title" className="text-xs sm:text-sm">Title</Label>
                            <Input
                                id="edit-title"
                                value={editingData.title}
                                onChange={(e) => setEditingData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter prompt title..."
                                className="h-9 sm:h-10 text-sm"
                            />
                        </div>
                        <div className="grid gap-1.5 sm:gap-2">
                            <Label htmlFor="edit-content" className="text-xs sm:text-sm">Prompt Content</Label>
                            <Textarea
                                id="edit-content"
                                value={editingData.text}
                                onChange={(e) => setEditingData(prev => ({ ...prev, text: e.target.value }))}
                                placeholder="Enter your prompt here..."
                                rows={5}
                                className="text-sm min-h-[120px] sm:min-h-[150px]"
                            />
                            <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
                                {editingData.text?.length || 0} characters
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false)
                            setEditingData(null)
                        }}
                        className="w-full sm:w-auto order-2 sm:order-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (editingData) {
                                onSave(
                                    editingData.agent,
                                    editingData.id,
                                    editingData.title,
                                    editingData.text
                                )
                            }
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Delete confirmation dialog component
 */
export function DeleteConfirmDialog({
    deleteDialog,
    onClose,
    onConfirm,
    selectedCount,
}) {
    return (
        <AlertDialog open={!!deleteDialog} onOpenChange={() => onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {deleteDialog?.type === 'single' && "This action cannot be undone. This prompt will be permanently deleted."}
                        {deleteDialog?.type === 'selected' && `This action cannot be undone. ${deleteDialog.count || selectedCount} prompt(s) will be permanently deleted.`}
                        {deleteDialog?.type === 'category' && `This action cannot be undone. All prompts from "${deleteDialog.agent}" will be permanently deleted.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
