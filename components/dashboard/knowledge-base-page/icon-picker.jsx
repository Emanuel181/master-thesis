"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"

export const iconNames = [
    "Activity", "Airplay", "AlarmClock", "AlertCircle", "AlertTriangle", "Anchor", "Archive",
    "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "AtSign", "Award",
    "BarChart", "BarChart2", "BatteryCharging", "Bell", "Bluetooth", "Bold",
    "BookOpen", "Bookmark", "Box", "Briefcase", "Bug", "Calendar", "Camera", "Cast",
    "Check", "CheckCircle", "CheckSquare", "ChevronDown", "ChevronLeft", "ChevronRight", "ChevronUp",
    "Circle", "Clipboard", "Clock", "Cloud", "Code", "Codepen", "Compass",
    "Copy", "CreditCard", "Crop", "Database", "Delete", "Disc", "Download",
    "Edit", "Edit2", "Edit3", "ExternalLink", "Eye", "EyeOff", "Facebook", "FastForward", "Feather",
    "File", "FileMinus", "FilePlus", "FileText", "Film", "Filter", "Flag", "Folder",
    "FolderMinus", "FolderPlus", "Frown", "Gift", "GitBranch", "GitCommit", "GitMerge", "GitPullRequest",
    "Github", "Gitlab", "Globe", "Grid", "HardDrive", "Hash", "Headphones", "Heart",
    "HelpCircle", "Hexagon", "Home", "Image", "Inbox", "Info", "Instagram", "Italic",
    "Key", "Layers", "Layout", "Link", "Link2", "Linkedin", "List", "Loader", "Lock",
    "LogIn", "LogOut", "Mail", "Map", "MapPin", "Maximize", "Maximize2", "Meh",
    "Menu", "MessageCircle", "MessageSquare", "Mic", "MicOff", "Minimize", "Minimize2", "Monitor", "Moon",
    "MoreHorizontal", "MoreVertical", "MousePointer", "Move", "Music", "Navigation", "Navigation2",
    "Octagon", "Package", "Paperclip", "Pause", "PauseCircle", "PenTool", "Percent", "Phone",
    "PhoneCall", "PhoneForwarded", "PhoneIncoming", "PhoneMissed", "PhoneOff", "PhoneOutgoing",
    "PieChart", "Play", "PlayCircle", "Plus", "PlusCircle", "PlusSquare", "Pocket", "Power",
    "Printer", "Radio", "RefreshCcw", "RefreshCw", "Repeat", "Rewind", "RotateCcw", "RotateCw",
    "Rss", "Save", "Scissors", "Search", "Send", "Server", "Settings", "Share", "Share2",
    "Shield", "ShieldOff", "ShoppingBag", "ShoppingCart", "Shuffle", "Sidebar", "SkipBack", "SkipForward",
    "Slack", "Slash", "Sliders", "Smartphone", "Smile", "Speaker", "Square", "Star",
    "StopCircle", "Sun", "Sunrise", "Sunset", "Table", "Tablet", "Tag", "Target",
    "Terminal", "Thermometer", "ThumbsDown", "ThumbsUp", "ToggleLeft", "ToggleRight", "Tool",
    "Trash", "Trash2", "TrendingDown", "TrendingUp", "Triangle", "Truck", "Tv", "Twitter", "Type",
    "Umbrella", "Underline", "Unlock", "Upload", "UploadCloud", "User", "UserCheck", "UserMinus",
    "UserPlus", "UserX", "Users", "Video", "VideoOff", "Voicemail", "Volume", "Volume1", "Volume2", "VolumeX",
    "Watch", "Wifi", "WifiOff", "Wind", "X", "XCircle", "XOctagon", "XSquare", "Youtube", "Zap", "ZapOff",
    "ZoomIn", "ZoomOut"
];

const ICONS_PER_PAGE = 21; // 3 columns x 7 rows

export function IconPicker({ value, onValueChange, className }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)

    // Filter icons based on search
    const filteredIcons = useMemo(() => {
        if (!search.trim()) return iconNames;
        const searchLower = search.toLowerCase();
        return iconNames.filter(name =>
            name.toLowerCase().includes(searchLower)
        );
    }, [search]);

    // Pagination
    const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
    const startIndex = (currentPage - 1) * ICONS_PER_PAGE;
    const paginatedIcons = filteredIcons.slice(startIndex, startIndex + ICONS_PER_PAGE);

    // Reset page when search changes
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    // Get the current icon component
    const CurrentIcon = LucideIcons[value] || LucideIcons.File;

    const handleSelect = (iconName) => {
        onValueChange(iconName);
        setOpen(false);
        setSearch("");
        setCurrentPage(1);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("justify-between", className)}
                >
                    <div className="flex items-center gap-2">
                        <CurrentIcon className="h-4 w-4" />
                        <span>{value}</span>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-90")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0" align="start">
                {/* Search */}
                <div className="p-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search icons..."
                            value={search}
                            onChange={handleSearchChange}
                            className="pl-8 h-9"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Icons Grid */}
                <ScrollArea className="h-[280px]">
                    {paginatedIcons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                            <Search className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No icons found</p>
                            <p className="text-xs">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1 p-2">
                            {paginatedIcons.map(iconName => {
                                const IconComponent = LucideIcons[iconName];
                                const isSelected = value === iconName;
                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => handleSelect(iconName)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 rounded-md transition-colors",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                        )}
                                        title={iconName}
                                    >
                                        {IconComponent && <IconComponent className="h-5 w-5" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
                        <span className="text-xs text-muted-foreground">
                            {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

