import React from "react";
import { Timeline } from "@/components/ui/timeline";
import { Terminal, Database, ShieldCheck, GitPullRequest } from "lucide-react";

export function TimelineDemo() {
    const data = [
        {
            title: "1. Detection",
            content: (
                <div>
                    <p className="mb-4 text-neutral-300 text-sm font-normal leading-relaxed">
                        The process begins when our <span className="font-semibold text-blue-400">Scanner Agent</span> parses the Abstract Syntax Tree (AST) of your codebase. It identifies high-risk patterns like SQL Injection (CWE-89) or XSS (CWE-79) in real-time.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                        {/* Mock Terminal UI - Background Removed */}
                        <div className="rounded-lg border border-zinc-800 bg-transparent p-4 font-mono text-xs shadow-xl">
                            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2 text-zinc-500">
                                <Terminal size={12} />
                                <span>scanner_logs.txt</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-emerald-500">➜ system start --scan ./src</p>
                                <p className="text-zinc-400">Analyzing dependency graph...</p>
                                <p className="text-zinc-400">Parsing AST nodes...</p>
                                <p className="text-red-500 font-bold bg-red-500/10 inline-block px-1 rounded">
                                    [CRITICAL] CWE-89 Detected in auth.ts:42
                                </p>
                                <p className="text-zinc-500 pl-4">"SELECT * FROM users WHERE id = " + input</p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "2. Retrieval",
            content: (
                <div>
                    <p className="mb-4 text-neutral-300 text-sm font-normal leading-relaxed">
                        This is where RAG kicks in. The system queries your **Vector Database** to retrieve verified context. We fetch OWASP guidelines and similar historical patches from your own codebase to ground the AI.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                        {/* Mock RAG Card - Background Removed */}
                        <div className="rounded-lg border border-blue-500/20 bg-transparent p-4 shadow-xl">
                            <div className="flex items-center gap-2 mb-3 text-blue-400">
                                <Database size={16} />
                                <span className="font-semibold text-sm">Context Retrieved</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between bg-transparent p-2 rounded border border-zinc-800">
                                    <span className="text-xs text-zinc-300">OWASP_A03_Injection.md</span>
                                    <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded">98% Match</span>
                                </div>
                                <div className="flex items-center justify-between bg-transparent p-2 rounded border border-zinc-800">
                                    <span className="text-xs text-zinc-300">prev_patch_auth_v1.ts</span>
                                    <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded">94% Match</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "3. Remediation",
            content: (
                <div>
                    <p className="mb-4 text-neutral-300 text-sm font-normal leading-relaxed">
                        The <span className="font-semibold text-emerald-500">Fixing Agent</span> synthesizes the patch. Unlike standard LLMs, it uses the retrieved context to apply the correct "Parameterized Query" pattern, ensuring the fix is functional and secure.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                        {/* Mock Diff View - Background Removed */}
                        <div className="rounded-lg border border-zinc-800 bg-transparent overflow-hidden text-xs font-mono">
                            <div className="bg-red-900/10 border-l-2 border-red-500 p-2 text-red-200 opacity-60">
                                - const query = "SELECT * FROM users WHERE id = " + id;
                            </div>
                            <div className="bg-emerald-900/10 border-l-2 border-emerald-500 p-2 text-emerald-200">
                                + const query = "SELECT * FROM users WHERE id = ?";
                            </div>
                            <div className="bg-emerald-900/10 border-l-2 border-emerald-500 p-2 text-emerald-200">
                                + const result = await db.execute(query, [id]);
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "4. Verification",
            content: (
                <div>
                    <p className="mb-4 text-neutral-300 text-sm font-normal leading-relaxed">
                        Finally, the <span className="font-semibold text-purple-500">QA Agent</span> generates a regression test, runs it locally, and opens a Pull Request only if the tests pass and the vulnerability is neutralized.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Test Pass Card - Background Removed */}
                        <div className="rounded-lg border border-zinc-800 bg-transparent p-4 flex flex-col justify-between">
                            <div className="flex items-center gap-2 text-emerald-500 mb-2">
                                <ShieldCheck size={18} />
                                <span className="font-bold text-sm">Security Checks</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-full" />
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2">2/2 Regression tests passed</p>
                        </div>

                        {/* PR Card - Background Removed */}
                        <div className="rounded-lg border border-zinc-800 bg-transparent p-4 flex flex-col justify-between">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <GitPullRequest size={18} />
                                <span className="font-bold text-sm">Ready to Merge</span>
                            </div>
                            <div className="text-xs text-zinc-300 bg-transparent p-2 rounded border border-zinc-800">
                                feat: fix sql injection in auth
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
    ];
    return (
        <div className="w-full">
            <Timeline data={data} />
        </div>
    );
}