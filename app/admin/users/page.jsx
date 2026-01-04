'use client'

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import {
    Shield,
    ShieldCheck,
    Loader2,
    Eye,
    Users,
    AlertTriangle,
    CheckCircle2,
    X,
    Mail,
    KeyRound,
    Timer,
    LogOut,
    PersonStanding,
    Search,
    Globe,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    Briefcase,
    Building2,
    MapPin,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAccessibility } from "@/contexts/accessibilityContext";

// Verification States
const VERIFY_STATE = {
    LOADING: 'loading',
    ENTER_EMAIL: 'enter_email',
    CODE_SENT: 'code_sent',
    VERIFYING: 'verifying',
    VERIFIED: 'verified',
    ERROR: 'error'
};

// Local storage keys
const ADMIN_EMAIL_KEY = 'vulniq_admin_email';
const CODE_EXPIRY_KEY = 'vulniq_admin_code_expiry';
const SESSION_EXPIRY_KEY = 'vulniq_admin_session_expiry';
const SESSION_DURATION_MS = 30 * 60 * 1000;

function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AdminUsersPage() {
    const { setForceHideFloating, openPanel } = useAccessibility();

    useEffect(() => {
        setForceHideFloating(true);
        return () => setForceHideFloating(false);
    }, [setForceHideFloating]);

    // Verification state
    const [verifyState, setVerifyState] = useState(VERIFY_STATE.LOADING);
    const [verifyError, setVerifyError] = useState(null);
    const [adminEmail, setAdminEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [codeSending, setCodeSending] = useState(false);
    const [codeExpiry, setCodeExpiry] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [sessionExpiry, setSessionExpiry] = useState(null);
    const [sessionCountdown, setSessionCountdown] = useState(0);
    const inputRefs = useRef([]);

    // Main page state
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, warnedUsers: 0, bannedIPs: 0 });
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Dialog states
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
    const [warningReason, setWarningReason] = useState('');
    const [isWarning, setIsWarning] = useState(false);

    const usersPerPage = 15;

    // Code countdown timer
    useEffect(() => {
        if (!codeExpiry) { setCountdown(0); return; }
        const updateCountdown = () => {
            const remaining = Math.max(0, Math.floor((codeExpiry - Date.now()) / 1000));
            setCountdown(remaining);
            if (remaining <= 0) { localStorage.removeItem(CODE_EXPIRY_KEY); setCodeExpiry(null); }
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [codeExpiry]);

    // Session countdown timer
    useEffect(() => {
        if (!sessionExpiry || verifyState !== VERIFY_STATE.VERIFIED) { setSessionCountdown(0); return; }
        const updateSessionCountdown = () => {
            const remaining = Math.max(0, Math.floor((sessionExpiry - Date.now()) / 1000));
            setSessionCountdown(remaining);
            if (remaining <= 0) {
                localStorage.removeItem(SESSION_EXPIRY_KEY);
                localStorage.removeItem(ADMIN_EMAIL_KEY);
                setSessionExpiry(null);
                setAdminEmail('');
                setVerifyState(VERIFY_STATE.ENTER_EMAIL);
                setUsers([]);
            }
        };
        updateSessionCountdown();
        const interval = setInterval(updateSessionCountdown, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiry, verifyState]);

    // Fetch users
    async function fetchUsers(email, page = 1) {
        if (!email) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: usersPerPage.toString(),
                search: searchQuery,
                filter: filterStatus,
            });
            const response = await fetch(`/api/admin/users?${params}`, {
                headers: { 'x-admin-email': email.trim() },
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setStats(data.stats || {});
                setTotalPages(data.totalPages || 1);
                setTotalUsers(data.total || 0);
                setCurrentPage(page);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to fetch users');
            }
        } catch (err) {
            setError('Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    }

    // Check for existing session
    useEffect(() => {
        async function checkExistingSession() {
            const savedEmail = localStorage.getItem(ADMIN_EMAIL_KEY);
            const savedSessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);
            if (savedEmail) {
                try {
                    const response = await fetch('/api/admin/check-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: savedEmail })
                    });
                    const data = await response.json();
                    if (data.valid) {
                        setAdminEmail(savedEmail);
                        setVerifyState(VERIFY_STATE.VERIFIED);
                        localStorage.removeItem(CODE_EXPIRY_KEY);
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
                        fetchUsers(savedEmail, 1);
                        return;
                    }
                } catch (err) {
                    console.error('Failed to check session:', err);
                }
                localStorage.removeItem(ADMIN_EMAIL_KEY);
                localStorage.removeItem(SESSION_EXPIRY_KEY);
            }
            setVerifyState(VERIFY_STATE.ENTER_EMAIL);
        }
        checkExistingSession();
    }, []);

    // Refetch when filter changes
    useEffect(() => {
        if (verifyState === VERIFY_STATE.VERIFIED && adminEmail) {
            fetchUsers(adminEmail, 1);
        }
    }, [filterStatus, searchQuery]);

    // Send verification code
    async function handleSendCode() {
        if (!adminEmail.trim()) { setVerifyError('Please enter your email'); return; }
        setCodeSending(true);
        setVerifyError(null);
        try {
            const response = await fetch('/api/admin/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim() })
            });
            const data = await response.json();
            if (response.ok) {
                const expiryTime = Date.now() + (5 * 60 * 1000);
                setCodeExpiry(expiryTime);
                localStorage.setItem(CODE_EXPIRY_KEY, expiryTime.toString());
                localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail.trim());
                setVerifyState(VERIFY_STATE.CODE_SENT);
                setVerificationCode(['', '', '', '', '', '']);
            } else {
                setVerifyError(data.error || 'Failed to send verification code');
            }
        } catch (err) {
            setVerifyError('Failed to send verification code. Please try again.');
        } finally {
            setCodeSending(false);
        }
    }

    // Verify code
    async function handleVerifyCode() {
        const code = verificationCode.join('');
        if (code.length !== 6) { setVerifyError('Please enter the complete 6-digit code'); return; }
        setVerifyState(VERIFY_STATE.VERIFYING);
        setVerifyError(null);
        try {
            const response = await fetch('/api/admin/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim(), code })
            });
            const data = await response.json();
            if (response.ok && data.valid) {
                const newExpiry = Date.now() + SESSION_DURATION_MS;
                localStorage.setItem(SESSION_EXPIRY_KEY, newExpiry.toString());
                setSessionExpiry(newExpiry);
                localStorage.removeItem(CODE_EXPIRY_KEY);
                setCodeExpiry(null);
                setVerifyState(VERIFY_STATE.VERIFIED);
                fetchUsers(adminEmail, 1);
            } else {
                setVerifyError(data.error || 'Invalid verification code');
                setVerifyState(VERIFY_STATE.CODE_SENT);
            }
        } catch (err) {
            setVerifyError('Failed to verify code. Please try again.');
            setVerifyState(VERIFY_STATE.CODE_SENT);
        }
    }

    function handleCodeInput(index, value) {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...verificationCode];
        newCode[index] = value.slice(-1);
        setVerificationCode(newCode);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }

    function handleCodeKeyDown(index, e) {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'Enter' && verificationCode.join('').length === 6) handleVerifyCode();
    }

    function handleCodePaste(e) {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...verificationCode];
        for (let i = 0; i < pastedData.length; i++) newCode[i] = pastedData[i];
        setVerificationCode(newCode);
        inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }

    function handleLogout() {
        localStorage.removeItem(ADMIN_EMAIL_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);
        localStorage.removeItem(CODE_EXPIRY_KEY);
        setVerifyState(VERIFY_STATE.ENTER_EMAIL);
        setAdminEmail('');
        setVerificationCode(['', '', '', '', '', '']);
        setUsers([]);
        setSessionExpiry(null);
        setCodeExpiry(null);
    }

    // Warning handler
    async function handleWarnUser() {
        if (!selectedUser || !warningReason.trim()) return;
        setIsWarning(true);
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-email': adminEmail.trim(),
                },
                body: JSON.stringify({ action: 'warn', reason: warningReason.trim() }),
            });
            if (response.ok) {
                setSuccessMessage('User warned successfully. They will receive a notification.');
                setIsWarningDialogOpen(false);
                setWarningReason('');
                fetchUsers(adminEmail, currentPage);
                setTimeout(() => setSuccessMessage(null), 4000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to warn user');
            }
        } catch (err) {
            setError('Failed to warn user');
        } finally {
            setIsWarning(false);
        }
    }

    function getUserInitials(user) {
        if (user.name) return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        if (user.email) return user.email.slice(0, 2).toUpperCase();
        return 'U';
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

    // Login/verification UI
    if (verifyState !== VERIFY_STATE.VERIFIED) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-[var(--brand-accent)]/20">
                    <CardHeader className="text-center space-y-3">
                        <div className="mx-auto w-14 h-14 rounded-xl bg-[var(--brand-accent)]/10 flex items-center justify-center">
                            <Shield className="h-7 w-7 text-[var(--brand-accent)]" />
                        </div>
                        <CardTitle className="text-xl">Admin Verification</CardTitle>
                        <CardDescription>
                            {verifyState === VERIFY_STATE.CODE_SENT
                                ? 'Enter the 6-digit code sent to your email'
                                : 'Enter your admin email to receive a verification code'}
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
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleSendCode} disabled={codeSending} className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90">
                                    {codeSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><KeyRound className="mr-2 h-4 w-4" />Send Verification Code</>}
                                </Button>
                            </>
                        )}

                        {verifyState === VERIFY_STATE.CODE_SENT && (
                            <>
                                <div className="flex justify-center gap-2">
                                    {verificationCode.map((digit, index) => (
                                        <Input
                                            key={index}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleCodeInput(index, e.target.value)}
                                            onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                            onPaste={handleCodePaste}
                                            className="w-11 h-11 text-center text-lg font-mono"
                                        />
                                    ))}
                                </div>
                                {countdown > 0 && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        Code expires in <span className="font-mono text-[var(--brand-accent)]">{formatCountdown(countdown)}</span>
                                    </p>
                                )}
                                <Button onClick={handleVerifyCode} disabled={verifyState === VERIFY_STATE.VERIFYING || verificationCode.join('').length !== 6} className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90">
                                    {verifyState === VERIFY_STATE.VERIFYING ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify Code'}
                                </Button>
                                <Button variant="ghost" onClick={() => setVerifyState(VERIFY_STATE.ENTER_EMAIL)} className="w-full">Use different email</Button>
                            </>
                        )}

                        <Separator />
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Shield className="h-4 w-4 text-[var(--brand-accent)] shrink-0" />
                            <p><span className="font-medium text-foreground">Security Notice:</span> Verification codes are only sent to whitelisted admin emails.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main admin users page
    return (
        <ScrollArea className="h-screen">
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Image src="/icon0.svg" alt="VulnIQ" width={28} height={28} className="dark:invert" />
                            <span className="font-semibold hidden sm:inline">VulnIQ</span>
                        </Link>
                        <Badge variant="outline" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-[var(--brand-accent)]/30">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Admin
                        </Badge>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-2">
                        {sessionCountdown > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${sessionCountdown <= 300 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-muted text-muted-foreground'}`}>
                                            <Timer className="h-3 w-3" />
                                            <span className="font-mono">{formatCountdown(sessionCountdown)}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>{sessionCountdown <= 300 ? 'Session expiring soon!' : 'Session time remaining'}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <span className="text-xs text-muted-foreground hidden md:block">{adminEmail}</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={openPanel} className="h-8 w-8">
                                        <PersonStanding className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Accessibility</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={handleLogout} className="h-8 w-8">
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Logout</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container py-6 space-y-6">
                {/* Messages */}
                {successMessage && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                                {error}
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setError(null)}><X className="h-4 w-4" /></Button>
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}

                {/* Page Header & Stats */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-[var(--brand-accent)]/10">
                                <Users className="h-5 w-5 text-[var(--brand-accent)]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                                <p className="text-sm text-muted-foreground">View user profiles and issue warnings</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Card className="flex-1 min-w-[120px]">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10"><Users className="h-4 w-4 text-blue-500" /></div>
                                <div><p className="text-xl font-bold">{stats.totalUsers}</p><p className="text-xs text-muted-foreground">Total</p></div>
                            </CardContent>
                        </Card>
                        <Card className="flex-1 min-w-[120px]">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10"><AlertCircle className="h-4 w-4 text-amber-500" /></div>
                                <div><p className="text-xl font-bold">{stats.warnedUsers}</p><p className="text-xs text-muted-foreground">Warned</p></div>
                            </CardContent>
                        </Card>
                        <Card className="flex-1 min-w-[120px]">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10"><Globe className="h-4 w-4 text-red-500" /></div>
                                <div><p className="text-xl font-bold">{stats.bannedIPs}</p><p className="text-xs text-muted-foreground">Banned IPs</p></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="warned">Warned Users</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={() => fetchUsers(adminEmail, currentPage)}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader className="py-4 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Users</CardTitle>
                            <Badge variant="secondary">{totalUsers} total</Badge>
                        </div>
                    </CardHeader>
                    <ScrollArea className="h-[calc(100vh-420px)] min-h-[400px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Users className="h-12 w-12 mb-3 opacity-30" />
                                <p className="font-medium">No users found</p>
                                <p className="text-sm">Try adjusting your search or filter</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">User</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="text-center">Warnings</TableHead>
                                        <TableHead className="text-center">Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={user.image} />
                                                        <AvatarFallback className="bg-muted text-sm">{getUserInitials(user)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">{user.name || user.firstName || 'Unnamed'}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                    {user.jobTitle && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{user.jobTitle}</span>}
                                                    {user.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{user.company}</span>}
                                                    {user.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{user.location}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {user.warningCount > 0 ? (
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                                        <AlertCircle className="h-3 w-3 mr-1" />{user.warningCount}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedUser(user); setIsProfileOpen(true); }}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>View Profile</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950" onClick={() => { setSelectedUser(user); setWarningReason(''); setIsWarningDialogOpen(true); }}>
                                                                    <AlertTriangle className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Issue Warning</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </ScrollArea>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" className="h-8" onClick={() => fetchUsers(adminEmail, Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" className="h-8" onClick={() => fetchUsers(adminEmail, Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Security Notice */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-muted/30">
                    <ShieldCheck className="h-5 w-5 text-[var(--brand-accent)] shrink-0" />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Security Notice:</span> Your admin session expires after 30 minutes. Warnings are logged and users are notified.
                    </p>
                </div>
            </main>

            {/* User Profile Dialog */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>User Profile</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={selectedUser.image} />
                                    <AvatarFallback className="bg-muted text-lg">{getUserInitials(selectedUser)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold truncate">{selectedUser.name || 'Unnamed User'}</h3>
                                    <p className="text-sm text-muted-foreground truncate">{selectedUser.email}</p>
                                    {selectedUser.warningCount > 0 && (
                                        <Badge variant="outline" className="mt-2 bg-amber-500/10 text-amber-600 border-amber-500/30">
                                            <AlertCircle className="h-3 w-3 mr-1" />{selectedUser.warningCount} warning{selectedUser.warningCount > 1 ? 's' : ''}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {selectedUser.firstName && <div><Label className="text-xs text-muted-foreground">First Name</Label><p className="font-medium">{selectedUser.firstName}</p></div>}
                                {selectedUser.lastName && <div><Label className="text-xs text-muted-foreground">Last Name</Label><p className="font-medium">{selectedUser.lastName}</p></div>}
                                {selectedUser.phone && <div><Label className="text-xs text-muted-foreground">Phone</Label><p className="font-medium">{selectedUser.phone}</p></div>}
                                {selectedUser.jobTitle && <div><Label className="text-xs text-muted-foreground">Job Title</Label><p className="font-medium">{selectedUser.jobTitle}</p></div>}
                                {selectedUser.company && <div><Label className="text-xs text-muted-foreground">Company</Label><p className="font-medium">{selectedUser.company}</p></div>}
                                {selectedUser.location && <div><Label className="text-xs text-muted-foreground">Location</Label><p className="font-medium">{selectedUser.location}</p></div>}
                                <div><Label className="text-xs text-muted-foreground">Joined</Label><p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p></div>
                            </div>
                            {selectedUser.bio && (
                                <>
                                    <Separator />
                                    <div><Label className="text-xs text-muted-foreground">Bio</Label><p className="text-sm mt-1">{selectedUser.bio}</p></div>
                                </>
                            )}
                            {selectedUser.warnings && selectedUser.warnings.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Warning History</Label>
                                        <ScrollArea className="h-[120px]">
                                            <div className="space-y-2">
                                                {selectedUser.warnings.map((warning) => (
                                                    <div key={warning.id} className="p-2 rounded-md bg-amber-500/5 border border-amber-500/20 text-sm">
                                                        <p className="font-medium text-amber-700 dark:text-amber-400">{warning.reason}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">By {warning.warnedBy} • {new Date(warning.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Warning Dialog */}
            <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Issue Warning
                        </DialogTitle>
                        <DialogDescription>
                            Send a warning to this user. They will receive a notification and email.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedUser.image} />
                                    <AvatarFallback>{getUserInitials(selectedUser)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{selectedUser.name || 'Unnamed User'}</p>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="warning-reason">Warning Reason</Label>
                                <Textarea
                                    id="warning-reason"
                                    value={warningReason}
                                    onChange={(e) => setWarningReason(e.target.value)}
                                    placeholder="Explain why this user is being warned..."
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWarningDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleWarnUser} disabled={isWarning || !warningReason.trim()} className="bg-amber-500 hover:bg-amber-600 text-white">
                            {isWarning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Warning'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </ScrollArea>
    );
}

