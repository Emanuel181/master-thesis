"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Sticky Feedback Widget
 * A floating button on the right edge that expands on hover
 */
export function StickyFeedback() {
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef(null);

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/feedback/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback: feedback.trim(),
                    page: typeof window !== 'undefined' ? window.location.pathname : 'landing'
                }),
            });

            if (response.ok) {
                setFeedback('');
                if (textareaRef.current) {
                    textareaRef.current.value = '';
                }
                setIsOpen(false);
            }
        } catch (error) {
            // Silent fail
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, handleClose]);

    return (
        <>
            {/* Custom Modal - no Radix Dialog */}
            {isOpen && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/50 animate-in fade-in-0"
                        onClick={handleClose}
                    />
                    {/* Modal Content */}
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[90vw] bg-background border rounded-lg p-6 shadow-lg animate-in fade-in-0 zoom-in-95">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        
                        {/* Header */}
                        <div className="flex flex-col gap-2 text-center sm:text-left mb-4">
                            <h2 className="text-lg font-semibold leading-none">Share your feedback</h2>
                            <p className="text-muted-foreground text-sm">
                                We&apos;d love to hear your thoughts on how we can improve.
                            </p>
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-2 mb-4">
                            <Label htmlFor="sticky-feedback">Your feedback</Label>
                            <textarea
                                ref={textareaRef}
                                id="sticky-feedback"
                                placeholder="Tell us what you think..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-transparent resize-none outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        
                        {/* Footer */}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="button" 
                                onClick={handleSubmit} 
                                disabled={isSubmitting || !feedback.trim()}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Feedback"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating button - right edge, vertically positioned */}
            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 group">
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-l-xl rounded-r-none px-2.5 py-5 shadow-lg transition-all duration-200 ease-out group-hover:px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                    onClick={() => setIsOpen(true)}
                    aria-label="Send feedback"
                >
                    <Star className="w-4 h-4 shrink-0" fill="currentColor" />
                    <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-200 ease-out group-hover:max-w-[100px] group-hover:ml-2">
                        Feedback
                    </span>
                </button>
            </div>
        </>
    );
}
