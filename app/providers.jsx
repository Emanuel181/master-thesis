"use client"

import { SessionProvider } from "next-auth/react"
import { SettingsProvider } from "@/contexts/settingsContext"

export function Providers({ children }) {
    return (
        <SessionProvider>
            <SettingsProvider>
                {children}
            </SettingsProvider>
        </SessionProvider>
    )
}
