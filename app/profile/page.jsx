'use client'

import React, { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProfileHeader from "@/components/profile/profile-header"
import ProfileContent from "@/components/profile/profile-content"
import { ThemeToggle } from "@/components/theme-toggle"
import { CustomizationDialog } from "@/components/customization-dialog"
import { useSettings } from "@/contexts/settingsContext"
import { useSession } from "next-auth/react"
import { FeedbackDialog } from "@/components/dashboard/sidebar/feedback-dialog"
import { toast } from "sonner";
import { NotificationProvider, NotificationCenter } from "@/components/ui/notification-center"
import { CommandPaletteProvider, useCommandPalette } from "@/components/ui/command"
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog"
import { Button } from "@/components/ui/button"
import { Keyboard, PersonStanding } from "lucide-react"
import { useAccessibility } from "@/contexts/accessibilityContext"
import { useIsMobile } from "@/hooks/use-mobile"

// Accessibility button for mobile in header
function AccessibilityTrigger() {
    const { openPanel } = useAccessibility()

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={openPanel}
            title="Accessibility Options"
        >
            <PersonStanding className="h-5 w-5" />
        </Button>
    )
}

// Header buttons component that can use the command palette context
function HeaderButtons() {
    const { setOpen } = useCommandPalette()
    const isMobile = useIsMobile()

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(true)}
                title="Command Palette (Ctrl+K)"
            >
                <Keyboard className="h-5 w-5" />
            </Button>
            <NotificationCenter />
            {/* Show accessibility trigger on mobile in header */}
            {isMobile && <AccessibilityTrigger />}
            <CustomizationDialog showEditorTabs={false} />
            <ThemeToggle />
        </div>
    )
}

export default function ProfilePage() {
    const { settings, mounted } = useSettings()
    const { data: session } = useSession()
    const router = useRouter()
    const isMobile = useIsMobile()
    const { setForceHideFloating } = useAccessibility()

    // 1. Add State Management here
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    // Hide floating accessibility button on mobile (use header icon instead)
    useEffect(() => {
        if (isMobile) {
            setForceHideFloating(true);
            return () => setForceHideFloating(false);
        }
    }, [isMobile, setForceHideFloating]);

    // Listen for open-feedback event (from command palette shortcut)
    useEffect(() => {
        const handleOpenFeedback = () => setIsFeedbackOpen(true);
        window.addEventListener("open-feedback", handleOpenFeedback);
        return () => window.removeEventListener("open-feedback", handleOpenFeedback);
    }, []);

    const handleNavigation = (item) => {
        if (item.title === "Feedback") {
            setIsFeedbackOpen(true);
        } else {
            router.push(item.url);
        }
    }

    const defaultSidebarOpen = useMemo(() => {
        return mounted ? settings.sidebarMode !== 'icon' : true
    }, [settings.sidebarMode, mounted])

    const sidebarKey = `${settings.sidebarMode}-${mounted}`

    // 2. Handlers to control the flow
    const handleEditStart = () => setIsEditing(true);
    const handleEditCancel = () => setIsEditing(false);

    // Called when the child component successfully saves data
    const handleSaveSuccess = () => {
        setIsEditing(false); // Switch back to Read-Only
        setIsSaving(false);
    };

    // Handle image upload
    const handleImageUpload = async (file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            if (!session?.user?.id) {
                toast.error('User not authenticated');
                return;
            }

            // Ask the server for a presigned upload URL + server-generated s3Key.
            const presignedResponse = await fetch('/api/profile/image-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType: file.type,
                    fileName: file.name,
                    fileSize: file.size,
                }),
            });

            if (!presignedResponse.ok) {
                toast.error('Failed to get upload URL');
                return;
            }

            const { uploadUrl, s3Key } = await presignedResponse.json();

            // Upload image to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            if (!uploadResponse.ok) {
                toast.error('Failed to upload image');
                return;
            }

            // Update the profile with the S3 key (not a presigned URL).
            const updateResponse = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: s3Key }),
            });

            if (!updateResponse.ok) {
                toast.error('Failed to update profile');
                return;
            }

            toast.success('Profile image uploaded successfully!');

            // Refresh the page to update the session and UI
            window.location.reload();
        } catch (error) {
            // Only log detailed errors in development to prevent information leakage
            if (process.env.NODE_ENV === 'development') {
                console.error('Image upload error:', error);
            }
            toast.error('Failed to upload image. Please try again.');
        }
    };

    return (
        <NotificationProvider>
            <CommandPaletteProvider onNavigate={(item) => router.push(item.url || `/dashboard?page=${item.title}`)}>
                <SidebarProvider
                    key={sidebarKey}
                    className="h-screen overflow-hidden"
                    defaultOpen={defaultSidebarOpen}
                >
                    <AppSidebar onNavigate={handleNavigation} />
                    <SidebarInset className="flex flex-col overflow-hidden">
                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center justify-between w-full gap-2 px-4 pr-2 sm:pr-4">
                                <div className="flex items-center gap-2">
                                    <SidebarTrigger className="-ml-1" />
                                    <Separator
                                        orientation="vertical"
                                        className="mr-2 data-[orientation=vertical]:h-4"
                                    />
                                    <Breadcrumb>
                                        <BreadcrumbList>
                                            <BreadcrumbItem className="hidden md:block">
                                                <BreadcrumbLink href="/dashboard">
                                                    Home
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                <BreadcrumbLink href="/profile">
                                                    Profile
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </div>
                                <div className="flex items-center gap-2">
                                    <HeaderButtons />
                                </div>
                            </div>
                        </header>
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className={`container mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 py-6 sm:py-10 pb-safe ${
                                    settings.contentLayout === 'centered' ? 'max-w-full sm:max-w-5xl' : ''
                                }`}>

                                    {/* 3. Pass state and handlers to Header */}
                                    <ProfileHeader
                                        user={session?.user}
                                        isEditing={isEditing}
                                        onEdit={handleEditStart}
                                        onCancel={handleEditCancel}
                                        isSaving={isSaving}
                                        onImageUpload={handleImageUpload}
                                    />

                                    {/* 4. Pass state and handlers to Content */}
                                    <ProfileContent
                                        isEditing={isEditing}
                                        onCancel={handleEditCancel}
                                        onUpdateSavingState={setIsSaving}
                                        onSaveSuccess={handleSaveSuccess}
                                        onImageUpload={handleImageUpload}
                                    />
                                </div>
                            </ScrollArea>
                        </div>
                    </SidebarInset>
                    <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
                    <KeyboardShortcutsDialog />
                </SidebarProvider>
            </CommandPaletteProvider>
        </NotificationProvider>
    )
}