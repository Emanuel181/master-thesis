"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
    Bell,
    BellOff,
    CheckCheck,
    X,
    Info,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    Trash2,
    Volume2,
    VolumeX,
    ExternalLink,
    Settings,
    Heart,
    Eye,
    FileText,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

const NotificationContext = React.createContext(null)

// Storage keys
const DND_STORAGE_KEY = 'vulniq_dnd_mode'
const SOUND_STORAGE_KEY = 'vulniq_notification_sound'
const DESKTOP_NOTIF_KEY = 'vulniq_desktop_notifications'

export function useNotifications() {
    const context = React.useContext(NotificationContext)
    if (!context) {
        throw new Error("useNotifications must be used within NotificationProvider")
    }
    return context
}

// Notification types - extended to support article notifications
const notificationIcons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    loading: Loader2,
    // Article notification types
    ARTICLE_SUBMITTED: FileText,
    ARTICLE_IN_REVIEW: Eye,
    ARTICLE_PUBLISHED: CheckCircle,
    ARTICLE_REJECTED: XCircle,
    ARTICLE_REACTION: Heart,
}

const notificationColors = {
    info: "text-blue-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
    loading: "text-primary",
    // Article notification types
    ARTICLE_SUBMITTED: "text-blue-500",
    ARTICLE_IN_REVIEW: "text-blue-500",
    ARTICLE_PUBLISHED: "text-green-500",
    ARTICLE_REJECTED: "text-red-500",
    ARTICLE_REACTION: "text-pink-500",
}

// Simple notification sound (base64 encoded short beep)
const playNotificationSound = () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        gainNode.gain.value = 0.1

        oscillator.start()
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.stop(audioContext.currentTime + 0.1)
    } catch (e) {
        // Audio not supported or blocked
    }
}

// Request desktop notification permission
const requestDesktopPermission = async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false

    const permission = await Notification.requestPermission()
    return permission === 'granted'
}

