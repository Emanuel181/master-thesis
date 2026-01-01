"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

/**
 * Sticky Feedback Widget
 * A floating button on the right edge that expands on hover
 */
export function StickyFeedback() {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!feedback.trim()) {
            setStatus('error');
            setMessage('Please enter your feedback');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('/api/feedback/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback: feedback.trim(),
                    email: email.trim() || undefined,
                    page: typeof window !== 'undefined' ? window.location.pathname : 'landing'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('Thank you for your feedback!');
                setFeedback('');
                setEmail('');
                // Auto-close after success
                setTimeout(() => {
                    setIsOpen(false);
                    setStatus('idle');
                    setMessage('');
                }, 2000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to submit feedback');
            }
        } catch (error) {
            setStatus('error');
            setMessage('An error occurred. Please try again.');
        }
    };

    return (
        <>
            {/* Feedback Dialog */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => {
                                setIsOpen(false);
                                setStatus('idle');
                                setMessage('');
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-border bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">Send Feedback</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                            setIsOpen(false);
                                            setStatus('idle');
                                            setMessage('');
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="p-4 space-y-3">
                                <div>
                                    <Input
                                        type="email"
                                        placeholder="Email (optional)"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="text-sm"
                                        disabled={status === 'loading' || status === 'success'}
                                    />
                                </div>
                                <div>
                                    <Textarea
                                        placeholder="Tell us what you think..."
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="min-h-[100px] text-sm resize-none"
                                        disabled={status === 'loading' || status === 'success'}
                                    />
                                </div>
                                {message && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`text-xs flex items-center gap-1 ${
                                            status === 'success'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`}
                                    >
                                        {status === 'success' ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : (
                                            <AlertCircle className="w-3 h-3" />
                                        )}
                                        {message}
                                    </motion.p>
                                )}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={status === 'loading' || status === 'success'}
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : status === 'success' ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Sent!
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Feedback
                                        </>
                                    )}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating button - right edge, vertically positioned */}
            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
                <motion.button
                    className="flex items-center bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white shadow-lg shadow-[var(--brand-accent)]/25 rounded-l-xl overflow-hidden"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={() => setIsOpen(true)}
                    whileTap={{ scale: 0.95 }}
                    layout
                >
                    <motion.div
                        className="flex items-center py-3"
                        animate={{ 
                            paddingLeft: isHovered ? '16px' : '12px',
                            paddingRight: isHovered ? '16px' : '12px',
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                        <motion.span
                            className="text-sm font-medium whitespace-nowrap overflow-hidden"
                            animate={{ 
                                width: isHovered ? 'auto' : 0,
                                opacity: isHovered ? 1 : 0,
                                marginRight: isHovered ? '8px' : '0px'
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            Give us your feedback
                        </motion.span>
                        <Star className="w-5 h-5 shrink-0" fill="currentColor" />
                    </motion.div>
                </motion.button>
            </div>
        </>
    );
}
