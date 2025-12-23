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
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as LucideIcons from "lucide-react"
import { toast } from "sonner"

const iconNames = [
  "Activity", "Airplay", "AlarmClock", "AlertCircle", "Anchor", "Archive",
  "AtSign", "Award", "BarChart", "BatteryCharging", "Bell", "Bluetooth",
  "BookOpen", "Box", "Briefcase", "Calendar", "Camera", "Cast",
  "CheckCircle", "Clipboard", "Clock", "Cloud", "Codepen", "Compass",
  "Copy", "CreditCard", "Database", "Delete", "Disc", "Download",
  "Edit", "ExternalLink", "Eye", "Facebook", "FastForward", "Feather",
  "File", "FileText", "Film", "Filter", "Flag", "Folder",
  "Gift", "GitBranch", "GitCommit", "Github", "Globe", "Grid",
  "HardDrive", "Hash", "Headphones", "Heart", "HelpCircle", "Home",
  "Image", "Inbox", "Info", "Instagram", "Key", "Layers",
  "Layout", "Link", "Linkedin", "List", "Loader", "Lock",
  "LogIn", "LogOut", "Mail", "Map", "MapPin", "Maximize",
  "Menu", "MessageCircle", "Mic", "Minimize", "Monitor", "Moon",
  "MousePointer", "Music", "Navigation", "Package", "Paperclip", "Pause",
  "PenTool", "Percent", "Phone", "PieChart", "Play", "Pocket",
  "Power", "Printer", "Radio", "RefreshCw", "Repeat", "Rewind",
  "Save", "Scissors", "Search", "Send", "Settings", "Share",
  "Shield", "ShoppingCart", "Sidebar", "Slack", "Sliders", "Smartphone",
  "Smile", "Speaker", "Star", "Sun", "Sunrise", "Sunset",
  "Table", "Tablet", "Tag", "Target", "Terminal", "ThumbsUp",
  "ToggleLeft", "Trash", "TrendingUp", "Truck", "Twitter", "Type",
  "Umbrella", "Underline", "Unlock", "Upload", "User", "Video",
  "Voicemail", "Volume2", "Watch", "Wifi", "Wind", "Youtube",
  "Zap"
];

export function EditCategoryDialog({ useCase, open, onOpenChange, onUpdate }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("File")
  const [isLoading, setIsLoading] = useState(false)

  // Update form when useCase changes
  useEffect(() => {
    if (useCase) {
      setName(useCase.name || "")
      // Use fullDescription if available for editing
      setDescription(useCase.fullDescription || useCase.description || "")
      setIcon(useCase.icon || "File")
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
        body: JSON.stringify({
          title: name,
          content: description,
          icon,
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
            <Select onValueChange={setIcon} value={icon}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                <div className="grid grid-cols-3 gap-1 p-1">
                  {iconNames.map(iconName => {
                    const IconComponent = LucideIcons[iconName];
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                          <span className="truncate">{iconName}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </div>
              </SelectContent>
            </Select>
          </div>
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
