"use client"

import { SessionProvider } from "next-auth/react"
import { SettingsProvider } from "@/contexts/settingsContext"
import { UseCasesProvider } from "@/contexts/useCasesContext"

export function Providers({ children }) {
    return (
        <SessionProvider>
            <SettingsProvider>
                <UseCasesProvider>
                    {children}
                </UseCasesProvider>
            </SettingsProvider>
        </SessionProvider>
    )
}
