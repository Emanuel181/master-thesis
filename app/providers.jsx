"use client"

import { SessionProvider } from "next-auth/react"
import { SettingsProvider } from "@/contexts/settingsContext"
import { UseCasesProvider } from "@/contexts/useCasesContext"
import { PromptsProvider } from "@/contexts/promptsContext"
import { AccessibilityProvider } from "@/contexts/accessibilityContext"
import { AccessibilityWidget } from "@/components/accessibility-widget"
import { DemoProvider } from "@/contexts/demoContext"
import { AuthProvider } from "@/components/auth/auth-provider"

export function Providers({ children }) {
    return (
        <AuthProvider>
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
        </AuthProvider>
    )
}
