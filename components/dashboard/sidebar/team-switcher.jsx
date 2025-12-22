"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
                                 team,
                             }) {
    const router = useRouter()

    if (!team) {
        return null
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    onClick={() => router.push("/")}
                    className="cursor-pointer"
                >
                    <Image src={team.logo} width={32} height={32} alt="" className="size-8 rounded-lg" />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{team.name}</span>
                        <span className="truncate text-xs">{team.plan}</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}