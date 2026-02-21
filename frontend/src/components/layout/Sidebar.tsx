"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard,
    Building2,
    Users,
    UserPlus,
    ShieldCheck,
    LogOut,
    LayoutDashboard,
    Settings,
    PieChart,
    LockKeyhole,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserInfo {
    id: string;
    fullName: string;
    role: string;
    email: string;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { label: "Payments", href: "/payments", icon: CreditCard },
    { label: "Accounts", href: "/accounts", icon: Building2 },
];

const adminItems: NavItem[] = [
    { label: "Access Requests", href: "/admin/signups", icon: UserPlus },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "System Settings", href: "/admin/settings", icon: Settings },
];

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Snappy Animation Variants
const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.3,
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

export function Sidebar({ user }: { user: UserInfo }) {
    const pathname = usePathname();
    const isAdmin = user.role === "treasury_admin";
    const [loggingOut, setLoggingOut] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed", error);
            setLoggingOut(false);
        }
    };

    const sidebarContent = (
        <>
            {/* 1. Header (Clean & Static) */}
            <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-slate-50 z-10">
                <div className="flex items-center gap-3 flex-1">
                    {/* The Vault Icon (Slate-900) */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 shadow-md shadow-slate-900/10">
                        <div className="h-3 w-3 bg-white rounded-full"></div>
                    </div>

                    {/* Brand Name */}
                    <span className="block text-lg font-bold text-slate-900 tracking-tight">
                        VAULT
                    </span>
                </div>

                {/* Mobile close button */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* 2. Navigation (Scrollable) */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-none">
                <div className="space-y-1">
                    <SectionLabel>Operations</SectionLabel>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            isActive={pathname.startsWith(item.href)}
                        />
                    ))}
                </div>

                {isAdmin && (
                    <div className="space-y-1">
                        <SectionLabel>Administration</SectionLabel>
                        {adminItems.map((item) => (
                            <NavLink
                                key={item.href}
                                item={item}
                                isActive={pathname.startsWith(item.href)}
                            />
                        ))}
                    </div>
                )}
            </nav>

            {/* 3. Footer (User Session) */}
            <div className="border-t border-slate-200 bg-slate-100/50 p-4">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-all border border-transparent hover:border-slate-200 hover:shadow-sm cursor-default group"
                >
                    <Avatar className="h-9 w-9 border border-slate-200 bg-white">
                        <AvatarFallback className="text-xs font-semibold text-slate-700 bg-slate-100">
                            {getInitials(user.fullName)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                            {user.fullName}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] text-slate-500 truncate font-mono uppercase font-medium">
                                {isAdmin ? "Admin" : "Treasurer"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLogout();
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Sign out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </motion.div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                aria-label="Open navigation"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Desktop sidebar — always visible */}
            <motion.aside
                initial="hidden"
                animate="visible"
                variants={sidebarVariants}
                className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-50 text-slate-900 border-r border-slate-200 shadow-sm hidden md:flex flex-col"
            >
                {sidebarContent}
            </motion.aside>

            {/* Mobile sidebar — slide-out overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setMobileOpen(false)}
                            className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                        />

                        {/* Sidebar drawer */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 28, stiffness: 350 }}
                            className="md:hidden fixed left-0 top-0 z-50 h-screen w-64 bg-slate-50 text-slate-900 border-r border-slate-200 shadow-xl flex flex-col"
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Logout Overlay */}
            <AnimatePresence>
                {loggingOut && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/60 backdrop-blur-[2px]"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: -5 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                            className="relative overflow-hidden flex flex-col items-center justify-center w-full max-w-[280px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
                        >
                            <div className="relative h-14 w-14 mb-5 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                                <LockKeyhole className="h-6 w-6 text-slate-400" strokeWidth={2} />
                                <motion.div
                                    animate={{ top: ['-20%', '120%'] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                    className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                                />
                            </div>
                            <div className="space-y-1 text-center">
                                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                                    Signing Out
                                </h3>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    Ending Session
                                </p>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-50" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* --- Subcomponents --- */

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <motion.h3
            variants={itemVariants}
            className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono"
        >
            {children}
        </motion.h3>
    );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
    const Icon = item.icon;

    return (
        <Link href={item.href} className="block relative">
            <motion.div
                variants={itemVariants}
                // Snappy Light Mode Hover: White background, subtle shadow
                whileHover={{ x: 4, backgroundColor: "#ffffff", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors border border-transparent",
                    isActive
                        ? "bg-white text-slate-900 shadow-sm border-slate-200"
                        : "text-slate-500 hover:text-slate-900"
                )}
            >
                {/* Active Indicator (Solid Slate-900 Bar) */}
                {isActive && (
                    <motion.div
                        layoutId="active-nav-indicator"
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-slate-900 rounded-r-full"
                    />
                )}

                <Icon
                    className={cn(
                        "h-4 w-4 shrink-0 transition-colors duration-200",
                        isActive
                            ? "text-slate-900"
                            : "text-slate-400 group-hover:text-slate-600"
                    )}
                />

                <span className="truncate">{item.label}</span>
            </motion.div>
        </Link>
    );
}