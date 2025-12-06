"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useSettings } from "@/contexts/settingsContext"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { settings, updateSettings } = useSettings()

  const setLight = () => {
    if (!settings) return
    updateSettings({ ...settings, mode: "light" })
  }
  const setDark = () => {
    if (!settings) return
    updateSettings({ ...settings, mode: "dark" })
  }
  const setSystem = () => {
    if (!settings) return
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    updateSettings({ ...settings, mode: prefersDark ? "dark" : "light" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={setLight}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={setDark}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={setSystem}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
