import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProfileContent({ isEditing, onSaveSuccess, onUpdateSavingState, onCancel }) {
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        company: '',
        bio: '',
        location: '',
    });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch profile data on component mount
    useEffect(() => {
        fetchProfile();
    }, []);

    // When edit mode is cancelled (isEditing turns false externally), revert data to what is in DB
    useEffect(() => {
        if (!isEditing) {
            fetchProfile();
        }
    }, [isEditing]);

    const fetchProfile = async () => {
        try {
            // Only show full loading spinner on initial load, not on cancel revert
            if (!profile.email) setIsLoading(true);

            const response = await fetch('/api/profile');
            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();

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
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Notify parent that saving started
        if (onUpdateSavingState) onUpdateSavingState(true);

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update profile');
            }

            const data = await response.json();

            // Update local state with confirmed data
            setProfile(prev => ({
                ...prev,
                firstName: data.user.firstName || prev.firstName,
                lastName: data.user.lastName || prev.lastName,
                // ... update other fields as needed
            }));

            toast.success('Profile updated successfully!');

            // Notify parent to turn off Edit Mode
            if (onSaveSuccess) onSaveSuccess();

        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
            // Stop spinner on error
            if (onUpdateSavingState) onUpdateSavingState(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading profile...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="space-y-1">
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details and profile information.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {/* ID matches the Button form attribute in ProfileHeader */}
                <form id="profile-form" onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={profile.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                placeholder="First name"
                                maxLength={100}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted/50" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={profile.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                placeholder="Last name"
                                maxLength={100}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted/50" : ""}
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
                                className={!isEditing ? "bg-muted/50" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jobTitle">Job Title</Label>
                            <Input
                                id="jobTitle"
                                value={profile.jobTitle}
                                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                                placeholder="Job title"
                                maxLength={100}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted/50" : ""}
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
                                className={!isEditing ? "bg-muted/50" : ""}
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
                            className={!isEditing ? "bg-muted/50" : ""}
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
                            className={!isEditing ? "bg-muted/50" : ""}
                        />
                    </div>
                </form>
                {/* Removed the duplicate buttons here; Header handles them */}
            </CardContent>
        </Card>
    );
}