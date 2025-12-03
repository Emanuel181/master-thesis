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
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as LucideIcons from "lucide-react"

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

export function AddCategoryDialog({ onAddCategory }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("File")

  const handleAdd = () => {
    if (name && description) {
      onAddCategory({
        id: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        name,
        description,
        icon,
      })
      setName("")
      setDescription("")
      setIcon("File")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="e.g., CI/CD, Docker, and hosting"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icon
            </Label>
            <Select onValueChange={setIcon} defaultValue={icon}>
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
          <Button onClick={handleAdd}>Add Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
