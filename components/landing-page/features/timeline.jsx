import React from "react";

import { Timeline } from "../timeline";


import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";

import { Terminal, Database, ShieldCheck, GitPullRequest, FileCode, FileText, AlertTriangle, Bug } from "lucide-react";



export function TimelineDemo() {

    const data = [

        {

            title: `1. Detection`,

            content: (

                <div>

                    <p className="mb-4 text-[#0e2736]/70 dark:text-[#e6f4f7]/70 text-sm font-normal leading-relaxed">

                        The process begins when our <span className="font-semibold text-[#0e2736] dark:text-[#e6f4f7]">Scanner Agent</span> parses the Abstract Syntax Tree (AST) of your codebase. It identifies high-risk patterns like SQL Injection (CWE-89) or XSS (CWE-79) in real-time.

                    </p>

                    <div className="grid grid-cols-1 gap-4">

                        <Command className="rounded-lg border shadow-md bg-[#232323] text-white">

                            <CommandInput placeholder="Type a command or search..." />

                            <CommandList>

                                <CommandGroup heading="Suggestions">

                                    <CommandItem>

                                        <Terminal className="mr-2 h-4 w-4" />

                                        <span>Analyzing dependency graph...</span>

                                    </CommandItem>

                                    <CommandItem>

                                        <FileCode className="mr-2 h-4 w-4" />

                                        <span>Parsing AST nodes...</span>

                                    </CommandItem>

                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="Settings">

                                    <CommandItem>

                                        <AlertTriangle className="mr-2 h-4 w-4" />

                                        <span>[CRITICAL] CWE-89 in auth.ts:42</span>

                                        <CommandShortcut>⌘1</CommandShortcut>

                                    </CommandItem>

                                    <CommandItem>

                                        <Bug className="mr-2 h-4 w-4" />

                                        <span>SQL Injection detected</span>

                                        <CommandShortcut>⌘2</CommandShortcut>

                                    </CommandItem>

                                </CommandGroup>

                            </CommandList>

                        </Command>

                    </div>

                </div>

            ),

        },

        {

            title: `2. Retrieval`,

            content: (

                <div>

                    <p className="mb-4 text-[#0e2736]/70 dark:text-[#e6f4f7]/70 text-sm font-normal leading-relaxed">

                        This is where RAG kicks in. The system queries your <span className="font-semibold text-[#0e2736] dark:text-[#e6f4f7]">Vector Database</span> to retrieve verified context. We fetch OWASP guidelines and similar historical patches from your own codebase to ground the AI.

                    </p>

                    <div className="grid grid-cols-1 gap-4">

                        <Command className="rounded-lg border shadow-md bg-[#232323] text-white">

                            <CommandInput placeholder="Search knowledge base..." />

                            <CommandList>

                                <CommandEmpty>No results found.</CommandEmpty>

                                <CommandGroup heading="Suggestions">

                                    <CommandItem>

                                        <FileText className="mr-2 h-4 w-4" />

                                        <span>OWASP_A03_Injection.md</span>

                                        <CommandShortcut>98%</CommandShortcut>

                                    </CommandItem>

                                    <CommandItem>

                                        <FileCode className="mr-2 h-4 w-4" />

                                        <span>prev_patch_auth_v1.ts</span>

                                        <CommandShortcut>94%</CommandShortcut>

                                    </CommandItem>

                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="Settings">

                                    <CommandItem>

                                        <Database className="mr-2 h-4 w-4" />

                                        <span>CWE-89_mitigation_guide.md</span>

                                        <CommandShortcut>91%</CommandShortcut>

                                    </CommandItem>

                                </CommandGroup>

                            </CommandList>

                        </Command>

                    </div>

                </div>

            ),

        },

        {

            title: `3. Remediation`,

            content: (

                <div>

                    <p className="mb-4 text-[#0e2736]/70 dark:text-[#e6f4f7]/70 text-sm font-normal leading-relaxed">

                        The <span className="font-semibold text-[#0e2736] dark:text-[#e6f4f7]">Fixing Agent</span> synthesizes the patch. Unlike standard LLMs, it uses the retrieved context to apply the correct &quot;Parameterized Query&quot; pattern, ensuring the fix is functional and secure.

                    </p>

                    <div className="grid grid-cols-1 gap-4">

                        <div className="rounded-lg border border-[#0e2736]/10 dark:border-[#1fb6cf]/20 bg-white dark:bg-[#0e2736]/50 overflow-hidden">

                            <div className="p-4 overflow-hidden text-xs font-mono">

                                <div className="bg-red-500/10 border-l-2 border-red-500 p-2 text-[#0e2736]/50 dark:text-[#e6f4f7]/50">

                                    - const query = &quot;SELECT * FROM users WHERE id = &quot; + id;

                                </div>

                                <div className="bg-[#1fb6cf]/10 border-l-2 border-[#1fb6cf] p-2 text-[#0e2736] dark:text-[#e6f4f7]">

                                    + const query = &quot;SELECT * FROM users WHERE id = ?&quot;;

                                </div>

                                <div className="bg-[#1fb6cf]/10 border-l-2 border-[#1fb6cf] p-2 text-[#0e2736] dark:text-[#e6f4f7]">

                                    + const result = await db.execute(query, [id]);

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            ),

        },

        {

            title: `4. Verification`,

            content: (

                <div>

                    <p className="mb-4 text-[#0e2736]/70 dark:text-[#e6f4f7]/70 text-sm font-normal leading-relaxed">

                        Finally, the <span className="font-semibold text-[#0e2736] dark:text-[#e6f4f7]">QA agent</span> generates a regression test, runs it locally, and opens a Pull Request only if the tests pass and the vulnerability is neutralized.

                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="rounded-lg border border-[#0e2736]/10 dark:border-[#1fb6cf]/20 bg-white dark:bg-[#0e2736]/50 overflow-hidden">

                            <div className="p-4 flex flex-col justify-between">

                                <div className="flex items-center gap-2 text-[#0e2736]/70 dark:text-[#e6f4f7]/70 mb-2">

                                    <ShieldCheck size={18} />

                                    <span className="font-bold text-sm">Security Checks</span>

                                </div>

                                <div className="w-full bg-[#e6f4f7] dark:bg-[#0a1c27] h-1.5 rounded-full overflow-hidden">

                                    <div className="h-full bg-[#1fb6cf] w-full" />

                                </div>

                                <p className="text-xs text-[#0e2736]/60 dark:text-[#e6f4f7]/60 mt-2">2/2 Regression tests passed</p>

                            </div>

                        </div>



                        <div className="rounded-lg border border-[#0e2736]/10 dark:border-[#1fb6cf]/20 bg-white dark:bg-[#0e2736]/50 overflow-hidden">

                            <div className="p-4 flex flex-col justify-between">

                                <div className="flex items-center gap-2 text-[#0e2736]/70 dark:text-[#e6f4f7]/70 mb-2">

                                    <GitPullRequest size={18} />

                                    <span className="font-bold text-sm">Ready to Merge</span>

                                </div>

                                <div className="text-xs text-[#0e2736] dark:text-[#e6f4f7] bg-[#e6f4f7]/50 dark:bg-[#0a1c27]/50 p-2 rounded border border-[#0e2736]/5 dark:border-[#1fb6cf]/10">

                                    feat: fix sql injection in auth

                                </div>

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