'use client'

import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { Results } from "@/components/dashboard/results-page/results";
import { useDemo } from "@/contexts/demoContext";

export default function DemoResultsPage() {
    const { currentDemoProject, getDemoResultsForRepo } = useDemo();

    const demoVulnerabilities = getDemoResultsForRepo(currentDemoProject);

    return (
        <PageErrorBoundary pageName="Results">
            <PageTransition pageKey="demo-results" variant="default">
                <div className="h-full flex flex-col">
                    <Results
                        vulnerabilities={demoVulnerabilities}
                        demoMode={true}
                    />
                </div>
            </PageTransition>
        </PageErrorBoundary>
    );
}
