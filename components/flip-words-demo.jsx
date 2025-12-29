import React from "react";
import { FlipWords } from "./ui/flip-words";

export function FlipWordsDemo() {
    const words = ["better", "verified", "secure", "trusted"];

    return (
        <div className="h-[10rem] sm:h-[15rem] md:h-[20rem] lg:h-[30rem] flex justify-center items-center px-4 w-full max-w-full overflow-hidden">
            <div
                className="text-xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-8xl mx-auto font-normal text-neutral-400 dark:text-neutral-500 text-center leading-tight max-w-full">
                Build
                <FlipWords words={words} className="text-xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-8xl text-[var(--brand-accent)] font-bold px-1 sm:px-2 md:px-4" /> <br />
                apps with <span className="gradient-text font-bold">VulnIQ</span>
            </div>
        </div>
    );
}
