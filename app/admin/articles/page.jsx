'use client'

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeToggle } from "@/components/theme-toggle";
import {
    Shield,
    ShieldCheck,
    Loader2,
    Eye,
    AlertTriangle,
    CheckCircle2,
    X,
    Mail,
    KeyRound,
    Timer,
    LogOut,
    FileText,
    Clock,
    Check,
    XCircle,
    ChevronLeft,
    Filter,
    Search,
    Zap,
    Lock,
    Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

// Session duration in milliseconds (30 minutes)
const SESSION_DURATION_MS = 30 * 60 * 1000;

// Format seconds to MM:SS
function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Icon component for articles
function ArticleIcon({ iconName, className }) {
    switch (iconName) {
        case 'AlertTriangle':
            return <AlertTriangle className={className} />;
        case 'Shield':
            return <Shield className={className} />;
        case 'Code':
            return <Code className={className} />;
        case 'Zap':
            return <Zap className={className} />;
        case 'Lock':
            return <Lock className={className} />;
        default:
            return <Shield className={className} />;
    }
}

// Status badge component
function StatusBadge({ status }) {
    const statusConfig = {
        DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
        PENDING_REVIEW: { label: "Pending", variant: "warning", icon: Clock },
        APPROVED: { label: "Published", variant: "success", icon: CheckCircle2 },
        REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="gap-1">
            <Icon className="w-3 h-3" />
            {config.label}
        </Badge>
    );
}

// Markdown preview component
function MarkdownPreview({ content }) {
    const components = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
                <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ margin: 0, padding: "1rem", background: "#1e1e1e", borderRadius: "0.5rem" }}
                    {...props}
                >
                    {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
            ) : (
                <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm" {...props}>
                    {children}
                </code>
            );
        },
        h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
        p: ({ children }) => <p className="text-muted-foreground leading-7 mb-4">{children}</p>,
        ul: ({ children }) => <ul className="my-4 ml-6 list-disc space-y-2">{children}</ul>,
        ol: ({ children }) => <ol className="my-4 ml-6 list-decimal space-y-2">{children}</ol>,
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
                {children}
            </blockquote>
        ),
    };

    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
        </ReactMarkdown>
    );
}

