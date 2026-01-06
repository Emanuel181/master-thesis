'use client'

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminNav } from "@/components/admin/admin-nav";
import {
    Shield,
    ShieldCheck,
    Loader2,
    Eye,
    EyeOff,
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
    ChevronRight,
    Filter,
    Search,
    Zap,
    Lock,
    Code,
    User,
    Calendar,
    Pencil,
    Save,
    Image as ImageIcon,
    Palette,
    Maximize2,
    Bug,
    Key,
    Server,
    Database,
    Globe,
    Wifi,
    Terminal,
    FileCode,
    GitBranch,
    Cloud,
    Cpu,
    HardDrive,
    MoreVertical,
    Trash2,
    PersonStanding,
    Star,
    RefreshCw,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAccessibility } from "@/contexts/accessibilityContext";
import { FullscreenEditor } from "@/components/dashboard/article-editor/fullscreen-editor";

// Predefined gradients
const PRESET_GRADIENTS = [
  { name: "Security Red", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(0,70%,35%), hsl(20,80%,30%), hsl(350,60%,35%), hsl(10,70%,20%))" },
  { name: "Ocean Teal", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(180,70%,25%), hsl(200,80%,30%), hsl(170,60%,35%), hsl(190,70%,20%))" },
  { name: "Purple Haze", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(270,70%,35%), hsl(290,80%,30%), hsl(260,60%,40%), hsl(280,70%,25%))" },
  { name: "Emerald", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(140,70%,30%), hsl(160,80%,25%), hsl(130,60%,35%), hsl(150,70%,20%))" },
  { name: "Amber Glow", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(40,80%,45%), hsl(30,90%,40%), hsl(45,70%,50%), hsl(35,85%,35%))" },
  { name: "Sunset", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(15,80%,50%), hsl(30,90%,45%), hsl(350,70%,45%), hsl(10,85%,40%))" },
  { name: "Deep Blue", value: "linear-gradient(45deg, hsl(220,70%,15%), hsl(230,80%,35%), hsl(240,70%,30%), hsl(225,75%,40%), hsl(235,80%,25%))" },
  { name: "Cyber", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(180,100%,35%), hsl(200,90%,30%), hsl(160,80%,40%), hsl(190,95%,25%))" },
];

// Categories
const CATEGORIES = [
  "Vulnerability Analysis", "Security Testing", "Web Security", "DevSecOps",
  "Cloud Security", "API Security", "Mobile Security", "General",
];

// Available icons
const AVAILABLE_ICONS = [
  "Shield", "Code", "Zap", "Lock", "AlertTriangle", "Bug", "Eye", "Key",
  "Server", "Database", "Globe", "Wifi", "Terminal", "FileCode", "GitBranch", "Cloud",
  "Cpu", "HardDrive",
];