// Show desktop notification
const showDesktopNotification = (title, options = {}) => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
        new Notification(title, {
            icon: '/web-app-manifest-192x192.png',
            badge: '/web-app-manifest-192x192.png',
            ...options,
        })
    } catch (e) {
        // Desktop notifications not supported
    }
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = React.useState([])
    const [open, setOpen] = React.useState(false)
    const [doNotDisturb, setDoNotDisturb] = React.useState(false)
    const [soundEnabled, setSoundEnabled] = React.useState(true)
    const [desktopEnabled, setDesktopEnabled] = React.useState(false)
    const { data: session } = useSession()

    // Listen for open-notifications event (from command palette shortcut)
    React.useEffect(() => {
        const handleOpenNotifications = () => {
            setOpen(true)
        }
        window.addEventListener("open-notifications", handleOpenNotifications)
        return () => window.removeEventListener("open-notifications", handleOpenNotifications)
    }, [])

    // Load settings from localStorage
    React.useEffect(() => {
        try {
            const savedDnd = localStorage.getItem(DND_STORAGE_KEY)
            const savedSound = localStorage.getItem(SOUND_STORAGE_KEY)
            const savedDesktop = localStorage.getItem(DESKTOP_NOTIF_KEY)

            if (savedDnd === 'true') setDoNotDisturb(true)
            if (savedSound === 'false') setSoundEnabled(false)
            if (savedDesktop === 'true') setDesktopEnabled(true)
        } catch (e) {
            console.error('Failed to load notification settings:', e)
        }
    }, [])

    // Fetch persistent notifications from API
    const fetchPersistentNotifications = React.useCallback(async () => {
        if (!session?.user?.id) return

        try {
            const response = await fetch(`/api/notifications?limit=20`)
            if (!response.ok) return

            const data = await response.json()

            // Transform API notifications to match the UI format
            const persistentNotifications = (data.notifications || []).map(n => ({
                id: n.id,
                type: n.type, // ARTICLE_SUBMITTED, ARTICLE_IN_REVIEW, etc.
                title: n.title,
                description: n.message,
                read: n.read,
                timestamp: new Date(n.createdAt),
                source: 'articles',
                link: n.link,
                persistent: true, // Mark as persistent for special handling
            }))

            // Merge with existing local notifications, avoiding duplicates
            setNotifications(prev => {
                const localNotifs = prev.filter(n => !n.persistent)
                return [...persistentNotifications, ...localNotifs].slice(0, 50)
            })
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }, [session?.user?.id])

    // Initial fetch and poll for new notifications
    React.useEffect(() => {
        if (!session?.user?.id) return

        fetchPersistentNotifications()

        // Poll every 60 seconds for new notifications
        const interval = setInterval(fetchPersistentNotifications, 60000)
        return () => clearInterval(interval)
    }, [session?.user?.id, fetchPersistentNotifications])

    // Toggle DND mode
    const toggleDoNotDisturb = React.useCallback(() => {
        setDoNotDisturb(prev => {
            const next = !prev
            try {
                localStorage.setItem(DND_STORAGE_KEY, String(next))
            } catch (e) { /* ignore */ }
            return next
        })
    }, [])

    // Toggle sound
    const toggleSound = React.useCallback(() => {
        setSoundEnabled(prev => {
            const next = !prev
            try {
                localStorage.setItem(SOUND_STORAGE_KEY, String(next))
            } catch (e) { /* ignore */ }
            return next
        })
    }, [])

    // Toggle desktop notifications
    const toggleDesktopNotifications = React.useCallback(async () => {
        if (!desktopEnabled) {
            const granted = await requestDesktopPermission()
            if (granted) {
                setDesktopEnabled(true)
                try {
                    localStorage.setItem(DESKTOP_NOTIF_KEY, 'true')
                } catch (e) { /* ignore */ }
            }
        } else {
            setDesktopEnabled(false)
            try {
                localStorage.setItem(DESKTOP_NOTIF_KEY, 'false')
            } catch (e) { /* ignore */ }
        }
    }, [desktopEnabled])

    // Remove a notification
    const removeNotification = React.useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    // Add a new notification
    const addNotification = React.useCallback((notification) => {
        // Skip if DND is enabled (unless it's an error)
        if (doNotDisturb && notification.type !== 'error') {
            return null
        }

        const id = notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newNotification = {
            id,
            type: "info",
            read: false,
            timestamp: new Date(),
            source: notification.source || 'system',
            ...notification,
        }

        setNotifications(prev => [newNotification, ...prev].slice(0, 50))

        // Play sound if enabled
        if (soundEnabled && !doNotDisturb) {
            playNotificationSound()
        }

        // Show desktop notification if enabled
        if (desktopEnabled && !doNotDisturb && document.hidden) {
            showDesktopNotification(notification.title, {
                body: notification.description,
                tag: id,
            })
        }

        // Auto-dismiss
        if (notification.autoDismiss) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id))
            }, notification.autoDismiss)
        }

        return id
    }, [doNotDisturb, soundEnabled, desktopEnabled])

    // Update an existing notification
    const updateNotification = React.useCallback((id, updates) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, ...updates } : n)
        )
    }, [])

    // Mark notification as read
    const markAsRead = React.useCallback(async (id) => {
        // Update local state immediately
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )

        // If it's a persistent notification, also update on server
        const notification = notifications.find(n => n.id === id)
        if (notification?.persistent) {
            try {
                await fetch(`/api/notifications/${id}`, {
                    method: 'PATCH',
                })
            } catch (error) {
                console.error('Error marking notification as read:', error)
            }
        }
    }, [notifications])

    // Mark all as read
    const markAllAsRead = React.useCallback(async () => {
        // Update local state immediately
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))

        // Also update persistent notifications on server
        const hasPersistent = notifications.some(n => n.persistent && !n.read)
        if (hasPersistent) {
            try {
                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'markAllRead' }),
                })
            } catch (error) {
                console.error('Error marking all as read:', error)
            }
        }
    }, [notifications])

    // Clear all notifications
    const clearAll = React.useCallback(() => {
        setNotifications([])
    }, [])

    // Clear by type
    const clearByType = React.useCallback((type) => {
        setNotifications(prev => prev.filter(n => n.type !== type))
    }, [])

    // Clear by source
    const clearBySource = React.useCallback((source) => {
        setNotifications(prev => prev.filter(n => n.source !== source))
    }, [])

    // Count unread
    const unreadCount = React.useMemo(() =>
        notifications.filter(n => !n.read).length
    , [notifications])

    // Group notifications by type
    const groupedNotifications = React.useMemo(() => {
        const groups = {}
        notifications.forEach(n => {
            const key = n.type || 'info'
            if (!groups[key]) groups[key] = []
            groups[key].push(n)
        })
        return groups
    }, [notifications])

    // Helper to show a toast-like notification
    const notify = React.useCallback((title, options = {}) => {
        return addNotification({
            title,
            type: "info",
            autoDismiss: 5000,
            ...options,
        })
    }, [addNotification])

    const value = React.useMemo(() => ({
        notifications,
        groupedNotifications,
        unreadCount,
        addNotification,
        updateNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        clearByType,
        clearBySource,
        notify,
        open,
        setOpen,
        doNotDisturb,
        toggleDoNotDisturb,
        soundEnabled,
        toggleSound,
        desktopEnabled,
        toggleDesktopNotifications,
        refreshNotifications: fetchPersistentNotifications,
    }), [
        notifications,
        groupedNotifications,
        unreadCount,
        addNotification,
        updateNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        clearByType,
        clearBySource,
        notify,
        open,
        doNotDisturb,
        toggleDoNotDisturb,
        soundEnabled,
        toggleSound,
        desktopEnabled,
        toggleDesktopNotifications,
        fetchPersistentNotifications,
    ])

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}

