"use client";

import { useState } from "react";
import ProfileHeader from "./components/profile-header";
import ProfileContent from "./components/profile-content";

export default function Page() {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    return (
        <div className="container mx-auto space-y-6 px-4 py-10">
            <ProfileHeader
                isEditing={isEditing}
                isSaving={isSaving}
                onEdit={() => setIsEditing(true)}
                onCancel={() => setIsEditing(false)}
                // Pass user object here if available, e.g., user={userData}
            />

            <ProfileContent
                isEditing={isEditing}
                onUpdateSavingState={setIsSaving}
                onSaveSuccess={() => setIsEditing(false)}
            />
        </div>
    );
}