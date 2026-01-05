'use client'

import { useState, useEffect } from "react";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { CodeInput } from "@/components/dashboard/code-page/code-input";
import { useDemo } from "@/contexts/demoContext";
import { useProject } from "@/contexts/projectContext";

// Demo mode localStorage keys for repo connections
const DEMO_GITHUB_KEY = 'vulniq_demo_github_connected';
const DEMO_GITLAB_KEY = 'vulniq_demo_gitlab_connected';

export default function DemoCodeInputPage() {
    const { isCodeLocked, setIsCodeLocked } = useDemo();
    const { projectStructure, clearProject, currentRepo } = useProject();
    
    const [code, setCode] = useState('');
    const [codeType, setCodeType] = useState("demo-sql-injection"); // Default to SQL injection category

    // Clear project if no repo is connected in demo mode
    // This ensures realistic behavior - no project without a connected repo
    // Run once on mount and when project/repo changes
    useEffect(() => {
        const isGithubConnected = localStorage.getItem(DEMO_GITHUB_KEY) === 'true';
        const isGitlabConnected = localStorage.getItem(DEMO_GITLAB_KEY) === 'true';
        
        let shouldClear = false;
        
        // If there's a project but no repo connection, clear it
        if (projectStructure && !isGithubConnected && !isGitlabConnected) {
            shouldClear = true;
        }
        
        // If there's a project from a provider that's no longer connected, clear it
        if (currentRepo) {
            if (currentRepo.provider === 'github' && !isGithubConnected) {
                shouldClear = true;
            } else if (currentRepo.provider === 'gitlab' && !isGitlabConnected) {
                shouldClear = true;
            }
        }
        
        if (shouldClear) {
            clearProject();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectStructure, currentRepo]);

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
