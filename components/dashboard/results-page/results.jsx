"use client"

import { DataTable } from "./data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/themes/prism.css";
import "@/app/github-theme.css";

export function Results({ initialCode, problems = [], generatedCode = "" }) {
    const hasResults = initialCode && initialCode.trim().length > 0


    return (
        <ScrollArea className="flex-1 h-full">
            <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 pt-0 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                <div className="grid gap-3 sm:gap-6">
                    <Card>
                        <CardHeader className="py-3 sm:py-4 px-3 sm:px-6">
                            <CardTitle className="text-sm sm:text-base md:text-lg">Initial Code</CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                            {hasResults ? (
                                <div className="relative overflow-x-auto">
                                    <Editor
                                        value={initialCode}
                                        onValueChange={() => {}}
                                        highlight={code => highlight(code, languages.js)}
                                        padding={{ top: 10, bottom: 10, left: 40, right: 10 }}
                                        style={{
                                            fontFamily: '"Fira code", "Fira Mono", monospace',
                                            fontSize: 'clamp(12px, 2.5vw, 16px)',
                                            lineHeight: '1.6',
                                        }}
                                        readOnly
                                        preClassName="language-js"
                                    />
                                    <div className="absolute top-2.5 left-2.5 bottom-2.5 text-right select-none text-foreground/50 text-[clamp(12px,2.5vw,16px)]" style={{ fontFamily: '"Fira code", "Fira Mono", monospace', lineHeight: '1.6' }}>
                                        {initialCode.split('\n').map((_, i) => (
                                            <div key={i + 1}>{i + 1}</div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-8 sm:py-12 text-center">
                                    <p className="text-xs sm:text-sm text-muted-foreground px-4">
                                        No code has been submitted for analysis yet.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-3 sm:py-4 px-3 sm:px-6">
                            <CardTitle className="text-sm sm:text-base md:text-lg">Security Problems</CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                            {!hasResults ? (
                                <div className="flex items-center justify-center py-8 sm:py-12 text-center">
                                    <p className="text-xs sm:text-sm text-muted-foreground px-4">
                                        Security analysis will appear here after code review.
                                    </p>
                                </div>
                            ) : problems.length === 0 ? (
                                <div className="flex items-center justify-center py-8 sm:py-12 text-center">
                                    <p className="text-xs sm:text-sm text-muted-foreground px-4">
                                        ✓ No security issues detected in your code.
                                    </p>
                                </div>
                            ) : (
                                <DataTable data={problems} />
                            )}
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader className="py-3 sm:py-4 px-3 sm:px-6">
                        <CardTitle className="text-sm sm:text-base md:text-lg">Generated Code</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        {!hasResults ? (
                            <div className="flex items-center justify-center py-8 sm:py-12 text-center">
                                <p className="text-xs sm:text-sm text-muted-foreground px-4">
                                    Improved code will be generated here after analysis.
                                </p>
                            </div>
                        ) : generatedCode ? (
                            <div className="relative overflow-x-auto">
                                <Editor
                                    value={generatedCode}
                                    onValueChange={() => {}}
                                    highlight={code => highlight(code, languages.js)}
                                    padding={{ top: 10, bottom: 10, left: 40, right: 10 }}
                                    style={{
                                        fontFamily: '"Fira code", "Fira Mono", monospace',
                                        fontSize: 'clamp(12px, 2.5vw, 16px)',
                                        lineHeight: '1.6',
                                    }}
                                    readOnly
                                    preClassName="language-js"
                                />
                                <div className="absolute top-2.5 left-2.5 bottom-2.5 text-right select-none text-foreground/50 text-[clamp(12px,2.5vw,16px)]" style={{ fontFamily: '"Fira code", "Fira Mono", monospace', lineHeight: '1.6' }}>
                                    {generatedCode.split('\n').map((_, i) => (
                                        <div key={i + 1}>{i + 1}</div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8 sm:py-12 text-center">
                                <p className="text-xs sm:text-sm text-muted-foreground px-4">
                                    No code improvements generated yet.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
        </ScrollArea>
    )
}

