'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, X, GitPullRequest, Loader2, FileCode, CheckCheck, XCircle, ChevronUp, ChevronDown, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { getSeverityBadgeVariant, getSeverityColors } from '@/lib/severity-utils';
import { cn } from '@/lib/utils';

// Dynamically import Monaco DiffEditor to avoid SSR issues
const DiffEditor = dynamic(
    () => import('@monaco-editor/react').then(mod => mod.DiffEditor),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }
);

/** Compute +/- line diff stats */
function computeDiffStats(original = '', modified = '') {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const added = Math.max(0, modLines.length - origLines.length);
    const removed = Math.max(0, origLines.length - modLines.length);
    // rough char-based diff when line count is same
    if (added === 0 && removed === 0) {
        let changed = 0;
        for (let i = 0; i < origLines.length; i++) {
            if (origLines[i] !== modLines[i]) changed++;
        }
        return { added: changed, removed: changed };
    }
    return { added, removed };
}

export function FixReview({ runId }) {
    const [fixes, setFixes] = useState([]);
    const [selectedFix, setSelectedFix] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingPR, setCreatingPR] = useState(false);
    const { resolvedTheme } = useTheme();

    // Keyboard shortcut hints
    const [showShortcuts, setShowShortcuts] = useState(false);

    useEffect(() => {
        if (runId) {
            loadFixes();
        }
    }, [runId, loadFixes]);

    const loadFixes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/fixes?runId=${runId}`);
            const data = await response.json();

            if (response.ok) {
                setFixes(data.fixes || []);
                if (data.fixes?.length > 0) {
                    setSelectedFix(data.fixes[0]);
                }
            } else {
                toast.error(data.error || 'Failed to load fixes');
            }
        } catch (error) {
            console.error('Error loading fixes:', error);
            toast.error('Failed to load fixes');
        } finally {
            setLoading(false);
        }
    }, [runId]);

    const handleAccept = async (fixId) => {
        try {
            const response = await fetch(`/api/fixes/${fixId}/accept`, {
                method: 'POST'
            });

            if (response.ok) {
                toast.success('Fix accepted');
                loadFixes();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to accept fix');
            }
        } catch (error) {
            console.error('Error accepting fix:', error);
            toast.error('Failed to accept fix');
        }
    };

    const handleReject = async (fixId) => {
        try {
            const response = await fetch(`/api/fixes/${fixId}/reject`, {
                method: 'POST'
            });

            if (response.ok) {
                toast.success('Fix rejected');
                loadFixes();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to reject fix');
            }
        } catch (error) {
            console.error('Error rejecting fix:', error);
            toast.error('Failed to reject fix');
        }
    };

    const handleAcceptAll = async () => {
        const pending = fixes.filter(f => f.status === 'PENDING');
        if (pending.length === 0) return;
        let accepted = 0;
        for (const fix of pending) {
            try {
                const res = await fetch(`/api/fixes/${fix.id}/accept`, { method: 'POST' });
                if (res.ok) accepted++;
            } catch { /* continue */ }
        }
        toast.success(`Accepted ${accepted} of ${pending.length} fixes`);
        loadFixes();
    };

    const handleRejectAll = async () => {
        const pending = fixes.filter(f => f.status === 'PENDING');
        if (pending.length === 0) return;
        let rejected = 0;
        for (const fix of pending) {
            try {
                const res = await fetch(`/api/fixes/${fix.id}/reject`, { method: 'POST' });
                if (res.ok) rejected++;
            } catch { /* continue */ }
        }
        toast.success(`Rejected ${rejected} of ${pending.length} fixes`);
        loadFixes();
    };

    const handleCreatePR = async () => {
        try {
            const acceptedFixes = fixes.filter(f => f.status === 'ACCEPTED');
            if (acceptedFixes.length === 0) {
                toast.error('No accepted fixes to create PR');
                return;
            }

            setCreatingPR(true);
            toast.loading('Creating pull request...');

            const response = await fetch('/api/fixes/create-pr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    runId,
                    fixIds: acceptedFixes.map(f => f.id)
                })
            });

            const data = await response.json();
            toast.dismiss();

            if (response.ok) {
                toast.success(`PR created successfully!`);
                window.open(data.prUrl, '_blank');
                loadFixes();
            } else {
                toast.error(data.error || 'Failed to create PR');
            }
        } catch (error) {
            console.error('Error creating PR:', error);
            toast.dismiss();
            toast.error('Failed to create PR');
        } finally {
            setCreatingPR(false);
        }
    };

    // Navigate fixes with keyboard
    const navigateFix = useCallback((direction) => {
        if (!fixes.length) return;
        const currentIdx = fixes.findIndex(f => f.id === selectedFix?.id);
        const nextIdx = direction === 'next'
            ? Math.min(currentIdx + 1, fixes.length - 1)
            : Math.max(currentIdx - 1, 0);
        setSelectedFix(fixes[nextIdx]);
    }, [fixes, selectedFix]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            // Alt+A = accept current fix
            if (e.altKey && e.key === 'a' && selectedFix?.status === 'PENDING') {
                e.preventDefault();
                handleAccept(selectedFix.id);
            }
            // Alt+R = reject current fix
            if (e.altKey && e.key === 'r' && selectedFix?.status === 'PENDING') {
                e.preventDefault();
                handleReject(selectedFix.id);
            }
            // Arrow down / j = next fix
            if ((e.key === 'ArrowDown' || e.key === 'j') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const tag = document.activeElement?.tagName;
                if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
                    e.preventDefault();
                    navigateFix('next');
                }
            }
            // Arrow up / k = previous fix
            if ((e.key === 'ArrowUp' || e.key === 'k') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const tag = document.activeElement?.tagName;
                if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
                    e.preventDefault();
                    navigateFix('prev');
                }
            }
            // ? = toggle shortcut hints
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                const tag = document.activeElement?.tagName;
                if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
                    setShowShortcuts(v => !v);
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selectedFix, navigateFix, handleAccept, handleReject]);

    const acceptedCount = useMemo(() => fixes.filter(f => f.status === 'ACCEPTED').length, [fixes]);
    const pendingCount = useMemo(() => fixes.filter(f => f.status === 'PENDING').length, [fixes]);
    const rejectedCount = useMemo(() => fixes.filter(f => f.status === 'REJECTED').length, [fixes]);

    if (loading) {
        return (
            <Card className="flex items-center justify-center h-full border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading fixes…</p>
                </CardContent>
            </Card>
        );
    }

    if (fixes.length === 0) {
        return (
            <Card className="flex items-center justify-center h-full border-dashed">
                <CardContent className="flex flex-col items-center gap-4 py-12">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <FileCode className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="text-base font-semibold">No Fixes Available</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            The Implementer agent hasn&apos;t generated any fixes yet. Make sure it&apos;s enabled in your workflow configuration.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-models-dialog'))}
                        className="gap-2 mt-2"
                    >
                        Configure Workflow
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const selectedIndex = fixes.findIndex(f => f.id === selectedFix?.id);

    return (
        <div className="flex flex-col h-full rounded-xl border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:px-6 border-b gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold">Security Fixes</h2>
                    <Badge variant="outline">{fixes.length} total</Badge>
                    {acceptedCount > 0 && (
                        <Badge className="bg-success">{acceptedCount} accepted</Badge>
                    )}
                    {pendingCount > 0 && (
                        <Badge variant="warning">{pendingCount} pending</Badge>
                    )}
                    {rejectedCount > 0 && (
                        <Badge variant="destructive">{rejectedCount} rejected</Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Batch actions */}
                    {pendingCount > 0 && (
                        <>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Accept All
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Accept all pending fixes?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will accept {pendingCount} pending {pendingCount === 1 ? 'fix' : 'fixes'}. You can still reject individual fixes afterwards.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleAcceptAll}>
                                            Accept All ({pendingCount})
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive">
                                        <XCircle className="w-3.5 h-3.5" />
                                        Reject All
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Reject all pending fixes?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will reject {pendingCount} pending {pendingCount === 1 ? 'fix' : 'fixes'}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction variant="destructive" onClick={handleRejectAll}>
                                            Reject All ({pendingCount})
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}

                    {/* Shortcut hint toggle */}
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowShortcuts(v => !v)}>
                                    <Keyboard className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button
                        onClick={handleCreatePR}
                        disabled={acceptedCount === 0 || creatingPR}
                        className="gap-2"
                        size="sm"
                    >
                        {creatingPR ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating PR...
                            </>
                        ) : (
                            <>
                                <GitPullRequest className="w-4 h-4" />
                                Create PR ({acceptedCount})
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Shortcut hints bar */}
            {showShortcuts && (
                <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground flex-wrap">
                    <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">↑↓</kbd> navigate</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">Alt+A</kbd> accept</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">Alt+R</kbd> reject</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">?</kbd> toggle hints</span>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Fix List Sidebar */}
                <div className="w-72 lg:w-80 border-r overflow-hidden bg-muted/30 shrink-0 flex flex-col">
                    {/* Navigation indicator */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b text-xs text-muted-foreground">
                        <span>{selectedIndex + 1} of {fixes.length}</span>
                        <div className="flex gap-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigateFix('prev')} disabled={selectedIndex <= 0}>
                                <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigateFix('next')} disabled={selectedIndex >= fixes.length - 1}>
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1.5">
                            {fixes.map(fix => {
                                const sevColors = getSeverityColors(fix.vulnerability.severity);
                                const stats = computeDiffStats(fix.originalCode, fix.fixedCode);
                                return (
                                    <Card
                                        key={fix.id}
                                        className={cn(
                                            "p-3 cursor-pointer hover:bg-accent/50 hover:border-primary/30 transition-all duration-150 select-none border-l-[3px]",
                                            selectedFix?.id === fix.id ? 'border-l-primary bg-accent shadow-sm' : '',
                                            !selectedFix || selectedFix.id !== fix.id ? sevColors.borderLeft : ''
                                        )}
                                        onClick={() => setSelectedFix(fix)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">
                                                    {fix.fileName}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {fix.vulnerability.title}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <Badge
                                                        variant={getSeverityBadgeVariant(fix.vulnerability.severity)}
                                                        className="text-[10px] px-1.5 py-0"
                                                    >
                                                        {fix.vulnerability.severity}
                                                    </Badge>
                                                    {fix.status === 'ACCEPTED' && (
                                                        <Badge variant="success" className="text-[10px] px-1.5 py-0">Accepted</Badge>
                                                    )}
                                                    {fix.status === 'REJECTED' && (
                                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Rejected</Badge>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                                                        <span className="text-success">+{stats.added}</span>
                                                        {' / '}
                                                        <span className="text-destructive">-{stats.removed}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            {fix.status === 'ACCEPTED' && (
                                                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                                            )}
                                            {fix.status === 'REJECTED' && (
                                                <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Diff Editor */}
                {selectedFix && (
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Fix Details */}
                        <div className="p-4 md:px-6 border-b bg-muted/30">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-base truncate">
                                            {selectedFix.vulnerability.title}
                                        </h3>
                                        <Badge variant={getSeverityBadgeVariant(selectedFix.vulnerability.severity)} className="shrink-0">
                                            {selectedFix.vulnerability.severity}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {selectedFix.explanation}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <code className="bg-muted px-1.5 py-0.5 rounded">{selectedFix.fileName}</code>
                                        {selectedFix.startLine && <span>Line {selectedFix.startLine}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {selectedFix.status === 'PENDING' && (
                                        <>
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAccept(selectedFix.id)}
                                                            className="gap-1.5"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            Accept
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Alt+A</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReject(selectedFix.id)}
                                                            className="gap-1.5"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Reject
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Alt+R</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </>
                                    )}
                                    {selectedFix.status === 'ACCEPTED' && (
                                        <Badge variant="success" className="gap-1.5 h-8">
                                            <Check className="w-3.5 h-3.5" />
                                            Accepted
                                        </Badge>
                                    )}
                                    {selectedFix.status === 'REJECTED' && (
                                        <Badge variant="destructive" className="gap-1.5 h-8">
                                            <X className="w-3.5 h-3.5" />
                                            Rejected
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Monaco Diff Editor */}
                        <div className="flex-1 min-h-0">
                            <DiffEditor
                                original={selectedFix.originalCode}
                                modified={selectedFix.fixedCode}
                                language={selectedFix.language || 'javascript'}
                                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                                options={{
                                    readOnly: true,
                                    renderSideBySide: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    renderWhitespace: 'selection',
                                }}
                            />
                        </div>

                        {/* Change Details */}
                        {selectedFix.changes && Array.isArray(selectedFix.changes) && selectedFix.changes.length > 0 && (
                            <div className="p-4 border-t bg-muted/30 max-h-48 overflow-y-auto">
                                <h4 className="font-semibold mb-2 text-sm">Changes Made:</h4>
                                <div className="space-y-1.5">
                                    {selectedFix.changes.map((change, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <Badge variant="outline" className="text-xs shrink-0">
                                                Line {change.line}
                                            </Badge>
                                            <span className="text-muted-foreground truncate">
                                                {change.reason}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
