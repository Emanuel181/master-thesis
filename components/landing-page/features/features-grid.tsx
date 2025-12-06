"use client";

import { Lock, Search, Terminal, FileCheck, Server, ShieldAlert, CloudOff, Database } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { motion } from "framer-motion";
import React from "react";

export function FeaturesGrid() {
    return (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-8 lg:gap-12 xl:grid-rows-2">

            {/* 1. ZERO HALLUCINATIONS (Top Left) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<FileCheck className="h-4 w-4 text-zinc-400" />}
                title="Zero Hallucinations"
                description="RAG verifies every generated patch against your trusted internal docs."
                header={<SkeletonZeroHallucinations />}
            />

            {/* 2. LOCAL EXECUTION (Bottom Left) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<Server className="h-4 w-4 text-zinc-400" />}
                title="Local Execution"
                description="Air-gapped compatible. Run Llama 3 on-prem; no data leaves your VPC."
                header={<SkeletonLocalExecution />}
            />

            {/* 3. ROLE-BASED AGENTS (Center Tall) */}
            <GridItem
                area="md:col-span-12 xl:col-span-4 xl:row-span-2"
                icon={<Lock className="h-4 w-4 text-zinc-400" />}
                title="Role-Based Agents"
                description="Specialized agents for scanning, fixing, and testing ensure separation of concerns."
                header={<SkeletonAgents />}
            />

            {/* 4. REAL-TIME SCANNING (Top Right) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<Terminal className="h-4 w-4 text-zinc-400" />}
                title="Real-time Scanning"
                description="Continuous monitoring of new PRs against CVE databases."
                header={<SkeletonScanning />}
            />

            {/* 5. AUDIT TRAILS (Bottom Right) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<Search className="h-4 w-4 text-zinc-400" />}
                title="Audit Trails"
                description="Every AI decision is logged and cited for compliance."
                header={<SkeletonAudit />}
            />
        </ul>
    );
}

// --- GRID ITEM WRAPPER ---
interface GridItemProps {
    area: string;
    icon: React.ReactNode;
    title: string;
    description: React.ReactNode;
    header: React.ReactNode;
}

const GridItem = ({ area, icon, title, description, header }: GridItemProps) => {
    return (
        <li className={`min-h-[20rem] list-none ${area}`}>
            <div className="relative h-full rounded-3xl border border-zinc-800 p-2 md:p-3 bg-zinc-900/20">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl border-0.75 p-6 shadow-[0px_0px_27px_0px_#2D2D2D] bg-zinc-950/80">

                    <div className="relative flex-1 min-h-[10rem] w-full overflow-hidden rounded-xl bg-zinc-900/30 border border-zinc-800/50 flex items-center justify-center">
                        {header}
                    </div>

                    <div className="relative flex flex-col justify-between gap-3">
                        <div className="w-fit rounded-lg border border-zinc-700 p-2 bg-zinc-800/50">
                            {icon}
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-sans text-xl font-semibold text-white">
                                {title}
                            </h3>
                            <h2 className="font-sans text-sm text-zinc-400 leading-relaxed">
                                {description}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};


// --- NEW ANIMATIONS ---

// 1. ZERO HALLUCINATIONS: Shows "Bad Code" turning into "Good Code" via Database
const SkeletonZeroHallucinations = () => {
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2 gap-2">
            {/* The Database (Source of Truth) */}
            <div className="flex items-center gap-2 mb-2 opacity-80">
                <Database size={14} className="text-blue-500" />
                <div className="h-1 w-12 bg-blue-500/30 rounded-full" />
                <span className="text-[10px] text-blue-400 font-mono tracking-wider">VERIFIED_CONTEXT</span>
            </div>

            {/* The Comparison Box */}
            <div className="w-full max-w-[200px] bg-zinc-950 border border-zinc-800 rounded-lg p-3 relative overflow-hidden">
                {/* Red State (Hallucination) - Fades Out */}
                <motion.div
                    className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-2"
                    animate={{ opacity: [1, 1, 0, 0, 1] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
                >
                    <ShieldAlert size={24} className="text-red-500 mb-2" />
                    <div className="w-full h-2 bg-red-900/30 rounded mb-1.5" />
                    <div className="w-3/4 h-2 bg-red-900/30 rounded" />
                    <span className="text-[9px] text-red-500 mt-2 font-bold tracking-widest">HALLUCINATION DETECTED</span>
                </motion.div>

                {/* Green State (Verified) - Fades In */}
                <motion.div
                    className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-2"
                    animate={{ opacity: [0, 0, 1, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                        <FileCheck size={16} className="text-emerald-500" />
                    </div>
                    <div className="w-full h-2 bg-emerald-900/30 rounded mb-1.5" />
                    <div className="w-3/4 h-2 bg-emerald-900/30 rounded" />
                    <span className="text-[9px] text-emerald-500 mt-2 font-bold tracking-widest">RAG VERIFIED</span>
                </motion.div>

                {/* Placeholder structure to keep height */}
                <div className="opacity-0">
                    <div className="h-8 w-8"/>
                    <div className="h-2 w-full my-1"/>
                    <div className="h-2 w-3/4"/>
                    <div className="h-4"/>
                </div>
            </div>
        </div>
    );
}

// 2. LOCAL EXECUTION: Shows an "Air Gap" (Disconnected Cloud)
const SkeletonLocalExecution = () => {
    return (
        <div className="flex w-full h-full items-center justify-center gap-8">

            {/* The Local Machine (On-Prem) */}
            <div className="relative w-20 h-24 bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col items-center justify-end p-3 shadow-2xl">
                {/* Active Indicator */}
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <Server size={32} className="text-zinc-400 mb-3" />
                <div className="w-full h-1.5 bg-zinc-800 rounded mb-1.5" />
                <div className="w-full h-1.5 bg-zinc-800 rounded mb-1.5" />
                <div className="text-[9px] text-emerald-500 font-bold mt-1 tracking-wider">LOCAL</div>
            </div>

            {/* The Connection (Severed) */}
            <div className="relative w-12 h-[1px] bg-zinc-800/50 flex items-center justify-center">
                <div className="absolute -top-4 text-red-500 text-lg font-bold">×</div>
            </div>

            {/* The Cloud (Disconnected) */}
            <div className="flex flex-col items-center justify-center opacity-30 grayscale blur-[1px]">
                <CloudOff size={36} className="text-zinc-500" />
                <span className="text-[9px] text-zinc-600 mt-2 font-bold tracking-wider">CLOUD</span>
            </div>

        </div>
    );
}

// 3. AGENTS: Interaction
const SkeletonAgents = () => {
    return (
        <div className="flex flex-col gap-6 items-center justify-center h-full w-full">
            <div className="flex items-center gap-4">
                {/* Agent 1 */}
                <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-lg"
                >
                    <Search size={20} className="text-blue-400" />
                </motion.div>

                {/* Arrow */}
                <motion.div
                    className="text-zinc-600"
                    animate={{ opacity: [0.2, 1, 0.2], x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    →
                </motion.div>

                {/* Agent 2 */}
                <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-lg"
                >
                    <Terminal size={20} className="text-purple-400" />
                </motion.div>
            </div>

            <div className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-mono">Orchestrating Logic...</span>
            </div>
        </div>
    );
};

// 4. SCANNING: Moving Line
const SkeletonScanning = () => {
    return (
        <div className="relative w-4/5 h-32 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden mx-auto my-auto flex flex-col gap-2.5 p-4 shadow-inner">
            {/* Fake Code Lines */}
            <div className="w-1/2 h-2.5 bg-zinc-800/80 rounded-sm" />
            <div className="w-3/4 h-2.5 bg-zinc-800/80 rounded-sm" />
            <div className="w-full h-2.5 bg-zinc-800/80 rounded-sm" />
            <div className="w-2/3 h-2.5 bg-zinc-800/80 rounded-sm" />
            <div className="w-1/3 h-2.5 bg-zinc-800/80 rounded-sm" />

            {/* Scanner Line */}
            <motion.div
                className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.9)] z-10"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
};

// 5. AUDIT: Typing Log
const SkeletonAudit = () => {
    return (
        <div className="w-full h-full p-6 font-mono text-[10px] sm:text-xs text-zinc-500 flex flex-col gap-2 overflow-hidden bg-zinc-950/50">
            <div className="flex gap-3 items-center">
                <span className="text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">INFO</span>
                <span>Initializing remediation agent...</span>
            </div>
            <div className="flex gap-3 items-center">
                <span className="text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">INFO</span>
                <span>Connecting to VectorDB instance...</span>
            </div>
            <div className="flex gap-3 items-center">
                <span className="text-orange-500 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded">WARN</span>
                <span>CVE-2024-89 detected in auth.ts</span>
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                className="flex gap-3 items-center"
            >
                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">DONE</span>
                <span className="text-zinc-300">Patch verified (latency: 24ms)</span>
            </motion.div>
        </div>
    );
};