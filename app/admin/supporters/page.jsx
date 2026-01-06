'use client'

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminNav } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";
import {
    Shield,
    ShieldCheck,
    Loader2,
    Plus,
    Trash2,
    Save,
    Eye,
    EyeOff,
    Users,
    Star,
    AlertTriangle,
    CheckCircle2,
    X,
    Mail,
    KeyRound,
    Timer,
    LogOut,
    PersonStanding,
    ExternalLink,
    Linkedin,
    Globe,
    Building2,
    Briefcase,
    User,
    Link2,
    ImageIcon,
    FileText,
    Hash,
    Pencil,
    Columns3,
    Check,
    MoreHorizontal,
    Search,
    Lock,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAccessibility } from "@/contexts/accessibilityContext";
import { SupporterCard } from "@/components/ui/supporter-card";

// Verification States
const VERIFY_STATE = {
    LOADING: 'loading',
    ENTER_EMAIL: 'enter_email',
    ENTER_PASSWORD: 'enter_password',
    VERIFYING: 'verifying',
    PASSKEY_SETUP: 'passkey_setup',      // Need to register new passkey
    PASSKEY_AUTH: 'passkey_auth',         // Need to authenticate with existing passkey
    PASSKEY_PROCESSING: 'passkey_processing', // WebAuthn dialog active
    VERIFIED: 'verified',
    ERROR: 'error'
};

// Local storage keys
const ADMIN_EMAIL_KEY = 'vulniq_admin_email';
const SESSION_EXPIRY_KEY = 'vulniq_admin_session_expiry';

// Session duration in milliseconds (30 minutes)
const SESSION_DURATION_MS = 30 * 60 * 1000;

