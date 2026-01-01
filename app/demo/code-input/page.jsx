'use client'

import { useState, useEffect } from "react";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { CodeInput } from "@/components/dashboard/code-page/code-input";
import { useDemo } from "@/contexts/demoContext";
import { useProject } from "@/contexts/projectContext";

export default function DemoCodeInputPage() {
    const { DEMO_PROJECT_STRUCTURE, isCodeLocked, setIsCodeLocked } = useDemo();
    const { setProjectStructure, projectStructure, projectUnloaded } = useProject();
    
    const [code, setCode] = useState('');
    const [codeType, setCodeType] = useState("demo-sql-injection"); // Default to SQL injection category

    // Set demo project structure on mount if not already set (and not explicitly unloaded)
    useEffect(() => {
        if (!projectStructure && !projectUnloaded) {
            setProjectStructure(DEMO_PROJECT_STRUCTURE);
        }
    }, [projectStructure, setProjectStructure, DEMO_PROJECT_STRUCTURE, projectUnloaded]);

    return (
        <PageErrorBoundary pageName="Code input">
            <PageTransition pageKey="demo-code-input" variant="default">
                <CodeInput 
                    code={code} 
                    setCode={setCode} 
                    codeType={codeType} 
                    setCodeType={setCodeType} 
                    isLocked={isCodeLocked} 
                    onLockChange={setIsCodeLocked} 
                />
            </PageTransition>
        </PageErrorBoundary>
    );
}
