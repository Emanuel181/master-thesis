"use client";

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Sticky Feedback Widget
 * A floating button on the right edge that expands on hover
 */
export function StickyFeedback() {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
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
                    textareaRef.current.textContent = '';
                }
                setIsOpen(false);
            }
        } catch (error) {
            // Silent fail
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInput = (e) => {
        setFeedback(e.currentTarget.textContent || '');
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* Feedback Dialog - matches dashboard design */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="w-[400px] max-w-[90vw]">
                    <DialogHeader>
                        <DialogTitle>Share your feedback</DialogTitle>
                        <DialogDescription>
                            We&apos;d love to hear your thoughts on how we can improve.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="sticky-feedback">Your feedback</Label>
                        <ScrollArea className="h-[120px] w-full rounded-md border border-input bg-transparent overflow-hidden">
                            <div
                                ref={textareaRef}
                                contentEditable
                                role="textbox"
                                aria-multiline="true"
                                id="sticky-feedback"
                                data-placeholder="Tell us what you think..."
                                onInput={handleInput}
                                className="min-h-[120px] w-full px-3 py-2 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground break-all"
                                suppressContentEditableWarning
                            />
                        </ScrollArea>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !feedback.trim()}>
                            {isSubmitting ? "Submitting..." : "Submit Feedback"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Floating button - right edge, vertically positioned */}
            {/* On mobile: simple button that directly opens form */}
            {/* On desktop: expands on hover to show text */}
            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
                {/* Mobile button - always compact, no hover effect */}
                <motion.button
                    className="md:hidden flex items-center justify-center bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white shadow-lg shadow-[var(--brand-accent)]/25 rounded-l-xl p-3"
                    onClick={() => setIsOpen(true)}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Send feedback"
                >
                    <Star className="w-5 h-5" fill="currentColor" />
                </motion.button>

                {/* Desktop button - expands on hover */}
                <motion.button
                    className="hidden md:flex items-center bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white shadow-lg shadow-[var(--brand-accent)]/25 rounded-l-xl overflow-hidden"
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
