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
                                          isSaving
                                      }) {
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : 'U';

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">

                    {/* Avatar Section */}
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-2 border-background shadow-sm">
                            <AvatarImage src={user?.image || ""} alt="Profile" />
                            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                        </Avatar>
                        {/* Show camera only when editing */}
                        {isEditing && (
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full shadow-md hover:bg-muted"
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 space-y-2">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <h1 className="text-2xl font-bold">{user?.name || "User"}</h1>
                        </div>
                        <p className="text-muted-foreground">{user?.title || ""}</p>
                        <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                            {user?.email && (
                                <div className="flex items-center gap-1">
                                    <Mail className="size-4" />
                                    {user.email}
                                </div>
                            )}
                            {user?.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="size-4" />
                                    {user.location}
                                </div>
                            )}
                            {user?.joinedDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="size-4" />
                                    Joined {user.joinedDate}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isSaving}
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
                                >
                                    {isSaving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={onEdit}>
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