'use client'

import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { DemoArticleEditor } from "@/components/dashboard/article-editor/demo-article-editor";

export function DemoWriteArticleClient() {
    return (
        <PageErrorBoundary pageName="Write article">
            <PageTransition pageKey="demo-write-article" variant="default">
                <DemoArticleEditor />
            </PageTransition>
        </PageErrorBoundary>
    );
}
