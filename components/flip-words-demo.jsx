import React from "react";
import { FlipWords } from "./ui/flip-words";

export function FlipWordsDemo() {
    const words = ["better", "verified", "secure", "trusted"];

    return (
        <div className="h-[30rem] flex justify-center items-center px-4">
            <div
                className="text-6xl md:text-8xl mx-auto font-normal text-neutral-400 dark:text-neutral-500">
                Build
                <FlipWords words={words} className="text-6xl md:text-8xl text-[var(--brand-accent)] font-bold px-4" /> <br />
                apps with <span className="gradient-text font-bold">VulnIQ</span>
            </div>
        </div>
    );
}