export function NotificationCenter() {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        open,
        setOpen,
        doNotDisturb,
        toggleDoNotDisturb,
        soundEnabled,
        toggleSound,
        desktopEnabled,
        toggleDesktopNotifications,
        refreshNotifications,
    } = useNotifications()

    const router = useRouter()
    const [showSettings, setShowSettings] = React.useState(false)
    const [isRefreshing, setIsRefreshing] = React.useState(false)
    const [currentPage, setCurrentPage] = React.useState(1)
    const NOTIFICATIONS_PER_PAGE = 5

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await refreshNotifications?.()
        setIsRefreshing(false)
    }

    // Paginated notifications
    const totalPages = Math.ceil(notifications.length / NOTIFICATIONS_PER_PAGE)
    const paginatedNotifications = React.useMemo(() => {
        const start = (currentPage - 1) * NOTIFICATIONS_PER_PAGE
        return notifications.slice(start, start + NOTIFICATIONS_PER_PAGE)
    }, [notifications, currentPage])

    // Reset to page 1 when notifications change significantly
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages)
        }
    }, [totalPages, currentPage])

    const formatTime = (date) => {
        const now = new Date()
        const diff = now - date
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return "Just now"
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative"
                    title={doNotDisturb ? "Notifications (Do Not Disturb)" : "Notifications"}
                >
                    {doNotDisturb ? (
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <Bell className="h-5 w-5" />
                    )}
                    {unreadCount > 0 && !doNotDisturb && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        Notifications
                        {doNotDisturb && (
                            <span className="text-xs font-normal text-muted-foreground">(DND)</span>
                        )}
                    </h4>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title="Refresh notifications"
                        >
                            <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setShowSettings(!showSettings)}
                            title="Notification Settings"
                        >
                            <Settings className="h-3 w-3" />
                        </Button>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={markAllAsRead}
                            >
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Read all
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={clearAll}
                                title="Clear all"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Settings Panel */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-b overflow-hidden"
                        >
                            <div className="p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="dnd" className="text-xs flex items-center gap-2">
                                        <BellOff className="h-3 w-3" />
                                        Do Not Disturb
                                    </Label>
                                    <Switch
                                        id="dnd"
                                        checked={doNotDisturb}
                                        onCheckedChange={toggleDoNotDisturb}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="sound" className="text-xs flex items-center gap-2">
                                        {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                                        Sound
                                    </Label>
                                    <Switch
                                        id="sound"
                                        checked={soundEnabled}
                                        onCheckedChange={toggleSound}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="desktop" className="text-xs flex items-center gap-2">
                                        <ExternalLink className="h-3 w-3" />
                                        Desktop Notifications
                                    </Label>
                                    <Switch
                                        id="desktop"
                                        checked={desktopEnabled}
                                        onCheckedChange={toggleDesktopNotifications}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications</p>
                            <p className="text-xs text-muted-foreground/70">You&apos;re all caught up!</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {paginatedNotifications.map((notification) => {
                                const Icon = notificationIcons[notification.type] || Info
                                const colorClass = notificationColors[notification.type] || ""

                                return (
                                    <motion.div
                                        key={notification.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className={cn(
                                            "group flex items-start gap-3 p-3 border-b hover:bg-accent/50 transition-colors cursor-pointer",
                                            !notification.read && "bg-accent/30"
                                        )}
                                        onClick={() => {
                                            markAsRead(notification.id)
                                            if (notification.link) {
                                                setOpen(false)
                                                router.push(notification.link)
                                            } else if (notification.action) {
                                                notification.action()
                                            }
                                        }}
                                    >
                                        <div className={cn("mt-0.5", colorClass)}>
                                            <Icon className={cn(
                                                "h-4 w-4",
                                                notification.type === "loading" && "animate-spin"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {notification.title}
                                            </p>
                                            {notification.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                    {notification.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-muted-foreground/70">
                                                    {formatTime(notification.timestamp)}
                                                </p>
                                                {notification.source && notification.source !== 'system' && (
                                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                        {notification.source}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Action buttons */}
                                            {notification.actions && (
                                                <div className="flex gap-1 mt-2">
                                                    {notification.actions.map((action, i) => (
                                                        <Button
                                                            key={i}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 text-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                action.onClick()
                                                            }}
                                                        >
                                                            {action.label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeNotification(notification.id)
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    )}
                </ScrollArea>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-3 py-2 border-t">
                        <span className="text-xs text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

export default NotificationProvider
