"use client"

import { Link } from '@/i18n/navigation'
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
import { useTranslations } from 'next-intl'

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
                        "block select-none rounded-md p-3 no-underline outline-none transition-colors",
                        "hover:bg-muted focus:bg-muted"
                    )}
                >
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-accent shrink-0" />}
                        <span className="text-sm font-medium leading-none flex items-center gap-1">
                            {title}
                            {external && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                        </span>
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground line-clamp-2 mt-1.5 pl-6">
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
    const t = useTranslations('nav')

    const triggerClassName = cn(
        "bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 text-sm transition-colors duration-500 ease-out",
        isAboveColoredSection
            ? "text-accent hover:text-accent"
            : "text-muted-foreground hover:text-foreground"
    )

    return (
        <div className="hidden md:flex items-center">
            <NavigationMenu viewport={false}>
                <NavigationMenuList>
                    {/* Product Dropdown */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className={triggerClassName}>
                            {t('product')}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid gap-2 p-3 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                <li className="row-span-3">
                                    <NavigationMenuLink asChild>
                                        <Link
                                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-accent/20 to-muted p-4 no-underline outline-none focus:shadow-md transition-all hover:from-accent/30 hover:to-muted/80"
                                            href="/#features"
                                        >
                                            <Sparkles className="h-6 w-6 text-accent" />
                                            <div className="mb-2 mt-4 text-lg font-medium">{t('productItems.vulniq.label')}</div>
                                            <p className="text-sm leading-tight text-muted-foreground">
                                                {t('productItems.vulniq.description')}
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <ListItem href="/#features" title={t('productItems.features.label')} icon={Zap}>
                                    {t('productItems.features.description')}
                                </ListItem>
                                <ListItem href="/#use-cases" title={t('productItems.useCases.label')} icon={Shield}>
                                    {t('productItems.useCases.description')}
                                </ListItem>
                                <li>
                                    <div className="block select-none rounded-md p-3 no-underline outline-none">
                                        <div className="flex items-center gap-2">
                                            <GitBranch className="h-4 w-4 text-accent shrink-0" />
                                            <span className="text-sm font-medium leading-none">{t('productItems.integrations.label')}</span>
                                        </div>
                                        <p className="text-xs leading-snug text-muted-foreground line-clamp-2 mt-1.5 pl-6">
                                            {t('productItems.integrations.description')}
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Resources Dropdown */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className={triggerClassName}>
                            {t('resources')}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid gap-3 p-4 md:w-[450px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                <li className="row-span-4">
                                    <NavigationMenuLink asChild>
                                        <Link
                                            className="flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md transition-all duration-200 overflow-hidden relative group bg-gradient-to-br from-accent/15 via-muted to-accent/15"
                                            href="/blog"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
                                            <Rss className="h-8 w-8 mb-3 text-accent relative z-10 group-hover:scale-110 transition-transform" />
                                            <div className="mb-1 text-lg font-medium relative z-10 text-foreground">{t('resourceItems.blog.label')}</div>
                                            <p className="text-sm leading-tight text-muted-foreground relative z-10">
                                                {t('resourceItems.blog.description')}
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <ListItem href="/changelog" title={t('resourceItems.changelog.label')} icon={FileCode}>
                                    {t('resourceItems.changelog.description')}
                                </ListItem>
                                <ListItem href="/supporters" title={t('resourceItems.supporters.label')} icon={Heart}>
                                    {t('resourceItems.supporters.description')}
                                </ListItem>
                                <ListItem href="https://www.producthunt.com/posts/vulniq" title={t('resourceItems.productHunt.label')} icon={Rocket} external>
                                    {t('resourceItems.productHunt.description')}
                                </ListItem>
                                <ListItem href="/demo" title={t('resourceItems.tryDemo.label')} icon={Zap}>
                                    {t('resourceItems.tryDemo.description')}
                                </ListItem>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Company Dropdown */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className={triggerClassName}>
                            {t('company')}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[280px] gap-2 p-3">
                                <ListItem href="/about" title={t('companyItems.about.label')} icon={Building2}>
                                    {t('companyItems.about.description')}
                                </ListItem>
                                <ListItem href="/security" title={t('companyItems.security.label')} icon={Shield}>
                                    {t('companyItems.security.description')}
                                </ListItem>
                                <ListItem href="/#connect" title={t('companyItems.contact.label')} icon={MessageSquare}>
                                    {t('companyItems.contact.description')}
                                </ListItem>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    )
}
