'use client'

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
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
import ProfileHeader from "@/components/profile/profile-header"
import ProfileContent from "@/components/profile/profile-content"
import { ThemeToggle } from "@/components/theme-toggle"
import { CustomizationDialog } from "@/components/customization-dialog"
import { useSettings } from "@/contexts/settingsContext"
import { useSession } from "next-auth/react"
import { FeedbackDialog } from "@/components/feedback-dialog"
import { toast } from "sonner";

export default function ProfilePage() {
    const { settings, mounted } = useSettings()
    const { data: session } = useSession()
    const router = useRouter()

    // 1. Add State Management here
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
            // Get current user email from session
            if (!session?.user?.email) {
                toast.error('User not authenticated');
                return;
            }

            // Generate a unique key for the image
            const userEmail = session.user.email;
            const timestamp = Date.now();
            const fileExtension = file.name.split('.').pop();
            const s3Key = `profile-images/${userEmail}/${timestamp}.${fileExtension}`;

            // Get presigned upload URL
            const presignedResponse = await fetch('/api/profile/image-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    s3Key,
                    contentType: file.type,
                }),
            });

            if (!presignedResponse.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { uploadUrl } = await presignedResponse.json();

            // Upload image to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image');
            }

            // Get the download URL
            const downloadResponse = await fetch('/api/profile/image-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ s3Key }),
            });

            if (!downloadResponse.ok) {
                throw new Error('Failed to get download URL');
            }

            const { downloadUrl } = await downloadResponse.json();

            // Update the profile with the new image URL
            const updateResponse = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: downloadUrl }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update profile');
            }

            toast.success('Profile image uploaded successfully!');

            // Refresh the page to update the session and UI
            window.location.reload();
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error(error.message || 'Failed to upload image');
        }
    };

    return (
        <SidebarProvider
            key={sidebarKey}
            className="h-screen overflow-hidden"
            defaultOpen={defaultSidebarOpen}
        >
            <AppSidebar onNavigate={handleNavigation} />
            <SidebarInset className="flex flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center justify-between w-full gap-2 px-4">
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
                            <CustomizationDialog showEditorTabs={false} />
                            <ThemeToggle />
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto relative">
                    <div className={`container mx-auto space-y-6 px-4 py-10 ${
                        settings.contentLayout === 'centered' ? 'max-w-5xl' : ''
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
                </div>
            </SidebarInset>
            <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
        </SidebarProvider>
    )
}