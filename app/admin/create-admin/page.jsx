'use client'

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminNav } from "@/components/admin/admin-nav";
import {
    Shield,
    ShieldCheck,
    Loader2,
    Plus,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Check,
    X,
    Mail,
    KeyRound,
    Timer,
    LogOut,
    Users,
    RefreshCw,
    Crown,
    Key,
    Clock,
    Send,
    Eye,
    EyeOff,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    Alert,
    AlertDescription,
} from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAccessibility } from "@/contexts/accessibilityContext";

// Verification States
const VERIFY_STATE = {
    LOADING: 'loading',
    ENTER_EMAIL: 'enter_email',
    ENTER_PASSWORD: 'enter_password',
    VERIFYING: 'verifying',
    PASSKEY_SETUP: 'passkey_setup',
    PASSKEY_AUTH: 'passkey_auth',
    PASSKEY_PROCESSING: 'passkey_processing',
    VERIFIED: 'verified',
    UNAUTHORIZED: 'unauthorized', // Not master admin
    ERROR: 'error'
};

// Local storage keys
const ADMIN_EMAIL_KEY = 'vulniq_admin_email';
const SESSION_EXPIRY_KEY = 'vulniq_admin_session_expiry';
const SESSION_DURATION_MS = 30 * 60 * 1000;