// Icon colors
const ICON_COLORS = [
  { name: "White", value: "white" },
  { name: "Black", value: "black" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#eab308" },
  { name: "Lime", value: "#84cc16" },
  { name: "Green", value: "#22c55e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
];

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

// Icon component for articles
function ArticleIcon({ iconName, className, style }) {
    const icons = {
        Shield,
        Code,
        Zap,
        Lock,
        AlertTriangle,
        Bug,
        Eye,
        Key,
        Server,
        Database,
        Globe,
        Wifi,
        Terminal,
        FileCode,
        GitBranch,
        Cloud,
        Cpu,
        HardDrive,
    };

    const IconComponent = icons[iconName] || Shield;
    return <IconComponent className={className} style={style} />;
}

// Status badge component
function StatusBadge({ status }) {
    const statusConfig = {
        DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
        PENDING_REVIEW: { label: "Pending", variant: "warning", icon: Clock },
        IN_REVIEW: { label: "In Review", variant: "info", icon: Eye },
        PUBLISHED: { label: "Published", variant: "success", icon: CheckCircle2 },
        APPROVED: { label: "Published", variant: "success", icon: CheckCircle2 }, // Legacy support
        REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
        SCHEDULED_FOR_DELETION: { label: "Pending Deletion", variant: "destructive", icon: Trash2 },
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

// Strip HTML tags for plain text preview
function stripHtmlTags(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// HTML Content preview component (for TipTap HTML content)
function HTMLContentPreview({ content }) {
    if (!content) return null;

    // Sanitize HTML to prevent XSS attacks
    const sanitizedContent = typeof window !== 'undefined'
        ? DOMPurify.sanitize(content, {
            ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li',
                          'strong', 'em', 'u', 's', 'a', 'img', 'blockquote', 'pre', 'code',
                          'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel']
          })
        : content;

    return (
        <div
            className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
                prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
                prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2
                prose-p:leading-7 prose-p:mb-4
                prose-ul:my-4 prose-ul:ml-6 prose-ol:my-4 prose-ol:ml-6
                prose-li:my-1
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:bg-muted prose-code:font-mono prose-code:text-sm
                prose-pre:bg-zinc-900 prose-pre:rounded-lg prose-pre:p-4
                prose-img:rounded-lg prose-img:my-4"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
}

// Markdown preview component (for markdown content)
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
    const { setForceHideFloating, openPanel } = useAccessibility();

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
    const passwordRef = useRef(null);
    const deviceNameRef = useRef(null);

    // Main page state
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [isArticlePreviewOpen, setIsArticlePreviewOpen] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSchedulingDeletion, setIsSchedulingDeletion] = useState(false);
    const [rejectFeedback, setRejectFeedback] = useState('');
    const [approveFeedback, setApproveFeedback] = useState('');
    const [deleteFeedback, setDeleteFeedback] = useState('');
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [scheduleDeleteDialogOpen, setScheduleDeleteDialogOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
    const [searchQuery, setSearchQuery] = useState('');

    // Edit article state
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedArticle, setEditedArticle] = useState(null);
    const [isSavingArticle, setIsSavingArticle] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isFullscreenEditorOpen, setIsFullscreenEditorOpen] = useState(false);

    // Memoize custom headers for fullscreen editor to prevent unnecessary re-renders
    const editorCustomHeaders = useMemo(() => ({}), []);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalArticles, setTotalArticles] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const articlesPerPage = 10;

    // Featured articles state
    const [featuredArticles, setFeaturedArticles] = useState([]);
    const [mainFeaturedArticle, setMainFeaturedArticle] = useState(null);
    const [isFeaturedLoading, setIsFeaturedLoading] = useState(false);
    const [isFeaturedSectionOpen, setIsFeaturedSectionOpen] = useState(false);
    const [updatingFeatured, setUpdatingFeatured] = useState(null);

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
            try {
                // Check session using HTTP-only cookie (server is source of truth)
                const response = await fetch('/api/admin/check-session', {
                    method: 'GET',
                    credentials: 'include' // Include cookies
                });
                const data = await response.json();
                
                if (data.valid && data.email) {
                    // Use email from server session (not localStorage)
                    setAdminEmail(data.email);
                    setIsMasterAdmin(data.isMasterAdmin || false);
                    setVerifyState(VERIFY_STATE.VERIFIED);
                    
                    // Use server-provided expiry or calculate from now
                    const sessionExpiryTime = data.expiresAt || (Date.now() + SESSION_DURATION_MS);
                    localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
                    localStorage.setItem(ADMIN_EMAIL_KEY, data.email); // For UI only
                    setSessionExpiry(sessionExpiryTime);
                    fetchArticles(data.email, 1);
                    return;
                } else {
                    // Session invalid, clear stored data
                    localStorage.removeItem(ADMIN_EMAIL_KEY);
                    localStorage.removeItem(SESSION_EXPIRY_KEY);
                }
            } catch (err) {
                console.error('Failed to check session:', err);
                // On error, clear stored data
                localStorage.removeItem(ADMIN_EMAIL_KEY);
                localStorage.removeItem(SESSION_EXPIRY_KEY);
            }
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
                fetchArticles(adminEmail.trim(), 1);
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
                fetchArticles(adminEmail.trim(), 1);
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
                credentials: 'include', // Include cookies
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

            // Success! Session is granted via HTTP-only cookie
            // Use email from server response (source of truth)
            const verifiedEmail = verifyData.email || adminEmail.trim();
            localStorage.setItem(ADMIN_EMAIL_KEY, verifiedEmail); // UI only
            const sessionExpiryTime = Date.now() + SESSION_DURATION_MS;
            localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
            setAdminEmail(verifiedEmail);
            setSessionExpiry(sessionExpiryTime);
            setVerifyState(VERIFY_STATE.VERIFIED);
            fetchArticles(verifiedEmail, 1);

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
                credentials: 'include', // Include cookies
                body: JSON.stringify({
                    email: adminEmail.trim(),
                    response: credential
                })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
                throw new Error(verifyData.error || 'Failed to authenticate with passkey');
            }

            // Success! Session is granted via HTTP-only cookie
            // Use email from server response (source of truth)
            const verifiedEmail = verifyData.email || adminEmail.trim();
            localStorage.setItem(ADMIN_EMAIL_KEY, verifiedEmail); // UI only
            const sessionExpiryTime = Date.now() + SESSION_DURATION_MS;
            localStorage.setItem(SESSION_EXPIRY_KEY, sessionExpiryTime.toString());
            setAdminEmail(verifiedEmail);
            setSessionExpiry(sessionExpiryTime);
            setVerifyState(VERIFY_STATE.VERIFIED);
            fetchArticles(verifiedEmail, 1);

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
            // Invalidate session on server and clear HTTP-only cookie
            await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error('Logout error:', err);
        }
        
        // Clear local state regardless of API result
        localStorage.removeItem(ADMIN_EMAIL_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);
        setAdminEmail('');
        setPassword('');
        setSessionExpiry(null);
        setVerifyState(VERIFY_STATE.ENTER_EMAIL);
        setArticles([]);
    }

    async function fetchArticles(email, page = 1) {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') {
                params.set('status', statusFilter);
            }
            params.set('page', page.toString());
            params.set('limit', articlesPerPage.toString());
            if (searchQuery) {
                params.set('search', searchQuery);
            }

            const response = await fetch(`/api/admin/articles?${params.toString()}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setArticles(data.articles || []);
                setTotalPages(data.totalPages || 1);
                setTotalArticles(data.total || 0);
                setCurrentPage(page);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.error || 'Failed to fetch articles');
                setArticles([]);
            }
        } catch (err) {
            setError('Failed to load articles');
            setArticles([]);
        } finally {
            setIsLoading(false);
        }
    }

    // Re-fetch when status filter or page changes
    useEffect(() => {
        if (verifyState === VERIFY_STATE.VERIFIED && adminEmail) {
            fetchArticles(adminEmail, currentPage);
        }
    }, [statusFilter, verifyState, adminEmail, currentPage, searchQuery]);

    // Fetch featured articles
    async function fetchFeaturedArticles(email) {
        setIsFeaturedLoading(true);
        try {
            const response = await fetch('/api/admin/articles/featured', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setFeaturedArticles(data.articles || []);
                setMainFeaturedArticle(data.mainFeatured);
            }
        } catch (err) {
            console.error('Failed to fetch featured articles:', err);
        } finally {
            setIsFeaturedLoading(false);
        }
    }

    // Update featured status
    async function updateFeaturedStatus(articleId, action, value, featuredOrder) {
        setUpdatingFeatured(articleId);
        try {
            const response = await fetch('/api/admin/articles/featured', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ articleId, action, value, featuredOrder })
            });

            if (response.ok) {
                const data = await response.json();
                setSuccessMessage(`Article ${action === 'setFeatured' ? (value ? 'set as featured' : 'unfeatured') : 'updated'} successfully`);
                setTimeout(() => setSuccessMessage(null), 3000);
                // Refresh featured articles list
                fetchFeaturedArticles(adminEmail);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update featured status');
            }
        } catch (err) {
            setError('Failed to update featured status');
        } finally {
            setUpdatingFeatured(null);
        }
    }

    // Fetch featured articles when section is opened
    useEffect(() => {
        if (isFeaturedSectionOpen && verifyState === VERIFY_STATE.VERIFIED && adminEmail) {
            fetchFeaturedArticles(adminEmail);
        }
    }, [isFeaturedSectionOpen, verifyState, adminEmail]);

    async function handleApprove() {
        if (!selectedArticle) return;

        setIsApproving(true);
        try {
            const response = await fetch(`/api/admin/articles/${selectedArticle.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    status: 'PUBLISHED',
                    feedback: approveFeedback || 'Your article has been approved and published!'
                })
            });

            if (response.ok) {
                setSuccessMessage('Article approved and published!');
                setApproveDialogOpen(false);
                setSelectedArticle(null);
                setApproveFeedback('');
                fetchArticles(adminEmail, currentPage);
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
            const response = await fetch(`/api/admin/articles/${selectedArticle.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    status: 'REJECTED',
                    feedback: rejectFeedback
                })
            });

            if (response.ok) {
                setSuccessMessage('Article rejected with feedback');
                setRejectDialogOpen(false);
                setSelectedArticle(null);
                setRejectFeedback('');
                fetchArticles(adminEmail, currentPage);
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

    async function handleStartReview(article) {
        try {
            const response = await fetch(`/api/admin/articles/${article.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    status: 'IN_REVIEW'
                })
            });

            if (response.ok) {
                setSuccessMessage('Article marked as "In Review" - author has been notified');
                fetchArticles(adminEmail, currentPage);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to start review');
            }
        } catch (err) {
            setError('Failed to start review');
        }
    }

    // Delete article immediately
    async function handleDelete() {
        if (!selectedArticle) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/articles/${selectedArticle.id}/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    feedback: deleteFeedback || null
                })
            });

            if (response.ok) {
                setSuccessMessage('Article deleted - author has been notified');
                setDeleteDialogOpen(false);
                setSelectedArticle(null);
                setDeleteFeedback('');
                fetchArticles(adminEmail, currentPage);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete article');
            }
        } catch (err) {
            setError('Failed to delete article');
        } finally {
            setIsDeleting(false);
        }
    }

    // Schedule article for deletion (3 days)
    async function handleScheduleDeletion() {
        if (!selectedArticle) return;

        setIsSchedulingDeletion(true);
        try {
            const response = await fetch(`/api/admin/articles/${selectedArticle.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    status: 'SCHEDULED_FOR_DELETION',
                    feedback: deleteFeedback || 'Article scheduled for deletion.'
                })
            });

            if (response.ok) {
                setSuccessMessage('Article scheduled for deletion in 3 days - author has been notified');
                setScheduleDeleteDialogOpen(false);
                setSelectedArticle(null);
                setDeleteFeedback('');
                fetchArticles(adminEmail, currentPage);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to schedule deletion');
            }
        } catch (err) {
            setError('Failed to schedule deletion');
        } finally {
            setIsSchedulingDeletion(false);
        }
    }

    // Fetch available users for reassignment
    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setAvailableUsers(data.users || []);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    }

    // Save edited article
    async function handleSaveArticle() {
        if (!editedArticle) return;

        setIsSavingArticle(true);
        try {
            const response = await fetch(`/api/admin/articles/${editedArticle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: editedArticle.title,
                    excerpt: editedArticle.excerpt,
                    category: editedArticle.category,
                    content: editedArticle.content,
                    authorId: editedArticle.authorId,
                    authorName: editedArticle.authorName,
                    authorEmail: editedArticle.authorEmail,
                    readTime: editedArticle.readTime,
                    iconName: editedArticle.iconName,
                    iconColor: editedArticle.iconColor,
                    gradient: editedArticle.gradient,
                    coverImage: editedArticle.coverImage,
                    coverType: editedArticle.coverType,
                })
            });

            if (response.ok) {
                setSuccessMessage('Article updated successfully');
                setSelectedArticle(editedArticle);
                setIsEditMode(false);
                fetchArticles(adminEmail, currentPage);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update article');
            }
        } catch (err) {
            setError('Failed to update article');
        } finally {
            setIsSavingArticle(false);
        }
    }

    // Enter edit mode
    function enterEditMode() {
        if (!selectedArticle?.id) {
            return;
        }

        setEditedArticle({ ...selectedArticle });
        setIsEditMode(true);
        fetchUsers();
    }

    // Cancel edit mode
    function cancelEditMode() {
        setEditedArticle(null);
        setIsEditMode(false);
    }

    // Handle author reassignment
    function handleAuthorChange(userId) {
        const user = availableUsers.find(u => u.id === userId);
        if (user) {
            setEditedArticle(prev => ({
                ...prev,
                authorId: user.id,
                authorName: user.name || user.email?.split('@')[0] || 'Unknown',
                authorEmail: user.email
            }));
        }
    }

    // Loading state
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

    // Verification screens
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
                                        ← Back to Home
                                    </Link>
                                </div>

                                <Separator />
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <Shield className="h-4 w-4 text-[var(--brand-accent)] shrink-0" />
                                    <p><span className="font-medium text-foreground">Security Notice:</span> Access is restricted to whitelisted admin emails.</p>
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
                        <Badge variant="outline" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-[var(--brand-accent)]/30">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Admin
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

            <main className="container py-8 space-y-8">
                {/* Success/Error Messages */}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Alert className="bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400">
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
                                <FileText className="h-5 w-5 text-[var(--brand-accent)]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Review Articles</h1>
                                <p className="text-sm text-muted-foreground">
                                    {totalArticles} article{totalArticles !== 1 ? 's' : ''} • Review and approve submissions
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters - Simplified */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(value) => {
                        setStatusFilter(value);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="PUBLISHED">Published</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="SCHEDULED_FOR_DELETION">Pending Deletion</SelectItem>
                            <SelectItem value="DRAFT">Drafts</SelectItem>
                            <SelectItem value="all">All Articles</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Articles List - Clean Card Layout */}
                <Card className="border-border/50">
                    <CardHeader className="py-3 px-4 border-b flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-base font-medium">Articles</CardTitle>
                            <Badge variant="outline" className="text-xs font-normal">
                                {articles.filter(a => a.status === 'PENDING_REVIEW').length} pending
                            </Badge>
                        </div>
                    </CardHeader>

                    <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : articles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <FileText className="h-10 w-10 mb-3 opacity-40" />
                                <p className="font-medium">No articles found</p>
                                <p className="text-sm">{searchQuery ? 'Try adjusting your search' : 'No articles match the current filter'}</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {articles.map((article) => (
                                    <div
                                        key={article.id}
                                        className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedArticle(article);
                                            setIsArticlePreviewOpen(true);
                                        }}
                                    >
                                        <div className="flex gap-4">
                                            {/* Cover Thumbnail */}
                                            <div className="shrink-0">
                                                {article.coverType === 'image' && article.coverImage ? (
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                                                        <img
                                                            src={article.coverImage}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="w-16 h-16 rounded-lg flex items-center justify-center"
                                                        style={{ background: article.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                                    >
                                                        <ArticleIcon
                                                            iconName={article.iconName}
                                                            className="w-6 h-6"
                                                            style={{ color: article.iconColor || 'white' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-1">
                                                    <h3 className="font-medium text-sm line-clamp-1">{article.title}</h3>
                                                    <StatusBadge status={article.status} />
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{article.excerpt}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {article.authorName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {article.submittedAt ? new Date(article.submittedAt).toLocaleDateString() : 'Not submitted'}
                                                    </span>
                                                    {article.category && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                            {article.category}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                {(article.status === 'PENDING_REVIEW' || article.status === 'IN_REVIEW') && (
                                                    <>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                                                        onClick={() => {
                                                                            setSelectedArticle(article);
                                                                            setApproveDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Approve</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                                        onClick={() => {
                                                                            setSelectedArticle(article);
                                                                            setRejectDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Reject</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedArticle(article);
                                                            setIsArticlePreviewOpen(true);
                                                        }}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Preview
                                                        </DropdownMenuItem>
                                                        {article.status === 'PENDING_REVIEW' && (
                                                            <DropdownMenuItem onClick={() => handleStartReview(article)}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Start Review
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedArticle(article);
                                                                setDeleteFeedback('');
                                                                setScheduleDeleteDialogOpen(true);
                                                            }}
                                                            className="text-orange-600"
                                                        >
                                                            <Clock className="w-4 h-4 mr-2" />
                                                            Schedule Deletion
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedArticle(article);
                                                                setDeleteFeedback('');
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete Permanently
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <p className="text-xs text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Featured Articles Management Section */}
                <Card className="border-border/50">
                    <CardHeader
                        className="py-3 px-4 border-b cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setIsFeaturedSectionOpen(!isFeaturedSectionOpen)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-amber-500/10">
                                    <Star className="h-4 w-4 text-amber-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-medium">Featured Articles</CardTitle>
                                    <CardDescription className="text-xs">
                                        Manage which articles appear as featured on the blog
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {mainFeaturedArticle && (
                                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                                        <Star className="h-3 w-3 mr-1 fill-amber-500" />
                                        {mainFeaturedArticle.title.slice(0, 20)}{mainFeaturedArticle.title.length > 20 ? '...' : ''}
                                    </Badge>
                                )}
                                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isFeaturedSectionOpen ? 'rotate-90' : ''}`} />
                            </div>
                        </div>
                    </CardHeader>

                    {isFeaturedSectionOpen && (
                        <CardContent className="p-4">
                            {isFeaturedLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : featuredArticles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <FileText className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="font-medium">No published articles</p>
                                    <p className="text-sm">Approve articles to manage featured content</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Main Featured Article Section */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                            Main Featured Article
                                        </Label>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            This article will be displayed as the large hero on the blog page
                                        </p>
                                        <div className="grid gap-2">
                                            {featuredArticles.map((article) => (
                                                <div
                                                    key={`featured-${article.id}`}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                                        article.featured 
                                                            ? 'bg-amber-500/10 border-amber-500/30' 
                                                            : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                                                    }`}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden">
                                                        {article.coverType === 'image' && article.coverImage ? (
                                                            <img src={article.coverImage} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div
                                                                className="w-full h-full flex items-center justify-center"
                                                                style={{ background: article.gradient || 'var(--muted)' }}
                                                            >
                                                                <ArticleIcon iconName={article.iconName} className="h-5 w-5 text-white/80" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{article.title}</p>
                                                        <p className="text-xs text-muted-foreground">{article.authorName} • {article.category}</p>
                                                    </div>

                                                    {/* Featured Toggle */}
                                                    <Button
                                                        size="sm"
                                                        variant={article.featured ? "default" : "outline"}
                                                        className={article.featured ? "bg-amber-500 hover:bg-amber-600" : ""}
                                                        disabled={updatingFeatured === article.id}
                                                        onClick={() => updateFeaturedStatus(article.id, 'setFeatured', !article.featured)}
                                                    >
                                                        {updatingFeatured === article.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : article.featured ? (
                                                            <>
                                                                <Star className="h-3 w-3 mr-1 fill-white" />
                                                                Featured
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Star className="h-3 w-3 mr-1" />
                                                                Set Featured
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t" />

                                    {/* More Articles Section */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            More Articles Section
                                        </Label>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            Toggle which articles appear in the &quot;More Articles&quot; grid on the blog page
                                        </p>
                                        <div className="grid gap-2">
                                            {featuredArticles.map((article) => (
                                                <div
                                                    key={`more-${article.id}`}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                                        article.showInMoreArticles 
                                                            ? 'bg-muted/50 border-border' 
                                                            : 'bg-muted/20 border-border/50 opacity-60'
                                                    }`}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden">
                                                        {article.coverType === 'image' && article.coverImage ? (
                                                            <img src={article.coverImage} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div
                                                                className="w-full h-full flex items-center justify-center"
                                                                style={{ background: article.gradient || 'var(--muted)' }}
                                                            >
                                                                <ArticleIcon iconName={article.iconName} className="h-4 w-4 text-white/80" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{article.title}</p>
                                                        <p className="text-xs text-muted-foreground">{article.category}</p>
                                                    </div>

                                                    {/* Show/Hide Toggle */}
                                                    <Button
                                                        size="sm"
                                                        variant={article.showInMoreArticles ? "default" : "outline"}
                                                        disabled={updatingFeatured === article.id}
                                                        onClick={() => updateFeaturedStatus(article.id, 'toggleMoreArticles', !article.showInMoreArticles)}
                                                    >
                                                        {updatingFeatured === article.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : article.showInMoreArticles ? (
                                                            <>
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Visible
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Hidden
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Security Notice */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 bg-muted/30">
                    <ShieldCheck className="h-5 w-5 text-[var(--brand-accent)] shrink-0" />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Security Notice:</span>{' '}
                        Your admin session expires after 30 minutes. All changes are applied immediately.
                    </p>
                </div>
            </main>

            {/* Article Preview Dialog - Full Blog Page Style with Edit Mode */}
            <Dialog open={isArticlePreviewOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsEditMode(false);
                    setEditedArticle(null);
                }
                setIsArticlePreviewOpen(open);
            }}>
                <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
                    {/* Preview Header */}
                    <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30 shrink-0">
                        <div className="flex items-center gap-3">
                            {isEditMode ? (
                                <Pencil className="h-5 w-5 text-[var(--brand-accent)]" />
                            ) : (
                                <Eye className="h-5 w-5 text-[var(--brand-accent)]" />
                            )}
                            <div>
                                <h2 className="font-semibold">{isEditMode ? 'Edit Article' : 'Article Preview'}</h2>
                                <p className="text-xs text-muted-foreground">
                                    {isEditMode ? 'Edit any field including reassigning the author' : 'This is how the article will appear when published'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={selectedArticle?.status} />
                            {!isEditMode && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={enterEditMode}
                                >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full w-full">
                            <div className="max-w-4xl mx-auto px-6 py-8">
                            {isEditMode && editedArticle ? (
                                /* Edit Mode Form */
                                <div className="space-y-6">
                                    {/* Cover Section */}
                                    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <Palette className="w-4 h-4" />
                                            Cover Settings
                                        </Label>

                                        {/* Cover Preview */}
                                        <div className="mb-4">
                                            {editedArticle.coverType === 'image' && editedArticle.coverImage ? (
                                                <div className="w-full h-40 rounded-xl overflow-hidden relative group">
                                                    <img
                                                        src={editedArticle.coverImage}
                                                        alt={editedArticle.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-full h-40 rounded-xl flex items-center justify-center relative overflow-hidden"
                                                    style={{ background: editedArticle.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                                >
                                                    <ArticleIcon
                                                        iconName={editedArticle.iconName}
                                                        className="w-12 h-12"
                                                        style={{ color: editedArticle.iconColor || 'white' }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Cover Type Toggle */}
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={editedArticle.coverType === 'gradient' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setEditedArticle(prev => ({ ...prev, coverType: 'gradient' }))}
                                            >
                                                <Palette className="w-4 h-4 mr-2" />
                                                Gradient
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={editedArticle.coverType === 'image' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setEditedArticle(prev => ({ ...prev, coverType: 'image' }))}
                                            >
                                                <ImageIcon className="w-4 h-4 mr-2" />
                                                Image
                                            </Button>
                                        </div>

                                        {editedArticle.coverType === 'gradient' ? (
                                            <>
                                                {/* Gradient Selection */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Select Gradient</Label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {PRESET_GRADIENTS.map((g) => (
                                                            <button
                                                                key={g.name}
                                                                type="button"
                                                                className={`h-12 rounded-lg border-2 transition-all ${
                                                                    editedArticle.gradient === g.value ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
                                                                }`}
                                                                style={{ background: g.value }}
                                                                onClick={() => setEditedArticle(prev => ({ ...prev, gradient: g.value }))}
                                                                title={g.name}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Icon Selection */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Select Icon</Label>
                                                    <div className="grid grid-cols-6 gap-2">
                                                        {AVAILABLE_ICONS.map((iconName) => (
                                                            <button
                                                                key={iconName}
                                                                type="button"
                                                                className={`h-10 rounded-lg border flex items-center justify-center transition-all ${
                                                                    editedArticle.iconName === iconName ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/50'
                                                                }`}
                                                                onClick={() => setEditedArticle(prev => ({ ...prev, iconName }))}
                                                                title={iconName}
                                                            >
                                                                <ArticleIcon iconName={iconName} className="w-5 h-5" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Icon Color */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Icon Color</Label>
                                                    <div className="grid grid-cols-10 gap-1">
                                                        {ICON_COLORS.map((color) => (
                                                            <button
                                                                key={color.value}
                                                                type="button"
                                                                className={`w-6 h-6 rounded-full border-2 transition-all ${
                                                                    editedArticle.iconColor === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                                                                }`}
                                                                style={{ backgroundColor: color.value, borderColor: color.value === 'white' ? '#ccc' : color.value }}
                                                                onClick={() => setEditedArticle(prev => ({ ...prev, iconColor: color.value }))}
                                                                title={color.name}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            /* Image URL Input */
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-cover-image" className="text-xs">Image URL</Label>
                                                <Input
                                                    id="edit-cover-image"
                                                    value={editedArticle.coverImage || ''}
                                                    onChange={(e) => setEditedArticle(prev => ({ ...prev, coverImage: e.target.value }))}
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-title" className="text-sm font-medium">Title</Label>
                                        <Input
                                            id="edit-title"
                                            value={editedArticle.title || ''}
                                            onChange={(e) => setEditedArticle(prev => ({ ...prev, title: e.target.value }))}
                                            className="text-lg font-semibold"
                                            placeholder="Article title"
                                        />
                                    </div>

                                    {/* Excerpt */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-excerpt" className="text-sm font-medium">Excerpt</Label>
                                        <Textarea
                                            id="edit-excerpt"
                                            value={editedArticle.excerpt || ''}
                                            onChange={(e) => setEditedArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                                            placeholder="Brief description of the article"
                                            rows={3}
                                        />
                                    </div>

                                    {/* Category & Read Time Row */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {/* Category Dropdown */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-category" className="text-sm font-medium">Category</Label>
                                            <Select
                                                value={editedArticle.category || ''}
                                                onValueChange={(value) => setEditedArticle(prev => ({ ...prev, category: value }))}
                                            >
                                                <SelectTrigger id="edit-category">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CATEGORIES.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Read Time */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-readtime" className="text-sm font-medium">Read Time</Label>
                                            <Input
                                                id="edit-readtime"
                                                value={editedArticle.readTime || ''}
                                                onChange={(e) => setEditedArticle(prev => ({ ...prev, readTime: e.target.value }))}
                                                placeholder="e.g., 5 min read"
                                            />
                                        </div>
                                    </div>

                                    {/* Author Reassignment */}
                                    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Author Assignment
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Reassign this article to a different user account
                                        </p>

                                        {/* Select User */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-author-select" className="text-xs">Select User</Label>
                                            <Select
                                                value={editedArticle.authorId || ''}
                                                onValueChange={handleAuthorChange}
                                            >
                                                <SelectTrigger id="edit-author-select">
                                                    <SelectValue placeholder="Select a user" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableUsers.map((user) => (
                                                        <SelectItem key={user.id} value={user.id}>
                                                            {user.name || 'Unknown'} ({user.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Display Name & Email in separate rows */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-author-name" className="text-xs">Display Name</Label>
                                            <Input
                                                id="edit-author-name"
                                                value={editedArticle.authorName || ''}
                                                onChange={(e) => setEditedArticle(prev => ({ ...prev, authorName: e.target.value }))}
                                                placeholder="Author display name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-author-email" className="text-xs">Author Email</Label>
                                            <Input
                                                id="edit-author-email"
                                                value={editedArticle.authorEmail || ''}
                                                onChange={(e) => setEditedArticle(prev => ({ ...prev, authorEmail: e.target.value }))}
                                                placeholder="author@example.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Content Editor */}
                                    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Article Content
                                            </Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Click the button below to open the fullscreen editor. Your progress is automatically saved every 30 seconds, when you switch tabs, and when you close the editor or browser.
                                        </p>
                                        <Button
                                            type="button"
                                            className="w-full"
                                            onClick={() => {
                                                if (!editedArticle?.id) {
                                                    return;
                                                }
                                                // Close the dialog first to prevent overlay conflicts
                                                setIsArticlePreviewOpen(false);
                                                // Small delay to let dialog close before opening fullscreen editor
                                                setTimeout(() => {
                                                    setIsFullscreenEditorOpen(true);
                                                }, 100);
                                            }}
                                        >
                                            <Maximize2 className="w-4 h-4 mr-2" />
                                            Open Fullscreen Editor
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* Preview Mode */
                                <article>
                                    {/* Cover Image / Gradient Header */}
                                    {selectedArticle && (
                                        <div className="mb-8">
                                            {selectedArticle.coverType === 'image' && selectedArticle.coverImage ? (
                                                <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden">
                                                    <img
                                                        src={selectedArticle.coverImage}
                                                        alt={selectedArticle.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-full h-64 md:h-80 rounded-2xl flex items-center justify-center relative overflow-hidden"
                                                    style={{ background: selectedArticle.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                                >
                                                    <ArticleIcon
                                                        iconName={selectedArticle.iconName}
                                                        className="w-24 h-24 md:w-32 md:h-32"
                                                        style={{ color: selectedArticle.iconColor || 'white' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Article Header */}
                                    <header className="mb-8">
                                        {/* Category Badge */}
                                        <div className="mb-4">
                                            <Badge variant="secondary" className="text-xs">
                                                {selectedArticle?.category}
                                            </Badge>
                                        </div>

                                        {/* Title */}
                                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                                            {selectedArticle?.title}
                                        </h1>

                                        {/* Excerpt */}
                                        {selectedArticle?.excerpt && (
                                            <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                                                {selectedArticle.excerpt}
                                            </p>
                                        )}

                                        {/* Author & Meta */}
                                        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                    <User className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{selectedArticle?.authorName}</p>
                                                    <p className="text-sm text-muted-foreground">{selectedArticle?.authorEmail}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {selectedArticle?.readTime && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {selectedArticle.readTime}
                                                    </span>
                                                )}
                                                {selectedArticle?.submittedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(selectedArticle.submittedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </header>

                                    {/* Article Content */}
                                    {selectedArticle?.content && (
                                        <HTMLContentPreview content={selectedArticle.content} />
                                    )}
                                </article>
                            )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Footer with Actions */}
                    <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/30 shrink-0">
                        {isEditMode ? (
                            <>
                                <Button variant="outline" onClick={cancelEditMode}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveArticle}
                                    disabled={isSavingArticle}
                                    className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
                                >
                                    {isSavingArticle ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setIsArticlePreviewOpen(false)}>
                                    Close Preview
                                </Button>
                                <div className="flex items-center gap-2">
                                    {(selectedArticle?.status === 'PENDING_REVIEW' || selectedArticle?.status === 'IN_REVIEW') && (
                                        <>
                                            <Button
                                                variant="destructive"
                                                onClick={() => {
                                                    setIsArticlePreviewOpen(false);
                                                    setRejectDialogOpen(true);
                                                }}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button
                                                className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
                                                onClick={() => {
                                                    setIsArticlePreviewOpen(false);
                                                    setApproveDialogOpen(true);
                                                }}
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Approve
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
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

            {/* Delete Immediately Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Delete Article Permanently</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The article will be permanently deleted and the author will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                            <p className="text-sm font-medium text-destructive">
                                Article: {selectedArticle?.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Author: {selectedArticle?.authorName} ({selectedArticle?.authorEmail})
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="delete-feedback">Reason for deletion (optional)</Label>
                            <Textarea
                                id="delete-feedback"
                                value={deleteFeedback}
                                onChange={(e) => setDeleteFeedback(e.target.value)}
                                placeholder="Explain why this article is being deleted..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Permanently
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Schedule Deletion Dialog */}
            <Dialog open={scheduleDeleteDialogOpen} onOpenChange={setScheduleDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Article for Deletion</DialogTitle>
                        <DialogDescription>
                            The article will be scheduled for deletion in 3 days. The author will be notified and can import the article to drafts to prevent deletion.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                            <p className="text-sm font-medium">
                                Article: {selectedArticle?.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Author: {selectedArticle?.authorName} ({selectedArticle?.authorEmail})
                            </p>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                                Will be deleted on: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="schedule-delete-feedback">Reason for scheduled deletion (optional)</Label>
                            <Textarea
                                id="schedule-delete-feedback"
                                value={deleteFeedback}
                                onChange={(e) => setDeleteFeedback(e.target.value)}
                                placeholder="Explain why this article is scheduled for deletion..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduleDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleScheduleDeletion}
                            disabled={isSchedulingDeletion}
                        >
                            {isSchedulingDeletion ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Scheduling...
                                </>
                            ) : (
                                <>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Schedule Deletion
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Fullscreen Editor for Article Content - only render when article has valid id */}
            {editedArticle?.id && (
                <FullscreenEditor
                    open={isFullscreenEditorOpen}
                    onOpenChange={(open) => {
                        setIsFullscreenEditorOpen(open);
                        // Reopen the article preview dialog when fullscreen editor closes
                        if (!open) {
                            setTimeout(() => {
                                setIsArticlePreviewOpen(true);
                            }, 100);
                        }
                    }}
                    article={editedArticle}
                    apiBasePath="/api/admin/articles"
                    customHeaders={editorCustomHeaders}
                    allowAutosaveAllStatuses={true}
                    onArticleUpdate={(updatedArticle) => {
                        // Update the edited article with new content
                        if (updatedArticle) {
                            setEditedArticle(prev => ({
                                ...prev,
                                content: updatedArticle.content || prev?.content,
                                contentJson: updatedArticle.contentJson || prev?.contentJson,
                            }));
                        }
                    }}
                />
            )}
        </div>
        </ScrollArea>
    );
}

