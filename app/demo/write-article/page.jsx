'use client'

import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { DemoArticleEditor } from "@/components/dashboard/article-editor/demo-article-editor";

export default function DemoWriteArticlePage() {
    return (
        <PageErrorBoundary pageName="Write Article">
            <PageTransition pageKey="demo-write-article" variant="default">
                <DemoArticleEditor />
            </PageTransition>
        </PageErrorBoundary>
    );
}
