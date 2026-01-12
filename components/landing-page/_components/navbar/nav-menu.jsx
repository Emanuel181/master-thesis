"use client"

import Link from "next/link"
import { Sparkles, Zap, Shield, GitBranch, Rss, FileCode, Heart, Rocket, Building2, MessageSquare, ExternalLink } from "lucide-react"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * ListItem - Navigation menu list item component
 */
function ListItem({ title, children, href, icon: Icon, external, ...props }) {
    const isInternal = href.startsWith('/') && !external
    const LinkComponent = isInternal ? Link : 'a'
    
    return (
        <li {...props}>
            <NavigationMenuLink asChild>
                <LinkComponent
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className={cn(
                        "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors",
                        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-[var(--brand-accent)]" />}
                        <div className="text-sm font-medium leading-none flex items-center gap-1">
                            {title}
                            {external && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                        </div>
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1.5">
                        {children}
                    </p>
                </LinkComponent>
            </NavigationMenuLink>
        </li>
    )
}

/**
 * NavMenu - Desktop navigation menu with dropdowns
 */
export function NavMenu({ isAboveColoredSection }) {
    const isMobile = useIsMobile()

    const triggerClassName = cn(
        "bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 text-sm transition-colors duration-500 ease-out",
        isAboveColoredSection
            ? "text-[#1fb6cf] hover:text-[#1fb6cf]"
            : "text-muted-foreground hover:text-foreground"
    )

    return (
        <div className="hidden md:flex items-center">
            <NavigationMenu viewport={!isMobile}>
                <NavigationMenuList>
                    {/* Product Dropdown */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className={triggerClassName}>
                            Product
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid gap-2 p-3 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                <li className="row-span-3">
                                    <NavigationMenuLink asChild>
                                        <Link
                                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-[var(--brand-accent)]/20 to-[var(--brand-primary)]/20 p-4 no-underline outline-none focus:shadow-md transition-all hover:from-[var(--brand-accent)]/30 hover:to-[var(--brand-primary)]/30"
                                            href="/#features"
                                        >
                                            <Sparkles className="h-6 w-6 text-[var(--brand-accent)]" />
                                            <div className="mb-2 mt-4 text-lg font-medium">VulnIQ</div>
                                            <p className="text-sm leading-tight text-muted-foreground">
                                                AI-powered security code review with autonomous remediation.
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <ListItem href="/#features" title="Features" icon={Zap}>
                                    Advanced vulnerability detection and AI-driven fixes.
                                </ListItem>
                                <ListItem href="/#use-cases" title="Use cases" icon={Shield}>
                                    See how teams use VulnIQ for security.
                                </ListItem>
                                <li>
                                    <div className="block select-none rounded-md p-3 leading-none no-underline outline-none">
                                        <div className="flex items-center gap-2">
                                            <GitBranch className="h-4 w-4 text-[var(--brand-accent)]" />
                                            <div className="text-sm font-medium leading-none">Integrations</div>
                                        </div>
                                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1.5">
                                            Connect with GitHub, GitLab, and more.
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Resources Dropdown */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className={triggerClassName}>
                            Resources
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid gap-3 p-4 md:w-[450px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                <li className="row-span-4">
                                    <NavigationMenuLink asChild>
                                        <Link
                                            className="flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md transition-all duration-200 overflow-hidden relative group"
                                            href="/blog"
                                            style={{
                                                background: `linear-gradient(135deg, 
                                                    rgba(var(--brand-accent-rgb), 0.15) 0%, 
                                                    rgba(var(--brand-primary-rgb), 0.3) 50%,
                                                    rgba(var(--brand-accent-rgb), 0.15) 100%)`
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
                                            <Rss className="h-8 w-8 mb-3 text-[var(--brand-accent)] relative z-10 group-hover:scale-110 transition-transform" />
                                            <div className="mb-1 text-lg font-medium relative z-10 text-foreground">Blog</div>
                                            <p className="text-sm leading-tight text-muted-foreground relative z-10">
                                                Security insights and best practices.
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <ListItem href="/changelog" title="Changelog" icon={FileCode}>
                                    Latest updates and releases.
                                </ListItem>
                                <ListItem href="/supporters" title="Supporters" icon={Heart}>
                                    People supporting this project.
                                </ListItem>
                                <ListItem href="https://www.producthunt.com/posts/vulniq" title="Product Hunt" icon={Rocket} external>
                                    Support us on Product Hunt.
                                </ListItem>
                                <ListItem href="/demo" title="Try demo" icon={Zap}>
                                    Experience VulnIQ in action.
                                </ListItem>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Company Dropdown */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className={triggerClassName}>
                            Company
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[280px] gap-2 p-3">
                                <ListItem href="/about" title="About us" icon={Building2}>
                                    Learn about our mission and team.
                                </ListItem>
                                <ListItem href="/security" title="Security policy" icon={Shield}>
                                    Vulnerability disclosure policy.
                                </ListItem>
                                <ListItem href="/#connect" title="Contact" icon={MessageSquare}>
                                    Get in touch with our team.
                                </ListItem>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    )
}
