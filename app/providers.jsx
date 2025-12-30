"use client"

import { SessionProvider } from "next-auth/react"
import { SettingsProvider } from "@/contexts/settingsContext"
import { UseCasesProvider } from "@/contexts/useCasesContext"
import { PromptsProvider } from "@/contexts/promptsContext"
import { AccessibilityProvider } from "@/contexts/accessibilityContext"
import { AccessibilityWidget } from "@/components/accessibility-widget"
import { DemoProvider } from "@/contexts/demoContext"

export function Providers({ children }) {
    return (
        <SessionProvider>
            <DemoProvider>
                <SettingsProvider>
                    <UseCasesProvider>
                        <PromptsProvider>
                            <AccessibilityProvider>
                                {children}
                                <AccessibilityWidget />
                            </AccessibilityProvider>
                        </PromptsProvider>
                    </UseCasesProvider>
                </SettingsProvider>
            </DemoProvider>
        </SessionProvider>
    )
}
