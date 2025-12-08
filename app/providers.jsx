"use client"

import { SessionProvider } from "next-auth/react"
import { SettingsProvider } from "@/contexts/settingsContext"
import { UseCasesProvider } from "@/contexts/useCasesContext"
import { PromptsProvider } from "@/contexts/promptsContext"

export function Providers({ children }) {
    return (
        <SessionProvider>
            <SettingsProvider>
                <UseCasesProvider>
                    <PromptsProvider>
                        {children}
                    </PromptsProvider>
                </UseCasesProvider>
            </SettingsProvider>
        </SessionProvider>
    )
}
