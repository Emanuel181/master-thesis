"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Linkedin, Quote, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SupporterCard({ supporter, className }) {
    const [showFullContribution, setShowFullContribution] = useState(false);
    const [showFullBio, setShowFullBio] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Truncate text helper
    const truncateText = (text, maxLength = 120) => {
        if (!text || text.length <= maxLength) return { text, isTruncated: false };
        return { text: text.slice(0, maxLength).trim() + '...', isTruncated: true };
    };

    const contribution = truncateText(supporter.contributionBio, 100);
    const bio = truncateText(supporter.personalBio, 100);

    // Get initials for fallback
    const initials = supporter.name.split(' ').map(n => n[0]).join('').slice(0, 2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn("w-full h-full", className)}
        >
            <div className="group relative h-full flex flex-col rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-[var(--brand-accent)]/30 hover:shadow-lg hover:shadow-[var(--brand-accent)]/5">
                {/* Header Section - Fixed Height */}
                <div className="flex flex-col items-center text-center">
                    {/* Avatar - Using Next.js Image for better mobile support */}
                    <div className="relative h-20 w-20 rounded-xl ring-2 ring-border/50 group-hover:ring-[var(--brand-accent)]/30 transition-all shadow-lg overflow-hidden">
                        {supporter.avatarUrl && !imageError ? (
                            <Image
                                src={supporter.avatarUrl}
                                alt={supporter.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                                loading="eager"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full w-full bg-muted text-xl font-semibold">
                                {initials}
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <h3 className="font-semibold text-lg text-foreground mt-4">
                        {supporter.name}
                    </h3>

                    {/* Occupation & Company */}
                    <p className="text-sm text-muted-foreground mt-1">
                        {supporter.occupation}
                    </p>
                    {supporter.company && (
                        <p className="text-xs text-muted-foreground/70">
                            {supporter.company}
                        </p>
                    )}
                </div>

                {/* Content Sections - Flex Grow */}
                <div className="flex-1 flex flex-col mt-4 space-y-4">
                    {/* Contribution Section */}
                    {supporter.contributionBio && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Quote className="h-3 w-3 text-[var(--brand-accent)]" />
                                <span className="text-xs font-medium uppercase tracking-wider text-[var(--brand-accent)]">
                                    Contribution
                                </span>
                            </div>
                            <div className="text-sm text-muted-foreground leading-relaxed">
                                {showFullContribution ? supporter.contributionBio : contribution.text}
                                {contribution.isTruncated && (
                                    <button
                                        onClick={() => setShowFullContribution(!showFullContribution)}
                                        className="ml-1 text-xs text-[var(--brand-accent)] hover:underline"
                                    >
                                        {showFullContribution ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* About Section */}
                    {supporter.personalBio && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    About
                                </span>
                            </div>
                            <div className="text-sm text-muted-foreground/80 italic leading-relaxed">
                                {showFullBio ? supporter.personalBio : bio.text}
                                {bio.isTruncated && (
                                    <button
                                        onClick={() => setShowFullBio(!showFullBio)}
                                        className="ml-1 text-xs text-[var(--brand-accent)] hover:underline not-italic"
                                    >
                                        {showFullBio ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="my-4 h-px bg-border/50" />

                {/* Action Buttons - Fixed at Bottom */}
                <div className="flex items-center justify-center gap-4">
                    {supporter.linkedinUrl && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 text-muted-foreground hover:text-[#0077b5] hover:bg-[#0077b5]/10"
                                        asChild
                                    >
                                        <a
                                            href={supporter.linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Linkedin className="h-4 w-4" />
                                            <span>LinkedIn</span>
                                        </a>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>View LinkedIn Profile</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {supporter.linkedinUrl && supporter.websiteUrl && (
                        <div className="h-4 w-px bg-border/50" />
                    )}

                    {supporter.websiteUrl && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 text-muted-foreground hover:text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/10"
                                        asChild
                                    >
                                        <a
                                            href={supporter.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <svg 
                                                className="h-4 w-4" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" 
                                                />
                                            </svg>
                                            <span>Website</span>
                                        </a>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Visit Website</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Show badge if no links */}
                    {!supporter.linkedinUrl && !supporter.websiteUrl && (
                        <Badge variant="secondary" className="text-xs">
                            Supporter
                        </Badge>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
