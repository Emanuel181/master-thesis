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
    Plus,
    Trash2,
    Save,
    Eye,
    Users,
    Star,
    Heart,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    X,
    Mail,
    KeyRound,
    Timer,
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";

// Verification States
const VERIFY_STATE = {
    ENTER_EMAIL: 'enter_email',
    CODE_SENT: 'code_sent',
    VERIFYING: 'verifying',
    VERIFIED: 'verified',
    ERROR: 'error'
};

// Local storage key for admin email (for convenience, not security)
const ADMIN_EMAIL_KEY = 'vulniq_admin_email';

export default function AdminSupportersPage() {
    // Verification state
    const [verifyState, setVerifyState] = useState(VERIFY_STATE.ENTER_EMAIL);
    const [verifyError, setVerifyError] = useState(null);
    const [adminEmail, setAdminEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [codeSending, setCodeSending] = useState(false);
    const [codeExpiry, setCodeExpiry] = useState(null);
    const inputRefs = useRef([]);

    // Main page state
    const [supporters, setSupporters] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editingSupporter, setEditingSupporter] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);

    // Load saved email on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem(ADMIN_EMAIL_KEY);
        if (savedEmail) {
            setAdminEmail(savedEmail);
        }
    }, []);

    // Send verification code
    async function sendVerificationCode() {
        if (!adminEmail.trim()) {
            setVerifyError('Please enter your admin email address');
            return;
        }

        setCodeSending(true);
        setVerifyError(null);

        try {
            const response = await fetch('/api/admin/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim() })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Save email for convenience
                localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail.trim());
                setVerifyState(VERIFY_STATE.CODE_SENT);
                setCodeExpiry(Date.now() + (data.expiresIn * 1000));
                setVerificationCode(['', '', '', '', '', '']);
                // Focus first input
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            } else {
                setVerifyError(data.error || 'Failed to send code');
            }
        } catch (err) {
            setVerifyError('Failed to send verification code');
        } finally {
            setCodeSending(false);
        }
    }

    // Handle code input
    function handleCodeInput(index, value) {
        if (!/^\d*$/.test(value)) return; // Only digits

        const newCode = [...verificationCode];
        newCode[index] = value.slice(-1); // Only last digit
        setVerificationCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits entered
        if (newCode.every(d => d !== '') && newCode.join('').length === 6) {
            verifyCode(newCode.join(''));
        }
    }

    // Handle backspace
    function handleKeyDown(index, e) {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter' && verificationCode.every(d => d !== '')) {
            verifyCode(verificationCode.join(''));
        }
    }

    // Handle paste
    function handlePaste(e) {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setVerificationCode(newCode);
            verifyCode(pastedData);
        }
    }

    // Verify the code
    async function verifyCode(code) {
        setVerifyState(VERIFY_STATE.VERIFYING);
        setVerifyError(null);

        try {
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim(), code })
            });

            const data = await response.json();

            if (data.verified) {
                setVerifyState(VERIFY_STATE.VERIFIED);
                fetchSupporters();
            } else {
                setVerifyState(VERIFY_STATE.CODE_SENT);
                setVerifyError(data.error || 'Invalid code');
                setVerificationCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setVerifyState(VERIFY_STATE.CODE_SENT);
            setVerifyError('Verification failed');
        }
    }

    // Logout admin session
    function handleLogout() {
        localStorage.removeItem(ADMIN_EMAIL_KEY);
        setAdminEmail('');
        setVerifyState(VERIFY_STATE.ENTER_EMAIL);
        setVerificationCode(['', '', '', '', '', '']);
        setSupporters([]);
    }

    // Fetch supporters
    async function fetchSupporters() {
        try {
            const response = await fetch('/api/admin/supporters');
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

    // Handle save (create/update)
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

    // Handle delete
    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this supporter?')) return;

        setIsDeleting(id);
        setError(null);

        try {
            const response = await fetch(`/api/admin/supporters/${id}`, {
                method: 'DELETE'
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

    // Verification screen (email entry and OTP)
    if (verifyState !== VERIFY_STATE.VERIFIED) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                {/* Background effects */}
                <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-50" />
                <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative z-10"
                >
                    <Card className="border-border shadow-xl">
                        <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b text-center pb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mx-auto mb-4">
                                <Shield className="w-8 h-8 text-amber-500" />
                            </div>
                            <CardTitle className="text-xl">Admin Access</CardTitle>
                            <CardDescription>
                                Enter your admin email to receive a verification code
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {/* Email Entry */}
                            {verifyState === VERIFY_STATE.ENTER_EMAIL && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="admin-email">Admin Email</Label>
                                        <Input
                                            id="admin-email"
                                            type="email"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendVerificationCode()}
                                            placeholder="admin@example.com"
                                            autoFocus
                                        />
                                    </div>

                                    {verifyError && (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>{verifyError}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        onClick={sendVerificationCode}
                                        disabled={codeSending || !adminEmail.trim()}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {codeSending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending Code...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send Verification Code
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}

                            {/* OTP Entry */}
                            {(verifyState === VERIFY_STATE.CODE_SENT || verifyState === VERIFY_STATE.VERIFYING) && (
                                <>
                                    <div className="text-center space-y-2">
                                        <KeyRound className="w-12 h-12 text-amber-500 mx-auto" />
                                        <p className="text-sm text-muted-foreground">
                                            Enter the 6-digit code sent to
                                        </p>
                                        <p className="font-medium">{adminEmail}</p>
                                    </div>

                                    {verifyError && (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>{verifyError}</AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Code input */}
                                    <div className="flex justify-center gap-2" onPaste={handlePaste}>
                                        {verificationCode.map((digit, index) => (
                                            <Input
                                                key={index}
                                                ref={el => inputRefs.current[index] = el}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleCodeInput(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                disabled={verifyState === VERIFY_STATE.VERIFYING}
                                                className="w-12 h-14 text-center text-2xl font-bold p-0"
                                            />
                                        ))}
                                    </div>

                                    {verifyState === VERIFY_STATE.VERIFYING && (
                                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Verifying...
                                        </div>
                                    )}

                                    {codeExpiry && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <Timer className="h-3 w-3" />
                                            Code expires in 5 minutes
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={sendVerificationCode}
                                            disabled={codeSending || verifyState === VERIFY_STATE.VERIFYING}
                                            className="w-full"
                                        >
                                            {codeSending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Mail className="mr-2 h-4 w-4" />
                                            )}
                                            Resend Code
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setVerifyState(VERIFY_STATE.ENTER_EMAIL);
                                                setVerifyError(null);
                                            }}
                                            className="w-full"
                                        >
                                            Use different email
                                        </Button>
                                    </div>
                                </>
                            )}

                            <div className="text-center">
                                <Link
                                    href="/"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ← Back to Home
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Main admin page (verified)
    const tierConfig = {
        sponsor: { icon: Star, label: 'Sponsor', variant: 'default' },
        contributor: { icon: Sparkles, label: 'Contributor', variant: 'secondary' },
        supporter: { icon: Heart, label: 'Supporter', variant: 'outline' }
    };

    return (
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
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Admin
                        </Badge>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground hidden md:block">{adminEmail}</span>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/supporters">
                                <Eye className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">View Public</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">Logout</span>
                        </Button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container py-6 space-y-6">
                {/* Success/Error Messages */}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Alert className="bg-green-500/10 border-green-500/30 text-green-600">
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
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">Manage Supporters</h1>
                        <p className="text-sm text-muted-foreground">
                            Add, edit, or remove project supporters
                        </p>
                    </div>
                    <Button onClick={() => { setEditingSupporter(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Supporter
                    </Button>
                </div>

                {/* Supporters Table */}
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Supporter</TableHead>
                                <TableHead className="hidden sm:table-cell">Occupation</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead className="hidden sm:table-cell">Featured</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {supporters.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Users className="h-8 w-8 opacity-50" />
                                            <p className="text-sm">No supporters yet</p>
                                            <p className="text-xs">Add your first supporter to get started</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                supporters.map((supporter) => {
                                    const tier = tierConfig[supporter.tier] || tierConfig.supporter;
                                    const TierIcon = tier.icon;
                                    return (
                                        <TableRow key={supporter.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {supporter.avatarUrl ? (
                                                        <Image
                                                            src={supporter.avatarUrl}
                                                            alt={supporter.name}
                                                            width={40}
                                                            height={40}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                            <span className="text-sm font-medium">
                                                                {supporter.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="space-y-0.5">
                                                        <p className="font-medium leading-none">{supporter.name}</p>
                                                        <p className="text-xs text-muted-foreground">{supporter.company}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                                                {supporter.occupation}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tier.variant} className="gap-1">
                                                    <TierIcon className="h-3 w-3" />
                                                    <span className="hidden sm:inline">{tier.label}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {supporter.featured && (
                                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => { setEditingSupporter(supporter); setIsModalOpen(true); }}
                                                    >
                                                        Edit
                                                    </Button>
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
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Info box */}
                <Alert>
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                        <span className="font-medium">Security Notice:</span>{' '}
                        Your admin session expires after 30 minutes. All changes are applied immediately.
                    </AlertDescription>
                </Alert>
            </main>

            {/* Modal */}
            <SupporterModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                supporter={editingSupporter}
                onSave={handleSave}
                isSaving={isSaving}
            />
        </div>
    );
}

// Supporter Form Modal using Shadcn Dialog
function SupporterModal({ open, onOpenChange, supporter, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        name: '',
        avatarUrl: '',
        occupation: '',
        company: '',
        contributionBio: '',
        personalBio: '',
        linkedinUrl: '',
        websiteUrl: '',
        tier: 'supporter',
        featured: false,
        order: 0,
    });

    // Reset form when supporter changes
    useEffect(() => {
        if (supporter) {
            setFormData({
                name: supporter.name || '',
                avatarUrl: supporter.avatarUrl || '',
                occupation: supporter.occupation || '',
                company: supporter.company || '',
                contributionBio: supporter.contributionBio || '',
                personalBio: supporter.personalBio || '',
                linkedinUrl: supporter.linkedinUrl || '',
                websiteUrl: supporter.websiteUrl || '',
                tier: supporter.tier || 'supporter',
                featured: supporter.featured || false,
                order: supporter.order || 0,
            });
        } else {
            setFormData({
                name: '',
                avatarUrl: '',
                occupation: '',
                company: '',
                contributionBio: '',
                personalBio: '',
                linkedinUrl: '',
                websiteUrl: '',
                tier: 'supporter',
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {supporter ? 'Edit Supporter' : 'Add New Supporter'}
                    </DialogTitle>
                    <DialogDescription>
                        {supporter
                            ? 'Update the supporter information below.'
                            : 'Fill in the details to add a new supporter.'}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    <form id="supporter-form" onSubmit={handleSubmit} className="space-y-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="avatarUrl">Avatar URL</Label>
                                <Input
                                    id="avatarUrl"
                                    type="url"
                                    value={formData.avatarUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="occupation">Occupation *</Label>
                                <Input
                                    id="occupation"
                                    required
                                    value={formData.occupation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                                    placeholder="Software Engineer"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    value={formData.company}
                                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                    placeholder="Acme Inc."
                                />
                            </div>
                        </div>

                        {/* Bios */}
                        <div className="space-y-2">
                            <Label htmlFor="contributionBio">Contribution *</Label>
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

                        {/* Links */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                                <Input
                                    id="linkedinUrl"
                                    type="url"
                                    value={formData.linkedinUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="websiteUrl">Website URL</Label>
                                <Input
                                    id="websiteUrl"
                                    type="url"
                                    value={formData.websiteUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>

                        {/* Tier & Options */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tier">Tier *</Label>
                                <Select
                                    value={formData.tier}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value }))}
                                >
                                    <SelectTrigger id="tier">
                                        <SelectValue placeholder="Select tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sponsor">Sponsor</SelectItem>
                                        <SelectItem value="contributor">Contributor</SelectItem>
                                        <SelectItem value="supporter">Supporter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order">Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    min="0"
                                    value={formData.order}
                                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Options</Label>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox
                                        id="featured"
                                        checked={formData.featured}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                                    />
                                    <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                                        Featured
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </form>
                </ScrollArea>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="supporter-form" disabled={isSaving}>
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