export default function AdminArticlesPage() {
    const { setForceHideFloating } = useAccessibility();

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
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectFeedback, setRejectFeedback] = useState('');
    const [approveFeedback, setApproveFeedback] = useState('');
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
    const [searchQuery, setSearchQuery] = useState('');

    // Code countdown timer effect
    useEffect(() => {
        if (!codeExpiry) {
            setCountdown(0);
            return;
        }

        const updateCountdown = () => {
            const remaining = Math.max(0, Math.floor((codeExpiry - Date.now()) / 1000));
            setCountdown(remaining);

            if (remaining <= 0) {
                localStorage.removeItem(CODE_EXPIRY_KEY);
                setCodeExpiry(null);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [codeExpiry]);

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
                localStorage.removeItem(SESSION_EXPIRY_KEY);
                localStorage.removeItem(ADMIN_EMAIL_KEY);
                setSessionExpiry(null);
                setAdminEmail('');
                setVerifyState(VERIFY_STATE.ENTER_EMAIL);
                setArticles([]);
            }
        };

        updateSessionCountdown();
        const interval = setInterval(updateSessionCountdown, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiry, verifyState]);

    // Check for existing session on mount
    useEffect(() => {
        async function checkExistingSession() {
            const savedEmail = localStorage.getItem(ADMIN_EMAIL_KEY);
            const savedCodeExpiry = localStorage.getItem(CODE_EXPIRY_KEY);
            const savedSessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);

            if (savedEmail) {
                setAdminEmail(savedEmail);
                try {
                    const response = await fetch('/api/admin/check-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: savedEmail })
                    });
                    const data = await response.json();
                    if (data.valid) {
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
                        fetchArticles(savedEmail);
                        return;
                    }
                } catch (err) {
                    console.error('Failed to check session:', err);
                }

                if (savedCodeExpiry) {
                    const expiryTime = parseInt(savedCodeExpiry, 10);
                    if (Date.now() < expiryTime) {
                        setCodeExpiry(expiryTime);
                        setVerifyState(VERIFY_STATE.CODE_SENT);
                        setTimeout(() => inputRefs.current[0]?.focus(), 100);
                        return;
                    } else {
                        localStorage.removeItem(CODE_EXPIRY_KEY);
                    }
                }
            }
            setVerifyState(VERIFY_STATE.ENTER_EMAIL);
        }
        checkExistingSession();
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
                localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail.trim());
                const expiryTime = Date.now() + (data.expiresIn * 1000);
                localStorage.setItem(CODE_EXPIRY_KEY, expiryTime.toString());
                setVerifyState(VERIFY_STATE.CODE_SENT);
                setCodeExpiry(expiryTime);
                setVerificationCode(['', '', '', '', '', '']);
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
        if (!/^\d*$/.test(value)) return;

        const newCode = [...verificationCode];
        newCode[index] = value.slice(-1);
        setVerificationCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newCode.every(d => d !== '') && newCode.join('').length === 6) {
            verifyCode(newCode.join(''));
        }
    }

    function handleKeyDown(index, e) {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter' && verificationCode.every(d => d !== '')) {
            verifyCode(verificationCode.join(''));
        }
    }

    function handlePaste(e) {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setVerificationCode(newCode);
            verifyCode(pastedData);
        }
    }

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
                localStorage.removeItem(CODE_EXPIRY_KEY);
                setCodeExpiry(null);
                const sessionExpiryTime = Date.now() + SESSION_DURATION_MS;
                localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
                setSessionExpiry(sessionExpiryTime);
                setVerifyState(VERIFY_STATE.VERIFIED);
                fetchArticles(adminEmail.trim());
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

    function handleLogout() {
        localStorage.removeItem(ADMIN_EMAIL_KEY);
        localStorage.removeItem(CODE_EXPIRY_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);
        setAdminEmail('');
        setCodeExpiry(null);
        setSessionExpiry(null);
        setVerifyState(VERIFY_STATE.ENTER_EMAIL);
        setVerificationCode(['', '', '', '', '', '']);
        setArticles([]);
    }

    async function fetchArticles(email) {
        try {
            const response = await fetch(`/api/admin/articles?email=${encodeURIComponent(email)}&status=${statusFilter}`);
            if (response.ok) {
                const data = await response.json();
                setArticles(data || []);
            } else {
                setError('Failed to fetch articles');
            }
        } catch (err) {
            setError('Failed to load articles');
        }
    }

    // Re-fetch when status filter changes
    useEffect(() => {
        if (verifyState === VERIFY_STATE.VERIFIED && adminEmail) {
            fetchArticles(adminEmail);
        }
    }, [statusFilter, verifyState, adminEmail]);

    async function handleApprove() {
        if (!selectedArticle) return;

        setIsApproving(true);
        try {
            const response = await fetch(`/api/admin/articles/${selectedArticle.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminEmail: adminEmail.trim(),
                    feedback: approveFeedback || 'Your article has been approved and published!'
                })
            });

            if (response.ok) {
                setSuccessMessage('Article approved and published!');
                setApproveDialogOpen(false);
                setSelectedArticle(null);
                setApproveFeedback('');
                fetchArticles(adminEmail);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to approve article');
            }
        } catch (err) {
            setError('Failed to approve article');
        } finally {
            setIsApproving(false);
        }
    }

    async function handleReject() {
        if (!selectedArticle || !rejectFeedback.trim()) {
            setError('Please provide feedback for rejection');
            return;
        }

        setIsRejecting(true);
        try {
            const response = await fetch(`/api/admin/articles/${selectedArticle.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminEmail: adminEmail.trim(),
                    feedback: rejectFeedback
                })
            });

            if (response.ok) {
                setSuccessMessage('Article rejected with feedback');
                setRejectDialogOpen(false);
                setSelectedArticle(null);
                setRejectFeedback('');
                fetchArticles(adminEmail);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to reject article');
            }
        } catch (err) {
            setError('Failed to reject article');
        } finally {
            setIsRejecting(false);
        }
    }

    // Filter articles by search query
    const filteredArticles = articles.filter(article => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            article.title?.toLowerCase().includes(query) ||
            article.authorName?.toLowerCase().includes(query) ||
            article.authorEmail?.toLowerCase().includes(query) ||
            article.category?.toLowerCase().includes(query)
        );
    });

    // Loading state
    if (verifyState === VERIFY_STATE.LOADING) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Verification screens
    if (verifyState !== VERIFY_STATE.VERIFIED) {
        return (
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="border-b border-border/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2">
                                <Shield className="w-8 h-8 text-primary" />
                                <span className="text-xl font-bold">VulnIQ</span>
                            </Link>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <main className="max-w-md mx-auto px-4 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card>
                            <CardHeader className="text-center">
                                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle>Admin Article Review</CardTitle>
                                <CardDescription>
                                    {verifyState === VERIFY_STATE.ENTER_EMAIL
                                        ? 'Enter your admin email to receive a verification code'
                                        : 'Enter the 6-digit code sent to your email'}
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
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="admin@example.com"
                                                    value={adminEmail}
                                                    onChange={(e) => setAdminEmail(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && sendVerificationCode()}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={sendVerificationCode}
                                            disabled={codeSending}
                                        >
                                            {codeSending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <KeyRound className="w-4 h-4 mr-2" />
                                                    Send Verification Code
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}

                                {(verifyState === VERIFY_STATE.CODE_SENT || verifyState === VERIFY_STATE.VERIFYING) && (
                                    <>
                                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                                            <Mail className="w-4 h-4" />
                                            <span>Code sent to {adminEmail}</span>
                                        </div>

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
                                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                                    onPaste={handlePaste}
                                                    disabled={verifyState === VERIFY_STATE.VERIFYING}
                                                    className="w-12 h-12 text-center text-xl font-mono"
                                                />
                                            ))}
                                        </div>

                                        {countdown > 0 && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                                <Timer className="w-4 h-4" />
                                                <span>Code expires in {formatCountdown(countdown)}</span>
                                            </div>
                                        )}

                                        {verifyState === VERIFY_STATE.VERIFYING && (
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Verifying...</span>
                                            </div>
                                        )}

                                        <Button
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() => {
                                                setVerifyState(VERIFY_STATE.ENTER_EMAIL);
                                                setVerificationCode(['', '', '', '', '', '']);
                                                localStorage.removeItem(CODE_EXPIRY_KEY);
                                            }}
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            Use different email
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </main>
            </div>
        );
    }

    // Main admin page (verified)
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-2">
                                <Shield className="w-8 h-8 text-primary" />
                                <span className="text-xl font-bold">VulnIQ</span>
                            </Link>
                            <Separator orientation="vertical" className="h-6" />
                            <span className="text-sm text-muted-foreground">Article Review Admin</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Timer className="w-4 h-4" />
                                <span>Session: {formatCountdown(sessionCountdown)}</span>
                            </div>
                            <ThemeToggle />
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Messages */}
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setError(null)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </Alert>
                )}

                {successMessage && (
                    <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by title, author, or category..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                    <SelectItem value="all">All Articles</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Articles Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Submitted Articles</CardTitle>
                        <CardDescription>
                            Review and approve user-submitted articles for the blog
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredArticles.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                                <p className="mt-4 text-muted-foreground">No articles found</p>
                            </div>
                        ) : (
                            <ScrollArea className="w-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Article</TableHead>
                                            <TableHead>Author</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Submitted</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredArticles.map((article) => (
                                            <TableRow key={article.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <ArticleIcon iconName={article.iconName} className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{article.title}</p>
                                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                {article.excerpt}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{article.authorName}</p>
                                                        <p className="text-xs text-muted-foreground">{article.authorEmail}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{article.category}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={article.status} />
                                                </TableCell>
                                                <TableCell>
                                                    {article.submittedAt
                                                        ? new Date(article.submittedAt).toLocaleDateString()
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedArticle(article);
                                                                setIsPreviewOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Preview
                                                        </Button>
                                                        {article.status === 'PENDING_REVIEW' && (
                                                            <>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedArticle(article);
                                                                        setApproveDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Check className="w-4 h-4 mr-1" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedArticle(article);
                                                                        setRejectDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{selectedArticle?.title}</DialogTitle>
                        <DialogDescription>
                            By {selectedArticle?.authorName} • {selectedArticle?.category}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 -mx-6 px-6">
                        <div className="space-y-4 pb-4">
                            {selectedArticle?.excerpt && (
                                <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4">
                                    {selectedArticle.excerpt}
                                </p>
                            )}
                            {selectedArticle?.content && (
                                <MarkdownPreview content={selectedArticle.content} />
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Close
                        </Button>
                        {selectedArticle?.status === 'PENDING_REVIEW' && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setIsPreviewOpen(false);
                                        setRejectDialogOpen(true);
                                    }}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsPreviewOpen(false);
                                        setApproveDialogOpen(true);
                                    }}
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Article</DialogTitle>
                        <DialogDescription>
                            This will publish the article to the blog and notify the author.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="approve-feedback">Feedback (optional)</Label>
                            <Textarea
                                id="approve-feedback"
                                value={approveFeedback}
                                onChange={(e) => setApproveFeedback(e.target.value)}
                                placeholder="Add a congratulatory message or suggestions for the author..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} disabled={isApproving}>
                            {isApproving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Approve & Publish
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Article</DialogTitle>
                        <DialogDescription>
                            Please provide feedback explaining why the article needs revision.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reject-feedback">Feedback (required)</Label>
                            <Textarea
                                id="reject-feedback"
                                value={rejectFeedback}
                                onChange={(e) => setRejectFeedback(e.target.value)}
                                placeholder="Explain what needs to be improved or changed..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isRejecting || !rejectFeedback.trim()}
                        >
                            {isRejecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Rejecting...
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject with Feedback
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

