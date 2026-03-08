'use client'

import { useState, useEffect } from "react";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { CodeInput } from "@/components/dashboard/code-page/code-input";
import { DEMO_VULNERABILITIES } from "@/contexts/demoContext";
import { useProject } from "@/contexts/projectContext";

// Demo mode localStorage keys for repo connections
const DEMO_GITHUB_KEY = 'vulniq_demo_github_connected';
const DEMO_GITLAB_KEY = 'vulniq_demo_gitlab_connected';

export default function DemoCodeInputPage() {
    const { projectStructure, clearProject, currentRepo, setFileVulnerabilities } = useProject();

    const [code, setCode] = useState('');
    const [codeType, setCodeType] = useState("demo-sql-injection"); // Default to SQL injection category

    // Populate demo vulnerabilities when a project is loaded
    useEffect(() => {
        if (projectStructure) {
            setFileVulnerabilities(DEMO_VULNERABILITIES);
        }
    }, [projectStructure, setFileVulnerabilities]);

    // Clear project if no repo is connected in demo mode
    useEffect(() => {
        const isGithubConnected = localStorage.getItem(DEMO_GITHUB_KEY) === 'true';
        const isGitlabConnected = localStorage.getItem(DEMO_GITLAB_KEY) === 'true';

        let shouldClear = false;

        if (projectStructure && !isGithubConnected && !isGitlabConnected) {
            shouldClear = true;
        }

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
        <PageErrorBoundary pageName="Code inspection">
            <PageTransition pageKey="demo-code-input" variant="default">
                <CodeInput
                    code={code}
                    setCode={setCode}
                    codeType={codeType}
                    setCodeType={setCodeType}
                />
            </PageTransition>
        </PageErrorBoundary>
    );
}
