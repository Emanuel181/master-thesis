'use client'

import { useState, useEffect } from "react";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { CodeInput } from "@/components/dashboard/code-page/code-input";
import { useDemo, DEMO_CODE } from "@/contexts/demoContext";
import { useProject } from "@/contexts/projectContext";

export default function DemoCodeInputPage() {
    const { DEMO_PROJECT_STRUCTURE } = useDemo();
    const { setProjectStructure, projectStructure } = useProject();
    
    const [code, setCode] = useState(DEMO_CODE);
    const [codeType, setCodeType] = useState("demo-sql-injection"); // Default to SQL injection category
    const [isLocked, setIsLocked] = useState(true); // Pre-locked for demo

    // Set demo project structure on mount if not already set
    useEffect(() => {
        if (!projectStructure) {
            setProjectStructure(DEMO_PROJECT_STRUCTURE);
        }
    }, [projectStructure, setProjectStructure, DEMO_PROJECT_STRUCTURE]);

    return (
        <PageErrorBoundary pageName="Code input">
            <PageTransition pageKey="demo-code-input" variant="default">
                <CodeInput 
                    code={code} 
                    setCode={setCode} 
                    codeType={codeType} 
                    setCodeType={setCodeType} 
                    isLocked={isLocked} 
                    onLockChange={setIsLocked} 
                />
            </PageTransition>
        </PageErrorBoundary>
    );
}
