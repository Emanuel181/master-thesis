"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Calendar, Mail, MapPin, Pencil, X, Check, Loader2 } from "lucide-react";

export default function ProfileHeader({
                                          user,
                                          isEditing,
                                          onEdit,
                                          onCancel,
                                          isSaving,
                                          onImageUpload
                                      }) {
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : 'U';

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
                            <AvatarImage src={user?.image || ""} alt="Profile" />
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
                            <h1 className="text-xl sm:text-2xl font-bold">{user?.name || "User"}</h1>
                        </div>
                        <p className="text-muted-foreground text-sm sm:text-base">{user?.title || ""}</p>
                        <div className="text-muted-foreground flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm">
                            {user?.email && (
                                <div className="flex items-center gap-1">
                                    <Mail className="size-3 sm:size-4 flex-shrink-0" />
                                    <span className="truncate max-w-[150px] sm:max-w-none">{user.email}</span>
                                </div>
                            )}
                            {user?.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="size-3 sm:size-4 flex-shrink-0" />
                                    {user.location}
                                </div>
                            )}
                            {user?.joinedDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="size-3 sm:size-4 flex-shrink-0" />
                                    Joined {user.joinedDate}
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