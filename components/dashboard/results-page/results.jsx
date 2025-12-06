"use client"

import { DataTable } from "./data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/themes/prism.css";
import "@/app/github-theme.css";

export function Results({ initialCode, problems = [], generatedCode = "" }) {
    const hasResults = initialCode && initialCode.trim().length > 0


    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Initial Code</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {hasResults ? (
                                <div className="relative">
                                    <Editor
                                        value={initialCode}
                                        onValueChange={() => {}}
                                        highlight={code => highlight(code, languages.js)}
                                        padding={{ top: 10, bottom: 10, left: 40, right: 10 }}
                                        style={{
                                            fontFamily: '"Fira code", "Fira Mono", monospace',
                                            fontSize: 16,
                                            lineHeight: '1.6',
                                        }}
                                        readOnly
                                        preClassName="language-js"
                                    />
                                    <div className="absolute top-2.5 left-2.5 bottom-2.5 text-right select-none text-foreground/50" style={{ fontFamily: '"Fira code", "Fira Mono", monospace', fontSize: 16, lineHeight: '1.6' }}>
                                        {initialCode.split('\n').map((_, i) => (
                                            <div key={i + 1}>{i + 1}</div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-12 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No code has been submitted for analysis yet.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Problems</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!hasResults ? (
                                <div className="flex items-center justify-center py-12 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Security analysis will appear here after code review.
                                    </p>
                                </div>
                            ) : problems.length === 0 ? (
                                <div className="flex items-center justify-center py-12 text-center">
                                    <p className="text-sm text-muted-foreground">
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
                    <CardHeader>
                        <CardTitle>Generated Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!hasResults ? (
                            <div className="flex items-center justify-center py-12 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Improved code will be generated here after analysis.
                                </p>
                            </div>
                        ) : generatedCode ? (
                            <div className="relative">
                                <Editor
                                    value={generatedCode}
                                    onValueChange={() => {}}
                                    highlight={code => highlight(code, languages.js)}
                                    padding={{ top: 10, bottom: 10, left: 40, right: 10 }}
                                    style={{
                                        fontFamily: '"Fira code", "Fira Mono", monospace',
                                        fontSize: 16,
                                        lineHeight: '1.6',
                                    }}
                                    readOnly
                                    preClassName="language-js"
                                />
                                <div className="absolute top-2.5 left-2.5 bottom-2.5 text-right select-none text-foreground/50" style={{ fontFamily: '"Fira code", "Fira Mono", monospace', fontSize: 16, lineHeight: '1.6' }}>
                                    {generatedCode.split('\n').map((_, i) => (
                                        <div key={i + 1}>{i + 1}</div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-12 text-center">
                                <p className="text-sm text-muted-foreground">
                                    No code improvements generated yet.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

