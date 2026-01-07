import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Demo profile data
const DEMO_PROFILE = {
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@vulniq.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Security Engineer',
    company: 'VulnIQ Demo Inc.',
    bio: 'This is a demo account showcasing VulnIQ\'s profile management features. In production, you can update your personal information, upload a profile picture, and manage your account settings.',
    location: 'San Francisco, CA',
};

/**
 * Sanitizes user input to prevent potential security issues.
 * Removes null bytes and trims whitespace.
 * @param {string} value - The input value to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeInput = (value) => {
    if (typeof value !== 'string') return '';
    // Remove null bytes and control characters (except newlines for bio)
    return value.replace(/[\0\x08\x09\x1a]/g, '').trim();
};

/**
 * Maps API error messages to user-friendly messages.
 * Prevents leaking internal error details to users.
 * @param {string} errorMessage - The original error message
 * @returns {string} - Safe user-friendly message
 */
const getSafeErrorMessage = (errorMessage) => {
    const errorMap = {
        'Unauthorized': 'Please log in to continue.',
        'User not found': 'Profile not found. Please try again.',
        'Rate limit exceeded': 'Too many requests. Please wait a moment.',
        'Validation failed': 'Please check your input and try again.',
    };

    // Check if the error message contains any known error
    for (const [key, safeMessage] of Object.entries(errorMap)) {
        if (errorMessage?.includes(key)) {
            return safeMessage;
        }
    }

    return 'An error occurred. Please try again.';
};

