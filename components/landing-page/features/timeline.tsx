import React from "react";

import { Timeline } from "@/components/ui/timeline";

import { Badge } from "@/components/ui/badge";

import { Card, CardContent } from "@/components/ui/card";

import { Terminal, Database, ShieldCheck, GitPullRequest } from "lucide-react";



export function TimelineDemo() {

    const data = [

        {

            title: `1. Detection`,

            content: (

                <div>

                    <p className="mb-4 text-muted-foreground text-sm font-normal leading-relaxed">

                        The process begins when our <span className="font-semibold text-muted-foreground">Scanner Agent</span> parses the Abstract Syntax Tree (AST) of your codebase. It identifies high-risk patterns like SQL Injection (CWE-89) or XSS (CWE-79) in real-time.

                    </p>

                    <div className="grid grid-cols-1 gap-4">

                        <Card className="">

                            <CardContent className="p-4 font-mono text-xs">

                                <div className="flex items-center gap-2 border-b border-border pb-2 mb-2 text-foreground">

                                    <Terminal size={12} />

                                    <span>scanner_logs.txt</span>

                                </div>

                                <div className="space-y-1">

                                    <p className="text-foreground">➜ system start --scan ./src</p>

                                    <p className="text-muted-foreground">Analyzing dependency graph...</p>

                                    <p className="text-muted-foreground">Parsing AST nodes...</p>

                                    <p className="text-destructive font-bold bg-destructive/10 inline-block px-1 rounded">

                                        [CRITICAL] CWE-89 Detected in auth.ts:42

                                    </p>

                                    <p className="text-foreground pl-4">&quot;SELECT * FROM users WHERE id = &quot; + input</p>

                                </div>

                            </CardContent>

                        </Card>

                    </div>

                </div>

            ),

        },

        {

            title: `2. Retrieval`,

            content: (

                <div>

                    <p className="mb-4 text-muted-foreground text-sm font-normal leading-relaxed">

                        This is where RAG kicks in. The system queries your **Vector Database** to retrieve verified context. We fetch OWASP guidelines and similar historical patches from your own codebase to ground the AI.

                    </p>

                    <div className="grid grid-cols-1 gap-4">

                        <Card className={undefined}>

                            <CardContent className="p-4">

                                <div className="flex items-center gap-2 mb-3 text-muted-foreground">

                                    <Database size={16} />

                                    <span className="font-semibold text-sm">Context Retrieved</span>

                                </div>

                                <div className="space-y-2">

                                    <div className="flex items-center justify-between bg-card p-2 rounded border border-border">

                                        <span className="text-xs text-foreground">OWASP_A03_Injection.md</span>

                                        <Badge variant="secondary" className="text-[10px]">98% Match</Badge>

                                    </div>

                                    <div className="flex items-center justify-between bg-card p-2 rounded border border-border">

                                        <span className="text-xs text-foreground">prev_patch_auth_v1.ts</span>

                                        <Badge variant="secondary" className="text-[10px]">94% Match</Badge>

                                    </div>

                                </div>

                            </CardContent>

                        </Card>

                    </div>

                </div>

            ),

        },

        {

            title: `3. Remediation`,

            content: (

                <div>

                    <p className="mb-4 text-muted-foreground text-sm font-normal leading-relaxed">

                        The <span className="font-semibold text-muted-foreground">Fixing Agent</span> synthesizes the patch. Unlike standard LLMs, it uses the retrieved context to apply the correct &quot;Parameterized Query&quot; pattern, ensuring the fix is functional and secure.

                    </p>

                    <div className="grid grid-cols-1 gap-4">

                        <Card className={undefined}>

                            <CardContent className="p-4 overflow-hidden text-xs font-mono">

                                <div className="bg-muted border-l-2 border-muted-foreground p-2 text-muted-foreground opacity-60">

                                    - const query = &quot;SELECT * FROM users WHERE id = &quot; + id;

                                </div>

                                <div className="bg-accent border-l-2 border-accent-foreground p-2 text-accent-foreground">

                                    + const query = &quot;SELECT * FROM users WHERE id = ?&quot;;

                                </div>

                                <div className="bg-accent border-l-2 border-accent-foreground p-2 text-accent-foreground">

                                    + const result = await db.execute(query, [id]);

                                </div>

                            </CardContent>

                        </Card>

                    </div>

                </div>

            ),

        },

        {

            title: `4. Verification`,

            content: (

                <div>

                    <p className="mb-4 text-muted-foreground text-sm font-normal leading-relaxed">

                        Finally, the <span className="font-semibold text-muted-foreground">QA Agent</span> generates a regression test, runs it locally, and opens a Pull Request only if the tests pass and the vulnerability is neutralized.

                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <Card className={undefined}>

                            <CardContent className="p-4 flex flex-col justify-between">

                                <div className="flex items-center gap-2 text-muted-foreground mb-2">

                                    <ShieldCheck size={18} />

                                    <span className="font-bold text-sm">Security Checks</span>

                                </div>

                                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">

                                    <div className="h-full bg-primary w-full" />

                                </div>

                                <p className="text-[10px] text-muted-foreground mt-2">2/2 Regression tests passed</p>

                            </CardContent>

                        </Card>



                        <Card className={undefined}>

                            <CardContent className="p-4 flex flex-col justify-between">

                                <div className="flex items-center gap-2 text-muted-foreground mb-2">

                                    <GitPullRequest size={18} />

                                    <span className="font-bold text-sm">Ready to Merge</span>

                                </div>

                                <div className="text-xs text-foreground bg-card p-2 rounded border border-border">

                                    feat: fix sql injection in auth

                                </div>

                            </CardContent>

                        </Card>

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