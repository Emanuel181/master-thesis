"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Check, Folder } from "lucide-react"
import { IconPicker } from "./icon-picker"
import { categoryColors } from "./add-category-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"


export function EditCategoryDialog({ useCase, open, onOpenChange, onUpdate, groups = [] }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("File")
  const [color, setColor] = useState("default")
  const [groupId, setGroupId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Update form when useCase changes
  useEffect(() => {
    if (useCase) {
      setName(useCase.name || "")
      // Use fullDescription if available for editing
      setDescription(useCase.fullDescription || useCase.description || "")
      setIcon(useCase.icon || "File")
      setColor(useCase.color || "default")
      setGroupId(useCase.groupId || "")
    }
  }, [useCase])

  const handleUpdate = async () => {
    if (!name || !description || !useCase) {
      toast.error("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/use-cases/${useCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: name,
          content: description,
          icon,
          color,
          groupId: groupId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update use case")
      }

      const { useCase: updatedUseCase } = await response.json()

      // Call the callback with the updated use case
      onUpdate({
        id: updatedUseCase.id,
        name: updatedUseCase.title,
        description: updatedUseCase.content,
        icon: updatedUseCase.icon,
        color: updatedUseCase.color,
        groupId: updatedUseCase.groupId,
      })

      toast.success("Use case updated successfully!")
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating use case:", error)
      toast.error(error.message || "Failed to update use case")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    if (useCase) {
      setName(useCase.name || "")
      setDescription(useCase.fullDescription || useCase.description || "")
      setIcon(useCase.icon || "File")
      setColor(useCase.color || "default")
      setGroupId(useCase.groupId || "")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Use Case</DialogTitle>
          <DialogDescription>
            Update the details for this knowledge base category.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">
              Name
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Deployment"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="edit-description" className="text-right pt-2">
              Description
            </Label>
            <div className="col-span-3">
              <ScrollArea className="h-40 w-full rounded-md border">
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[152px] border-0 focus-visible:ring-0 resize-none break-words"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  placeholder="Enter a detailed description for this category..."
                />
              </ScrollArea>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-icon" className="text-right">
              Icon
            </Label>
            <IconPicker
              value={icon}
              onValueChange={setIcon}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Color
            </Label>
            <div className="col-span-3">
              <div className="flex flex-wrap gap-2">
                {categoryColors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
                      c.class,
                      color === c.name ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                    )}
                    title={c.label}
                  >
                    {color === c.name && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {groups.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-group" className="text-right">
                Group
              </Label>
              <Select value={groupId || "none"} onValueChange={(val) => setGroupId(val === "none" ? "" : val)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="No group (ungrouped)">
                    {groupId ? (
                      <span className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {groups.find(g => g.id === groupId)?.name || "Unknown"}
                      </span>
                    ) : (
                      "No group (ungrouped)"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group (ungrouped)</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <span className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {group.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
