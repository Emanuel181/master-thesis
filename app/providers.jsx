"use client"

import { SessionProvider } from "next-auth/react"
import { SettingsProvider } from "@/contexts/settingsContext"
import { UseCasesProvider } from "@/contexts/useCasesContext"
import { PromptsProvider } from "@/contexts/promptsContext"
import { AccessibilityProvider } from "@/contexts/accessibilityContext"
import { AccessibilityWidget } from "@/components/accessibility-widget"
import { DemoProvider } from "@/contexts/demoContext"
import { KbSelectionProvider } from "@/contexts/kbSelectionContext"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children, session }) {
    return (
            <SessionProvider session={session}>
                <DemoProvider>
                    <SettingsProvider>
                        <UseCasesProvider>
                            <PromptsProvider>
                                <KbSelectionProvider>
                                    <AccessibilityProvider>
                                        <TooltipProvider>
                                            {children}
                                            <AccessibilityWidget />
                                        </TooltipProvider>
                                    </AccessibilityProvider>
                                </KbSelectionProvider>
                            </PromptsProvider>
                        </UseCasesProvider>
                    </SettingsProvider>
                </DemoProvider>
            </SessionProvider>
    )
}
