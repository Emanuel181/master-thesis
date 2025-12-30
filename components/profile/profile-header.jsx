"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Calendar, Mail, MapPin, Pencil, X, Check, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Demo user data
const DEMO_USER = {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@vulniq.com',
    image: null,
    title: 'Security Engineer',
    location: 'San Francisco, CA',
    joinedDate: 'January 2024',
};

export default function ProfileHeader({
                                          user,
                                          isEditing,
                                          onEdit,
                                          onCancel,
                                          isSaving,
                                          onImageUpload,
                                          isDemo = false
                                      }) {
    // Use demo user data when in demo mode
    const displayUser = isDemo ? DEMO_USER : user;
    
    const initials = displayUser?.name
        ? displayUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : 'U';

    const [resolvedImageUrl, setResolvedImageUrl] = useState('');
    const [refreshNonce, setRefreshNonce] = useState(0);
    const abortRef = useRef(null);
    const refreshTimerRef = useRef(null);
    const retriedRef = useRef(false);

    const rawImage = typeof displayUser?.image === 'string' ? displayUser.image : '';
    const isHttpsUrl = rawImage.startsWith('https://');
    const isS3Key = rawImage.startsWith('users/');

    const imageSrc = useMemo(() => {
        if (isHttpsUrl) return rawImage;
        if (isS3Key) return resolvedImageUrl;
        return '';
    }, [isHttpsUrl, isS3Key, rawImage, resolvedImageUrl]);

    useEffect(() => {
        if (!isS3Key) {
            // No S3 key to resolve; do nothing (imageSrc falls back to '').
            return;
        }

        // Clear any scheduled refresh for previous image.
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        // Abort any in-flight request when image changes/unmounts.
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        const run = async () => {
            try {
                const res = await fetch('/api/profile/image-download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ s3Key: rawImage }),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    // Silent fail (avatar falls back to initials). Avoid exposing details.
                    setResolvedImageUrl('');
                    return;
                }

                const data = await res.json();
                const url = typeof data?.downloadUrl === 'string' ? data.downloadUrl : '';
                setResolvedImageUrl(url);

                // Presigned URLs expire; refresh proactively.
                // Server uses 3600s (1h). Refresh at ~50 min.
                refreshTimerRef.current = setTimeout(() => {
                    retriedRef.current = false;
                    setRefreshNonce((n) => n + 1);
                }, 50 * 60 * 1000);
            } catch (e) {
                if (e?.name === 'AbortError') return;
                setResolvedImageUrl('');
            }
        };

        run();

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
            controller.abort();
        };
    }, [isS3Key, rawImage, refreshNonce]);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file && onImageUpload) {
            onImageUpload(file);
        }
    };

    return (
        <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center sm:items-start gap-4 sm:gap-6 md:flex-row md:items-center">

                    {/* Avatar Section */}
                    <div className="relative flex-shrink-0">
                        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-background shadow-sm">
                            <AvatarImage
                                src={imageSrc}
                                alt="Profile"
                                onError={() => {
                                    // Retry once if a presigned URL expired while the page stayed open.
                                    if (!isS3Key) return;
                                    if (retriedRef.current) return;
                                    retriedRef.current = true;
                                    setRefreshNonce((n) => n + 1);
                                }}
                            />
                            <AvatarFallback className="text-xl sm:text-2xl">{initials}</AvatarFallback>
                        </Avatar>
                        {/* Show camera only when editing */}
                        {isEditing && (
                            <>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full shadow-md hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-background hover:border-primary"
                                    onClick={() => document.getElementById('profile-image-upload').click()}
                                    title="Click to upload profile image"
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                                <input
                                    id="profile-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <h1 className="text-xl sm:text-2xl font-bold">{displayUser?.name || "User"}</h1>
                        </div>
                        <p className="text-muted-foreground text-sm sm:text-base">{displayUser?.title || ""}</p>
                        <div className="text-muted-foreground flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm">
                            {displayUser?.email && (
                                <div className="flex items-center gap-1">
                                    <Mail className="size-3 sm:size-4 flex-shrink-0" />
                                    <span className="truncate max-w-[150px] sm:max-w-none">{displayUser.email}</span>
                                </div>
                            )}
                            {displayUser?.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="size-3 sm:size-4 flex-shrink-0" />
                                    {displayUser.location}
                                </div>
                            )}
                            {displayUser?.joinedDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="size-3 sm:size-4 flex-shrink-0" />
                                    Joined {displayUser.joinedDate}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end flex-shrink-0">
                        {isEditing ? (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                                {/* NOTE: This button has type="submit" and the 'form' attribute.
                    It will trigger the onSubmit event of the form with id="profile-form"
                    located in the ProfileContent component.
                */}
                                <Button
                                    type="submit"
                                    form="profile-form"
                                    disabled={isSaving}
                                    className="w-full sm:w-auto"
                                >
                                    {isSaving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={onEdit} className="w-full sm:w-auto transition-all hover:scale-105 hover:shadow-md">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Profile
                            </Button>
                        )}
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}