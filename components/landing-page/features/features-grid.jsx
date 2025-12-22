"use client";

import { Lock, Search, Terminal, FileCheck, Server, ShieldAlert, CloudOff, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import React from "react";

export function FeaturesGrid() {
    return (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8 xl:grid-rows-2">

            {/* 1. ZERO HALLUCINATIONS (Top Left) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<FileCheck className="h-4 w-4" />}
                title="Zero Hallucinations"
                description="RAG verifies every generated patch against your trusted internal documentation."
                header={<SkeletonZeroHallucinations />}
            />

            {/* 2. LOCAL EXECUTION (Bottom Left) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<Server className="h-4 w-4" />}
                title="Local Execution"
                description="Air-gapped compatible. Run Llama on-premise; no data leaves your environment."
                header={<SkeletonLocalExecution />}
            />

            {/* 3. ROLE-BASED AGENTS (Center Tall) */}
            <GridItem
                area="md:col-span-12 xl:col-span-4 xl:row-span-2"
                icon={<Lock className="h-4 w-4" />}
                title="Role-Based Agents"
                description="Specialized agents for scanning, fixing, and testing ensure separation of concerns."
                header={<SkeletonAgents />}
            />

            {/* 4. REAL-TIME SCANNING (Top Right) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<Terminal className="h-4 w-4" />}
                title="Real-time Scanning"
                description="Continuous monitoring of new PRs against CVE databases."
                header={<SkeletonScanning />}
            />

            {/* 5. AUDIT TRAILS (Bottom Right) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<Search className="h-4 w-4" />}
                title="Audit Trails"
                description="Every AI decision is logged and cited for compliance."
                header={<SkeletonAudit />}
            />
        </ul>
    );
}

const GridItem = ({ area, icon, title, description, header }) => {
    return (
        <motion.li
            className={`min-h-[18rem] list-none ${area}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="relative h-full rounded-2xl border border-[#0e2736]/10 dark:border-[#1fb6cf]/10 bg-white dark:bg-[#0e2736]/50 p-6 transition-all duration-300 hover:border-[#1fb6cf]/30 hover:shadow-lg hover:shadow-[#1fb6cf]/5 group">
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#1fb6cf]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Content */}
                <div className="relative flex h-full flex-col gap-6">

                    {/* Visual header */}
                    <div className="relative flex-1 min-h-[8rem] w-full overflow-hidden rounded-xl bg-[#e6f4f7]/50 dark:bg-[#0a1c27]/50 border border-[#0e2736]/5 dark:border-[#1fb6cf]/10 flex items-center justify-center group-hover:border-[#1fb6cf]/20 transition-colors">
                        {header}
                    </div>

                    {/* Text content */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg border border-[#1fb6cf]/30 bg-[#1fb6cf]/10 flex items-center justify-center text-[#1fb6cf] group-hover:bg-[#1fb6cf]/20 transition-colors">
                                {icon}
                            </div>
                            <h3 className="font-semibold text-[#0e2736] dark:text-[#e6f4f7] text-lg">
                                {title}
                            </h3>
                        </div>
                        <p className="text-sm text-[#0e2736]/70 dark:text-[#e6f4f7]/60 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </motion.li>
    );
};


// --- REFINED ANIMATIONS ---

// 1. ZERO HALLUCINATIONS: Shows verification process
const SkeletonZeroHallucinations = () => {
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 gap-3">
            {/* Database indicator */}
            <div className="flex items-center gap-2 opacity-60">
                <Database size={12} className="text-[#0e2736] dark:text-[#1fb6cf]" />
                <div className="h-px w-8 bg-[#0e2736]/20 dark:bg-[#1fb6cf]/30" />
                <span className="text-[10px] text-[#0e2736]/60 dark:text-[#e6f4f7]/60 font-mono tracking-wider">VERIFIED</span>
            </div>

            {/* State animation */}
            <div className="w-full max-w-[160px] bg-white dark:bg-[#0a1c27] border border-[#0e2736]/10 dark:border-[#1fb6cf]/20 rounded-lg p-3 relative overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-white dark:bg-[#0a1c27] flex flex-col items-center justify-center p-2"
                    animate={{ opacity: [1, 1, 0, 0, 1] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
                >
                    <ShieldAlert size={20} className="text-[#0e2736]/40 dark:text-[#1fb6cf]/40 mb-2" />
                    <div className="w-full h-1.5 bg-[#e6f4f7] dark:bg-[#0e2736] rounded mb-1" />
                    <div className="w-3/4 h-1.5 bg-[#e6f4f7] dark:bg-[#0e2736] rounded" />
                    <span className="text-[8px] text-[#0e2736]/50 dark:text-[#e6f4f7]/50 mt-2 font-medium tracking-wider">CHECKING...</span>
                </motion.div>

                <motion.div
                    className="absolute inset-0 bg-white dark:bg-[#0a1c27] flex flex-col items-center justify-center p-2"
                    animate={{ opacity: [0, 0, 1, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
                >
                    <div className="w-6 h-6 rounded-full bg-[#1fb6cf]/20 flex items-center justify-center mb-2">
                        <FileCheck size={14} className="text-[#1fb6cf]" />
                    </div>
                    <div className="w-full h-1.5 bg-[#e6f4f7] dark:bg-[#0e2736] rounded mb-1" />
                    <div className="w-3/4 h-1.5 bg-[#e6f4f7] dark:bg-[#0e2736] rounded" />
                    <span className="text-[8px] text-[#1fb6cf] mt-2 font-medium tracking-wider">VERIFIED</span>
                </motion.div>

                <div className="opacity-0 flex flex-col items-center p-2">
                    <div className="h-6 w-6"/>
                    <div className="h-1.5 w-full my-1"/>
                    <div className="h-1.5 w-3/4"/>
                    <div className="h-3"/>
                </div>
            </div>
        </div>
    );
}

// 2. LOCAL EXECUTION: Shows air-gapped infrastructure
const SkeletonLocalExecution = () => {
    return (
        <div className="flex w-full h-full items-center justify-center gap-6 p-4">
            {/* Local server */}
            <div className="relative w-16 h-20 bg-white dark:bg-[#0a1c27] border border-[#0e2736]/10 dark:border-[#1fb6cf]/20 rounded-lg flex flex-col items-center justify-end p-2">
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#1fb6cf] rounded-full" />
                <Server size={24} className="text-[#0e2736]/60 dark:text-[#1fb6cf] mb-2" />
                <div className="w-full h-1 bg-[#e6f4f7] dark:bg-[#0e2736] rounded mb-1" />
                <div className="w-full h-1 bg-[#e6f4f7] dark:bg-[#0e2736] rounded" />
                <span className="text-[8px] text-[#0e2736]/60 dark:text-[#e6f4f7]/60 font-medium mt-1 tracking-wide">LOCAL</span>
            </div>

            {/* Disconnection indicator */}
            <div className="relative w-8 h-px bg-[#0e2736]/20 dark:bg-[#1fb6cf]/30 flex items-center justify-center">
                <span className="absolute text-[#0e2736]/40 dark:text-[#e6f4f7]/40 text-sm font-medium">×</span>
            </div>

            {/* Cloud (disabled) */}
            <div className="flex flex-col items-center justify-center opacity-30">
                <CloudOff size={28} className="text-[#0e2736] dark:text-[#e6f4f7]" />
                <span className="text-[8px] text-[#0e2736] dark:text-[#e6f4f7] mt-1.5 font-medium tracking-wide">CLOUD</span>
            </div>

        </div>
    );
}

// 3. AGENTS: Interaction
const SkeletonAgents = () => {
    return (
        <div className="flex flex-col gap-5 items-center justify-center h-full w-full p-4">
            <div className="flex items-center gap-4">
                {/* Agent 1 */}
                <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-10 h-10 rounded-full bg-white dark:bg-[#0a1c27] border border-[#0e2736]/10 dark:border-[#1fb6cf]/20 flex items-center justify-center"
                >
                    <Search size={16} className="text-[#0e2736]/60 dark:text-[#1fb6cf]" />
                </motion.div>

                {/* Arrow */}
                <motion.div
                    className="text-[#0e2736]/30 dark:text-[#1fb6cf]/40"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    →
                </motion.div>

                {/* Agent 2 */}
                <motion.div
                    animate={{ y: [0, 3, 0] }}
                    transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-10 h-10 rounded-full bg-white dark:bg-[#0a1c27] border border-[#0e2736]/10 dark:border-[#1fb6cf]/20 flex items-center justify-center"
                >
                    <Terminal size={16} className="text-[#0e2736]/60 dark:text-[#1fb6cf]" />
                </motion.div>
            </div>

            <div className="px-3 py-1 bg-white dark:bg-[#0a1c27] rounded-full border border-[#0e2736]/10 dark:border-[#1fb6cf]/20">
                <span className="text-[9px] text-[#0e2736]/60 dark:text-[#e6f4f7]/60 font-medium tracking-wide">ORCHESTRATING</span>
            </div>
        </div>
    );
};

// 4. SCANNING: Moving Line
const SkeletonScanning = () => {
    return (
        <div className="relative w-4/5 h-28 bg-white dark:bg-[#0a1c27] border border-[#0e2736]/10 dark:border-[#1fb6cf]/20 rounded-lg overflow-hidden mx-auto my-auto flex flex-col gap-2 p-4">
            {/* Code lines */}
            <div className="w-1/2 h-2 bg-[#e6f4f7] dark:bg-[#0e2736] rounded-sm" />
            <div className="w-3/4 h-2 bg-[#e6f4f7] dark:bg-[#0e2736] rounded-sm" />
            <div className="w-full h-2 bg-[#e6f4f7] dark:bg-[#0e2736] rounded-sm" />
            <div className="w-2/3 h-2 bg-[#e6f4f7] dark:bg-[#0e2736] rounded-sm" />
            <div className="w-1/3 h-2 bg-[#e6f4f7] dark:bg-[#0e2736] rounded-sm" />

            {/* Scanner Line */}
            <motion.div
                className="absolute top-0 left-0 w-full h-[2px] bg-[#1fb6cf] z-10"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
};

// 5. AUDIT: Log entries
const SkeletonAudit = () => {
    return (
        <div className="w-full h-full p-4 font-mono text-[10px] text-[#0e2736]/70 dark:text-[#e6f4f7]/70 flex flex-col gap-2 overflow-hidden">
            <div className="flex gap-2 items-center">
                <span className="px-1.5 py-0.5 bg-[#e6f4f7] dark:bg-[#0e2736] text-[#0e2736]/70 dark:text-[#e6f4f7]/70 rounded text-[9px] font-medium">INFO</span>
                <span>Initializing agent...</span>
            </div>
            <div className="flex gap-2 items-center">
                <span className="px-1.5 py-0.5 bg-[#e6f4f7] dark:bg-[#0e2736] text-[#0e2736]/70 dark:text-[#e6f4f7]/70 rounded text-[9px] font-medium">INFO</span>
                <span>Connecting to VectorDB...</span>
            </div>
            <div className="flex gap-2 items-center">
                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded text-[9px] font-medium">WARN</span>
                <span className="text-orange-600 dark:text-orange-400">CVE-2024-89 detected</span>
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                className="flex gap-2 items-center"
            >
                <span className="px-1.5 py-0.5 bg-[#1fb6cf]/20 text-[#1fb6cf] rounded text-[9px] font-medium">DONE</span>
                <span className="text-[#1fb6cf]">Patch verified</span>
            </motion.div>
        </div>
    );
};