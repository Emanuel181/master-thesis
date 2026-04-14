'use client'

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { 
    FileText, 
    Users, 
    Heart, 
    UserCog,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminNav({ adminEmail, isMasterAdmin = false, className }) {
    const pathname = usePathname();
    const t = useTranslations('admin');

    const adminNavItems = [
        {
            href: '/admin/articles',
            label: t('nav.articles'),
            icon: FileText,
            description: 'Review and manage articles'
        },
        {
            href: '/admin/users',
            label: t('nav.users'),
            icon: Users,
            description: 'Manage registered users'
        },
        {
            href: '/admin/supporters',
            label: t('nav.supporters'),
            icon: Heart,
            description: 'Manage supporters'
        },
        {
            href: '/admin/create-admin',
            label: t('nav.createAdmin'),
            icon: UserCog,
            description: 'Manage admin accounts',
            masterOnly: true
        }
    ];
    
    // Filter items based on master admin status
    const visibleItems = adminNavItems.filter(item => 
        !item.masterOnly || isMasterAdmin
    );
    
    return (
        <nav className={cn("flex items-center gap-1 flex-wrap", className)}>
            {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                    <Link key={item.href} href={item.href}>
                        <Button
                            variant={isActive ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                                "gap-2",
                                isActive && "bg-primary/10 text-primary"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{item.label}</span>
                        </Button>
                    </Link>
                );
            })}
        </nav>
    );
}
