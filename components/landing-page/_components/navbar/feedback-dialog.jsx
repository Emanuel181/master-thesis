"use client"

import React, { useState, useRef } from "react"
import { motion } from "framer-motion"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

/**
 * FeedbackButton - Opens feedback dialog
 */
export function FeedbackButton({ onClick }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2"
            aria-label="Send Feedback"
            title="Send Feedback"
        >
            <MessageSquare className="w-4 h-4 sm:w-4 sm:h-4 text-[var(--brand-accent)]" strokeWidth={2} />
        </motion.button>
    )
}

/**
 * FeedbackDialog - Modal for submitting feedback
 */
export function FeedbackDialog({ isOpen, onClose }) {
    const [feedback, setFeedback] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const textareaRef = useRef(null)

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            return
        }
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/feedback/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback: feedback.trim(),
                    page: typeof window !== 'undefined' ? window.location.pathname : 'landing'
                }),
            })
            if (response.ok) {
                setFeedback('')
                if (textareaRef.current) {
                    textareaRef.current.textContent = ''
                }
                onClose?.()
            }
        } catch (error) {
            // Silent fail
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInput = (e) => {
        setFeedback(e.currentTarget.textContent || '')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[400px] max-w-[90vw]">
                <DialogHeader>
                    <DialogTitle>Share your feedback</DialogTitle>
                    <DialogDescription>
                        We&apos;d love to hear your thoughts on how we can improve.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="feedback">Your feedback</Label>
                    <ScrollArea className="h-[120px] w-full rounded-md border border-input bg-transparent overflow-hidden">
                        <div
                            ref={textareaRef}
                            contentEditable
                            role="textbox"
                            aria-multiline="true"
                            id="feedback"
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
                        onClick={onClose}
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
    )
}
