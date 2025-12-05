"use client";
import { Box, Lock, Search, Settings, Sparkles, Server, Shield, Database } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export function FeaturesGrid() {
    return (
        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
            <GridItem
                area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
                icon={<Shield className="h-4 w-4 text-zinc-300" />}
                title="Zero Hallucinations"
                description="By grounding LLMs with RAG, we reduce false positives and broken code generation significantly."
            />
            <GridItem
                area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
                icon={<Server className="h-4 w-4 text-zinc-300" />}
                title="Local Execution"
                description="Run Llama 3 or Mistral on-prem. Your source code never has to leave your infrastructure for analysis."
            />
            <GridItem
                area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
                icon={<Lock className="h-4 w-4 text-zinc-300" />}
                title="Role-Based Agents"
                description="Specialized agents for scanning, fixing, and testing ensure separation of concerns and higher accuracy."
            />
            <GridItem
                area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
                icon={<Database className="h-4 w-4 text-zinc-300" />}
                title="CVE Database Sync"
                description="Automatically updated with the latest vulnerabilities from the National Vulnerability Database."
            />
            <GridItem
                area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
                icon={<Search className="h-4 w-4 text-zinc-300" />}
                title="Audit Trails"
                description="Every decision made by the AI is logged, explained, and cited for compliance reviews."
            />
        </ul>
    );
}

const GridItem = ({ area, icon, title, description }: any) => {
    return (
        <li className={`min-h-[14rem] list-none ${area}`}>
            <div className="relative h-full rounded-2xl border border-zinc-800 p-2 md:rounded-3xl md:p-3 bg-zinc-900/20">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-0.75 p-6 md:p-6 shadow-[0px_0px_27px_0px_#2D2D2D] bg-zinc-950/80">
                    <div className="relative flex flex-1 flex-col justify-between gap-3">
                        <div className="w-fit rounded-lg border border-zinc-700 p-2 bg-zinc-800/50">
                            {icon}
                        </div>
                        <div className="space-y-3">
                            <h3 className="pt-0.5 font-sans text-xl font-semibold text-white">
                                {title}
                            </h3>
                            <h2 className="font-sans text-sm text-zinc-400">
                                {description}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};