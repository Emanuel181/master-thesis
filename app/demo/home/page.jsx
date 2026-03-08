'use client'

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { HomePage } from "@/components/home/home-page";

export default function DemoHomePage() {
    const router = useRouter();

    const handleNavigation = useCallback((item) => {
        if (item.title === "Workflow configuration") {
            // Dispatch event so the layout's ModelsDialog opens
            window.dispatchEvent(new CustomEvent("open-workflow-config"));
            return;
        }
        if (item.title === "Feedback") {
            window.dispatchEvent(new CustomEvent("open-feedback"));
            return;
        }

        if (item.title === "Home" || item.title === "Dashboard") {
            router.push('/demo/home');
            return;
        }

        const routeMap = {
            'Code inspection': '/demo/code-input',
            'Knowledge base': '/demo/knowledge-base',
            'Results': '/demo/results',
            'Profile': '/demo/profile',
            'Write article': '/demo/write-article',
        };
        const route = routeMap[item.title];
        if (route) router.push(route);
    }, [router]);

    return (
        <PageErrorBoundary pageName="Home">
            <PageTransition pageKey="demo-home" variant="default">
                <HomePage onNavigate={handleNavigation} />
            </PageTransition>
        </PageErrorBoundary>
    );
}
