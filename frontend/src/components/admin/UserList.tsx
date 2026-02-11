"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff, Mail, Building2, Clock, Crown, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deactivateUser, type TreasuryUser } from "@/lib/actions/admin";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

interface UserListProps {
    users: TreasuryUser[];
}

export function UserList({ users }: UserListProps) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleDeactivate = async (userId: string) => {
        setLoadingId(userId);
        try {
            await deactivateUser(userId);
            router.refresh();
        } catch (err) {
            console.error("Failed to deactivate user:", err);
        } finally {
            setLoadingId(null);
        }
    };

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                    <Shield className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No users found in directory</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Personnel</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Dept</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Clearance</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Joined</th>
                        <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Security Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map((user) => (
                        <tr key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                            {/* User Identity */}
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{user.fullName}</span>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-slate-400">
                                        <Mail className="h-3 w-3" />
                                        <span className="font-mono text-xs">{user.email}</span>
                                    </div>
                                </div>
                            </td>

                            {/* Department */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs font-medium">{user.department || "General"}</span>
                                </div>
                            </td>

                            {/* Role (Micro-Badge) */}
                            <td className="px-6 py-4">
                                {user.role === "treasury_admin" ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-purple-100 bg-purple-50 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                                        <Crown className="h-3 w-3" />
                                        Admin
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Treasurer
                                    </span>
                                )}
                            </td>

                            {/* Status (Dots) */}
                            <td className="px-6 py-4">
                                {user.status === "active" ? (
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </div>
                                        <span className="text-xs font-medium text-slate-700">Active</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 opacity-60">
                                        <div className="h-2 w-2 rounded-full border border-slate-300" />
                                        <span className="text-xs font-medium text-slate-500">Deactivated</span>
                                    </div>
                                )}
                            </td>

                            {/* Joined Date */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <Clock className="h-3 w-3" />
                                    <span className="font-mono">{formatDate(user.createdAt)}</span>
                                </div>
                            </td>

                            {/* Actions (Visible Red Button) */}
                            <td className="px-6 py-4 text-right">
                                {user.status === "active" && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 text-xs font-medium border-red-200 text-red-600 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all shadow-sm"
                                                disabled={loadingId === user.id}
                                            >
                                                Revoke Access
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <div className="flex items-center gap-2 text-red-600 mb-2">
                                                    <ShieldOff className="w-5 h-5" />
                                                    <span className="text-sm font-bold uppercase tracking-wider">Security Alert</span>
                                                </div>
                                                <AlertDialogTitle>Revoke User Access?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to revoke access for <strong>{user.fullName}</strong>?
                                                    They will be immediately logged out and unable to access the system.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeactivate(user.id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    Confirm Revocation
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                                {user.status === "deactivated" && user.deactivatedAt && (
                                    <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 opacity-70">
                                        <Ban className="h-3 w-3" />
                                        <span className="font-mono">
                                            {new Date(user.deactivatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}