"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Mail, Building, UserCheck, UserX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveUser, rejectUser, type PendingUser } from "@/lib/actions/admin";
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
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

interface SignupRequestCardProps {
    user: PendingUser;
}

export function SignupRequestCard({ user }: SignupRequestCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

    const handleApprove = async () => {
        setLoading("approve");
        try {
            await approveUser(user.id);
            router.refresh();
        } catch (err) {
            console.error("Failed to approve user:", err);
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async () => {
        setLoading("reject");
        try {
            await rejectUser(user.id);
            router.refresh();
        } catch (err) {
            console.error("Failed to reject user:", err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">

            {/* Card Body */}
            <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            {user.fullName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                {user.email}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
                    {user.department && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Building className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{user.department}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>Requested {timeAgo(user.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-3">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-slate-200 text-slate-600 hover:text-red-700 hover:bg-white hover:border-red-200 h-9"
                            disabled={loading !== null}
                        >
                            <UserX className="h-3.5 w-3.5 mr-2" />
                            Reject
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <div className="flex items-center gap-2 text-red-600 mb-2">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Deactivate</span>
                            </div>
                            <AlertDialogTitle>Reject Access Request</AlertDialogTitle>
                            <AlertDialogDescription>
                                Reject the access request from <strong>{user.fullName}</strong> ({user.email})?
                                Their account will be deactivated.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleReject}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Reject
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-9"
                            disabled={loading !== null}
                        >
                            <UserCheck className="h-3.5 w-3.5 mr-2" />
                            Approve
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <div className="flex items-center gap-2 text-emerald-600 mb-2">
                                <UserCheck className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Activate</span>
                            </div>
                            <AlertDialogTitle>Approve Access Request</AlertDialogTitle>
                            <AlertDialogDescription>
                                Grant treasury access to <strong>{user.fullName}</strong> ({user.email})?
                                They will be able to log in and view payments.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleApprove}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Approve
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}