export default function ProfileContent({ isEditing, onSaveSuccess, onUpdateSavingState, onCancel, onImageUpload, isDemo = false }) {
    const [profile, setProfile] = useState(isDemo ? DEMO_PROFILE : {
        firstName: '',
        lastName: '',
        email: '',
        image: '',
        phone: '',
        jobTitle: '',
        company: '',
        bio: '',
        location: '',
    });
    const [isLoading, setIsLoading] = useState(!isDemo);

    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);
    // Track the current fetch operation to handle race conditions
    const fetchIdRef = useRef(0);

    // Memoized fetch function to prevent race conditions
    const fetchProfile = useCallback(async (fetchId) => {
        try {
            const response = await fetch('/api/profile');

            // Check if this fetch is still relevant and component is mounted
            if (!isMountedRef.current || fetchId !== fetchIdRef.current) {
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();

            // Double-check mount status before state update
            if (isMountedRef.current && fetchId === fetchIdRef.current) {
                setProfile({
                    firstName: data.user.firstName || '',
                    lastName: data.user.lastName || '',
                    email: data.user.email || '',
                    phone: data.user.phone || '',
                    jobTitle: data.user.jobTitle || '',
                    company: data.user.company || '',
                    bio: data.user.bio || '',
                    location: data.user.location || '',
                });
            }
        } catch (error) {
            // Only log errors in development to prevent information leakage
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching profile:', error);
            }
        } finally {
            if (isMountedRef.current && fetchId === fetchIdRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    // Fetch profile data on component mount (skip in demo mode)
    useEffect(() => {
        if (isDemo) return; // Skip fetching in demo mode
        
        isMountedRef.current = true;
        const currentFetchId = ++fetchIdRef.current;
        setIsLoading(true);
        fetchProfile(currentFetchId);

        return () => {
            isMountedRef.current = false;
        };
    }, [fetchProfile, isDemo]);

    // When edit mode is cancelled (isEditing turns false externally), revert data to what is in DB
    useEffect(() => {
        if (isDemo) {
            // In demo mode, just reset to demo profile
            if (!isEditing) {
                setProfile(DEMO_PROFILE);
            }
            return;
        }
        if (!isEditing && isMountedRef.current) {
            const currentFetchId = ++fetchIdRef.current;
            fetchProfile(currentFetchId);
        }
    }, [isEditing, fetchProfile, isDemo]);

    // Connect the onImageUpload prop to our handler
    useEffect(() => {
        if (onImageUpload) {
            // The image upload is handled by the parent component
        }
    }, [onImageUpload]);

    const handleInputChange = (field, value) => {
        // Sanitize input to prevent security issues
        // For bio, preserve newlines but sanitize other control characters
        const sanitizedValue = field === 'bio'
            ? (typeof value === 'string' ? value.replace(/[\0\x08\x09\x1a]/g, '') : '')
            : sanitizeInput(value);
        setProfile(prev => ({ ...prev, [field]: sanitizedValue }));
    };


    const handleSave = async (e) => {
        e.preventDefault();

        // Notify parent that saving started
        if (onUpdateSavingState) onUpdateSavingState(true);

        // In demo mode, just mock the save
        if (isDemo) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Demo: Profile changes saved (not persisted)');
            if (onSaveSuccess) onSaveSuccess();
            return;
        }

        try {
            // Sanitize all profile data before sending
            const sanitizedProfile = {
                firstName: sanitizeInput(profile.firstName),
                lastName: sanitizeInput(profile.lastName),
                phone: sanitizeInput(profile.phone),
                jobTitle: sanitizeInput(profile.jobTitle),
                company: sanitizeInput(profile.company),
                bio: typeof profile.bio === 'string' ? profile.bio.replace(/[\0\x08\x09\x1a]/g, '').trim() : '',
                location: sanitizeInput(profile.location),
            };

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitizedProfile),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update profile');
            }

            const data = await response.json();

            // Update local state with confirmed data from server
            if (isMountedRef.current) {
                setProfile(prev => ({
                    ...prev,
                    firstName: data.user.firstName || prev.firstName,
                    lastName: data.user.lastName || prev.lastName,
                    phone: data.user.phone || prev.phone,
                    jobTitle: data.user.jobTitle || prev.jobTitle,
                    company: data.user.company || prev.company,
                    bio: data.user.bio || prev.bio,
                    location: data.user.location || prev.location,
                }));
            }

            toast.success('Profile updated successfully!');

            // Notify parent to turn off Edit Mode
            if (onSaveSuccess) onSaveSuccess();

        } catch (error) {
            // Only log errors in development to prevent information leakage
            if (process.env.NODE_ENV === 'development') {
                console.error('Error updating profile:', error);
            }
            // Display safe, user-friendly error message
            toast.error(getSafeErrorMessage(error.message));
            // Stop spinner on error
            if (onUpdateSavingState) onUpdateSavingState(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading profile...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="px-4 sm:px-6">
                <div className="space-y-1">
                    <CardTitle className="text-lg sm:text-xl">Personal Information</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Update your personal details and profile information.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-4 sm:px-6">
                {/* ID matches the Button form attribute in ProfileHeader */}
                <form id="profile-form" onSubmit={handleSave} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input
                                id="firstName"
                                value={profile.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                placeholder="First name"
                                maxLength={100}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted text-muted-foreground opacity-100" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input
                                id="lastName"
                                value={profile.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                placeholder="Last name"
                                maxLength={100}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted text-muted-foreground opacity-100" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                // ALWAYS READ ONLY
                                readOnly={true}
                                placeholder="Email address"
                                className="bg-muted text-muted-foreground opacity-100"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={profile.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="Phone number"
                                maxLength={20}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted text-muted-foreground opacity-100" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jobTitle">Job title</Label>
                            <Input
                                id="jobTitle"
                                value={profile.jobTitle}
                                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                                placeholder="Job title"
                                maxLength={100}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted text-muted-foreground opacity-100" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                                id="company"
                                value={profile.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                placeholder="Company name"
                                maxLength={100}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted text-muted-foreground opacity-100" : ""}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            placeholder="Tell us about yourself..."
                            value={profile.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={4}
                            maxLength={1000}
                            readOnly={!isEditing}
                            className={!isEditing ? "bg-muted text-muted-foreground opacity-100" : ""}
                        />
                        <p className="text-xs text-muted-foreground">
                            {profile.bio.length}/1000 characters
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={profile.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="Location"
                            maxLength={100}
                            readOnly={!isEditing}
                            className={!isEditing ? "bg-muted text-muted-foreground opacity-100" : ""}
                        />
                    </div>
                </form>
                {/* Removed the duplicate buttons here; Header handles them */}
            </CardContent>
        </Card>
    );
}