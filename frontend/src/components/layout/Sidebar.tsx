"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    CreditCard,
    Building2,
    Users,
    UserPlus,
    Shield,
    LogOut,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    {
        label: "Payments",
        href: "/payments",
        icon: CreditCard,
    },
    {
        label: "Accounts",
        href: "/accounts",
        icon: Building2,
    },
];

const adminItems: NavItem[] = [
    {
        label: "Access Requests",
        href: "/admin/signups",
        icon: UserPlus,
        adminOnly: true,
    },
    {
        label: "Users & ERP",
        href: "/admin/users",
        icon: Users,
        adminOnly: true,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-sidebar">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Shield className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-sidebar-foreground">
                            Vault Treasury
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Sentinel Protected
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
                    {/* Main Nav */}
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink key={item.href} item={item} isActive={pathname === item.href || pathname.startsWith(item.href + "/")} />
                        ))}
                    </div>

                    {/* Admin Section */}
                    <div className="pt-4">
                        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Admin
                        </p>
                        <div className="space-y-1">
                            {adminItems.map((item) => (
                                <NavLink key={item.href} item={item} isActive={pathname === item.href || pathname.startsWith(item.href + "/")} />
                            ))}
                        </div>
                    </div>
                </nav>

                {/* User Section */}
                <div className="border-t border-sidebar-border p-3">
                    <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors duration-[var(--duration-fast)]">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                TA
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                Treasury Admin
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                treasury_admin
                            </p>
                        </div>
                        <button
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
    const Icon = item.icon;

    return (
        <Link href={item.href}>
            <motion.div
                className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.12 }}
            >
                <Icon className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-primary"
                )} />
                <span className="truncate">{item.label}</span>
                {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                )}
            </motion.div>
        </Link>
    );
}
