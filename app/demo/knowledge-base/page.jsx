'use client'

import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import KnowledgeBaseVisualization from "@/components/dashboard/knowledge-base-page/knowledge-base-visualization";

export default function DemoKnowledgeBasePage() {
    return (
        <PageErrorBoundary pageName="Knowledge base">
            <PageTransition pageKey="demo-knowledge-base" variant="default">
                <KnowledgeBaseVisualization />
            </PageTransition>
        </PageErrorBoundary>
    );
}
