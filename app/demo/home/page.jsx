'use client'

import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { HomePage } from "@/components/home/home-page";

export default function DemoHomePage() {
    return (
        <PageErrorBoundary pageName="Home">
            <PageTransition pageKey="demo-home" variant="default">
                <HomePage />
            </PageTransition>
        </PageErrorBoundary>
    );
}