function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function AdminManagementPage() {
    const { setForceHideFloating } = useAccessibility();

    useEffect(() => {
        setForceHideFloating(true);
        return () => setForceHideFloating(false);
    }, [setForceHideFloating]);

    // Verification state
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
    const deviceNameRef = useRef(null);
    const passwordRef = useRef(null);

    // Admin management state
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [resendingId, setResendingId] = useState(null);

    // Session countdown timer
    useEffect(() => {
        if (!sessionExpiry || verifyState !== VERIFY_STATE.VERIFIED) {
            setSessionCountdown(0);
            return;
        }

        const updateSessionCountdown = () => {
            const remaining = Math.max(0, Math.floor((sessionExpiry - Date.now()) / 1000));
            setSessionCountdown(remaining);

            if (remaining <= 0) {
                localStorage.removeItem(SESSION_EXPIRY_KEY);
                localStorage.removeItem(ADMIN_EMAIL_KEY);
                setSessionExpiry(null);
                setAdminEmail('');
                setVerifyState(VERIFY_STATE.ENTER_EMAIL);
                setAdmins([]);
            }
        };

        updateSessionCountdown();
        const interval = setInterval(updateSessionCountdown, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiry, verifyState]);

    // Check for existing session
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
                    
                    // Only master admin can access this page
                    if (!data.isMasterAdmin) {
                        setVerifyState(VERIFY_STATE.UNAUTHORIZED);
                        return;
                    }
                    
                    setVerifyState(VERIFY_STATE.VERIFIED);
                    if (savedSessionExpiry) {
                        const sessionExpiryTime = parseInt(savedSessionExpiry, 10);
                        if (Date.now() < sessionExpiryTime) {
                            setSessionExpiry(sessionExpiryTime);
                        } else {
                            const newExpiry = Date.now() + SESSION_DURATION_MS;
                            localStorage.setItem(SESSION_EXPIRY_KEY, newExpiry.toString());
                            setSessionExpiry(newExpiry);
                        }
                    } else {
                        const newExpiry = Date.now() + SESSION_DURATION_MS;
                        localStorage.setItem(SESSION_EXPIRY_KEY, newExpiry.toString());
                        setSessionExpiry(newExpiry);
                    }
                    fetchAdmins(data.email);
                    return;
                }
            } catch (err) {
                console.error('Failed to check session:', err);
            }
            localStorage.removeItem(ADMIN_EMAIL_KEY);
            localStorage.removeItem(SESSION_EXPIRY_KEY);
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
                fetchAdmins(adminEmail.trim());
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
                fetchAdmins(adminEmail.trim());
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
            const optionsRes = await fetch('/api/admin/passkey/register-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: adminEmail.trim(),
                    deviceName: passkeyDeviceName.trim() || undefined
                })
            });

            const optionsData = await optionsRes.json();
            console.log('[Passkey Setup] Options response:', optionsData);
            
            if (!optionsRes.ok) {
                throw new Error(optionsData.error || 'Failed to get registration options');
            }
            
            if (!optionsData.options) {
                throw new Error('Registration options not received from server');
            }

            const { startRegistration } = await import('@simplewebauthn/browser');
            const credential = await startRegistration(optionsData.options);

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

            // Use email from server response as source of truth
            const verifiedEmail = verifyData.email || adminEmail.trim();
            setAdminEmail(verifiedEmail);
            localStorage.setItem(ADMIN_EMAIL_KEY, verifiedEmail);
            const sessionExpiryTime = Date.now() + SESSION_DURATION_MS;
            localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
            setSessionExpiry(sessionExpiryTime);
            setVerifyState(VERIFY_STATE.VERIFIED);
            fetchAdmins(adminEmail.trim());

        } catch (err) {
            if (err.name === 'NotAllowedError') {
                // User cancelled - this is expected behavior, not an error
                console.log('Passkey registration cancelled by user');
                setVerifyError('Passkey setup was cancelled. Click the button to try again.');
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

            const { startAuthentication } = await import('@simplewebauthn/browser');
            const credential = await startAuthentication(optionsData.options);

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

            // Use email from server response as source of truth
            const verifiedEmail = verifyData.email || adminEmail.trim();
            setAdminEmail(verifiedEmail);
            localStorage.setItem(ADMIN_EMAIL_KEY, verifiedEmail);
            const sessionExpiryTime = Date.now() + SESSION_DURATION_MS;
            localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
            setSessionExpiry(sessionExpiryTime);
            setVerifyState(VERIFY_STATE.VERIFIED);
            fetchAdmins(adminEmail.trim());

        } catch (err) {
            if (err.name === 'NotAllowedError') {
                // User cancelled or no passkey available - offer to reset
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
            // Delete all existing passkeys for this admin
            const response = await fetch('/api/admin/passkey/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim(), password })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset passkey');
            }
            
            // Go to passkey setup
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
        setAdmins([]);
    }

    async function fetchAdmins(email) {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/admins', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setAdmins(data.admins || []);
            } else {
                const data = await response.json();
                if (response.status === 403) {
                    setError('Access denied. Only the master admin can manage admin accounts.');
                } else {
                    setError(data.error || 'Failed to fetch admins');
                }
            }
        } catch (err) {
            setError('Failed to load admins');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddAdmin() {
        if (!newAdminEmail.trim()) return;

        setIsAdding(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: newAdminEmail.trim() })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('Invitation sent successfully!');
                setNewAdminEmail('');
                setIsAddDialogOpen(false);
                fetchAdmins(adminEmail);
                setTimeout(() => setSuccessMessage(null), 4000);
            } else {
                setError(data.error || 'Failed to add admin');
            }
        } catch (err) {
            setError('Failed to add admin');
        } finally {
            setIsAdding(false);
        }
    }

    async function handleDeleteAdmin(id) {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/admins/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('Admin deleted successfully');
                setDeleteConfirmId(null);
                fetchAdmins(adminEmail);
                setTimeout(() => setSuccessMessage(null), 4000);
            } else {
                setError(data.error || 'Failed to delete admin');
            }
        } catch (err) {
            setError('Failed to delete admin');
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleResendVerification(id) {
        setResendingId(id);
        setError(null);

        try {
            const response = await fetch(`/api/admin/admins/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'resend-verification' })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('Verification email resent');
                setTimeout(() => setSuccessMessage(null), 4000);
            } else {
                setError(data.error || 'Failed to resend verification');
            }
        } catch (err) {
            setError('Failed to resend verification');
        } finally {
            setResendingId(null);
        }
    }

    // Loading state
    if (verifyState === VERIFY_STATE.LOADING) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--brand-accent)]" />
                    <p className="text-muted-foreground">Checking session...</p>
                </div>
            </div>
        );
    }

    // Unauthorized - not master admin
    if (verifyState === VERIFY_STATE.UNAUTHORIZED) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-red-500/5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-red-500/20 shadow-xl shadow-red-500/5">
                        <CardHeader className="text-center space-y-2">
                            <div className="flex justify-center mb-2">
                                <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20">
                                    <ShieldCheck className="h-8 w-8 text-red-500" />
                                </div>
                            </div>
                            <CardTitle className="text-xl">Access Denied</CardTitle>
                            <CardDescription>
                                This page is only accessible to the master admin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    You are logged in as <strong>{adminEmail}</strong>, but only the master admin can manage admin accounts.
                                </AlertDescription>
                            </Alert>
                            <div className="flex flex-col gap-2">
                                <Link href="/admin/articles">
                                    <Button variant="outline" className="w-full">
                                        Go to Articles Admin
                                    </Button>
                                </Link>
                                <Link href="/admin/users">
                                    <Button variant="outline" className="w-full">
                                        Go to Users Admin
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Login UI
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
                                    <Crown className="h-8 w-8 text-[var(--brand-accent)]" />
                                </div>
                            </div>
                            <CardTitle className="text-xl">Admin Management</CardTitle>
                            <CardDescription>
                                {verifyState === VERIFY_STATE.ENTER_EMAIL
                                    ? 'Enter your master admin email'
                                    : verifyState === VERIFY_STATE.ENTER_PASSWORD
                                    ? 'Enter your password'
                                    : verifyState === VERIFY_STATE.PASSKEY_SETUP
                                    ? 'Set up your passkey for secure access'
                                    : verifyState === VERIFY_STATE.PASSKEY_AUTH
                                    ? 'Authenticate with your passkey'
                                    : verifyState === VERIFY_STATE.PASSKEY_PROCESSING
                                    ? 'Complete the verification on your device'
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
                                            <p>Set up a passkey for secure, passwordless access.</p>
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
                                    ← Back to Home
                                </Link>
                            </div>

                            <Separator />
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <Shield className="h-4 w-4 text-[var(--brand-accent)] shrink-0" />
                                <p><span className="font-medium text-foreground">Access Restricted:</span> Only the master admin can manage admin accounts.</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Main admin management page
    return (
        <ScrollArea className="h-screen">
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-14 items-center">
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
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                                <Crown className="mr-1 h-3 w-3" />
                                Master Admin
                            </Badge>
                            <Separator orientation="vertical" className="h-6 hidden md:block" />
                            <AdminNav adminEmail={adminEmail} isMasterAdmin={isMasterAdmin} className="hidden md:flex" />
                        </div>
                        <div className="flex flex-1 items-center justify-end gap-2">
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
                                            <p>Session expires in {formatCountdown(sessionCountdown)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <ThemeToggle />
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container py-6 space-y-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Users className="h-6 w-6 text-[var(--brand-accent)]" />
                                Admin Accounts
                            </h1>
                            <p className="text-muted-foreground">
                                Manage administrator accounts and permissions
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => fetchAdmins(adminEmail)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Admin
                            </Button>
                        </div>
                    </div>

                    {/* Messages */}
                    {successMessage && (
                        <Alert className="bg-green-500/10 border-green-500/30">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <AlertDescription className="text-green-500">{successMessage}</AlertDescription>
                        </Alert>
                    )}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Admin List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Administrators</CardTitle>
                            <CardDescription>
                                All registered admin accounts. Master admin cannot be deleted.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : admins.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No admin accounts found</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Passkeys</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Last Login</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {admins.map((admin) => (
                                            <TableRow key={admin.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {admin.email}
                                                        {admin.isMasterAdmin && (
                                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                                                                <Crown className="h-3 w-3 mr-1" />
                                                                Master
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {admin.emailVerified ? (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Verified
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Key className="h-3 w-3 text-muted-foreground" />
                                                        <span>{admin.passkeyCount || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDate(admin.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDate(admin.lastLoginAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!admin.emailVerified && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleResendVerification(admin.id)}
                                                                            disabled={resendingId === admin.id}
                                                                        >
                                                                            {resendingId === admin.id ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Send className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Resend verification email</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                        {!admin.isMasterAdmin && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-destructive hover:text-destructive"
                                                                            onClick={() => setDeleteConfirmId(admin.id)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Delete admin</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                </main>

                {/* Add Admin Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Admin</DialogTitle>
                            <DialogDescription>
                                Enter the email address of the person you want to invite as an admin.
                                They will receive a verification email with instructions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="newAdminEmail">Email Address</Label>
                                <Input
                                    id="newAdminEmail"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddAdmin} disabled={isAdding || !newAdminEmail.trim()}>
                                {isAdding ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Invitation
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Admin</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this admin account? This action cannot be undone.
                                All passkeys associated with this admin will also be deleted.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleDeleteAdmin(deleteConfirmId)}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Admin
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ScrollArea>
    );
}
