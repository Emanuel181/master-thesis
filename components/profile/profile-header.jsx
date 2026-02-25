"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Calendar, Mail, MapPin, Pencil, X, Check, Loader2, Briefcase, Shield, ZoomIn, RotateCw, Crop } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Crop helper: creates a cropped image blob from canvas ---
async function getCroppedBlob(imageSrc, pixelCrop) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
}

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

    // --- Crop state ---
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const cropFileRef = useRef(null);

    const rawImage = typeof displayUser?.image === 'string' ? displayUser.image : '';
    const isHttpsUrl = rawImage.startsWith('https://');
    const isS3Key = rawImage.startsWith('users/');

    const imageSrc = useMemo(() => {
        if (isHttpsUrl) return rawImage;
        if (isS3Key) return resolvedImageUrl;
        return '';
    }, [isHttpsUrl, isS3Key, rawImage, resolvedImageUrl]);

    useEffect(() => {
        if (!isS3Key) return;
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
        if (abortRef.current) abortRef.current.abort();
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
                if (!res.ok) { setResolvedImageUrl(''); return; }
                const data = await res.json();
                setResolvedImageUrl(typeof data?.downloadUrl === 'string' ? data.downloadUrl : '');
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
            if (refreshTimerRef.current) { clearTimeout(refreshTimerRef.current); refreshTimerRef.current = null; }
            controller.abort();
        };
    }, [isS3Key, rawImage, refreshNonce]);

    // When user picks a file, open the crop dialog instead of uploading directly
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size must be less than 10MB');
            return;
        }

        cropFileRef.current = file;
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
            setCropDialogOpen(true);
        };
        reader.readAsDataURL(file);
        // Reset the input so re-selecting the same file works
        event.target.value = '';
    };

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleCropConfirm = async () => {
        if (!cropImageSrc || !croppedAreaPixels) return;
        setIsCropping(true);
        try {
            const blob = await getCroppedBlob(cropImageSrc, croppedAreaPixels);
            const croppedFile = new File([blob], cropFileRef.current?.name || 'profile.jpg', {
                type: 'image/jpeg',
            });
            setCropDialogOpen(false);
            setCropImageSrc(null);
            if (onImageUpload) onImageUpload(croppedFile);
        } catch {
            toast.error('Failed to crop image. Please try again.');
        } finally {
            setIsCropping(false);
        }
    };

    const handleCropCancel = () => {
        setCropDialogOpen(false);
        setCropImageSrc(null);
        cropFileRef.current = null;
    };

    return (
        <>
        <Card className="overflow-hidden transition-shadow hover:shadow-md">
            {/* Compact gradient banner */}
            <div className="h-16 sm:h-20 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                <div className="absolute bottom-2 right-4 flex items-center gap-1.5 opacity-30">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    <div className="h-1 w-1 rounded-full bg-white" />
                    <div className="h-0.5 w-0.5 rounded-full bg-white" />
                </div>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-2 left-3"
                    >
                        <Badge variant="secondary" className="text-[10px] gap-1 bg-background/80 backdrop-blur-sm">
                            <Pencil className="h-2.5 w-2.5" />
                            Editing
                        </Badge>
                    </motion.div>
                )}
            </div>

            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5 -mt-8 sm:-mt-10 relative">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4">

                    {/* Avatar Section */}
                    <div className="relative flex-shrink-0">
                        <div className={cn(
                            "rounded-full p-0.5 transition-all bg-background",
                            isEditing
                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                : "ring-3 ring-background shadow-lg"
                        )}>
                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 hover:scale-100">
                                <AvatarImage
                                    src={imageSrc}
                                    alt="Profile"
                                    className="object-cover"
                                    onError={() => {
                                        if (!isS3Key) return;
                                        if (retriedRef.current) return;
                                        retriedRef.current = true;
                                        setRefreshNonce((n) => n + 1);
                                    }}
                                />
                                <AvatarFallback className="text-lg sm:text-xl bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                        </div>
                        {/* Camera button when editing */}
                        <AnimatePresence>
                            {isEditing && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -right-1 -bottom-1"
                                >
                                    <Button
                                        size="icon"
                                        variant="default"
                                        className="h-7 w-7 rounded-full shadow-lg cursor-pointer border-2 border-background"
                                        onClick={() => document.getElementById('profile-image-upload').click()}
                                        title="Upload & crop profile image"
                                    >
                                        <Camera className="h-3 w-3" />
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {isEditing && (
                            <input
                                id="profile-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        )}
                    </div>

                    {/* User Info + Actions — side by side */}
                    <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 w-full min-w-0">
                        <div className="space-y-1 text-center sm:text-left min-w-0">
                            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2">
                                <h1 className="text-lg sm:text-xl font-bold leading-tight truncate">{displayUser?.name || "User"}</h1>
                                <Badge variant="outline" className="text-[10px] gap-1 h-5 font-normal shrink-0">
                                    <Shield className="h-2.5 w-2.5" />
                                    Member
                                </Badge>
                            </div>
                            <div className="text-muted-foreground flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-0.5 text-xs">
                                {displayUser?.title && (
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="size-3 shrink-0" />
                                        <span>{displayUser.title}</span>
                                    </div>
                                )}
                                {displayUser?.email && (
                                    <div className="flex items-center gap-1">
                                        <Mail className="size-3 shrink-0" />
                                        <span className="truncate max-w-[180px]">{displayUser.email}</span>
                                    </div>
                                )}
                                {displayUser?.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="size-3 shrink-0" />
                                        <span>{displayUser.location}</span>
                                    </div>
                                )}
                                {displayUser?.joinedDate && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="size-3 shrink-0" />
                                        <span>Joined {displayUser.joinedDate}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            <AnimatePresence mode="wait">
                                {isEditing ? (
                                    <motion.div
                                        key="editing"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="flex gap-2"
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onCancel}
                                            disabled={isSaving}
                                        >
                                            <X className="mr-1.5 h-3.5 w-3.5" />
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            type="submit"
                                            form="profile-form"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                            )}
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="viewing"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                    >
                                        <Button size="sm" onClick={onEdit} className="gap-1.5 transition-all hover:shadow-md">
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit Profile
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>
            </CardContent>
        </Card>

        {/* ---- Image Crop Dialog ---- */}
        <Dialog open={cropDialogOpen} onOpenChange={(open) => { if (!open) handleCropCancel(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Crop className="h-4 w-4 text-primary" />
                        Crop Profile Photo
                    </DialogTitle>
                    <DialogDescription>
                        Drag to reposition, scroll to zoom, and adjust rotation.
                    </DialogDescription>
                </DialogHeader>

                {/* Cropper area */}
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                    {cropImageSrc && (
                        <Cropper
                            image={cropImageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                            onCropComplete={onCropComplete}
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="space-y-3">
                    {/* Zoom */}
                    <div className="flex items-center gap-3">
                        <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.05}
                            onValueChange={([v]) => setZoom(v)}
                            className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{zoom.toFixed(1)}x</span>
                    </div>
                    {/* Rotation */}
                    <div className="flex items-center gap-3">
                        <RotateCw className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Slider
                            value={[rotation]}
                            min={0}
                            max={360}
                            step={1}
                            onValueChange={([v]) => setRotation(v)}
                            className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{rotation}°</span>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCropCancel} disabled={isCropping}>
                        Cancel
                    </Button>
                    <Button onClick={handleCropConfirm} disabled={isCropping}>
                        {isCropping ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4 mr-2" />
                        )}
                        {isCropping ? 'Cropping...' : 'Apply & Upload'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}