// Format seconds to MM:SS
function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AdminSupportersPage() {
    // Hide floating accessibility widget on this page
    const { setForceHideFloating, openPanel } = useAccessibility();

    useEffect(() => {
        setForceHideFloating(true);
        return () => setForceHideFloating(false);
    }, [setForceHideFloating]);

    // Verification state - start with LOADING to check existing session
    const [verifyState, setVerifyState] = useState(VERIFY_STATE.LOADING);
    const [verifyError, setVerifyError] = useState(null);
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passkeyDeviceName, setPasskeyDeviceName] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [sessionExpiry, setSessionExpiry] = useState(null);
    const [sessionCountdown, setSessionCountdown] = useState(0);
    const [isMasterAdmin, setIsMasterAdmin] = useState(false);
    const passwordRef = useRef(null);
    const deviceNameRef = useRef(null);

    // Main page state
    const [supporters, setSupporters] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editingSupporter, setEditingSupporter] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Inline editing state
    const [editingCell, setEditingCell] = useState(null); // { id: supporterId, field: fieldName }
    const [editingValue, setEditingValue] = useState('');
    const [savingCell, setSavingCell] = useState(false);

    // Column visibility state - all columns from form
    const [columnVisibility, setColumnVisibility] = useState({
        supporter: true,
        occupation: true,
        company: true,
        contribution: true,
        personalBio: false,
        linkedin: true,
        website: true,
        featured: true,
        order: true,
        actions: true,
    });

    const toggleColumn = (column) => {
        setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
    };

    // Inline edit handlers
    const startEditing = (supporterId, field, currentValue) => {
        setEditingCell({ id: supporterId, field });
        setEditingValue(currentValue || '');
    };

    const cancelEditing = () => {
        setEditingCell(null);
        setEditingValue('');
    };

    const saveInlineEdit = async () => {
        if (!editingCell) return;

        setSavingCell(true);
        try {
            // Handle numeric fields
            let valueToSave = editingValue;
            if (editingCell.field === 'order') {
                valueToSave = parseInt(editingValue) || 0;
            }

            const response = await fetch(`/api/admin/supporters/${editingCell.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [editingCell.field]: valueToSave })
            });

            if (response.ok) {
                // Update local state
                setSupporters(prev => prev.map(s =>
                    s.id === editingCell.id
                        ? { ...s, [editingCell.field]: valueToSave }
                        : s
                ));
                setSuccessMessage('Updated successfully');
                setTimeout(() => setSuccessMessage(null), 2000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update');
            }
        } catch (err) {
            setError('Failed to save changes');
        } finally {
            setSavingCell(false);
            setEditingCell(null);
            setEditingValue('');
        }
    };

    const handleInlineKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveInlineEdit();
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    };

    // Session countdown timer effect
    useEffect(() => {
        if (!sessionExpiry || verifyState !== VERIFY_STATE.VERIFIED) {
            setSessionCountdown(0);
            return;
        }

        const updateSessionCountdown = () => {
            const remaining = Math.max(0, Math.floor((sessionExpiry - Date.now()) / 1000));
            setSessionCountdown(remaining);

            if (remaining <= 0) {
                // Session expired - auto logout
                localStorage.removeItem(SESSION_EXPIRY_KEY);
                localStorage.removeItem(ADMIN_EMAIL_KEY);
                setSessionExpiry(null);
                setAdminEmail('');
                setVerifyState(VERIFY_STATE.ENTER_EMAIL);
                setSupporters([]);
            }
        };

        updateSessionCountdown();
        const interval = setInterval(updateSessionCountdown, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiry, verifyState]);

    // Check for existing session on mount
    useEffect(() => {
        async function checkExistingSession() {
            const savedSessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);

            try {
                const response = await fetch('/api/admin/check-session', {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.valid && data.email) {
                    // Use email from server response as source of truth
                    setAdminEmail(data.email);
                    setIsMasterAdmin(data.isMasterAdmin || false);
                    localStorage.setItem(ADMIN_EMAIL_KEY, data.email);
                    setVerifyState(VERIFY_STATE.VERIFIED);
                    // Restore session expiry if available
                    if (savedSessionExpiry) {
                        const sessionExpiryTime = parseInt(savedSessionExpiry, 10);
                        if (Date.now() < sessionExpiryTime) {
                            setSessionExpiry(sessionExpiryTime);
                        } else {
                            // Session expired on client side but server says valid?
                            // Set a new session expiry
                            const newExpiry = Date.now() + SESSION_DURATION_MS;
                            localStorage.setItem(SESSION_EXPIRY_KEY, newExpiry.toString());
                            setSessionExpiry(newExpiry);
                        }
                        } else {
                            // No saved expiry, set a new one
                            const newExpiry = Date.now() + SESSION_DURATION_MS;
                            localStorage.setItem(SESSION_EXPIRY_KEY, newExpiry.toString());
                            setSessionExpiry(newExpiry);
                        }
                        // Fetch supporters since we're verified
                        try {
                            const supportersResponse = await fetch('/api/admin/supporters');
                            if (supportersResponse.ok) {
                                const supportersData = await supportersResponse.json();
                                setSupporters(supportersData.supporters || []);
                            }
                        } catch (fetchErr) {
                            console.error('Failed to fetch supporters:', fetchErr);
                        }
                    return;
                }
            } catch (err) {
                console.error('Failed to check session:', err);
            }
            // Session invalid, clear stored email
            localStorage.removeItem(ADMIN_EMAIL_KEY);
            localStorage.removeItem(SESSION_EXPIRY_KEY);
            // No valid session found
            setVerifyState(VERIFY_STATE.ENTER_EMAIL);
        }
        checkExistingSession();
    }, []);

    // Verify email
    async function verifyEmail() {
        if (!adminEmail.trim()) {
            setVerifyError('Please enter your email address');
            return;
        }

        setIsVerifying(true);
        setVerifyError(null);

        try {
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim() })
            });

            const data = await response.json();

            if (data.verified) {
                localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail.trim());
                const sessionExpiryTime = Date.now() + SESSION_DURATION_MS;
                localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
                setSessionExpiry(sessionExpiryTime);
                setVerifyState(VERIFY_STATE.VERIFIED);
                fetchSupporters();
            } else if (data.emailValid && data.requiresPassword) {
                setVerifyState(VERIFY_STATE.ENTER_PASSWORD);
                setTimeout(() => passwordRef.current?.focus(), 100);
            } else {
                setVerifyError(data.error || 'Email not recognized');
            }
        } catch (err) {
            setVerifyError('Verification failed');
        } finally {
            setIsVerifying(false);
        }
    }

    // Verify password
    async function verifyPassword() {
        if (!password.trim()) {
            setVerifyError('Please enter your password');
            return;
        }

        setIsVerifying(true);
        setVerifyError(null);

        try {
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim(), password: password.trim() })
            });

            const data = await response.json();

            if (data.verified) {
                localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail.trim());
                const sessionExpiryTime = Date.now() + SESSION_DURATION_MS;
                localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
                setSessionExpiry(sessionExpiryTime);
                setVerifyState(VERIFY_STATE.VERIFIED);
                setPassword('');
                fetchSupporters();
            } else if (data.passwordVerified && data.requiresPasskeySetup) {
                setVerifyState(VERIFY_STATE.PASSKEY_SETUP);
                // Keep password for potential use
                setTimeout(() => deviceNameRef.current?.focus(), 100);
            } else if (data.passwordVerified && data.requiresPasskeyAuth) {
                setVerifyState(VERIFY_STATE.PASSKEY_AUTH);
                // Keep password for potential passkey reset
                setTimeout(() => startPasskeyAuth(), 100);
            } else {
                setVerifyError(data.error || 'Invalid password');
            }
        } catch (err) {
            setVerifyError('Verification failed');
        } finally {
            setIsVerifying(false);
        }
    }

    // WebAuthn Passkey Registration
    async function startPasskeySetup() {
        setVerifyState(VERIFY_STATE.PASSKEY_PROCESSING);
        setVerifyError(null);

        try {
            // 1. Get registration options from server
            const optionsRes = await fetch('/api/admin/passkey/register-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: adminEmail.trim(),
                    deviceName: passkeyDeviceName.trim() || undefined
                })
            });

            const optionsData = await optionsRes.json();
            if (!optionsRes.ok) {
                throw new Error(optionsData.error || 'Failed to get registration options');
            }
            
            if (!optionsData.options) {
                throw new Error('Registration options not received from server');
            }

            // 2. Start WebAuthn registration ceremony
            const { startRegistration } = await import('@simplewebauthn/browser');
            const credential = await startRegistration(optionsData.options);

            // 3. Verify registration with server
            const verifyRes = await fetch('/api/admin/passkey/register-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: adminEmail.trim(),
                    response: credential,
                    deviceName: passkeyDeviceName.trim() || undefined
                })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
                throw new Error(verifyData.error || 'Failed to register passkey');
            }

            // Success! Session is granted - use email from server response
            const verifiedEmail = verifyData.email || adminEmail.trim();
            setAdminEmail(verifiedEmail);
            localStorage.setItem(ADMIN_EMAIL_KEY, verifiedEmail);
            const sessionExpiryTime = Date.now() + SESSION_DURATION_MS;
            localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
            setSessionExpiry(sessionExpiryTime);
            setVerifyState(VERIFY_STATE.VERIFIED);
            fetchSupporters();

        } catch (err) {
            if (err.name === 'NotAllowedError') {
                // User cancelled - this is expected behavior, not an error
                console.log('Passkey registration cancelled by user');
                setVerifyError('Passkey registration was cancelled. Click the button to try again.');
            } else {
                console.error('Passkey registration error:', err);
                setVerifyError(err.message || 'Passkey registration failed');
            }
            setVerifyState(VERIFY_STATE.PASSKEY_SETUP);
        }
    }

    // WebAuthn Passkey Authentication
    async function startPasskeyAuth() {
        setVerifyState(VERIFY_STATE.PASSKEY_PROCESSING);
        setVerifyError(null);

        try {
            // 1. Get authentication options from server
            const optionsRes = await fetch('/api/admin/passkey/auth-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim() })
            });

            const optionsData = await optionsRes.json();
            if (!optionsRes.ok) {
                throw new Error(optionsData.error || 'Failed to get authentication options');
            }
            
            if (!optionsData.options) {
                throw new Error('Authentication options not received from server');
            }

            // 2. Start WebAuthn authentication ceremony
            const { startAuthentication } = await import('@simplewebauthn/browser');
            const credential = await startAuthentication(optionsData.options);

            // 3. Verify authentication with server
            const verifyRes = await fetch('/api/admin/passkey/auth-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: adminEmail.trim(),
                    response: credential
                })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
                throw new Error(verifyData.error || 'Failed to authenticate with passkey');
            }

            // Success! Session is granted - use email from server response
            const verifiedEmail = verifyData.email || adminEmail.trim();
            setAdminEmail(verifiedEmail);
            localStorage.setItem(ADMIN_EMAIL_KEY, verifiedEmail);
            const sessionExpiryTime = Date.now() + SESSION_DURATION_MS;
            localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
            setSessionExpiry(sessionExpiryTime);
            setVerifyState(VERIFY_STATE.VERIFIED);
            fetchSupporters();

        } catch (err) {
            if (err.name === 'NotAllowedError') {
                console.log('Passkey authentication cancelled or not available');
                setVerifyError('Passkey not found on this device. You may need to reset your passkey if it was deleted or you\'re on a different device.');
            } else {
                console.error('Passkey authentication error:', err);
                setVerifyError(err.message || 'Passkey authentication failed');
            }
            setVerifyState(VERIFY_STATE.PASSKEY_AUTH);
        }
    }

    // Reset passkey - delete existing and go to setup
    async function resetPasskey() {
        setIsVerifying(true);
        setVerifyError(null);
        
        try {
            const response = await fetch('/api/admin/passkey/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim(), password })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset passkey');
            }
            
            setVerifyState(VERIFY_STATE.PASSKEY_SETUP);
        } catch (err) {
            console.error('Passkey reset error:', err);
            setVerifyError(err.message || 'Failed to reset passkey');
        } finally {
            setIsVerifying(false);
        }
    }

    async function handleLogout() {
        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error('Logout API error:', err);
        }
        localStorage.removeItem(ADMIN_EMAIL_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);
        setAdminEmail('');
        setPassword('');
        setSessionExpiry(null);
        setVerifyState(VERIFY_STATE.ENTER_EMAIL);
        setSupporters([]);
    }

    async function fetchSupporters() {
        try {
            const response = await fetch('/api/admin/supporters', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setSupporters(data.supporters || []);
            } else {
                setError('Failed to fetch supporters');
            }
        } catch (err) {
            setError('Failed to load supporters');
        }
    }

    async function handleSave(formData) {
        setIsSaving(true);
        setError(null);

        try {
            const method = editingSupporter ? 'PUT' : 'POST';
            const url = editingSupporter
                ? `/api/admin/supporters/${editingSupporter.id}`
                : '/api/admin/supporters';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSuccessMessage(editingSupporter ? 'Supporter updated!' : 'Supporter added!');
                setIsModalOpen(false);
                setEditingSupporter(null);
                fetchSupporters();
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to save supporter');
            }
        } catch (err) {
            setError('Failed to save supporter');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this supporter?')) return;

        setIsDeleting(id);
        setError(null);

        try {
            const response = await fetch(`/api/admin/supporters/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setSuccessMessage('Supporter deleted!');
                fetchSupporters();
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete supporter');
            }
        } catch (err) {
            setError('Failed to delete supporter');
        } finally {
            setIsDeleting(null);
        }
    }

    async function handleToggleFeatured(supporter) {
        setError(null);
        try {
            const response = await fetch(`/api/admin/supporters/${supporter.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ featured: !supporter.featured })
            });

            if (response.ok) {
                setSuccessMessage(`${supporter.name} ${!supporter.featured ? 'is now featured' : 'is no longer featured'}`);
                fetchSupporters();
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update supporter');
            }
        } catch (err) {
            setError('Failed to update supporter');
        }
    }

    // Filter supporters by search query across all columns
    const filteredSupporters = supporters.filter(supporter => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();
        return (
            supporter.name?.toLowerCase().includes(query) ||
            supporter.occupation?.toLowerCase().includes(query) ||
            supporter.company?.toLowerCase().includes(query) ||
            supporter.contribution?.toLowerCase().includes(query) ||
            supporter.personalBio?.toLowerCase().includes(query) ||
            supporter.linkedin?.toLowerCase().includes(query) ||
            supporter.website?.toLowerCase().includes(query) ||
            String(supporter.order || '').includes(query)
        );
    });

    // Loading screen
    if (verifyState === VERIFY_STATE.LOADING) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-[var(--brand-accent)]/5">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="p-4 rounded-full bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20">
                        <Loader2 className="h-8 w-8 text-[var(--brand-accent)] animate-spin" />
                    </div>
                    <p className="text-muted-foreground">Checking session...</p>
                </motion.div>
            </div>
        );
    }

    // Verification screen (email entry and OTP)
    if (verifyState !== VERIFY_STATE.VERIFIED) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-[var(--brand-accent)]/5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-[var(--brand-accent)]/20 shadow-xl shadow-[var(--brand-accent)]/5">
                        <CardHeader className="text-center space-y-2">
                            <div className="flex justify-center mb-2">
                                <div className="p-3 rounded-full bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20">
                                    <Shield className="h-8 w-8 text-[var(--brand-accent)]" />
                                </div>
                            </div>
                            <CardTitle className="text-xl">Admin Access</CardTitle>
                            <CardDescription>
                                {verifyState === VERIFY_STATE.ENTER_EMAIL
                                    ? 'Enter your admin email to continue'
                                    : verifyState === VERIFY_STATE.ENTER_PASSWORD
                                    ? 'Enter your password'
                                    : verifyState === VERIFY_STATE.PASSKEY_SETUP
                                    ? 'Set up your passkey for secure admin access'
                                    : verifyState === VERIFY_STATE.PASSKEY_AUTH
                                    ? 'Authenticate with your registered passkey'
                                    : verifyState === VERIFY_STATE.PASSKEY_PROCESSING
                                    ? 'Complete the passkey verification on your device'
                                    : 'Verify your identity'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {verifyError && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{verifyError}</AlertDescription>
                                </Alert>
                            )}

                            {verifyState === VERIFY_STATE.ENTER_EMAIL && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Admin Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="admin@example.com"
                                                value={adminEmail}
                                                onChange={(e) => setAdminEmail(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && verifyEmail()}
                                                className="pl-9"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
                                        onClick={verifyEmail}
                                        disabled={isVerifying}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <KeyRound className="mr-2 h-4 w-4" />
                                                Continue
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}

                            {verifyState === VERIFY_STATE.ENTER_PASSWORD && (
                                <>
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                                        <Mail className="w-4 h-4" />
                                        <span>{adminEmail}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                ref={passwordRef}
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                                                className="pl-9 pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
                                        onClick={verifyPassword}
                                        disabled={isVerifying}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify Password'
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setVerifyState(VERIFY_STATE.ENTER_EMAIL);
                                            setPassword('');
                                            setVerifyError(null);
                                        }}
                                        className="w-full"
                                    >
                                        Use different email
                                    </Button>
                                </>
                            )}

                            {verifyState === VERIFY_STATE.PASSKEY_SETUP && (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center gap-2 text-sm text-green-500 mb-4">
                                            <Check className="h-4 w-4" />
                                            Password verified
                                        </div>
                                        <div className="text-center text-sm text-muted-foreground mb-4">
                                            <p>Set up a passkey for secure access.</p>
                                            <p className="mt-2">You can use Face ID, Touch ID, Windows Hello, or a security key.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="deviceName">Device Name (optional)</Label>
                                            <Input
                                                ref={deviceNameRef}
                                                id="deviceName"
                                                type="text"
                                                placeholder="e.g., MacBook Pro, iPhone"
                                                value={passkeyDeviceName}
                                                onChange={(e) => setPasskeyDeviceName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && startPasskeySetup()}
                                            />
                                        </div>
                                        <Button
                                            className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
                                            onClick={startPasskeySetup}
                                        >
                                            <KeyRound className="mr-2 h-4 w-4" />
                                            Set Up Passkey
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setVerifyState(VERIFY_STATE.ENTER_EMAIL);
                                            setVerifyError(null);
                                            setPasskeyDeviceName('');
                                        }}
                                        className="w-full"
                                    >
                                        Start over
                                    </Button>
                                </>
                            )}

                            {verifyState === VERIFY_STATE.PASSKEY_AUTH && (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center gap-2 text-sm text-green-500 mb-4">
                                            <Check className="h-4 w-4" />
                                            Password verified
                                        </div>
                                        <div className="text-center text-sm text-muted-foreground mb-4">
                                            <p>Complete authentication with your registered passkey.</p>
                                        </div>
                                        <Button
                                            className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
                                            onClick={startPasskeyAuth}
                                        >
                                            <KeyRound className="mr-2 h-4 w-4" />
                                            Authenticate with Passkey
                                        </Button>
                                        <div className="relative my-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-muted" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">
                                                    or if passkey is missing
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full text-amber-600 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950"
                                            onClick={resetPasskey}
                                            disabled={isVerifying}
                                        >
                                            {isVerifying ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</>
                                            ) : (
                                                <><RefreshCw className="mr-2 h-4 w-4" />Reset & Register New Passkey</>
                                            )}
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setVerifyState(VERIFY_STATE.ENTER_EMAIL);
                                            setVerifyError(null);
                                        }}
                                        className="w-full"
                                    >
                                        Start over
                                    </Button>
                                </>
                            )}

                            {verifyState === VERIFY_STATE.PASSKEY_PROCESSING && (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-accent)]" />
                                        <p className="text-sm text-muted-foreground">
                                            Complete the verification on your device...
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="text-center">
                                <Link
                                    href="/"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ← Back to home
                                </Link>
                            </div>

                            <Separator />
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <Shield className="h-4 w-4 text-[var(--brand-accent)] shrink-0" />
                                <p><span className="font-medium text-foreground">Security Notice:</span> Verification codes are only sent to whitelisted admin emails.</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Main admin page (verified)
    return (
        <ScrollArea className="h-screen">
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="w-full px-4 sm:px-6 lg:px-8 flex h-14 items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <Image
                                src="/web-app-manifest-512x512.png"
                                alt="Logo"
                                className="h-6 w-6 rounded"
                                width={24}
                                height={24}
                            />
                            <span className="hidden sm:inline-block">VulnIQ</span>
                        </Link>
                        <Badge variant="outline" className={cn(
                            "border-[var(--brand-accent)]/30",
                            isMasterAdmin 
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]"
                        )}>
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            {isMasterAdmin ? 'Master Admin' : 'Admin'}
                        </Badge>
                        <Separator orientation="vertical" className="h-6 hidden md:block" />
                        <AdminNav adminEmail={adminEmail} isMasterAdmin={isMasterAdmin} className="hidden md:flex" />
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-2">
                        {/* Session countdown */}
                        {sessionCountdown > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                                            sessionCountdown <= 300 
                                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' 
                                                : 'bg-muted text-muted-foreground'
                                        }`}>
                                            <Timer className="h-3 w-3" />
                                            <span className="font-mono">{formatCountdown(sessionCountdown)}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {sessionCountdown <= 300
                                            ? 'Session expiring soon!'
                                            : 'Session time remaining'}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <span className="text-xs text-muted-foreground hidden md:block">{adminEmail}</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={openPanel}
                                        className="text-[var(--brand-primary)] dark:text-[var(--brand-light)] hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)]/50 transition-all duration-300"
                                    >
                                        <PersonStanding className="h-5 w-5" />
                                        <span className="sr-only">Accessibility</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Accessibility Options</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleLogout}
                                        className="text-[var(--brand-primary)] dark:text-[var(--brand-light)] hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)]/50 transition-all duration-300"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span className="sr-only">Logout</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Logout</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Success/Error Messages */}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Alert className="bg-[var(--brand-accent)]/10 border-[var(--brand-accent)]/30 text-[var(--brand-accent)]">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                                {error}
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setError(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--brand-accent)]/10">
                                <Users className="h-5 w-5 text-[var(--brand-accent)]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Manage Supporters</h1>
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery
                                        ? `${filteredSupporters.length} of ${supporters.length} supporter${supporters.length !== 1 ? 's' : ''}`
                                        : `${supporters.length} supporter${supporters.length !== 1 ? 's' : ''}`
                                    } • Click any cell to edit
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={() => { setEditingSupporter(null); setIsModalOpen(true); }}
                        className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 shadow-sm"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Supporter
                    </Button>
                </div>

                {/* Search Bar */}
                <Card className="border-border/50 shadow-sm">
                    <CardContent className="py-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search supporters by name, occupation, company, contribution..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Supporters Table */}
                <Card className="border-border/50 w-full shadow-sm">
                    <CardHeader className="py-4 px-6 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <CardTitle className="text-lg font-semibold">
                                    Supporters List
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500 mr-1" />
                                    {supporters.filter(s => s.featured).length} featured
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsPreviewOpen(true)}
                                    disabled={supporters.length === 0}
                                    className="border-[var(--brand-accent)] text-[var(--brand-accent)] hover:bg-[var(--brand-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                </Button>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Columns3 className="h-4 w-4" />
                                        <span className="hidden sm:inline">Columns</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[180px]">
                                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.supporter}
                                        onCheckedChange={() => toggleColumn('supporter')}
                                    >
                                        Supporter
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.occupation}
                                        onCheckedChange={() => toggleColumn('occupation')}
                                    >
                                        Occupation
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.company}
                                        onCheckedChange={() => toggleColumn('company')}
                                    >
                                        Company
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.contribution}
                                        onCheckedChange={() => toggleColumn('contribution')}
                                    >
                                        Contribution
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.personalBio}
                                        onCheckedChange={() => toggleColumn('personalBio')}
                                    >
                                        Personal Bio
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.linkedin}
                                        onCheckedChange={() => toggleColumn('linkedin')}
                                    >
                                        LinkedIn
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.website}
                                        onCheckedChange={() => toggleColumn('website')}
                                    >
                                        Website
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.featured}
                                        onCheckedChange={() => toggleColumn('featured')}
                                    >
                                        Featured
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.order}
                                        onCheckedChange={() => toggleColumn('order')}
                                    >
                                        Order
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.actions}
                                        onCheckedChange={() => toggleColumn('actions')}
                                    >
                                        Actions
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </div>
                        </div>
                    </CardHeader>
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="min-w-max">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        {columnVisibility.supporter && (
                                            <TableHead className="w-[200px] border-r border-border/50 font-semibold">Supporter</TableHead>
                                        )}
                                        {columnVisibility.occupation && (
                                            <TableHead className="w-[150px] border-r border-border/50 font-semibold">Occupation</TableHead>
                                        )}
                                        {columnVisibility.company && (
                                            <TableHead className="w-[150px] border-r border-border/50 font-semibold">Company</TableHead>
                                        )}
                                        {columnVisibility.contribution && (
                                            <TableHead className="min-w-[300px] border-r border-border/50 font-semibold">Contribution</TableHead>
                                        )}
                                        {columnVisibility.personalBio && (
                                            <TableHead className="w-[200px] border-r border-border/50 font-semibold">Personal Bio</TableHead>
                                        )}
                                        {columnVisibility.linkedin && (
                                            <TableHead className="w-[80px] text-center border-r border-border/50 font-semibold">LinkedIn</TableHead>
                                        )}
                                        {columnVisibility.website && (
                                            <TableHead className="w-[80px] text-center border-r border-border/50 font-semibold">Website</TableHead>
                                    )}
                                    {columnVisibility.featured && (
                                        <TableHead className="w-[90px] text-center border-r border-border/50 font-semibold">Featured</TableHead>
                                    )}
                                    {columnVisibility.order && (
                                        <TableHead className="w-[70px] text-center border-r border-border/50 font-semibold">Order</TableHead>
                                    )}
                                    {columnVisibility.actions && (
                                        <TableHead className="w-[90px] text-right font-semibold">Actions</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSupporters.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="h-40 text-center">
                                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                <div className="p-4 rounded-full bg-muted">
                                                    <Users className="h-8 w-8 opacity-50" />
                                                </div>
                                                <div>
                                                    {searchQuery ? (
                                                        <>
                                                            <p className="font-medium">No supporters found</p>
                                                            <p className="text-sm">Try adjusting your search query</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="font-medium">No supporters yet</p>
                                                            <p className="text-sm">Add your first supporter to get started</p>
                                                        </>
                                                    )}
                                                </div>
                                                {!searchQuery && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setEditingSupporter(null); setIsModalOpen(true); }}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add Supporter
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSupporters.map((supporter) => (
                                        <TableRow key={supporter.id} className="group hover:bg-muted/30 border-b">
                                            {columnVisibility.supporter && (
                                                <TableCell className="py-3 border-r border-border/50 max-w-[200px]">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-border shrink-0">
                                                            <AvatarImage src={supporter.avatarUrl} alt={supporter.name} />
                                                            <AvatarFallback className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] text-sm">
                                                                {supporter.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0 flex-1">
                                                            {editingCell?.id === supporter.id && editingCell?.field === 'name' ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        value={editingValue}
                                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                                        onKeyDown={handleInlineKeyDown}
                                                                        className="h-7 text-sm"
                                                                        autoFocus
                                                                    />
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveInlineEdit} disabled={savingCell}>
                                                                        {savingCell ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                                                        <X className="h-3 w-3 text-red-500" />
                                                                    </Button>
                                                                </div>
                                                            ) : supporter.name && supporter.name.length > 20 ? (
                                                                <div className="flex items-center gap-1">
                                                                    <p
                                                                        className="font-medium text-sm leading-none cursor-pointer hover:text-[var(--brand-accent)] transition-colors truncate flex-1"
                                                                        onClick={() => startEditing(supporter.id, 'name', supporter.name)}
                                                                    >
                                                                        {supporter.name}
                                                                    </p>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0">
                                                                                <MoreHorizontal className="h-3 w-3" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-60">
                                                                            <p className="text-sm font-medium">{supporter.name}</p>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                </div>
                                                            ) : (
                                                                <p
                                                                    className="font-medium text-sm leading-none cursor-pointer hover:text-[var(--brand-accent)] transition-colors truncate"
                                                                    onClick={() => startEditing(supporter.id, 'name', supporter.name)}
                                                                >
                                                                    {supporter.name}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                                {supporter.linkedinUrl && (
                                                                    <a href={supporter.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[var(--brand-accent)] transition-colors">
                                                                        <Linkedin className="h-3 w-3" />
                                                                    </a>
                                                                )}
                                                                {supporter.websiteUrl && (
                                                                    <a href={supporter.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[var(--brand-accent)] transition-colors">
                                                                        <Globe className="h-3 w-3" />
                                                                    </a>
                                                                )}
                                                                {supporter.companyUrl && (
                                                                    <a href={supporter.companyUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[var(--brand-accent)] transition-colors">
                                                                        <Building2 className="h-3 w-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {columnVisibility.occupation && (
                                                <TableCell className="py-3 border-r border-border/50 max-w-[150px]">
                                                    {editingCell?.id === supporter.id && editingCell?.field === 'occupation' ? (
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onKeyDown={handleInlineKeyDown}
                                                                className="h-7 text-sm"
                                                                autoFocus
                                                            />
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveInlineEdit} disabled={savingCell}>
                                                                {savingCell ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                                                <X className="h-3 w-3 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ) : supporter.occupation && supporter.occupation.length > 25 ? (
                                                        <div className="flex items-center gap-1">
                                                            <p
                                                                className="text-sm cursor-pointer hover:text-[var(--brand-accent)] transition-colors truncate flex-1"
                                                                onClick={() => startEditing(supporter.id, 'occupation', supporter.occupation)}
                                                            >
                                                                {supporter.occupation}
                                                            </p>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0">
                                                                        <MoreHorizontal className="h-3 w-3" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-60">
                                                                    <p className="text-sm">{supporter.occupation}</p>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    ) : (
                                                        <p
                                                            className="text-sm cursor-pointer hover:text-[var(--brand-accent)] transition-colors truncate"
                                                            onClick={() => startEditing(supporter.id, 'occupation', supporter.occupation)}
                                                        >
                                                            {supporter.occupation || '—'}
                                                        </p>
                                                    )}
                                                </TableCell>
                                            )}
                                            {columnVisibility.company && (
                                                <TableCell className="py-3 border-r border-border/50 max-w-[150px]">
                                                    {editingCell?.id === supporter.id && editingCell?.field === 'company' ? (
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onKeyDown={handleInlineKeyDown}
                                                                className="h-7 text-sm"
                                                                autoFocus
                                                            />
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveInlineEdit} disabled={savingCell}>
                                                                {savingCell ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                                                <X className="h-3 w-3 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ) : supporter.company && supporter.company.length > 20 ? (
                                                        <div className="flex items-center gap-1">
                                                            <p
                                                                className="text-sm cursor-pointer hover:text-[var(--brand-accent)] transition-colors truncate flex-1"
                                                                onClick={() => startEditing(supporter.id, 'company', supporter.company)}
                                                            >
                                                                {supporter.company}
                                                            </p>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0">
                                                                        <MoreHorizontal className="h-3 w-3" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-60">
                                                                    <p className="text-sm">{supporter.company}</p>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    ) : (
                                                        <p
                                                            className="text-sm cursor-pointer hover:text-[var(--brand-accent)] transition-colors truncate"
                                                            onClick={() => startEditing(supporter.id, 'company', supporter.company)}
                                                        >
                                                            {supporter.company || '—'}
                                                        </p>
                                                    )}
                                                </TableCell>
                                            )}
                                            {columnVisibility.contribution && (
                                                <TableCell className="py-3 border-r border-border/50">
                                                    {editingCell?.id === supporter.id && editingCell?.field === 'contributionBio' ? (
                                                        <div className="flex items-start gap-1">
                                                            <Textarea
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Escape') cancelEditing(); }}
                                                                className="text-sm min-h-[60px] resize-none"
                                                                autoFocus
                                                            />
                                                            <div className="flex flex-col gap-1">
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveInlineEdit} disabled={savingCell}>
                                                                    {savingCell ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                                                    <X className="h-3 w-3 text-red-500" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="group/text">
                                                            {supporter.contributionBio && supporter.contributionBio.length > 100 ? (
                                                                <div className="flex items-start gap-1">
                                                                    <p
                                                                        className="text-sm text-muted-foreground line-clamp-2 flex-1 cursor-pointer hover:text-foreground transition-colors"
                                                                        onClick={() => startEditing(supporter.id, 'contributionBio', supporter.contributionBio)}
                                                                    >
                                                                        {supporter.contributionBio}
                                                                    </p>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs shrink-0">
                                                                                <MoreHorizontal className="h-3 w-3" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-80 max-h-60 overflow-auto">
                                                                            <p className="text-sm">{supporter.contributionBio}</p>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                </div>
                                                            ) : (
                                                                <p
                                                                    className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                                                    onClick={() => startEditing(supporter.id, 'contributionBio', supporter.contributionBio)}
                                                                >
                                                                    {supporter.contributionBio || '—'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            )}
                                            {columnVisibility.personalBio && (
                                                <TableCell className="py-3 border-r border-border/50">
                                                    {editingCell?.id === supporter.id && editingCell?.field === 'personalBio' ? (
                                                        <div className="flex items-start gap-1">
                                                            <Textarea
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Escape') cancelEditing(); }}
                                                                className="text-sm min-h-[60px] resize-none"
                                                                autoFocus
                                                            />
                                                            <div className="flex flex-col gap-1">
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveInlineEdit} disabled={savingCell}>
                                                                    {savingCell ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                                                    <X className="h-3 w-3 text-red-500" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            {supporter.personalBio && supporter.personalBio.length > 80 ? (
                                                                <div className="flex items-start gap-1">
                                                                    <p
                                                                        className="text-sm text-muted-foreground line-clamp-2 flex-1 cursor-pointer hover:text-foreground transition-colors"
                                                                        onClick={() => startEditing(supporter.id, 'personalBio', supporter.personalBio)}
                                                                    >
                                                                        {supporter.personalBio}
                                                                    </p>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs shrink-0">
                                                                                <MoreHorizontal className="h-3 w-3" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-80 max-h-60 overflow-auto">
                                                                            <p className="text-sm">{supporter.personalBio}</p>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                </div>
                                                            ) : (
                                                                <p
                                                                    className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                                                    onClick={() => startEditing(supporter.id, 'personalBio', supporter.personalBio)}
                                                                >
                                                                    {supporter.personalBio || '—'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            )}
                                            {columnVisibility.linkedin && (
                                                <TableCell className="text-center py-3 border-r border-border/50">
                                                    {editingCell?.id === supporter.id && editingCell?.field === 'linkedinUrl' ? (
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onKeyDown={handleInlineKeyDown}
                                                                className="h-7 text-xs"
                                                                placeholder="https://linkedin.com/in/..."
                                                                autoFocus
                                                            />
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveInlineEdit} disabled={savingCell}>
                                                                {savingCell ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                                                <X className="h-3 w-3 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ) : supporter.linkedinUrl ? (
                                                        <a href={supporter.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-[var(--brand-accent)] transition-colors">
                                                            <Linkedin className="h-4 w-4" />
                                                        </a>
                                                    ) : (
                                                        <span
                                                            className="text-muted-foreground/50 cursor-pointer hover:text-muted-foreground"
                                                            onClick={() => startEditing(supporter.id, 'linkedinUrl', supporter.linkedinUrl)}
                                                        >
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {columnVisibility.website && (
                                                <TableCell className="text-center py-3 border-r border-border/50">
                                                    {editingCell?.id === supporter.id && editingCell?.field === 'websiteUrl' ? (
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onKeyDown={handleInlineKeyDown}
                                                                className="h-7 text-xs"
                                                                placeholder="https://..."
                                                                autoFocus
                                                            />
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveInlineEdit} disabled={savingCell}>
                                                                {savingCell ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                                                <X className="h-3 w-3 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ) : supporter.websiteUrl ? (
                                                        <a href={supporter.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-[var(--brand-accent)] transition-colors">
                                                            <Globe className="h-4 w-4" />
                                                        </a>
                                                    ) : (
                                                        <span
                                                            className="text-muted-foreground/50 cursor-pointer hover:text-muted-foreground"
                                                            onClick={() => startEditing(supporter.id, 'websiteUrl', supporter.websiteUrl)}
                                                        >
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {columnVisibility.featured && (
                                                <TableCell className="text-center py-3 border-r border-border/50">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => handleToggleFeatured(supporter)}
                                                                >
                                                                    <Star className={`h-4 w-4 transition-colors ${supporter.featured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground hover:text-amber-500/50'}`} />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {supporter.featured ? 'Remove from featured' : 'Mark as featured'}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                            )}
                                            {columnVisibility.order && (
                                                <TableCell className="text-center py-3 border-r border-border/50">
                                                    {editingCell?.id === supporter.id && editingCell?.field === 'order' ? (
                                                        <div className="flex items-center gap-1 justify-center">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onKeyDown={handleInlineKeyDown}
                                                                className="h-7 w-16 text-sm text-center"
                                                                autoFocus
                                                            />
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveInlineEdit} disabled={savingCell}>
                                                                {savingCell ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                                                <X className="h-3 w-3 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-muted text-xs font-medium cursor-pointer hover:bg-muted/80"
                                                            onClick={() => startEditing(supporter.id, 'order', supporter.order?.toString() || '0')}
                                                        >
                                                            {supporter.order}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {columnVisibility.actions && (
                                                <TableCell className="text-right py-3">
                                                    <div className="flex items-center justify-end gap-0.5">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => { setEditingSupporter(supporter); setIsModalOpen(true); }}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Edit</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                        onClick={() => handleDelete(supporter.id)}
                                                                        disabled={isDeleting === supporter.id}
                                                                    >
                                                                        {isDeleting === supporter.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Delete</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </Card>

                {/* Info box */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 bg-muted/30">
                    <ShieldCheck className="h-5 w-5 text-[var(--brand-accent)] shrink-0" />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Security Notice:</span>{' '}
                        Your admin session expires after 30 minutes. All changes are applied immediately.
                    </p>
                </div>
            </main>

            {/* Add/Edit Modal */}
            <SupporterModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                supporter={editingSupporter}
                onSave={handleSave}
                isSaving={isSaving}
            />

            {/* Preview Modal */}
            <PreviewModal
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                supporters={supporters}
            />
        </div>
        </ScrollArea>
    );
}

// Preview Modal Component
function PreviewModal({ open, onOpenChange, supporters }) {
    const featuredSupporters = supporters.filter(s => s.featured);
    const allSupporters = supporters;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-[var(--brand-accent)]" />
                        Public Page Preview
                    </DialogTitle>
                    <DialogDescription>
                        This is how the supporters page will look to visitors
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
                    <div className="px-6 py-4 space-y-8">
                        {/* Featured Section */}
                        {featuredSupporters.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                    <h3 className="text-lg font-semibold">Featured Supporters</h3>
                                    <Badge variant="secondary">{featuredSupporters.length}</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {featuredSupporters.map((supporter) => (
                                        <SupporterCard key={supporter.id} supporter={supporter} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* All Supporters Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-[var(--brand-accent)]" />
                                <h3 className="text-lg font-semibold">All Supporters</h3>
                                <Badge variant="secondary">{allSupporters.length}</Badge>
                            </div>
                            {allSupporters.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No supporters to preview</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {allSupporters.map((supporter) => (
                                        <SupporterCard key={supporter.id} supporter={supporter} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" asChild>
                        <Link href="/supporters" target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Full Page
                        </Link>
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Supporter Form Modal
function SupporterModal({ open, onOpenChange, supporter, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        name: '',
        avatarUrl: '',
        occupation: '',
        company: '',
        companyUrl: '',
        contributionBio: '',
        personalBio: '',
        linkedinUrl: '',
        websiteUrl: '',
        featured: false,
        order: 0,
    });

    useEffect(() => {
        if (supporter) {
            setFormData({
                name: supporter.name || '',
                avatarUrl: supporter.avatarUrl || '',
                occupation: supporter.occupation || '',
                company: supporter.company || '',
                companyUrl: supporter.companyUrl || '',
                contributionBio: supporter.contributionBio || '',
                personalBio: supporter.personalBio || '',
                linkedinUrl: supporter.linkedinUrl || '',
                websiteUrl: supporter.websiteUrl || '',
                featured: supporter.featured || false,
                order: supporter.order || 0,
            });
        } else {
            setFormData({
                name: '',
                avatarUrl: '',
                occupation: '',
                company: '',
                companyUrl: '',
                contributionBio: '',
                personalBio: '',
                linkedinUrl: '',
                websiteUrl: '',
                featured: false,
                order: 0,
            });
        }
    }, [supporter, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        {supporter ? <Pencil className="h-5 w-5 text-[var(--brand-accent)]" /> : <Plus className="h-5 w-5 text-[var(--brand-accent)]" />}
                        {supporter ? 'Edit Supporter' : 'Add New Supporter'}
                    </DialogTitle>
                    <DialogDescription>
                        {supporter
                            ? 'Update the supporter information below.'
                            : 'Fill in the details to add a new supporter.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[calc(90vh-200px)]">
                        <form id="supporter-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Personal Information Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <User className="h-4 w-4" />
                                Personal Information
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="avatarUrl" className="flex items-center gap-1">
                                        <ImageIcon className="h-3 w-3" />
                                        Avatar URL
                                    </Label>
                                    <Input
                                        id="avatarUrl"
                                        type="url"
                                        value={formData.avatarUrl}
                                        onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                                        placeholder="https://example.com/avatar.jpg"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Professional Information Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Briefcase className="h-4 w-4" />
                                Professional Information
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                                <div className="space-y-2">
                                    <Label htmlFor="occupation">Occupation <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="occupation"
                                        required
                                        value={formData.occupation}
                                        onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                                        placeholder="Software Engineer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company" className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        Company
                                    </Label>
                                    <Input
                                        id="company"
                                        value={formData.company}
                                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                        placeholder="Acme Inc."
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="companyUrl" className="flex items-center gap-1">
                                        <Link2 className="h-3 w-3" />
                                        Company Website
                                    </Label>
                                    <Input
                                        id="companyUrl"
                                        type="url"
                                        value={formData.companyUrl}
                                        onChange={(e) => setFormData(prev => ({ ...prev, companyUrl: e.target.value }))}
                                        placeholder="https://company.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Bio Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                Bios
                            </div>
                            <div className="space-y-4 pl-6">
                                <div className="space-y-2">
                                    <Label htmlFor="contributionBio">Contribution <span className="text-destructive">*</span></Label>
                                    <Textarea
                                        id="contributionBio"
                                        required
                                        value={formData.contributionBio}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contributionBio: e.target.value }))}
                                        placeholder="What did they help with?"
                                        className="min-h-[80px] resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="personalBio">Personal Bio</Label>
                                    <Textarea
                                        id="personalBio"
                                        value={formData.personalBio}
                                        onChange={(e) => setFormData(prev => ({ ...prev, personalBio: e.target.value }))}
                                        placeholder="Short bio about the person"
                                        className="min-h-[80px] resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Links Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Globe className="h-4 w-4" />
                                Social Links
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                                <div className="space-y-2">
                                    <Label htmlFor="linkedinUrl" className="flex items-center gap-1">
                                        <Linkedin className="h-3 w-3" />
                                        LinkedIn
                                    </Label>
                                    <Input
                                        id="linkedinUrl"
                                        type="url"
                                        value={formData.linkedinUrl}
                                        onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="websiteUrl" className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        Personal Website
                                    </Label>
                                    <Input
                                        id="websiteUrl"
                                        type="url"
                                        value={formData.websiteUrl}
                                        onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Settings Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Hash className="h-4 w-4" />
                                Display Settings
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                                <div className="space-y-2">
                                    <Label htmlFor="order">Display Order</Label>
                                    <Input
                                        id="order"
                                        type="number"
                                        min="0"
                                        value={formData.order}
                                        onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                                    />
                                    <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Featured</Label>
                                    <div className="flex items-center space-x-3 pt-2">
                                        <Switch
                                            id="featured"
                                            checked={formData.featured}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                                        />
                                        <Label htmlFor="featured" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                                            <Star className={`h-4 w-4 ${formData.featured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                                            {formData.featured ? 'Featured' : 'Not featured'}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                    </ScrollArea>
                </div>

                <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="supporter-form"
                        disabled={isSaving}
                        className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {supporter ? 'Update' : 'Create'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
