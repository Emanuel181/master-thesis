import React from "react";
import { FlipWords } from "./ui/flip-words";

export function FlipWordsDemo() {
    const words = ["better", "verified", "secure", "trusted"];

    return (
        <div className="h-[30rem] flex justify-center items-center px-4">
            <div
                className="text-6xl md:text-8xl mx-auto font-normal text-neutral-600 dark:text-neutral-400">
                Build
                <FlipWords words={words} className="text-6xl md:text-8xl" /> <br />
                apps with VulnIQ
            </div>
        </div>
    );
}
