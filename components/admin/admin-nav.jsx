'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    FileText, 
    Users, 
    Heart, 
    UserCog,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminNavItems = [
    {
        href: '/admin/articles',
        label: 'Articles',
        icon: FileText,
        description: 'Review and manage articles'
    },
    {
        href: '/admin/users',
        label: 'Users',
        icon: Users,
        description: 'Manage registered users'
    },
    {
        href: '/admin/supporters',
        label: 'Supporters',
        icon: Heart,
        description: 'Manage supporters'
    },
    {
        href: '/admin/create-admin',
        label: 'Admins',
        icon: UserCog,
        description: 'Manage admin accounts',
        masterOnly: true
    }
];

export function AdminNav({ adminEmail, isMasterAdmin = false, className }) {
    const pathname = usePathname();
    
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
            {isMasterAdmin && (
                <span className="ml-2 flex items-center gap-1 text-xs text-amber-500">
                    <Shield className="h-3 w-3" />
                    <span className="hidden md:inline">Master Admin</span>
                </span>
            )}
        </nav>
    );
}
