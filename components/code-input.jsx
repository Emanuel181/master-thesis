"use client"

import React, { useState } from "react"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/themes/prism.css" //Example style, you can use another

export function CodeInput() {
    const [code, setCode] = useState(
        `function add(a, b) {\n  return a + b;\n}`
    );

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex-1 rounded-xl bg-muted/50 p-4">
                <h2 className="text-lg font-semibold mb-4">Code Editor</h2>
                <div style={{
                    position: 'relative',
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                }}>
                    <Editor
                        value={code}
                        onValueChange={code => setCode(code)}
                        highlight={code => highlight(code, languages.js)}
                        padding={{ top: 10, bottom: 10, left: 40, right: 10 }}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                            lineHeight: '1.5',
                            backgroundColor: '#f5f5f5',
                        }}
                        preClassName="language-js"
                    />
                     <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                        lineHeight: '1.5',
                        color: '#999',
                        textAlign: 'right',
                        userSelect: 'none',
                    }}>
                        {code.split('\n').map((_, i) => (
                            <div key={i + 1}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

