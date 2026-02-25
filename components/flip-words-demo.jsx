import React from "react";
import Link from "next/link";
import { FlipWords } from "./ui/flip-words";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

export function FlipWordsDemo() {
    const words = ["better", "verified", "secure", "trusted"];

    return (
        <div className="relative h-[12rem] sm:h-[14rem] md:h-[18rem] lg:h-[22rem] flex flex-col justify-center items-center px-4 w-full max-w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--brand-accent)]/[0.03] to-transparent pointer-events-none" />
            <div
                className="text-xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-8xl mx-auto font-normal text-neutral-400 dark:text-neutral-500 text-center leading-tight max-w-full relative">
                Build
                <FlipWords words={words} className="text-xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-8xl text-[var(--brand-accent)] font-bold px-1 sm:px-2 md:px-4" /> <br />
                apps with <span className="gradient-text font-bold">VulnIQ</span>
            </div>
            <p className="relative mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground text-center max-w-lg">
                Trusted by developers who want real security — not guesswork.
            </p>
            <Button asChild variant="outline" size="sm" className="relative mt-4 rounded-full border-[var(--brand-accent)]/30 hover:bg-[var(--brand-accent)]/10 hover:border-[var(--brand-accent)]/50 text-xs sm:text-sm">
                <Link href="/demo">
                    Try the demo
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
            </Button>
        </div>
    );
}
