"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2, Check, Folder } from "lucide-react"
import { IconPicker } from "./icon-picker"
import { toast } from "sonner"
import { cn } from "@/lib/utils"


// Category color options
export const categoryColors = [
  { name: "default", label: "Default", class: "bg-muted", ring: "ring-border" },
  { name: "red", label: "Red", class: "bg-red-500/20", ring: "ring-red-500" },
  { name: "orange", label: "Orange", class: "bg-orange-500/20", ring: "ring-orange-500" },
  { name: "amber", label: "Amber", class: "bg-amber-500/20", ring: "ring-amber-500" },
  { name: "yellow", label: "Yellow", class: "bg-yellow-500/20", ring: "ring-yellow-500" },
  { name: "lime", label: "Lime", class: "bg-lime-500/20", ring: "ring-lime-500" },
  { name: "green", label: "Green", class: "bg-green-500/20", ring: "ring-green-500" },
  { name: "emerald", label: "Emerald", class: "bg-emerald-500/20", ring: "ring-emerald-500" },
  { name: "teal", label: "Teal", class: "bg-teal-500/20", ring: "ring-teal-500" },
  { name: "cyan", label: "Cyan", class: "bg-cyan-500/20", ring: "ring-cyan-500" },
  { name: "sky", label: "Sky", class: "bg-sky-500/20", ring: "ring-sky-500" },
  { name: "blue", label: "Blue", class: "bg-blue-500/20", ring: "ring-blue-500" },
  { name: "indigo", label: "Indigo", class: "bg-indigo-500/20", ring: "ring-indigo-500" },
  { name: "violet", label: "Violet", class: "bg-violet-500/20", ring: "ring-violet-500" },
  { name: "purple", label: "Purple", class: "bg-purple-500/20", ring: "ring-purple-500" },
  { name: "fuchsia", label: "Fuchsia", class: "bg-fuchsia-500/20", ring: "ring-fuchsia-500" },
  { name: "pink", label: "Pink", class: "bg-pink-500/20", ring: "ring-pink-500" },
  { name: "rose", label: "Rose", class: "bg-rose-500/20", ring: "ring-rose-500" },
];

export function getCategoryColorClasses(colorName) {
  return categoryColors.find(c => c.name === colorName) || categoryColors[0];
}

export function AddCategoryDialog({ onAddCategory, groups = [] }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("File")
  const [color, setColor] = useState("default")
  const [groupId, setGroupId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAdd = async () => {
    if (!name || !description) {
      toast.error("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/use-cases", {
        method: "POST",
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
        throw new Error(error.error || "Failed to create use case")
      }

      const { useCase } = await response.json()

      // Call the callback with the created use case
      onAddCategory({
        id: useCase.id,
        name: useCase.title,
        description: useCase.content,
        icon: useCase.icon,
        color: useCase.color,
        groupId: useCase.groupId,
        pdfs: [],
      })

      toast.success("Use case created successfully!")
      setName("")
      setDescription("")
      setIcon("File")
      setColor("default")
      setGroupId("")
      setOpen(false)
    } catch (error) {
      console.error("Error creating use case:", error)
      toast.error(error.message || "Failed to create use case")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Enter the details for the new knowledge base category.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Deployment"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <div className="col-span-3">
              <ScrollArea className="h-40 w-full rounded-md border">
                <Textarea
                  id="description"
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
            <Label htmlFor="icon" className="text-right">
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
              <Label htmlFor="group" className="text-right">
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
          <Button onClick={handleAdd} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating..." : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
