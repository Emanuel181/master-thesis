"use client";
import React from "react";
import { StickyScroll } from "../../ui/sticky-scroll-reveal";
import { Search, Database, FileCode, ShieldCheck } from "lucide-react";

const content = [
    {
        title: "1. Vulnerability Detection",
        description:
            "Our scanning agents parse your codebase in real-time, identifying CWE patterns and potential security risks using static analysis and LLM-based heuristics. We don't just find bugs; we understand their potential impact.",
        content: (
            <div className="flex h-full w-full items-center justify-center bg-red-950/30 border border-red-500/20 text-red-400">
                <Search size={80} />
            </div>
        ),
    },
    {
        title: "2. RAG Context Retrieval",
        description:
            "Unlike standard copilots, we don't guess. We query a vector database of verified security patches, OWASP guidelines, and your internal documentation to ground the fix in reality, eliminating hallucinations.",
        content: (
            <div className="flex h-full w-full items-center justify-center bg-blue-950/30 border border-blue-500/20 text-blue-400">
                <Database size={80} />
            </div>
        ),
    },
    {
        title: "3. Agentic Remediation",
        description:
            "A specialized reasoning agent drafts a patch. It understands the surrounding context and dependencies, ensuring the fix resolves the security flaw without breaking the build or introducing regressions.",
        content: (
            <div className="flex h-full w-full items-center justify-center bg-emerald-950/30 border border-emerald-500/20 text-emerald-400">
                <FileCode size={80} />
            </div>
        ),
    },
    {
        title: "4. Automated Verification",
        description:
            "The loop isn't closed until it passes. A QA agent generates regression tests, executes them against the patched code, and verifies the vulnerability is neutralized before suggesting the merge.",
        content: (
            <div className="flex h-full w-full items-center justify-center bg-purple-950/30 border border-purple-500/20 text-purple-400">
                <ShieldCheck size={80} />
            </div>
        ),
    },
];

export function ProcessScroll() {
    return (
        <div className="w-full py-10">
            <StickyScroll content={content} contentClassName="" />
        </div>
    );
}