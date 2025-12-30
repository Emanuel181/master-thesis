'use client'

import React, { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProfileHeader from "@/components/profile/profile-header"
import ProfileContent from "@/components/profile/profile-content"
import { PageErrorBoundary } from "@/components/ui/error-boundary"
import { PageTransition } from "@/components/ui/page-transitions"
import { toast } from "sonner"

export default function DemoProfilePage() {
    // Demo mode is always true for this page
    const isDemo = true

    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const handleEditStart = () => setIsEditing(true)
    const handleEditCancel = () => setIsEditing(false)

    const handleSaveSuccess = () => {
        setIsEditing(false)
        setIsSaving(false)
    }

    // Mock image upload for demo mode
    const handleImageUpload = async () => {
        toast.info('Image upload is disabled in demo mode')
    }

    return (
        <PageErrorBoundary pageName="Profile">
            <PageTransition pageKey="demo-profile" variant="default">
                <ScrollArea className="h-[calc(100vh-4rem)]">
                    <div className="container mx-auto max-w-7xl space-y-4 sm:space-y-6 px-4 py-6 sm:py-10">
                        <ProfileHeader
                            user={null}
                            isEditing={isEditing}
                            onEdit={handleEditStart}
                            onCancel={handleEditCancel}
                            isSaving={isSaving}
                            onImageUpload={handleImageUpload}
                            isDemo={isDemo}
                        />

                        <ProfileContent
                            isEditing={isEditing}
                            onCancel={handleEditCancel}
                            onUpdateSavingState={setIsSaving}
                            onSaveSuccess={handleSaveSuccess}
                            onImageUpload={handleImageUpload}
                            isDemo={isDemo}
                        />
                    </div>
                </ScrollArea>
            </PageTransition>
        </PageErrorBoundary>
    )
}
