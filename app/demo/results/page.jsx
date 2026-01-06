'use client'

import { useRouter } from "next/navigation";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function DemoResultsPage() {
    const router = useRouter();

    return (
        <PageErrorBoundary pageName="Results">
            <PageTransition pageKey="demo-results" variant="default">
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Results Not Available in Demo</h2>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                            The Results page displays real vulnerability analysis results after running 
                            AI-powered security scans on your code. Sign up to experience the full 
                            VulnIQ workflow and get actionable remediation insights.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button onClick={() => router.push('/login')} className="gap-2">
                                Get started
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/demo/code-input')}>
                                Explore Code Input
                            </Button>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </PageErrorBoundary>
    );
}
